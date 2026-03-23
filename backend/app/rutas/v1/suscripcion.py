"""Rutas de suscripción y pagos."""

import io
import logging
import uuid
from datetime import datetime

import httpx
from fastapi import APIRouter, Depends, Request
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession

from app.configuracion import obtener_configuracion
from app.datos.repositorio_factura import RepositorioFactura
from app.datos.repositorio_pago import RepositorioPago
from app.datos.repositorio_plan import RepositorioPlan
from app.modelos.config_pais_mp import ConfigPaisMp
from app.datos.repositorio_suscripcion import RepositorioSuscripcion
from app.dependencias_auth import obtener_usuario_actual
from app.esquemas.suscripcion import EsquemaSuscribirse
from app.excepciones import (
    ErrorPasarelaPago,
    PlanNoEncontrado,
    SuscripcionNoEncontrada,
)
from app.datos.repositorio_usuario import RepositorioUsuario
from app.modelos.usuario import Usuario
from app.servicios.servicio_email import ServicioEmail
from app.principal import _obtener_db_placeholder
from app.servicios.servicio_mercadopago import (
    MAPA_ESTADOS_PAGO,
    MAPA_ESTADOS_SUSCRIPCION,
    ServicioMercadoPago,
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/suscripcion", tags=["Suscripciones"])


def _parsear_fecha(valor: str | None) -> datetime | None:
    """Convierte un string ISO 8601 de MP a datetime. Retorna None si falla."""
    if not valor:
        return None
    try:
        return datetime.fromisoformat(valor)
    except (ValueError, TypeError):
        return None

# Países soportados por MercadoPago
PAISES_SOPORTADOS = {"AR", "BR", "MX"}
PAIS_FALLBACK = "AR"


async def _detectar_pais_por_ip(ip: str) -> str:
    """Detecta el código de país a partir de una IP usando ip-api.com.

    Retorna el código ISO de 2 letras si es un país soportado,
    o el fallback 'AR' si no se puede determinar.
    """
    # IPs locales → fallback
    if ip in ("127.0.0.1", "::1", "localhost", "testclient"):
        return PAIS_FALLBACK

    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            resp = await client.get(
                f"http://ip-api.com/json/{ip}",
                params={"fields": "countryCode"},
            )
            if resp.status_code == 200:
                codigo = resp.json().get("countryCode", "")
                if codigo in PAISES_SOPORTADOS:
                    return codigo
    except Exception:
        logger.warning("Error detectando país por IP %s", ip)

    return PAIS_FALLBACK


def _obtener_ip_cliente(request: Request) -> str:
    """Extrae la IP del cliente considerando proxies (X-Forwarded-For)."""
    forwarded = request.headers.get("x-forwarded-for")
    if forwarded:
        # El primer valor es la IP original del cliente
        return forwarded.split(",")[0].strip()
    return request.client.host if request.client else "127.0.0.1"


@router.get("/detectar-pais")
async def detectar_pais(
    request: Request,
    db: AsyncSession = Depends(_obtener_db_placeholder),
):
    """Detecta el país del usuario por IP para mostrar precios locales."""
    ip = _obtener_ip_cliente(request)
    pais_codigo = await _detectar_pais_por_ip(ip)

    # Obtener datos del país desde la DB
    repo = RepositorioSuscripcion(db)
    config_pais = await repo.obtener_config_pais(pais_codigo)

    if config_pais:
        return {
            "exito": True,
            "datos": {
                "pais_codigo": config_pais.pais_codigo,
                "pais_nombre": config_pais.pais_nombre,
                "moneda": config_pais.moneda,
            },
        }

    # Fallback absoluto
    return {
        "exito": True,
        "datos": {
            "pais_codigo": PAIS_FALLBACK,
            "pais_nombre": "Argentina",
            "moneda": "ARS",
        },
    }


@router.get("/paises")
async def listar_paises(
    db: AsyncSession = Depends(_obtener_db_placeholder),
):
    """Lista los países disponibles con configuración de MercadoPago."""
    repo = RepositorioSuscripcion(db)
    paises = await repo.listar_paises_activos()

    resultado = []
    for p in paises:
        resultado.append({
            "pais_codigo": p.pais_codigo,
            "pais_nombre": p.pais_nombre,
            "moneda": p.moneda,
            "tipo_cambio_usd": float(p.tipo_cambio_usd),
        })

    return {"exito": True, "datos": resultado}


@router.get("/planes")
async def listar_planes(
    pais_codigo: str = "AR",
    db: AsyncSession = Depends(_obtener_db_placeholder),
):
    """Lista los planes disponibles con precios del país solicitado y de todos los países."""
    repo = RepositorioPlan(db)
    planes = await repo.listar_activos()

    resultado = []
    for plan in planes:
        # Precio del país solicitado (retrocompat)
        precios = await repo.obtener_precios_por_plan(plan.id, pais_codigo)
        precio_local = precios[0].precio_local if precios else None
        moneda_local = precios[0].moneda if precios else None

        # Precios de todos los países
        todos_precios = await repo.obtener_precios_por_plan(plan.id)
        precios_por_pais = {}
        for pp in todos_precios:
            precios_por_pais[pp.pais_codigo] = {
                "precio_local": pp.precio_local,
                "moneda": pp.moneda,
            }

        resultado.append({
            "id": str(plan.id),
            "nombre": plan.nombre,
            "slug": plan.slug,
            "descripcion": plan.descripcion,
            "precio_usd_centavos": plan.precio_usd_centavos,
            "intervalo": plan.intervalo,
            "limite_perfiles": plan.limite_perfiles,
            "limite_calculos_dia": plan.limite_calculos_dia,
            "features": plan.features or [],
            "precio_local": precio_local,
            "moneda_local": moneda_local,
            "precios_por_pais": precios_por_pais,
        })

    return {"exito": True, "datos": resultado}


@router.get("/verificar-estado")
async def verificar_estado(
    usuario: Usuario = Depends(obtener_usuario_actual),
    db: AsyncSession = Depends(_obtener_db_placeholder),
):
    """Verifica el estado actual de la suscripción (polling post-checkout)."""
    repo_sus = RepositorioSuscripcion(db)
    repo_plan = RepositorioPlan(db)

    suscripcion = await repo_sus.obtener_activa(usuario.id)
    if not suscripcion:
        return {
            "exito": True,
            "datos": {
                "estado": "sin_suscripcion",
                "es_premium": False,
                "plan_slug": None,
                "plan_nombre": None,
            },
        }

    plan = await repo_plan.obtener_por_id(suscripcion.plan_id)
    plan_slug = plan.slug if plan else None

    return {
        "exito": True,
        "datos": {
            "estado": suscripcion.estado,
            "es_premium": plan_slug == "premium" and suscripcion.estado == "activa",
            "plan_slug": plan_slug,
            "plan_nombre": plan.nombre if plan else None,
        },
    }


@router.get("/mi-suscripcion")
async def mi_suscripcion(
    usuario: Usuario = Depends(obtener_usuario_actual),
    db: AsyncSession = Depends(_obtener_db_placeholder),
):
    """Obtiene la suscripción activa del usuario."""
    repo_sus = RepositorioSuscripcion(db)
    suscripcion = await repo_sus.obtener_activa(usuario.id)

    if not suscripcion:
        return {
            "exito": True,
            "datos": None,
            "mensaje": "Sin suscripción activa",
        }

    repo_plan = RepositorioPlan(db)
    plan = await repo_plan.obtener_por_id(suscripcion.plan_id)

    return {
        "exito": True,
        "datos": {
            "id": str(suscripcion.id),
            "plan_id": str(suscripcion.plan_id),
            "plan_nombre": plan.nombre if plan else None,
            "plan_slug": plan.slug if plan else None,
            "pais_codigo": suscripcion.pais_codigo,
            "estado": suscripcion.estado,
            "mp_preapproval_id": suscripcion.mp_preapproval_id,
            "fecha_inicio": suscripcion.fecha_inicio.isoformat() if suscripcion.fecha_inicio else None,
            "fecha_fin": suscripcion.fecha_fin.isoformat() if suscripcion.fecha_fin else None,
            "creado_en": suscripcion.creado_en.isoformat() if suscripcion.creado_en else None,
        },
    }


@router.post("/suscribirse")
async def suscribirse(
    request: Request,
    datos: EsquemaSuscribirse,
    usuario: Usuario = Depends(obtener_usuario_actual),
    db: AsyncSession = Depends(_obtener_db_placeholder),
):
    """Crea una suscripción en MercadoPago y retorna la URL de checkout."""
    config = obtener_configuracion()
    repo_plan = RepositorioPlan(db)
    repo_sus = RepositorioSuscripcion(db)

    # Auto-detectar país si no se envió
    if not datos.pais_codigo:
        ip = _obtener_ip_cliente(request)
        datos.pais_codigo = await _detectar_pais_por_ip(ip)

    # Validar plan
    plan = await repo_plan.obtener_por_id(uuid.UUID(datos.plan_id))
    if not plan or not plan.activo:
        raise PlanNoEncontrado("El plan solicitado no existe o no está activo")

    if plan.slug == "gratis":
        raise ErrorPasarelaPago("No se puede suscribir al plan gratuito vía checkout")

    # Obtener precio local
    precio = await repo_plan.obtener_precio(plan.id, datos.pais_codigo)
    if not precio:
        raise PlanNoEncontrado(
            f"No hay precio configurado para el país {datos.pais_codigo}"
        )

    # Obtener credenciales del país
    config_pais = await repo_sus.obtener_config_pais(datos.pais_codigo)
    if not config_pais:
        raise ErrorPasarelaPago(
            f"No hay configuración de MercadoPago para el país {datos.pais_codigo}"
        )

    # Referencia externa única
    referencia = f"cosmic_{usuario.id}_{plan.slug}_{datos.pais_codigo}"

    # Cancelar solo suscripciones pendientes previas (la gratis se cancela al confirmar pago)
    await repo_sus.cancelar_pendientes_usuario(usuario.id)

    # Crear preapproval en MP
    monto = precio.precio_local / 100  # centavos → unidad
    respuesta_mp = await ServicioMercadoPago.crear_preapproval(
        access_token=config_pais.mp_access_token,
        motivo=f"CosmicEngine — Plan {plan.nombre}",
        monto=monto,
        moneda=config_pais.moneda,
        email_pagador=usuario.email,
        referencia_externa=referencia,
        url_retorno=config.mp_url_exito,
        frecuencia=precio.frecuencia,
        tipo_frecuencia=precio.intervalo,
    )

    # Crear suscripción local con estado pendiente
    suscripcion = await repo_sus.crear(
        usuario_id=usuario.id,
        plan_id=plan.id,
        pais_codigo=datos.pais_codigo,
        estado="pendiente",
        precio_plan_id=precio.id,
        mp_preapproval_id=respuesta_mp.get("id"),
        referencia_externa=referencia,
        datos_mp=respuesta_mp,
    )

    # Usar sandbox_init_point si existe, sino init_point
    url_checkout = respuesta_mp.get("sandbox_init_point") or respuesta_mp.get("init_point")

    return {
        "exito": True,
        "datos": {
            "init_point": url_checkout,
            "suscripcion_id": str(suscripcion.id),
            "mp_preapproval_id": respuesta_mp.get("id"),
        },
    }


@router.post("/cancelar")
async def cancelar_suscripcion(
    usuario: Usuario = Depends(obtener_usuario_actual),
    db: AsyncSession = Depends(_obtener_db_placeholder),
):
    """Cancela la suscripción activa del usuario."""
    repo_sus = RepositorioSuscripcion(db)
    repo_plan = RepositorioPlan(db)

    suscripcion = await repo_sus.obtener_activa(usuario.id)
    if not suscripcion:
        raise SuscripcionNoEncontrada("No tiene una suscripción activa para cancelar")

    # Si tiene preapproval en MP, cancelar allí
    if suscripcion.mp_preapproval_id:
        config_pais = await repo_sus.obtener_config_pais(suscripcion.pais_codigo)
        if config_pais:
            try:
                await ServicioMercadoPago.cancelar_preapproval(
                    access_token=config_pais.mp_access_token,
                    preapproval_id=suscripcion.mp_preapproval_id,
                )
            except ErrorPasarelaPago:
                logger.warning(
                    "No se pudo cancelar preapproval %s en MP",
                    suscripcion.mp_preapproval_id,
                )

    # Cancelar localmente
    await repo_sus.actualizar_estado(suscripcion.id, "cancelada")

    # Crear suscripción gratis automáticamente
    plan_gratis = await repo_plan.obtener_por_slug("gratis")
    if plan_gratis:
        await repo_sus.crear(
            usuario_id=usuario.id,
            plan_id=plan_gratis.id,
            pais_codigo=suscripcion.pais_codigo,
            estado="activa",
        )

    # Email de cancelación (fire-and-forget)
    try:
        await ServicioEmail.enviar_suscripcion_cancelada(
            usuario.email, usuario.nombre, "Premium"
        )
    except Exception:
        logger.warning("No se pudo enviar email de cancelación a %s", usuario.email)

    return {"exito": True, "mensaje": "Suscripción cancelada correctamente"}


@router.post("/webhook")
async def webhook_mercadopago(
    request: Request,
    db: AsyncSession = Depends(_obtener_db_placeholder),
):
    """Webhook de MercadoPago — procesa notificaciones de suscripciones y pagos.

    Siempre retorna 200 para que MP no reintente.
    """
    config = obtener_configuracion()
    repo_sus = RepositorioSuscripcion(db)
    repo_pago = RepositorioPago(db)
    repo_plan = RepositorioPlan(db)
    repo_factura = RepositorioFactura(db)

    try:
        body = await request.json()
    except Exception:
        return {"exito": True, "mensaje": "Cuerpo inválido, ignorado"}

    # Verificar firma si hay secret configurado
    if config.mp_webhook_secret:
        x_signature = request.headers.get("x-signature", "")
        x_request_id = request.headers.get("x-request-id", "")
        data_id = str(body.get("data", {}).get("id", ""))

        if not ServicioMercadoPago.verificar_firma_webhook(
            x_signature=x_signature,
            x_request_id=x_request_id,
            data_id=data_id,
            webhook_secret=config.mp_webhook_secret,
        ):
            logger.warning("Firma de webhook inválida")
            return {"exito": True, "mensaje": "Firma inválida"}

    # Idempotencia
    evento_id = str(body.get("id", ""))
    if not evento_id:
        return {"exito": True, "mensaje": "Sin ID de evento"}

    if await repo_sus.evento_ya_procesado(evento_id):
        return {"exito": True, "mensaje": "Evento ya procesado"}

    tipo = body.get("type", "")
    accion = body.get("action", "")
    data_id = str(body.get("data", {}).get("id", ""))

    logger.info("Webhook MP recibido: tipo=%s accion=%s data_id=%s", tipo, accion, data_id)

    try:
        if tipo == "subscription_preapproval":
            await _procesar_preapproval(data_id, repo_sus, repo_plan, db)
        elif tipo == "subscription_authorized_payment":
            await _procesar_pago_suscripcion(data_id, repo_sus, repo_pago, repo_factura, db)
        elif tipo == "payment":
            await _procesar_pago(data_id, repo_sus, repo_pago, repo_factura, db)
    except Exception as e:
        logger.error("Error procesando webhook: %s", str(e))

    # Registrar evento como procesado
    await repo_sus.registrar_evento(
        evento_id=evento_id,
        tipo=tipo,
        accion=accion,
        payload=body,
    )

    return {"exito": True, "mensaje": "Webhook procesado"}


async def _procesar_preapproval(
    preapproval_id: str,
    repo_sus: RepositorioSuscripcion,
    repo_plan: RepositorioPlan,
    db: AsyncSession,
) -> None:
    """Procesa un cambio de estado en la suscripción de MP."""
    suscripcion = await repo_sus.obtener_por_preapproval_id(preapproval_id)
    if not suscripcion:
        logger.warning("Suscripción no encontrada para preapproval %s", preapproval_id)
        return

    # Obtener datos actuales de MP
    config_pais = await repo_sus.obtener_config_pais(suscripcion.pais_codigo)
    if not config_pais:
        return

    datos_mp = await ServicioMercadoPago.obtener_preapproval(
        config_pais.mp_access_token, preapproval_id
    )
    estado_mp = datos_mp.get("status", "")
    estado_local = MAPA_ESTADOS_SUSCRIPCION.get(estado_mp, suscripcion.estado)

    await repo_sus.actualizar_estado(suscripcion.id, estado_local, datos_mp=datos_mp)

    # Si se activó la premium, cancelar la suscripción gratis y notificar
    if estado_local == "activa":
        await repo_sus.cancelar_gratis_usuario(suscripcion.usuario_id)
        try:
            repo_usuario = RepositorioUsuario(db)
            usuario = await repo_usuario.obtener_por_id(suscripcion.usuario_id)
            if usuario:
                await ServicioEmail.enviar_suscripcion_activa(
                    usuario.email, usuario.nombre, "Premium"
                )
        except Exception:
            logger.warning("No se pudo enviar email de suscripción activa")

    # Si fue cancelada, degradar a plan gratis y notificar
    if estado_local == "cancelada":
        plan_gratis = await repo_plan.obtener_por_slug("gratis")
        if plan_gratis:
            await repo_sus.crear(
                usuario_id=suscripcion.usuario_id,
                plan_id=plan_gratis.id,
                pais_codigo=suscripcion.pais_codigo,
                estado="activa",
            )


async def _procesar_pago_suscripcion(
    pago_id: str,
    repo_sus: RepositorioSuscripcion,
    repo_pago: RepositorioPago,
    repo_factura: RepositorioFactura,
    db: AsyncSession,
) -> None:
    """Procesa un pago de suscripción recurrente."""
    await _procesar_pago(pago_id, repo_sus, repo_pago, repo_factura, db)


async def _obtener_config_pais_para_pago(
    pago_id: str,
    repo_sus: RepositorioSuscripcion,
) -> "ConfigPaisMp | None":
    """Intenta obtener config de país iterando países activos hasta encontrar credenciales válidas."""
    paises = await repo_sus.listar_paises_activos()
    for config_pais in paises:
        try:
            datos = await ServicioMercadoPago.obtener_pago(
                config_pais.mp_access_token, pago_id
            )
            if datos:
                return config_pais
        except ErrorPasarelaPago:
            continue
    return None


async def _procesar_pago(
    pago_id: str,
    repo_sus: RepositorioSuscripcion,
    repo_pago: RepositorioPago,
    repo_factura: RepositorioFactura,
    db: AsyncSession,
) -> None:
    """Procesa una notificación de pago."""
    # Verificar si ya existe
    pago_existente = await repo_pago.obtener_por_mp_pago_id(pago_id)
    if pago_existente:
        return

    # Intentar inferir país: primero buscar suscripción por preapproval
    # Si no se puede, iterar países activos hasta encontrar credenciales válidas
    config_pais = None
    datos_pago = None

    # Intento 1: obtener pago con cada país activo
    paises = await repo_sus.listar_paises_activos()
    for cp in paises:
        try:
            datos_pago = await ServicioMercadoPago.obtener_pago(
                cp.mp_access_token, pago_id
            )
            if datos_pago:
                config_pais = cp
                break
        except ErrorPasarelaPago:
            continue

    if not config_pais or not datos_pago:
        logger.warning("No se pudo obtener datos del pago %s con ningún país", pago_id)
        return

    estado_mp = datos_pago.get("status", "")
    estado_local = MAPA_ESTADOS_PAGO.get(estado_mp, "pendiente")

    # Buscar suscripción asociada
    referencia = datos_pago.get("external_reference", "")
    suscripcion = None
    usuario_id = None

    preapproval_id = datos_pago.get("preapproval_id")
    if preapproval_id:
        suscripcion = await repo_sus.obtener_por_preapproval_id(preapproval_id)

    if suscripcion:
        usuario_id = suscripcion.usuario_id

    monto = int(datos_pago.get("transaction_amount", 0) * 100)
    moneda = datos_pago.get("currency_id", "ARS")

    pago = await repo_pago.crear(
        monto_centavos=monto,
        moneda=moneda,
        suscripcion_id=suscripcion.id if suscripcion else None,
        usuario_id=usuario_id,
        mp_pago_id=pago_id,
        estado=estado_local,
        metodo_pago=datos_pago.get("payment_method_id"),
        detalle_estado=datos_pago.get("status_detail"),
        referencia_externa=referencia,
        datos_mp=datos_pago,
        fecha_pago=_parsear_fecha(datos_pago.get("date_approved")),
    )

    # Si pago aprobado y hay suscripción, activarla y cancelar gratis
    if estado_local == "aprobado" and suscripcion and suscripcion.estado != "activa":
        await repo_sus.actualizar_estado(suscripcion.id, "activa", datos_mp=datos_pago)
        await repo_sus.cancelar_gratis_usuario(suscripcion.usuario_id)
        try:
            repo_usuario = RepositorioUsuario(db)
            usuario = await repo_usuario.obtener_por_id(suscripcion.usuario_id)
            if usuario:
                await ServicioEmail.enviar_suscripcion_activa(
                    usuario.email, usuario.nombre, "Premium"
                )
        except Exception:
            logger.warning("No se pudo enviar email de suscripción activa")

    # Auto-crear factura si el pago fue aprobado y hay usuario
    if estado_local == "aprobado" and usuario_id:
        # Idempotencia: verificar que no exista factura para este pago
        factura_existente = await repo_factura.obtener_por_pago_id(pago.id)
        if not factura_existente:
            await repo_factura.crear(
                usuario_id=usuario_id,
                pago_id=pago.id,
                suscripcion_id=suscripcion.id if suscripcion else None,
                monto_centavos=monto,
                moneda=moneda,
                concepto=f"Suscripción CosmicEngine — Pago {pago_id[:8]}",
                pais_codigo=config_pais.pais_codigo,
            )


@router.post("/sincronizar-pagos")
async def sincronizar_pagos(
    usuario: Usuario = Depends(obtener_usuario_actual),
    db: AsyncSession = Depends(_obtener_db_placeholder),
):
    """Sincroniza pagos y estado de suscripción desde MercadoPago.

    Recorre TODAS las suscripciones del usuario que tengan mp_preapproval_id
    (no solo la activa), sincroniza el estado del preapproval y crea los
    registros de pago/factura que falten. Útil en desarrollo donde los
    webhooks no llegan a localhost.
    """
    repo_sus = RepositorioSuscripcion(db)
    repo_pago = RepositorioPago(db)
    repo_factura = RepositorioFactura(db)
    # Buscar TODAS las suscripciones con MP (no solo la activa)
    suscripciones = await repo_sus.listar_con_mp_por_usuario(usuario.id)
    if not suscripciones:
        return {"exito": True, "datos": {"sincronizados": 0, "estado_actualizado": False},
                "mensaje": "Sin suscripciones vinculadas a MercadoPago"}

    sincronizados = 0
    consultados_ok = 0
    estado_actualizado = False
    errores: list[str] = []

    for suscripcion in suscripciones:
        config_pais = await repo_sus.obtener_config_pais(suscripcion.pais_codigo)
        if not config_pais:
            errores.append(f"Sin config para país {suscripcion.pais_codigo}")
            continue

        # 1. Sincronizar estado del preapproval
        try:
            datos_preapproval = await ServicioMercadoPago.obtener_preapproval(
                config_pais.mp_access_token, suscripcion.mp_preapproval_id
            )
            estado_mp = datos_preapproval.get("status", "")
            estado_local = MAPA_ESTADOS_SUSCRIPCION.get(estado_mp, suscripcion.estado)

            if estado_local != suscripcion.estado:
                await repo_sus.actualizar_estado(
                    suscripcion.id, estado_local, datos_mp=datos_preapproval
                )
                estado_actualizado = True

                # Si se activó premium, cancelar la gratis
                if estado_local == "activa":
                    await repo_sus.cancelar_gratis_usuario(usuario.id)
        except ErrorPasarelaPago as e:
            logger.warning(
                "No se pudo consultar preapproval %s: %s",
                suscripcion.mp_preapproval_id, str(e),
            )
            errores.append(
                f"Suscripción {suscripcion.mp_preapproval_id[:8]}… "
                f"no encontrada en MercadoPago"
            )
            continue

        consultados_ok += 1

        # 2. Sincronizar pagos autorizados
        pagos_mp = await ServicioMercadoPago.buscar_pagos_preapproval(
            config_pais.mp_access_token, suscripcion.mp_preapproval_id
        )

        for datos_pago in pagos_mp:
            # authorized_payments: { id, payment: { id, status, status_detail } }
            payment_info = datos_pago.get("payment", {})
            pago_id_mp = str(payment_info.get("id") or datos_pago.get("id", ""))
            if not pago_id_mp:
                continue

            existente = await repo_pago.obtener_por_mp_pago_id(pago_id_mp)
            if existente:
                continue

            estado_pago_mp = payment_info.get("status") or datos_pago.get("status", "")
            estado_pago = MAPA_ESTADOS_PAGO.get(estado_pago_mp, "pendiente")
            monto = int(datos_pago.get("transaction_amount", 0) * 100)
            moneda = datos_pago.get("currency_id", config_pais.moneda)

            pago = await repo_pago.crear(
                monto_centavos=monto,
                moneda=moneda,
                suscripcion_id=suscripcion.id,
                usuario_id=usuario.id,
                mp_pago_id=pago_id_mp,
                estado=estado_pago,
                metodo_pago=datos_pago.get("payment_method_id"),
                detalle_estado=payment_info.get("status_detail"),
                referencia_externa=datos_pago.get("external_reference", ""),
                datos_mp=datos_pago,
                fecha_pago=_parsear_fecha(
                    datos_pago.get("debit_date") or datos_pago.get("date_created")
                ),
            )

            if estado_pago == "aprobado":
                factura_existente = await repo_factura.obtener_por_pago_id(pago.id)
                if not factura_existente:
                    await repo_factura.crear(
                        usuario_id=usuario.id,
                        pago_id=pago.id,
                        suscripcion_id=suscripcion.id,
                        monto_centavos=monto,
                        moneda=moneda,
                        concepto=f"Suscripción CosmicEngine — Pago {pago_id_mp[:8]}",
                        pais_codigo=config_pais.pais_codigo,
                        email_cliente=usuario.email,
                        nombre_cliente=usuario.nombre,
                    )

                # Si el pago está aprobado y la suscripción no está activa, activarla
                if suscripcion.estado != "activa":
                    await repo_sus.actualizar_estado(suscripcion.id, "activa")
                    await repo_sus.cancelar_gratis_usuario(usuario.id)
                    estado_actualizado = True

            sincronizados += 1

    partes_mensaje: list[str] = []
    if sincronizados > 0:
        partes_mensaje.append(f"Se sincronizaron {sincronizados} pagos")
    elif consultados_ok > 0:
        partes_mensaje.append("Todo al día, sin pagos nuevos")
    if errores:
        partes_mensaje.append(f"{len(errores)} suscripciones no encontradas en MP")
    mensaje = ". ".join(partes_mensaje) if partes_mensaje else "Sin cambios"

    return {
        "exito": True,
        "datos": {
            "sincronizados": sincronizados,
            "estado_actualizado": estado_actualizado,
            "errores": errores,
        },
        "mensaje": mensaje,
    }


@router.get("/pagos")
async def listar_pagos(
    usuario: Usuario = Depends(obtener_usuario_actual),
    db: AsyncSession = Depends(_obtener_db_placeholder),
    limite: int = 50,
    offset: int = 0,
):
    """Lista el historial de pagos del usuario con factura asociada."""
    repo = RepositorioPago(db)
    repo_factura = RepositorioFactura(db)
    pagos = await repo.listar_por_usuario(usuario.id, limite=limite, offset=offset)

    # Obtener facturas en batch
    pago_ids = [pago.id for pago in pagos]
    facturas_por_pago = await repo_factura.obtener_por_pago_ids(pago_ids)

    resultado = []
    for pago in pagos:
        factura = facturas_por_pago.get(pago.id)
        resultado.append({
            "id": str(pago.id),
            "estado": pago.estado,
            "monto_centavos": pago.monto_centavos,
            "moneda": pago.moneda,
            "metodo_pago": pago.metodo_pago,
            "detalle_estado": pago.detalle_estado,
            "fecha_pago": pago.fecha_pago.isoformat() if pago.fecha_pago else None,
            "creado_en": pago.creado_en.isoformat() if pago.creado_en else None,
            "factura_id": str(factura.id) if factura else None,
            "numero_factura": factura.numero_factura if factura else None,
        })

    return {"exito": True, "datos": resultado}


@router.get("/facturas")
async def listar_facturas(
    usuario: Usuario = Depends(obtener_usuario_actual),
    db: AsyncSession = Depends(_obtener_db_placeholder),
    limite: int = 50,
    offset: int = 0,
):
    """Lista las facturas del usuario."""
    repo = RepositorioFactura(db)
    facturas = await repo.listar_por_usuario(usuario.id, limite=limite, offset=offset)

    resultado = []
    for f in facturas:
        resultado.append({
            "id": str(f.id),
            "numero_factura": f.numero_factura,
            "estado": f.estado,
            "monto_centavos": f.monto_centavos,
            "moneda": f.moneda,
            "concepto": f.concepto,
            "pais_codigo": f.pais_codigo,
            "email_cliente": f.email_cliente,
            "nombre_cliente": f.nombre_cliente,
            "periodo_inicio": f.periodo_inicio.isoformat() if f.periodo_inicio else None,
            "periodo_fin": f.periodo_fin.isoformat() if f.periodo_fin else None,
            "creado_en": f.creado_en.isoformat() if f.creado_en else None,
        })

    return {"exito": True, "datos": resultado}


@router.get("/facturas/{factura_id}/pdf")
async def descargar_factura_pdf(
    factura_id: str,
    usuario: Usuario = Depends(obtener_usuario_actual),
    db: AsyncSession = Depends(_obtener_db_placeholder),
):
    """Genera y descarga la factura en formato PDF."""
    from reportlab.lib import colors
    from reportlab.lib.pagesizes import A4
    from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
    from reportlab.lib.units import mm
    from reportlab.platypus import Paragraph, SimpleDocTemplate, Spacer, Table, TableStyle

    repo = RepositorioFactura(db)
    factura = await repo.obtener_por_id(uuid.UUID(factura_id))

    if not factura or factura.usuario_id != usuario.id:
        from fastapi import HTTPException

        raise HTTPException(status_code=404, detail="Factura no encontrada")

    # Generar PDF en memoria
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        leftMargin=20 * mm,
        rightMargin=20 * mm,
        topMargin=20 * mm,
        bottomMargin=20 * mm,
    )

    estilos = getSampleStyleSheet()
    titulo = ParagraphStyle(
        "Titulo",
        parent=estilos["Title"],
        fontSize=22,
        spaceAfter=6 * mm,
        textColor=colors.HexColor("#4A00E0"),
    )
    subtitulo = ParagraphStyle(
        "Sub",
        parent=estilos["Normal"],
        fontSize=10,
        textColor=colors.grey,
    )
    normal = estilos["Normal"]

    elementos = []

    # Encabezado
    elementos.append(Paragraph("CosmicEngine", titulo))
    elementos.append(Paragraph("Plataforma de cálculo esotérico-astronómico", subtitulo))
    elementos.append(Spacer(1, 10 * mm))

    # Datos de factura
    fecha_emision = factura.creado_en.strftime("%d/%m/%Y") if factura.creado_en else "—"
    datos_factura = [
        ["FACTURA", ""],
        ["Número:", factura.numero_factura],
        ["Fecha de emisión:", fecha_emision],
        ["Estado:", factura.estado.capitalize()],
    ]

    if factura.email_cliente:
        datos_factura.append(["Cliente:", factura.email_cliente])
    if factura.nombre_cliente:
        datos_factura.append(["Nombre:", factura.nombre_cliente])

    tabla_info = Table(datos_factura, colWidths=[50 * mm, 110 * mm])
    tabla_info.setStyle(TableStyle([
        ("FONTNAME", (0, 0), (1, 0), "Helvetica-Bold"),
        ("FONTSIZE", (0, 0), (1, 0), 14),
        ("TEXTCOLOR", (0, 0), (1, 0), colors.HexColor("#4A00E0")),
        ("BOTTOMPADDING", (0, 0), (1, 0), 8),
        ("FONTNAME", (0, 1), (0, -1), "Helvetica-Bold"),
        ("FONTSIZE", (0, 1), (-1, -1), 10),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("LEFTPADDING", (0, 0), (-1, -1), 0),
    ]))
    elementos.append(tabla_info)
    elementos.append(Spacer(1, 10 * mm))

    # Detalle
    monto_str = f"${factura.monto_centavos / 100:.2f} {factura.moneda}"
    detalle = [
        ["Concepto", "Monto"],
        [factura.concepto, monto_str],
    ]

    tabla_detalle = Table(detalle, colWidths=[120 * mm, 40 * mm])
    tabla_detalle.setStyle(TableStyle([
        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        ("FONTSIZE", (0, 0), (-1, -1), 10),
        ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#F0EAFF")),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.HexColor("#4A00E0")),
        ("GRID", (0, 0), (-1, -1), 0.5, colors.lightgrey),
        ("ALIGN", (1, 0), (1, -1), "RIGHT"),
        ("TOPPADDING", (0, 0), (-1, -1), 6),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
        ("LEFTPADDING", (0, 0), (-1, -1), 8),
        ("RIGHTPADDING", (0, 0), (-1, -1), 8),
    ]))
    elementos.append(tabla_detalle)
    elementos.append(Spacer(1, 10 * mm))

    # Total
    total = [["", f"TOTAL: {monto_str}"]]
    tabla_total = Table(total, colWidths=[120 * mm, 40 * mm])
    tabla_total.setStyle(TableStyle([
        ("FONTNAME", (1, 0), (1, 0), "Helvetica-Bold"),
        ("FONTSIZE", (1, 0), (1, 0), 12),
        ("ALIGN", (1, 0), (1, 0), "RIGHT"),
        ("TEXTCOLOR", (1, 0), (1, 0), colors.HexColor("#4A00E0")),
    ]))
    elementos.append(tabla_total)
    elementos.append(Spacer(1, 15 * mm))

    # Pie
    elementos.append(Paragraph(
        "Este documento es un comprobante generado automáticamente por CosmicEngine.",
        ParagraphStyle("Pie", parent=normal, fontSize=8, textColor=colors.grey),
    ))

    doc.build(elementos)
    buffer.seek(0)

    nombre_archivo = f"factura_{factura.numero_factura}.pdf"
    return StreamingResponse(
        buffer,
        media_type="application/pdf",
        headers={"Content-Disposition": f"inline; filename={nombre_archivo}"},
    )
