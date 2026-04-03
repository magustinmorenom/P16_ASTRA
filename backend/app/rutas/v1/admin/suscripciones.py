"""Endpoints de gestión de suscripciones para el backoffice."""

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.datos.admin.repositorio_admin import RepositorioAdmin
from app.dependencias_admin import requiere_admin
from app.modelos.usuario import Usuario
from app.principal import _obtener_db_placeholder

router = APIRouter(prefix="/suscripciones")


@router.get("")
async def listar_suscripciones(
    pagina: int = Query(1, ge=1),
    por_pagina: int = Query(25, ge=1, le=100),
    estado: str | None = Query(None),
    pais_codigo: str | None = Query(None),
    _admin: Usuario = Depends(requiere_admin),
    db: AsyncSession = Depends(_obtener_db_placeholder),
):
    """Lista paginada de suscripciones."""
    repo = RepositorioAdmin(db)
    datos = await repo.listar_suscripciones(
        pagina=pagina,
        por_pagina=por_pagina,
        estado=estado,
        pais_codigo=pais_codigo,
    )
    return {"exito": True, "datos": datos}
