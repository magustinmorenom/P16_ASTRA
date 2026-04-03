"""Endpoints de gestión de usuarios para el backoffice."""

import uuid

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.datos.admin.repositorio_admin import RepositorioAdmin
from app.dependencias_admin import requiere_admin
from app.excepciones import UsuarioNoEncontrado
from app.modelos.usuario import Usuario
from app.principal import _obtener_db_placeholder

router = APIRouter(prefix="/usuarios")


@router.get("")
async def listar_usuarios(
    pagina: int = Query(1, ge=1),
    por_pagina: int = Query(25, ge=1, le=100),
    busqueda: str | None = Query(None),
    activo: bool | None = Query(None),
    rol: str | None = Query(None),
    ordenar_por: str = Query("creado_en"),
    orden: str = Query("desc", pattern="^(asc|desc)$"),
    _admin: Usuario = Depends(requiere_admin),
    db: AsyncSession = Depends(_obtener_db_placeholder),
):
    """Lista paginada de usuarios con filtros."""
    repo = RepositorioAdmin(db)
    datos = await repo.listar_usuarios(
        pagina=pagina,
        por_pagina=por_pagina,
        busqueda=busqueda,
        activo=activo,
        rol=rol,
        ordenar_por=ordenar_por,
        orden=orden,
    )
    return {"exito": True, "datos": datos}


@router.get("/{usuario_id}")
async def detalle_usuario(
    usuario_id: uuid.UUID,
    _admin: Usuario = Depends(requiere_admin),
    db: AsyncSession = Depends(_obtener_db_placeholder),
):
    """Detalle completo de un usuario."""
    repo = RepositorioAdmin(db)
    datos = await repo.detalle_usuario(usuario_id)
    if not datos:
        raise UsuarioNoEncontrado()
    return {"exito": True, "datos": datos}


@router.put("/{usuario_id}/desactivar")
async def desactivar_usuario(
    usuario_id: uuid.UUID,
    _admin: Usuario = Depends(requiere_admin),
    db: AsyncSession = Depends(_obtener_db_placeholder),
):
    """Desactiva un usuario."""
    repo = RepositorioAdmin(db)
    ok = await repo.cambiar_estado_usuario(usuario_id, activo=False)
    if not ok:
        raise UsuarioNoEncontrado()
    return {"exito": True, "mensaje": "Usuario desactivado"}


@router.put("/{usuario_id}/reactivar")
async def reactivar_usuario(
    usuario_id: uuid.UUID,
    _admin: Usuario = Depends(requiere_admin),
    db: AsyncSession = Depends(_obtener_db_placeholder),
):
    """Reactiva un usuario."""
    repo = RepositorioAdmin(db)
    ok = await repo.cambiar_estado_usuario(usuario_id, activo=True)
    if not ok:
        raise UsuarioNoEncontrado()
    return {"exito": True, "mensaje": "Usuario reactivado"}


@router.put("/{usuario_id}/rol")
async def cambiar_rol(
    usuario_id: uuid.UUID,
    rol: str = Query(..., pattern="^(usuario|admin)$"),
    _admin: Usuario = Depends(requiere_admin),
    db: AsyncSession = Depends(_obtener_db_placeholder),
):
    """Cambia el rol de un usuario."""
    repo = RepositorioAdmin(db)
    ok = await repo.cambiar_rol_usuario(usuario_id, rol)
    if not ok:
        raise UsuarioNoEncontrado()
    return {"exito": True, "mensaje": f"Rol cambiado a '{rol}'"}
