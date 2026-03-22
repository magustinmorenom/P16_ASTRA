"""Servicio de autenticación con Google OAuth2."""

from authlib.integrations.httpx_client import AsyncOAuth2Client

from app.configuracion import obtener_configuracion

GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth"
GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token"
GOOGLE_USERINFO_URL = "https://www.googleapis.com/oauth2/v3/userinfo"


class ServicioGoogleOAuth:
    """Flujo OAuth2 con Google."""

    @staticmethod
    def obtener_url_autorizacion() -> str:
        """Genera la URL de autorización de Google."""
        config = obtener_configuracion()
        cliente = AsyncOAuth2Client(
            client_id=config.google_client_id,
            redirect_uri=config.google_redirect_uri,
            scope="openid email profile",
        )
        url, _ = cliente.create_authorization_url(GOOGLE_AUTH_URL)
        return url

    @staticmethod
    async def obtener_datos_usuario(codigo: str) -> dict:
        """Intercambia código de autorización por datos del usuario.

        Retorna dict con: google_id, email, nombre, verificado.
        """
        config = obtener_configuracion()
        cliente = AsyncOAuth2Client(
            client_id=config.google_client_id,
            client_secret=config.google_client_secret,
            redirect_uri=config.google_redirect_uri,
        )

        # Intercambiar código por token
        token = await cliente.fetch_token(
            GOOGLE_TOKEN_URL,
            code=codigo,
        )

        # Obtener info del usuario
        resp = await cliente.get(GOOGLE_USERINFO_URL)
        info = resp.json()

        return {
            "google_id": info["sub"],
            "email": info["email"],
            "nombre": info.get("name", info["email"].split("@")[0]),
            "verificado": info.get("email_verified", False),
        }
