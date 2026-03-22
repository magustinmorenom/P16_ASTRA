"""Dependencias de autenticación para inyección en endpoints."""

import uuid

import jwt
from fastapi import Depends, Request
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from redis.asyncio import Redis
from sqlalchemy.ext.asyncio import AsyncSession

from app.datos.repositorio_usuario import RepositorioUsuario
from app.excepciones import ErrorAutenticacion, ErrorTokenInvalido
from app.modelos.usuario import Usuario
from app.principal import _obtener_db_placeholder, _obtener_redis_placeholder
from app.servicios.servicio_auth import ServicioAuth

_esquema_bearer = HTTPBearer(auto_error=False)


async def obtener_usuario_actual(
    credenciales: HTTPAuthorizationCredentials = Depends(_esquema_bearer),
    db: AsyncSession = Depends(_obtener_db_placeholder),
    redis: Redis = Depends(_obtener_redis_placeholder),
) -> Usuario:
    """Dependencia que exige autenticación. Retorna el usuario o lanza 401."""
    if not credenciales:
        raise ErrorAutenticacion("Se requiere token de autenticación")

    try:
        payload = ServicioAuth.decodificar_token(credenciales.credentials)
    except jwt.ExpiredSignatureError:
        raise ErrorTokenInvalido("Token expirado")
    except jwt.PyJWTError:
        raise ErrorTokenInvalido("Token inválido")

    if payload.get("tipo") != "acceso":
        raise ErrorTokenInvalido("Se requiere token de acceso")

    # Verificar blacklist
    jti = payload.get("jti")
    if jti and await ServicioAuth.token_revocado(redis, jti):
        raise ErrorTokenInvalido("Token revocado")

    # Cargar usuario
    usuario_id = payload.get("sub")
    if not usuario_id:
        raise ErrorTokenInvalido("Token sin identificador de usuario")

    repo = RepositorioUsuario(db)
    usuario = await repo.obtener_por_id(uuid.UUID(usuario_id))
    if not usuario:
        raise ErrorAutenticacion("Usuario no encontrado")
    if not usuario.activo:
        raise ErrorAutenticacion("Usuario desactivado")

    return usuario


async def obtener_usuario_opcional(
    request: Request,
    credenciales: HTTPAuthorizationCredentials = Depends(_esquema_bearer),
    db: AsyncSession = Depends(_obtener_db_placeholder),
    redis: Redis = Depends(_obtener_redis_placeholder),
) -> Usuario | None:
    """Dependencia opcional: retorna el usuario si hay token válido, None si no."""
    if not credenciales:
        return None

    try:
        payload = ServicioAuth.decodificar_token(credenciales.credentials)
    except jwt.PyJWTError:
        return None

    if payload.get("tipo") != "acceso":
        return None

    jti = payload.get("jti")
    if jti and await ServicioAuth.token_revocado(redis, jti):
        return None

    usuario_id = payload.get("sub")
    if not usuario_id:
        return None

    repo = RepositorioUsuario(db)
    usuario = await repo.obtener_por_id(uuid.UUID(usuario_id))
    if usuario and usuario.activo:
        return usuario

    return None
