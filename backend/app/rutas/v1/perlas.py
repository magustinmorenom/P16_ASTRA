"""Endpoint del servicio Perlas del día."""

from datetime import date

from fastapi import APIRouter, Depends, Query
from redis.asyncio import Redis
from sqlalchemy.ext.asyncio import AsyncSession

from app.dependencias import obtener_redis
from app.dependencias_auth import obtener_usuario_actual
from app.modelos.usuario import Usuario
from app.principal import _obtener_db_placeholder
from app.registro import logger
from app.servicios.servicio_perlas import ServicioPerlas

router = APIRouter(prefix="/perlas", tags=["Perlas del día"])


@router.get("/diaria")
async def perlas_diarias(
    fecha: date | None = Query(None, description="Fecha YYYY-MM-DD (default: hoy)"),
    usuario: Usuario = Depends(obtener_usuario_actual),
    db: AsyncSession = Depends(_obtener_db_placeholder),
    redis: Redis = Depends(obtener_redis),
):
    """Devuelve 2-3 aforismos cortos personalizados para el usuario."""
    try:
        datos = await ServicioPerlas.obtener_perlas_diarias(
            sesion=db,
            redis=redis,
            usuario_id=usuario.id,
            fecha=fecha,
        )
        return {
            "exito": True,
            "datos": datos,
        }
    except Exception as exc:
        logger.error("Error en perlas diarias: %s", exc)
        return {
            "exito": False,
            "detalle": "No se pudieron generar las perlas. Intentá de nuevo.",
        }
