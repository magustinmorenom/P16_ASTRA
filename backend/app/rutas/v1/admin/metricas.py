"""Endpoint de métricas del dashboard admin."""

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.datos.admin.repositorio_admin import RepositorioAdmin
from app.dependencias_admin import requiere_admin
from app.modelos.usuario import Usuario
from app.principal import _obtener_db_placeholder

router = APIRouter()


@router.get("/metricas")
async def obtener_metricas(
    _admin: Usuario = Depends(requiere_admin),
    db: AsyncSession = Depends(_obtener_db_placeholder),
):
    """Métricas generales del dashboard de administración."""
    repo = RepositorioAdmin(db)
    return {"exito": True, "datos": await repo.obtener_metricas()}
