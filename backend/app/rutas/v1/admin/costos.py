"""Endpoints de costos de API para el backoffice."""

from datetime import datetime, timezone

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.datos.admin.repositorio_admin import RepositorioAdmin
from app.dependencias_admin import requiere_admin
from app.modelos.usuario import Usuario
from app.principal import _obtener_db_placeholder

router = APIRouter(prefix="/costos")


@router.get("/por-servicio")
async def costos_por_servicio(
    desde: datetime | None = Query(None),
    hasta: datetime | None = Query(None),
    _admin: Usuario = Depends(requiere_admin),
    db: AsyncSession = Depends(_obtener_db_placeholder),
):
    """Desglose de costos de APIs externas por servicio."""
    repo = RepositorioAdmin(db)
    datos = await repo.costos_por_servicio(desde=desde, hasta=hasta)
    return {"exito": True, "datos": datos}


@router.get("/top-consumidores")
async def top_consumidores(
    limite: int = Query(10, ge=1, le=50),
    _admin: Usuario = Depends(requiere_admin),
    db: AsyncSession = Depends(_obtener_db_placeholder),
):
    """Top N usuarios por consumo de API."""
    repo = RepositorioAdmin(db)
    datos = await repo.top_consumidores(limite=limite)
    return {"exito": True, "datos": datos}
