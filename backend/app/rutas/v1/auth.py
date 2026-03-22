"""Rutas de autenticación."""

import jwt
from fastapi import APIRouter, Depends
from redis.asyncio import Redis
from sqlalchemy.ext.asyncio import AsyncSession

from app.datos.repositorio_usuario import RepositorioUsuario
from app.dependencias_auth import obtener_usuario_actual
from app.esquemas.auth import (
    EsquemaCambioContrasena,
    EsquemaLogin,
    EsquemaLogout,
    EsquemaRegistro,
    EsquemaRenovarToken,
)
from app.excepciones import (
    EmailYaRegistrado,
    ErrorAutenticacion,
    ErrorTokenInvalido,
)
from app.modelos.usuario import Usuario
from app.principal import _obtener_db_placeholder, _obtener_redis_placeholder
from app.servicios.servicio_auth import ServicioAuth
from app.servicios.servicio_google_oauth import ServicioGoogleOAuth

router = APIRouter(prefix="/auth", tags=["Autenticación"])


@router.post("/registrar")
async def registrar(
    datos: EsquemaRegistro,
    db: AsyncSession = Depends(_obtener_db_placeholder),
):
    """Registra un nuevo usuario con email y contraseña."""
    repo = RepositorioUsuario(db)

    # Verificar email duplicado
    existente = await repo.obtener_por_email(datos.email)
    if existente:
        raise EmailYaRegistrado(datos.email)

    # Crear usuario
    hash_contrasena = ServicioAuth.hashear_contrasena(datos.contrasena)
    usuario = await repo.crear(
        email=datos.email,
        nombre=datos.nombre,
        hash_contrasena=hash_contrasena,
    )

    # Generar tokens
    tokens = ServicioAuth.generar_tokens(usuario.id, usuario.email)

    return {
        "exito": True,
        "datos": {
            "usuario": {
                "id": str(usuario.id),
                "email": usuario.email,
                "nombre": usuario.nombre,
            },
            **tokens,
        },
    }


@router.post("/login")
async def login(
    datos: EsquemaLogin,
    db: AsyncSession = Depends(_obtener_db_placeholder),
):
    """Inicia sesión con email y contraseña."""
    repo = RepositorioUsuario(db)

    usuario = await repo.obtener_por_email(datos.email)
    if not usuario or not usuario.hash_contrasena:
        raise ErrorAutenticacion("Email o contraseña incorrectos")

    if not ServicioAuth.verificar_contrasena(datos.contrasena, usuario.hash_contrasena):
        raise ErrorAutenticacion("Email o contraseña incorrectos")

    if not usuario.activo:
        raise ErrorAutenticacion("Usuario desactivado")

    # Actualizar último acceso
    await repo.actualizar_ultimo_acceso(usuario.id)

    tokens = ServicioAuth.generar_tokens(usuario.id, usuario.email)

    return {
        "exito": True,
        "datos": {
            "usuario": {
                "id": str(usuario.id),
                "email": usuario.email,
                "nombre": usuario.nombre,
            },
            **tokens,
        },
    }


@router.post("/logout")
async def logout(
    datos: EsquemaLogout,
    usuario: Usuario = Depends(obtener_usuario_actual),
    redis: Redis = Depends(_obtener_redis_placeholder),
):
    """Cierra sesión invalidando el token de refresco."""
    await ServicioAuth.revocar_token(redis, datos.token_refresco)

    return {"exito": True, "mensaje": "Sesión cerrada correctamente"}


