"""Endpoint de estado del sistema para el backoffice."""

import os

from fastapi import APIRouter, Depends, Request
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.configuracion import obtener_configuracion
from app.dependencias_admin import requiere_admin
from app.modelos.usuario import Usuario
from app.principal import _obtener_db_placeholder

router = APIRouter()


@router.get("/sistema")
async def estado_sistema(
    request: Request,
    _admin: Usuario = Depends(requiere_admin),
    db: AsyncSession = Depends(_obtener_db_placeholder),
):
    """Estado extendido del sistema (solo admin)."""
    config = obtener_configuracion()
    redis = request.app.state.redis

    # DB
    estado_db = "desconectado"
    db_version = None
    try:
        result = await db.execute(text("SELECT version()"))
        db_version = result.scalar()
        estado_db = "conectado"
    except Exception:
        pass

    # Redis
    estado_redis = "desconectado"
    redis_info = {}
    try:
        await redis.ping()
        estado_redis = "conectado"
        info = await redis.info("memory")
        redis_info = {
            "memoria_usada": info.get("used_memory_human", "?"),
            "claves": await redis.dbsize(),
        }
    except Exception:
        pass

    # MinIO
    estado_minio = "no verificado"

    # Efemérides
    ruta_eph = os.path.abspath(config.ephe_path)
    archivos_se1 = []
    if os.path.isdir(ruta_eph):
        archivos_se1 = [f for f in os.listdir(ruta_eph) if f.endswith(".se1")]

    return {
        "exito": True,
        "datos": {
            "version": config.version,
            "ambiente": config.ambiente,
            "base_datos": {
                "estado": estado_db,
                "version": db_version,
            },
            "redis": {
                "estado": estado_redis,
                **redis_info,
            },
            "minio": {"estado": estado_minio},
            "efemerides": {
                "ruta": ruta_eph,
                "archivos": len(archivos_se1),
            },
        },
    }
