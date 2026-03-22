"""Configuración centralizada con pydantic-settings."""

from functools import lru_cache
from pydantic_settings import BaseSettings, SettingsConfigDict


class Configuracion(BaseSettings):
    """Configuración de la aplicación cargada desde variables de entorno."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
    )

    # Base de datos
    database_url: str = "postgresql+asyncpg://cosmic:cosmic123@localhost:5434/cosmicengine"
    database_url_sync: str = "postgresql+psycopg2://cosmic:cosmic123@localhost:5434/cosmicengine"

    # Redis
    redis_url: str = "redis://localhost:6380/0"

    # Efemérides
    ephe_path: str = "./datos_efemerides"

    # Geocodificación
    nominatim_user_agent: str = "cosmic-engine/1.0"

    # Aplicación
    ambiente: str = "desarrollo"
    log_level: str = "INFO"
    version: str = "1.0.0"

    # Cache TTLs (segundos)
    cache_ttl_transitos: int = 600
    cache_ttl_determinista: int = 0  # 0 = sin expiración

    # JWT
    clave_secreta: str = "CAMBIAR-EN-PRODUCCION-generar-con-openssl-rand-hex-32"
    algoritmo_jwt: str = "HS256"
    expiracion_token_acceso: int = 30  # minutos
    expiracion_token_refresco: int = 10080  # 7 días en minutos

    # Google OAuth
    google_client_id: str = ""
    google_client_secret: str = ""
    google_redirect_uri: str = "http://localhost:8000/api/v1/auth/google/callback"


@lru_cache
def obtener_configuracion() -> Configuracion:
    """Singleton de configuración."""
    return Configuracion()
