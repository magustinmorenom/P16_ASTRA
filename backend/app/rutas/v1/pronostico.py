"""Endpoints del Pronóstico Cósmico — forecast diario y semanal."""

from datetime import date

from fastapi import APIRouter, Depends, Query
from redis.asyncio import Redis
from sqlalchemy.ext.asyncio import AsyncSession

from app.configuracion_features import obtener_acceso_pronostico
from app.dependencias import obtener_redis
from app.dependencias_auth import obtener_usuario_actual
from app.modelos.usuario import Usuario
from app.principal import _obtener_db_placeholder
from app.registro import logger
from app.servicios.servicio_pronostico import ServicioPronostico

router = APIRouter(prefix="/pronostico", tags=["Pronóstico Cósmico"])


@router.get("/diario")
async def pronostico_diario(
    fecha: date | None = Query(None, description="Fecha YYYY-MM-DD (default: hoy)"),
    usuario: Usuario = Depends(obtener_usuario_actual),
    db: AsyncSession = Depends(_obtener_db_placeholder),
    redis: Redis = Depends(obtener_redis),
):
    """Genera o recupera el pronóstico cósmico del día."""
    try:
        datos = await ServicioPronostico.generar_pronostico_diario(
            sesion=db,
            redis=redis,
            usuario_id=usuario.id,
            fecha=fecha,
        )

        # Determinar plan del usuario para gating
        plan = "gratis"
        if hasattr(usuario, "suscripcion") and usuario.suscripcion:
            plan = usuario.suscripcion.plan_slug or "gratis"

        acceso = obtener_acceso_pronostico(plan)

        # Asegurar que claves_dia siempre esté presente (cache viejo puede no tenerlo)
        datos.setdefault("claves_dia", [])

        return {
            "exito": True,
            "datos": {**datos, "acceso": acceso},
        }

    except ValueError as e:
        return {
            "exito": False,
            "detalle": str(e),
        }
    except Exception as e:
        logger.error("Error en pronóstico diario: %s", e)
        return {
            "exito": False,
            "detalle": "Error generando el pronóstico. Intentá de nuevo.",
        }


@router.get("/semanal")
async def pronostico_semanal(
    fecha_inicio: date | None = Query(None, description="Lunes de la semana deseada YYYY-MM-DD (default: lunes actual)"),
    usuario: Usuario = Depends(obtener_usuario_actual),
    db: AsyncSession = Depends(_obtener_db_placeholder),
    redis: Redis = Depends(obtener_redis),
):
    """Genera o recupera el pronóstico semanal resumido."""
    try:
        datos = await ServicioPronostico.generar_pronostico_semanal(
            sesion=db,
            redis=redis,
            usuario_id=usuario.id,
            fecha_inicio=fecha_inicio,
        )

        plan = "gratis"
        if hasattr(usuario, "suscripcion") and usuario.suscripcion:
            plan = usuario.suscripcion.plan_slug or "gratis"

        acceso = obtener_acceso_pronostico(plan)

        return {
            "exito": True,
            "datos": {**datos, "acceso": acceso},
        }

    except ValueError as e:
        return {
            "exito": False,
            "detalle": str(e),
        }
    except Exception as e:
        logger.error("Error en pronóstico semanal: %s", e)
        return {
            "exito": False,
            "detalle": "Error generando el pronóstico semanal. Intentá de nuevo.",
        }
