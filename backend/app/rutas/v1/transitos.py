"""Rutas de tránsitos planetarios."""

from fastapi import APIRouter, Depends
from redis.asyncio import Redis

from app.cache.gestor_cache import GestorCache
from app.principal import _obtener_redis_placeholder
from app.servicios.servicio_transitos import ServicioTransitos
from app.utilidades.hash import generar_hash_parametros

router = APIRouter()

TIPO_CALCULO = "transits"


@router.get("/transits")
async def obtener_transitos(
    redis: Redis = Depends(_obtener_redis_placeholder),
):
    """Obtiene las posiciones actuales de todos los planetas.

    Cache TTL=600s. No persiste en DB (datos efímeros).
    """
    # 1. Hash basado en minuto actual (precisión razonable para tránsitos)
    from datetime import datetime, timezone

    ahora = datetime.now(timezone.utc)
    hash_params = generar_hash_parametros(
        tipo=TIPO_CALCULO,
        fecha=ahora.strftime("%Y-%m-%d"),
        hora=ahora.strftime("%H:%M"),
    )

    # 2. Cache Redis (TTL=600s)
    cache = GestorCache(redis)
    resultado_cache = await cache.obtener(hash_params)
    if resultado_cache is not None:
        return {"exito": True, "datos": resultado_cache, "cache": True}

    # 3. Calcular
    transitos = ServicioTransitos.obtener_transitos_actuales()

    # 4. Solo cache, sin DB (efímero)
    await cache.guardar(hash_params, transitos, TIPO_CALCULO)

    return {"exito": True, "datos": transitos, "cache": False}
