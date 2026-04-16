"""Rutas del Calendario Cósmico — tránsitos por día y rango."""

from datetime import date
from zoneinfo import ZoneInfo

from fastapi import APIRouter, Depends, HTTPException, Query
from redis.asyncio import Redis
from sqlalchemy.ext.asyncio import AsyncSession

from app.cache.gestor_cache import GestorCache
from app.principal import _obtener_db_placeholder, _obtener_redis_placeholder
from app.servicios.servicio_transitos import ServicioTransitos
from app.dependencias import obtener_tz_usuario
from app.nucleo.utilidades_fecha import dia_actual
from app.utilidades.hash import generar_hash_parametros

router = APIRouter()

TIPO_CALCULO = "calendario-cosmico-v2"


def _determinar_tipo_cache(fecha_str: str, hoy: date) -> str:
    """Determina el tipo de cache según si la fecha es pasada, hoy o futura."""
    fecha = date.fromisoformat(fecha_str)

    if fecha < hoy:
        return "calendario-pasado"
    elif fecha == hoy:
        return "calendario-hoy"
    else:
        return "calendario-futuro"


def _determinar_tipo_cache_rango(inicio: date, fin: date, hoy: date) -> str:
    if fin < hoy:
        return "calendario-pasado"
    if inicio > hoy:
        return "calendario-futuro"
    return "calendario-hoy"


@router.get("/calendario-cosmico/dia")
async def obtener_transitos_dia(
    fecha: str = Query(..., description="Fecha en formato YYYY-MM-DD"),
    db: AsyncSession = Depends(_obtener_db_placeholder),
    redis: Redis = Depends(_obtener_redis_placeholder),
    tz: ZoneInfo = Depends(obtener_tz_usuario),
):
    """Obtiene el detalle del día desde la ventana persistida de tránsitos."""
    try:
        date.fromisoformat(fecha)
    except ValueError:
        raise HTTPException(status_code=400, detail="Formato de fecha inválido. Use YYYY-MM-DD")

    hash_params = generar_hash_parametros(tipo=TIPO_CALCULO, fecha=fecha)
    cache = GestorCache(redis)

    resultado_cache = await cache.obtener(hash_params)
    if resultado_cache is not None:
        return {"exito": True, "datos": resultado_cache, "cache": True}

    resultado = await ServicioTransitos.obtener_transitos_fecha_persistido(fecha, db)

    hoy = dia_actual(tz)
    tipo_cache = _determinar_tipo_cache(fecha, hoy)
    await cache.guardar(hash_params, resultado, tipo_cache)

    return {"exito": True, "datos": resultado, "cache": False}


@router.get("/calendario-cosmico/rango")
async def obtener_transitos_rango(
    fecha_inicio: str = Query(..., description="Fecha inicio YYYY-MM-DD"),
    fecha_fin: str = Query(..., description="Fecha fin YYYY-MM-DD"),
    db: AsyncSession = Depends(_obtener_db_placeholder),
    redis: Redis = Depends(_obtener_redis_placeholder),
    tz: ZoneInfo = Depends(obtener_tz_usuario),
):
    """Obtiene una grilla mensual compacta de hasta 42 días."""
    try:
        inicio = date.fromisoformat(fecha_inicio)
        fin = date.fromisoformat(fecha_fin)
    except ValueError:
        raise HTTPException(status_code=400, detail="Formato de fecha inválido. Use YYYY-MM-DD")

    cantidad_dias = (fin - inicio).days + 1
    if cantidad_dias > 42:
        raise HTTPException(status_code=400, detail="El rango no puede exceder 42 días")
    if cantidad_dias < 1:
        raise HTTPException(
            status_code=400,
            detail="La fecha de inicio debe ser anterior o igual a la fecha de fin",
        )

    hash_params = generar_hash_parametros(
        tipo=f"{TIPO_CALCULO}-rango",
        fecha_inicio=fecha_inicio,
        fecha_fin=fecha_fin,
    )
    cache = GestorCache(redis)
    resultado_cache = await cache.obtener(hash_params)
    if resultado_cache is not None:
        return {"exito": True, "datos": resultado_cache, "cache": True}

    resultado = await ServicioTransitos.obtener_transitos_rango_persistido(
        fecha_inicio,
        fecha_fin,
        db,
    )
    await cache.guardar(
        hash_params,
        resultado,
        _determinar_tipo_cache_rango(inicio, fin, dia_actual(tz)),
    )

    return {
        "exito": True,
        "datos": resultado,
        "cache": False,
    }
