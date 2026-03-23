"""Rutas del Calendario Cósmico — tránsitos por día y rango."""

from datetime import date, timedelta

from fastapi import APIRouter, Depends, HTTPException, Query
from redis.asyncio import Redis

from app.cache.gestor_cache import GestorCache
from app.principal import _obtener_redis_placeholder
from app.servicios.servicio_transitos import ServicioTransitos
from app.utilidades.hash import generar_hash_parametros

router = APIRouter()

TIPO_CALCULO = "calendario-cosmico"


def _determinar_tipo_cache(fecha_str: str) -> str:
    """Determina el tipo de cache según si la fecha es pasada, hoy o futura."""
    fecha = date.fromisoformat(fecha_str)
    hoy = date.today()

    if fecha < hoy:
        return "calendario-pasado"
    elif fecha == hoy:
        return "calendario-hoy"
    else:
        return "calendario-futuro"


@router.get("/calendario-cosmico/dia")
async def obtener_transitos_dia(
    fecha: str = Query(..., description="Fecha en formato YYYY-MM-DD"),
    redis: Redis = Depends(_obtener_redis_placeholder),
):
    """Obtiene las posiciones planetarias de un día específico (mediodía UTC)."""
    try:
        date.fromisoformat(fecha)
    except ValueError:
        raise HTTPException(status_code=400, detail="Formato de fecha inválido. Use YYYY-MM-DD")

    hash_params = generar_hash_parametros(tipo=TIPO_CALCULO, fecha=fecha)
    cache = GestorCache(redis)

    resultado_cache = await cache.obtener(hash_params)
    if resultado_cache is not None:
        return {"exito": True, "datos": resultado_cache, "cache": True}

    resultado = ServicioTransitos.obtener_transitos_fecha(fecha)

    tipo_cache = _determinar_tipo_cache(fecha)
    await cache.guardar(hash_params, resultado, tipo_cache)

    return {"exito": True, "datos": resultado, "cache": False}


@router.get("/calendario-cosmico/rango")
async def obtener_transitos_rango(
    fecha_inicio: str = Query(..., description="Fecha inicio YYYY-MM-DD"),
    fecha_fin: str = Query(..., description="Fecha fin YYYY-MM-DD"),
    redis: Redis = Depends(_obtener_redis_placeholder),
):
    """Obtiene tránsitos de un rango de fechas (máximo 31 días).

    Cachea cada día individualmente para máxima reutilización.
    """
    try:
        inicio = date.fromisoformat(fecha_inicio)
        fin = date.fromisoformat(fecha_fin)
    except ValueError:
        raise HTTPException(status_code=400, detail="Formato de fecha inválido. Use YYYY-MM-DD")

    cantidad_dias = (fin - inicio).days + 1
    if cantidad_dias > 31:
        raise HTTPException(status_code=400, detail="El rango no puede exceder 31 días")
    if cantidad_dias < 1:
        raise HTTPException(
            status_code=400,
            detail="La fecha de inicio debe ser anterior o igual a la fecha de fin",
        )

    cache = GestorCache(redis)
    dias = []
    fecha_actual = inicio

    while fecha_actual <= fin:
        fecha_str = fecha_actual.isoformat()
        hash_params = generar_hash_parametros(tipo=TIPO_CALCULO, fecha=fecha_str)

        resultado_cache = await cache.obtener(hash_params)
        if resultado_cache is not None:
            dias.append(resultado_cache)
        else:
            resultado = ServicioTransitos.obtener_transitos_fecha(fecha_str)
            tipo_cache = _determinar_tipo_cache(fecha_str)
            await cache.guardar(hash_params, resultado, tipo_cache)
            dias.append(resultado)

        fecha_actual += timedelta(days=1)

    return {
        "exito": True,
        "datos": {
            "fecha_inicio": fecha_inicio,
            "fecha_fin": fecha_fin,
            "dias": dias,
        },
        "cache": False,
    }
