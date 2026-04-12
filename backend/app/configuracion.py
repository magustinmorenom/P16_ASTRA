"""Configuración centralizada con pydantic-settings."""

from functools import lru_cache
from pydantic_settings import BaseSettings, SettingsConfigDict


class Configuracion(BaseSettings):
    """Configuración de la aplicación cargada desde variables de entorno / .env."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    # Base de datos (obligatorias)
    database_url: str
    database_url_sync: str

    # Redis (obligatoria)
    redis_url: str

    # Efemérides
    ephe_path: str = "./datos_efemerides"

    # Geocodificación
    nominatim_user_agent: str = "cosmic-engine/1.0"

    # Aplicación
    ambiente: str = "desarrollo"
    log_level: str = "INFO"
    version: str = "1.0.0"
    asignar_premium_por_defecto: bool = False

    # Dominio y CORS (producción)
    dominio: str = ""
    cors_origins: str = ""

    # Cache TTLs (segundos)
    cache_ttl_transitos: int = 600
    cache_ttl_determinista: int = 0

    # JWT (clave_secreta obligatoria)
    clave_secreta: str
    algoritmo_jwt: str = "HS256"
    expiracion_token_acceso: int = 30
    expiracion_token_refresco: int = 10080

    # Google OAuth
    google_client_id: str = ""
    google_client_secret: str = ""
    google_redirect_uri: str = "http://localhost:3000/callback"

    # MercadoPago — credenciales por país
    mp_access_token_ar: str = ""
    mp_public_key_ar: str = ""
    mp_access_token_br: str = ""
    mp_public_key_br: str = ""
    mp_access_token_mx: str = ""
    mp_public_key_mx: str = ""

    # MercadoPago — email del comprador test
    mp_payer_email_test: str = ""

    # Telegram Bot
    telegram_bot_token: str = ""

    # Anthropic (Claude API)
    anthropic_api_key: str = ""
    anthropic_modelo: str = "claude-opus-4-6"
    oraculo_modelo: str = "claude-haiku-4-5-20251001"
    pronostico_modelo: str = "claude-sonnet-4-6"

    # Gemini (opcional)
    gemini_api_key: str = ""

    # MinIO / S3
    minio_endpoint: str = "localhost:9002"
    minio_access_key: str = "cosmicminio"
    minio_secret_key: str = "cosmicminio123"
    minio_bucket: str = "astra-podcasts"
    minio_secure: bool = False

    # Resend (email transaccional)
    resend_api_key: str = ""
    resend_from: str = "ASTRA <noreply@theastra.xyz>"

    # MercadoPago — webhook y URLs
    mp_webhook_secret: str = ""
    mp_notification_url: str = "http://localhost:8000/api/v1/suscripcion/webhook"
    mp_url_exito: str = "http://localhost:3000/suscripcion/exito"
    mp_url_fallo: str = "http://localhost:3000/suscripcion/fallo"
    mp_url_pendiente: str = "http://localhost:3000/suscripcion/pendiente"


@lru_cache
def obtener_configuracion() -> Configuracion:
    """Singleton de configuración."""
    return Configuracion()
