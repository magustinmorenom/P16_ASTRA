"""Dependencias de inyección para FastAPI."""

from typing import AsyncGenerator

from redis.asyncio import Redis
from sqlalchemy.ext.asyncio import AsyncSession

from app.configuracion import Configuracion, obtener_configuracion


async def obtener_config() -> Configuracion:
    """Dependencia de configuración."""
    return obtener_configuracion()


async def obtener_db(
) -> AsyncGenerator[AsyncSession, None]:
    """Dependencia de sesión de base de datos.

    La sesión se inyecta desde el estado de la app en principal.py.
    Este es un placeholder que se sobreescribe en lifespan.
    """
    raise NotImplementedError("La sesión DB se configura en lifespan")


async def obtener_redis() -> Redis:
    """Dependencia de conexión Redis.

    Se inyecta desde el estado de la app en principal.py.
    """
    raise NotImplementedError("Redis se configura en lifespan")
