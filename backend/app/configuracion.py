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
    database_url: str = "postgresql+asyncpg://cosmic:cosmic123@localhost:5432/cosmicengine"
    database_url_sync: str = "postgresql+psycopg2://cosmic:cosmic123@localhost:5432/cosmicengine"

    # Redis
    redis_url: str = "redis://localhost:6379/0"

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


@lru_cache
def obtener_configuracion() -> Configuracion:
    """Singleton de configuración."""
    return Configuracion()
