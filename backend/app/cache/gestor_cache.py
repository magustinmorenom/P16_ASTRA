"""Gestor de cache Redis para cálculos deterministas."""

import json
from typing import Any

from redis.asyncio import Redis

from app.registro import logger


class GestorCache:
    """Cache Redis para resultados de cálculos."""

    # TTLs por tipo de cálculo (segundos)
    # 0 = sin expiración (cálculos deterministas)
    TTLS = {
        "natal": 0,
        "human-design": 0,
        "numerology": 0,
        "solar-return": 0,
        "transits": 600,  # 10 minutos
    }

    def __init__(self, redis: Redis):
        self.redis = redis

    async def obtener(self, clave: str) -> dict | None:
        """Obtiene un resultado del cache."""
        try:
            datos = await self.redis.get(f"cosmic:{clave}")
            if datos:
                logger.debug("Cache HIT: %s", clave)
                return json.loads(datos)
            logger.debug("Cache MISS: %s", clave)
            return None
        except Exception as e:
            logger.warning("Error leyendo cache: %s", e)
            return None

    async def guardar(
        self,
        clave: str,
        valor: Any,
        tipo: str = "natal",
    ) -> None:
        """Guarda un resultado en el cache."""
        try:
            ttl = self.TTLS.get(tipo, 0)
            datos = json.dumps(valor, default=str)

            if ttl > 0:
                await self.redis.setex(f"cosmic:{clave}", ttl, datos)
            else:
                await self.redis.set(f"cosmic:{clave}", datos)

            logger.debug("Cache SET: %s (TTL=%s)", clave, ttl or "∞")
        except Exception as e:
            logger.warning("Error escribiendo cache: %s", e)

    async def invalidar(self, clave: str) -> None:
        """Elimina una entrada del cache."""
        try:
            await self.redis.delete(f"cosmic:{clave}")
        except Exception as e:
            logger.warning("Error invalidando cache: %s", e)
