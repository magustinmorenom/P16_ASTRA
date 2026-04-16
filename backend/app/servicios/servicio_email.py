"""Servicio de email transaccional con Resend.

Los templates HTML están en app/email_templates/ y usan
placeholders {{variable}} que se reemplazan en tiempo de envío.
"""

import logging
from pathlib import Path
from typing import Optional

import httpx

from app.configuracion import obtener_configuracion

logger = logging.getLogger(__name__)

RESEND_API_URL = "https://api.resend.com/emails"
TEMPLATES_DIR = Path(__file__).parent.parent / "email_templates"


def _cargar_template(nombre: str, variables: dict[str, str]) -> str:
    """Carga un template HTML y reemplaza las variables."""
    # Cargar base y contenido
    base = (TEMPLATES_DIR / "base.html").read_text(encoding="utf-8")
    contenido = (TEMPLATES_DIR / f"{nombre}.html").read_text(encoding="utf-8")

    # Insertar contenido en base
    html = base.replace("{{contenido}}", contenido)

    # Reemplazar variables
    for clave, valor in variables.items():
        html = html.replace(f"{{{{{clave}}}}}", valor)

    return html


class ServicioEmail:
    """Envía emails transaccionales a través de Resend."""

    @staticmethod
    async def enviar(
        destinatario: str,
        asunto: str,
        html: str,
        remitente: Optional[str] = None,
    ) -> Optional[str]:
        """Envía un email y retorna el ID de Resend o None si falla."""
        config = obtener_configuracion()

        if not config.resend_api_key:
            logger.warning("RESEND_API_KEY no configurada, email no enviado")
            return None

        payload = {
            "from": remitente or config.resend_from,
            "to": destinatario,
            "subject": asunto,
            "html": html,
        }

        try:
            async with httpx.AsyncClient(timeout=15.0) as cliente:
                respuesta = await cliente.post(
                    RESEND_API_URL,
                    headers={
                        "Authorization": f"Bearer {config.resend_api_key}",
                        "Content-Type": "application/json",
                    },
                    json=payload,
                )

                if respuesta.status_code == 200:
                    data = respuesta.json()
                    logger.info("Email enviado a %s (id=%s)", destinatario, data.get("id"))

                    # Registrar consumo Resend (fire-and-forget)
                    try:
                        from app.servicios.servicio_consumo_api import registrar_consumo
                        from app.datos.sesion import crear_sesion_factory, crear_motor_async
                        from app.configuracion import obtener_configuracion as _obt_cfg
                        _c = _obt_cfg()
                        motor = crear_motor_async(_c.database_url)
                        factory = crear_sesion_factory(motor)
                        async with factory() as s:
                            await registrar_consumo(
                                s,
                                usuario_id=None,
                                servicio="resend",
                                operacion="email",
                                modelo="resend",
                                metadata_extra={"asunto": asunto, "destinatario": destinatario},
                            )
                        await motor.dispose()
                    except Exception as e_track:
                        logger.debug("Error tracking email: %s", e_track)

                    return data.get("id")

                logger.error(
                    "Error enviando email a %s: %s %s",
                    destinatario, respuesta.status_code, respuesta.text[:200],
                )
                return None

        except httpx.HTTPError as e:
            logger.error("Error de conexión con Resend: %s", str(e))
            return None

    # ------------------------------------------------------------------
    # Templates predefinidos
    # ------------------------------------------------------------------

    @staticmethod
    def _url_app() -> str:
        config = obtener_configuracion()
        return config.dominio or "https://theastra.xyz"

    @staticmethod
    async def enviar_bienvenida(email: str, nombre: str) -> Optional[str]:
        """Email de bienvenida al registrarse."""
        html = _cargar_template("bienvenida", {
            "nombre": nombre,
            "url_app": ServicioEmail._url_app(),
        })
        return await ServicioEmail.enviar(email, "Bienvenido/a a ASTRA", html)

    @staticmethod
    async def enviar_reset_password(email: str, nombre: str, token: str) -> Optional[str]:
        """Email para restablecer contraseña (legacy con enlace)."""
        enlace = f"{ServicioEmail._url_app()}/reset-password?token={token}"
        html = _cargar_template("reset_password", {
            "nombre": nombre,
            "enlace_reset": enlace,
        })
        return await ServicioEmail.enviar(email, "Restablecer contraseña — ASTRA", html)

    @staticmethod
    async def enviar_codigo_otp(email: str, nombre: str, codigo: str) -> Optional[str]:
        """Email con código OTP para restablecer contraseña."""
        html = _cargar_template("codigo_otp", {
            "nombre": nombre,
            "codigo": codigo,
        })
        return await ServicioEmail.enviar(email, "Tu código de verificación — ASTRA", html)

    @staticmethod
    async def enviar_verificacion_cuenta(email: str, nombre: str, codigo: str) -> Optional[str]:
        """Email con código OTP para verificar la cuenta al registrarse."""
        html = _cargar_template("verificacion_cuenta", {
            "nombre": nombre,
            "codigo": codigo,
        })
        return await ServicioEmail.enviar(email, "Verificá tu cuenta — ASTRA", html)

    @staticmethod
    async def enviar_cuenta_verificada(email: str, nombre: str) -> Optional[str]:
        """Confirmación de que la cuenta fue verificada exitosamente."""
        html = _cargar_template("cuenta_verificada", {
            "nombre": nombre,
            "url_app": ServicioEmail._url_app(),
        })
        return await ServicioEmail.enviar(email, "Cuenta verificada — ASTRA", html)

    @staticmethod
    async def enviar_suscripcion_activa(email: str, nombre: str, plan: str) -> Optional[str]:
        """Notificación de suscripción activada."""
        html = _cargar_template("suscripcion_activa", {
            "nombre": nombre,
            "plan": plan,
            "url_app": ServicioEmail._url_app(),
        })
        return await ServicioEmail.enviar(email, f"Plan {plan} activado — ASTRA", html)

    @staticmethod
    async def enviar_suscripcion_cancelada(email: str, nombre: str, plan: str) -> Optional[str]:
        """Notificación de suscripción cancelada."""
        html = _cargar_template("suscripcion_cancelada", {
            "nombre": nombre,
            "plan": plan,
            "url_app": ServicioEmail._url_app(),
        })
        return await ServicioEmail.enviar(email, f"Suscripción cancelada — ASTRA", html)

    @staticmethod
    async def enviar_cuenta_eliminada(email: str, nombre: str) -> Optional[str]:
        """Confirmación de cuenta eliminada."""
        html = _cargar_template("cuenta_eliminada", {
            "nombre": nombre,
            "url_app": ServicioEmail._url_app(),
        })
        return await ServicioEmail.enviar(email, "Tu cuenta fue eliminada — ASTRA", html)

    @staticmethod
    async def enviar_pago_rechazado(email: str, nombre: str) -> Optional[str]:
        """Notificación de pago rechazado."""
        html = _cargar_template("pago_rechazado", {
            "nombre": nombre,
            "url_app": ServicioEmail._url_app(),
        })
        return await ServicioEmail.enviar(email, "Pago rechazado — ASTRA", html)

    @staticmethod
    async def enviar_expiracion_gracia(email: str, nombre: str, fecha_fin: str) -> Optional[str]:
        """Notificación de expiración del período de gracia."""
        html = _cargar_template("expiracion_gracia", {
            "nombre": nombre,
            "fecha_fin": fecha_fin,
            "url_app": ServicioEmail._url_app(),
        })
        return await ServicioEmail.enviar(email, "Tu plan Premium ha expirado — ASTRA", html)

    @staticmethod
    async def enviar_podcast_listo(email: str, nombre: str, titulo_podcast: str) -> Optional[str]:
        """Notificación de podcast generado."""
        html = _cargar_template("podcast_listo", {
            "nombre": nombre,
            "titulo_podcast": titulo_podcast,
            "url_app": ServicioEmail._url_app(),
        })
        return await ServicioEmail.enviar(email, f"Podcast listo: {titulo_podcast} — ASTRA", html)
