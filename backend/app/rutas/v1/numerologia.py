"""Rutas de numerología."""

import uuid

from fastapi import APIRouter, Depends, Query
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
    perfil_id: uuid.UUID | None = Query(None),
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

    # 2. Cache Redis (invalidar si faltan campos de versiones nuevas)
    cache = GestorCache(redis)
    resultado_cache = await cache.obtener(hash_params)
    if resultado_cache is not None and "etapas_de_la_vida" in resultado_cache:
        if perfil_id:
            try:
                repo = RepositorioCalculo(db)
                existente = await repo.obtener_por_perfil_y_tipo(perfil_id, TIPO_CALCULO)
                if not existente:
                    await repo.guardar(
                        perfil_id=perfil_id,
                        tipo=TIPO_CALCULO,
                        hash_parametros=hash_params,
                        resultado_json=resultado_cache,
                    )
            except Exception as e:
                logger.warning("Error vinculando cálculo numerología a perfil: %s", e)
        return {"exito": True, "datos": resultado_cache, "cache": True}

    # 3. Si hay perfil_id, buscar en DB por perfil
    if perfil_id:
        try:
            repo = RepositorioCalculo(db)
            calculo_db = await repo.obtener_por_perfil_y_tipo(perfil_id, TIPO_CALCULO)
            if calculo_db and "etapas_de_la_vida" in calculo_db.resultado_json:
                await cache.guardar(hash_params, calculo_db.resultado_json, TIPO_CALCULO)
                return {"exito": True, "datos": calculo_db.resultado_json, "cache": True}
        except Exception as e:
            logger.warning("Error buscando cálculo numerología por perfil: %s", e)

    # 4. Calcular
    carta = ServicioNumerologia.calcular_carta_completa(
        datos.nombre,
        datos.fecha_nacimiento,
        datos.sistema,
    )

    resultado = carta

    # 5. Cache
    await cache.guardar(hash_params, resultado, TIPO_CALCULO)

    # 6. DB — actualizar existente o crear nuevo
    try:
        repo = RepositorioCalculo(db)
        existente = await repo.obtener_por_perfil_y_tipo(perfil_id, TIPO_CALCULO) if perfil_id else None
        if existente:
            existente.resultado_json = resultado
            existente.hash_parametros = hash_params
            await db.commit()
        else:
            await repo.guardar(
                perfil_id=perfil_id,
                tipo=TIPO_CALCULO,
                hash_parametros=hash_params,
                resultado_json=resultado,
            )
    except Exception as e:
        logger.warning("Error persistiendo cálculo numerología en DB: %s", e)

    return {"exito": True, "datos": resultado, "cache": False}
