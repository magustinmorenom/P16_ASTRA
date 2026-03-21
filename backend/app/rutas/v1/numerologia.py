"""Rutas de numerología."""

from fastapi import APIRouter, Depends
from redis.asyncio import Redis
from sqlalchemy.ext.asyncio import AsyncSession

from app.cache.gestor_cache import GestorCache
from app.datos.repositorio_calculo import RepositorioCalculo
from app.esquemas.entrada import DatosNumerologia
from app.principal import _obtener_db_placeholder, _obtener_redis_placeholder
from app.registro import logger
from app.servicios.servicio_numerologia import ServicioNumerologia
from app.utilidades.hash import generar_hash_parametros

router = APIRouter()

TIPO_CALCULO = "numerology"


@router.post("/numerology")
async def calcular_numerologia(
    datos: DatosNumerologia,
    db: AsyncSession = Depends(_obtener_db_placeholder),
    redis: Redis = Depends(_obtener_redis_placeholder),
):
    """Calcula una carta numerológica completa."""
    # 1. Hash determinista
    hash_params = generar_hash_parametros(
        tipo=TIPO_CALCULO,
        nombre=datos.nombre,
        fecha=str(datos.fecha_nacimiento),
        sistema=datos.sistema,
    )

    # 2. Cache Redis
    cache = GestorCache(redis)
    resultado_cache = await cache.obtener(hash_params)
    if resultado_cache is not None:
        return {"exito": True, "datos": resultado_cache, "cache": True}

    # 3. Calcular
    carta = ServicioNumerologia.calcular_carta_completa(
        datos.nombre,
        datos.fecha_nacimiento,
        datos.sistema,
    )

    resultado = carta

    # 4. Cache
    await cache.guardar(hash_params, resultado, TIPO_CALCULO)

    # 5. DB
    try:
        repo = RepositorioCalculo(db)
        await repo.guardar(
            perfil_id=None,
            tipo=TIPO_CALCULO,
            hash_parametros=hash_params,
            resultado_json=resultado,
        )
    except Exception as e:
        logger.warning("Error persistiendo cálculo numerología en DB: %s", e)

    return {"exito": True, "datos": resultado, "cache": False}
