"""Dependencias de autorización para endpoints de administración."""

from fastapi import Depends

from app.dependencias_auth import obtener_usuario_actual
from app.excepciones import ErrorAccesoDenegado
from app.modelos.usuario import Usuario


async def requiere_admin(
    usuario: Usuario = Depends(obtener_usuario_actual),
) -> Usuario:
    """Exige que el usuario autenticado tenga rol 'admin'."""
    if usuario.rol != "admin":
        raise ErrorAccesoDenegado("Se requieren permisos de administrador")
    return usuario
