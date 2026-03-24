"""Servicio de integración con MercadoPago — cliente async httpx."""

import hashlib
import hmac
import logging

import httpx

from app.excepciones import ErrorPasarelaPago

logger = logging.getLogger(__name__)

BASE_URL_MP = "https://api.mercadopago.com"

# Mapeo de estados MP → estados internos
MAPA_ESTADOS_SUSCRIPCION = {
    "pending": "pendiente",
    "authorized": "activa",
    "paused": "pausada",
    "cancelled": "cancelada",
}

MAPA_ESTADOS_PAGO = {
    "approved": "aprobado",
    "processed": "aprobado",
    "pending": "pendiente",
    "in_process": "en_proceso",
    "rejected": "rechazado",
    "cancelled": "cancelado",
    "refunded": "reembolsado",
    "charged_back": "contracargo",
}


class ServicioMercadoPago:
    """Cliente async para la API de MercadoPago."""

    @staticmethod
    def _headers(access_token: str) -> dict:
        """Headers de autenticación para MP."""
        return {
            "Authorization": f"Bearer {access_token}",
            "Content-Type": "application/json",
        }

    @staticmethod
    async def crear_preapproval(
        access_token: str,
        motivo: str,
        monto: float,
        moneda: str,
        email_pagador: str,
        referencia_externa: str,
        url_retorno: str,
        notification_url: str = "",
        frecuencia: int = 1,
        tipo_frecuencia: str = "months",
    ) -> dict:
        """Crea una suscripción en MercadoPago usando preapproval_plan.

        Flujo actual de MP:
        1. Crear un plan (/preapproval_plan) con monto, moneda y frecuencia
        2. El plan devuelve init_point para que el usuario complete el checkout

        Retorna dict con id, init_point y sandbox_init_point.
        """
        # back_url: MP no acepta localhost
        if url_retorno and "localhost" not in url_retorno and "127.0.0.1" not in url_retorno:
            back_url = url_retorno
        else:
            back_url = "https://theastra.xyz/suscripcion/exito"

        payload_plan = {
            "reason": motivo,
            "auto_recurring": {
                "frequency": frecuencia,
                "frequency_type": tipo_frecuencia,
                "transaction_amount": monto,
                "currency_id": moneda,
                "billing_day": 10,
                "billing_day_proportional": True,
            },
            "back_url": back_url,
        }

        if notification_url and "localhost" not in notification_url:
            payload_plan["notification_url"] = notification_url

        try:
            async with httpx.AsyncClient(timeout=30.0) as cliente:
                respuesta = await cliente.post(
                    f"{BASE_URL_MP}/preapproval_plan",
                    headers=ServicioMercadoPago._headers(access_token),
                    json=payload_plan,
                )

                if respuesta.status_code not in (200, 201):
                    logger.error(
                        "Error al crear plan de suscripción en MP: %s %s",
                        respuesta.status_code,
                        respuesta.text,
                    )
                    raise ErrorPasarelaPago(
                        f"Error al crear suscripción en MercadoPago: {respuesta.status_code}"
                    )

                datos_plan = respuesta.json()
                # Incluir datos que espera la ruta (id, init_point)
                return {
                    "id": datos_plan["id"],
                    "init_point": datos_plan.get("init_point"),
                    "sandbox_init_point": datos_plan.get("sandbox_init_point"),
                    "status": datos_plan.get("status"),
                    "external_reference": referencia_externa,
                    "payer_email": email_pagador,
                    "plan_data": datos_plan,
                }

        except httpx.HTTPError as e:
            logger.error("Error de conexión con MercadoPago: %s", str(e))
            raise ErrorPasarelaPago(f"Error de conexión con MercadoPago: {str(e)}")

    @staticmethod
    async def cancelar_preapproval(
        access_token: str, preapproval_id: str
    ) -> dict:
        """Cancela un preapproval (suscripción) en MercadoPago."""
        try:
            async with httpx.AsyncClient(timeout=30.0) as cliente:
                respuesta = await cliente.put(
                    f"{BASE_URL_MP}/preapproval/{preapproval_id}",
                    headers=ServicioMercadoPago._headers(access_token),
                    json={"status": "cancelled"},
                )

                if respuesta.status_code != 200:
                    logger.error(
                        "Error al cancelar preapproval en MP: %s %s",
                        respuesta.status_code,
                        respuesta.text,
                    )
                    raise ErrorPasarelaPago(
                        f"Error al cancelar suscripción en MercadoPago: {respuesta.status_code}"
                    )

                return respuesta.json()

        except httpx.HTTPError as e:
            logger.error("Error de conexión con MercadoPago: %s", str(e))
            raise ErrorPasarelaPago(f"Error de conexión con MercadoPago: {str(e)}")

    @staticmethod
    async def obtener_preapproval(
        access_token: str, preapproval_id: str
    ) -> dict:
        """Consulta un preapproval en MercadoPago."""
        try:
            async with httpx.AsyncClient(timeout=30.0) as cliente:
                respuesta = await cliente.get(
                    f"{BASE_URL_MP}/preapproval/{preapproval_id}",
                    headers=ServicioMercadoPago._headers(access_token),
                )

                if respuesta.status_code != 200:
                    raise ErrorPasarelaPago(
                        f"Error al consultar suscripción en MercadoPago: {respuesta.status_code}"
                    )

                return respuesta.json()

        except httpx.HTTPError as e:
            raise ErrorPasarelaPago(f"Error de conexión con MercadoPago: {str(e)}")

    @staticmethod
    async def obtener_pago(access_token: str, pago_id: str) -> dict:
        """Consulta un pago en MercadoPago."""
        try:
            async with httpx.AsyncClient(timeout=30.0) as cliente:
                respuesta = await cliente.get(
                    f"{BASE_URL_MP}/v1/payments/{pago_id}",
                    headers=ServicioMercadoPago._headers(access_token),
                )

                if respuesta.status_code != 200:
                    raise ErrorPasarelaPago(
                        f"Error al consultar pago en MercadoPago: {respuesta.status_code}"
                    )

                return respuesta.json()

        except httpx.HTTPError as e:
            raise ErrorPasarelaPago(f"Error de conexión con MercadoPago: {str(e)}")

    @staticmethod
    async def buscar_pagos_preapproval(
        access_token: str, preapproval_id: str
    ) -> list[dict]:
        """Busca pagos autorizados de una suscripción (preapproval) en MercadoPago."""
        try:
            async with httpx.AsyncClient(timeout=30.0) as cliente:
                respuesta = await cliente.get(
                    f"{BASE_URL_MP}/authorized_payments/search",
                    headers=ServicioMercadoPago._headers(access_token),
                    params={"preapproval_id": preapproval_id},
                )

                if respuesta.status_code != 200:
                    logger.warning(
                        "Error buscando pagos de preapproval %s: %s",
                        preapproval_id,
                        respuesta.status_code,
                    )
                    return []

                datos = respuesta.json()
                return datos.get("results", [])

        except httpx.HTTPError as e:
            logger.error("Error buscando pagos en MP: %s", str(e))
            return []

    @staticmethod
    def verificar_firma_webhook(
        x_signature: str,
        x_request_id: str,
        data_id: str,
        webhook_secret: str,
    ) -> bool:
        """Verifica la firma HMAC del webhook de MercadoPago.

        MP envía x-signature con formato: ts=xxxx,v1=yyyy
        La verificación: HMAC-SHA256(id:{data_id};request-id:{x_request_id};ts:{ts};, secret)
        """
        if not x_signature or not webhook_secret:
            return False

        partes = {}
        for parte in x_signature.split(","):
            clave_valor = parte.strip().split("=", 1)
            if len(clave_valor) == 2:
                partes[clave_valor[0]] = clave_valor[1]

        ts = partes.get("ts")
        v1 = partes.get("v1")
        if not ts or not v1:
            return False

        # Construir el manifest según documentación MP
        manifest = f"id:{data_id};request-id:{x_request_id};ts:{ts};"

        # Calcular HMAC-SHA256
        firma_calculada = hmac.new(
            webhook_secret.encode(),
            manifest.encode(),
            hashlib.sha256,
        ).hexdigest()

        return hmac.compare_digest(firma_calculada, v1)