@router.post("/renovar")
async def renovar_token(
    datos: EsquemaRenovarToken,
    db: AsyncSession = Depends(_obtener_db_placeholder),
    redis: Redis = Depends(_obtener_redis_placeholder),
):
    """Renueva el token de acceso usando un token de refresco."""
    try:
        payload = ServicioAuth.decodificar_token(datos.token_refresco)
    except jwt.ExpiredSignatureError:
        raise ErrorTokenInvalido("Token de refresco expirado")
    except jwt.PyJWTError:
        raise ErrorTokenInvalido("Token de refresco inválido")

    if payload.get("tipo") != "refresco":
        raise ErrorTokenInvalido("Se requiere token de refresco")

    # Verificar blacklist
    jti = payload.get("jti")
    if jti and await ServicioAuth.token_revocado(redis, jti):
        raise ErrorTokenInvalido("Token de refresco revocado")

    # Verificar que el usuario existe
    repo = RepositorioUsuario(db)
    usuario = await repo.obtener_por_id(
        __import__("uuid").UUID(payload["sub"])
    )
    if not usuario or not usuario.activo:
        raise ErrorAutenticacion("Usuario no encontrado o desactivado")

    # Generar nuevo token de acceso
    nuevo_token = ServicioAuth.crear_token_acceso(usuario.id, usuario.email)

    return {
        "exito": True,
        "datos": {
            "token_acceso": nuevo_token,
            "tipo": "bearer",
        },
    }


@router.post("/cambiar-contrasena")
async def cambiar_contrasena(
    datos: EsquemaCambioContrasena,
    usuario: Usuario = Depends(obtener_usuario_actual),
    db: AsyncSession = Depends(_obtener_db_placeholder),
):
    """Cambia la contraseña del usuario autenticado."""
    if not usuario.hash_contrasena:
        raise ErrorAutenticacion(
            "Los usuarios de Google no pueden cambiar contraseña"
        )

    if not ServicioAuth.verificar_contrasena(
        datos.contrasena_actual, usuario.hash_contrasena
    ):
        raise ErrorAutenticacion("Contraseña actual incorrecta")

    repo = RepositorioUsuario(db)
    nuevo_hash = ServicioAuth.hashear_contrasena(datos.contrasena_nueva)
    await repo.cambiar_contrasena(usuario.id, nuevo_hash)

    return {"exito": True, "mensaje": "Contraseña actualizada correctamente"}


@router.get("/google/url")
async def google_auth_url():
    """Retorna la URL de autorización de Google."""
    url = ServicioGoogleOAuth.obtener_url_autorizacion()
    return {"exito": True, "datos": {"url": url}}


@router.get("/google/callback")
async def google_callback(
    code: str,
    db: AsyncSession = Depends(_obtener_db_placeholder),
):
    """Callback de Google OAuth. Registra o autentica al usuario."""
    # Obtener datos de Google
    datos_google = await ServicioGoogleOAuth.obtener_datos_usuario(code)

    repo = RepositorioUsuario(db)

    # Buscar usuario por google_id
    usuario = await repo.obtener_por_google_id(datos_google["google_id"])

    if not usuario:
        # Buscar por email (puede haberse registrado localmente)
        usuario = await repo.obtener_por_email(datos_google["email"])

        if usuario:
            # Vincular Google ID al usuario existente (no implementado aún,
            # por ahora crear cuenta separada si el email está en uso)
            raise EmailYaRegistrado(datos_google["email"])

        # Crear nuevo usuario
        usuario = await repo.crear(
            email=datos_google["email"],
            nombre=datos_google["nombre"],
            proveedor_auth="google",
            google_id=datos_google["google_id"],
        )

    if not usuario.activo:
        raise ErrorAutenticacion("Usuario desactivado")

    await repo.actualizar_ultimo_acceso(usuario.id)
    tokens = ServicioAuth.generar_tokens(usuario.id, usuario.email)

    return {
        "exito": True,
        "datos": {
            "usuario": {
                "id": str(usuario.id),
                "email": usuario.email,
                "nombre": usuario.nombre,
            },
            **tokens,
        },
    }


@router.get("/me")
async def obtener_perfil_usuario(
    usuario: Usuario = Depends(obtener_usuario_actual),
):
    """Retorna los datos del usuario autenticado."""
    return {
        "exito": True,
        "datos": {
            "id": str(usuario.id),
            "email": usuario.email,
            "nombre": usuario.nombre,
            "activo": usuario.activo,
            "verificado": usuario.verificado,
            "proveedor_auth": usuario.proveedor_auth,
            "ultimo_acceso": usuario.ultimo_acceso.isoformat() if usuario.ultimo_acceso else None,
            "creado_en": usuario.creado_en.isoformat() if usuario.creado_en else None,
        },
    }
