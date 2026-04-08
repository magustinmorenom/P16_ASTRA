"""Rutas de autenticación."""

import logging
import random
import re
import uuid

import jwt
from fastapi import APIRouter, Depends
from redis.asyncio import Redis
from sqlalchemy.ext.asyncio import AsyncSession

from app.datos.repositorio_perfil import RepositorioPerfil
from app.servicios.servicio_email import ServicioEmail
from app.datos.repositorio_plan import RepositorioPlan
from app.datos.repositorio_suscripcion import RepositorioSuscripcion
from app.datos.repositorio_usuario import RepositorioUsuario
from app.dependencias_auth import obtener_usuario_actual
from app.esquemas.auth import (
    EsquemaCambioContrasena,
    EsquemaConfirmarReset,
    EsquemaEliminarCuenta,
    EsquemaLogin,
    EsquemaLogout,
    EsquemaRegistro,
    EsquemaRenovarToken,
    EsquemaSolicitarReset,
    EsquemaVerificarOTP,
)
from app.excepciones import (
    CosmicEngineError,
    EmailYaRegistrado,
    ErrorAutenticacion,
    ErrorTokenInvalido,
)
from app.modelos.usuario import Usuario
from app.principal import _obtener_db_placeholder, _obtener_redis_placeholder
from app.servicios.servicio_auth import ServicioAuth
from app.servicios.servicio_google_oauth import ServicioGoogleOAuth
from app.configuracion import obtener_configuracion

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/auth", tags=["Autenticación"])


async def _asignar_plan_inicial(usuario_id: uuid.UUID, db: AsyncSession) -> None:
    """Crea una suscripción con plan inicial para un usuario nuevo."""
    try:
        config = obtener_configuracion()
        slug_inicial = "premium" if config.asignar_premium_por_defecto else "gratis"
        
        repo_plan = RepositorioPlan(db)
        plan_inicial = await repo_plan.obtener_por_slug(slug_inicial)
        if plan_inicial:
            repo_sus = RepositorioSuscripcion(db)
            await repo_sus.crear(
                usuario_id=usuario_id,
                plan_id=plan_inicial.id,
                estado="activa",
            )
    except Exception as e:
        logger.warning("No se pudo asignar plan %s a %s: %s", slug_inicial, usuario_id, e)


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

    # Asignar plan inicial automáticamente
    await _asignar_plan_inicial(usuario.id, db)

    # Email de bienvenida (fire-and-forget)
    try:
        await ServicioEmail.enviar_bienvenida(usuario.email, usuario.nombre)
    except Exception:
        logger.warning("No se pudo enviar email de bienvenida a %s", usuario.email)

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
        raise ErrorAutenticacion("El email o la contraseña son incorrectos. Verificá tus datos e intentá de nuevo.")

    if not ServicioAuth.verificar_contrasena(datos.contrasena, usuario.hash_contrasena):
        raise ErrorAutenticacion("El email o la contraseña son incorrectos. Verificá tus datos e intentá de nuevo.")

    if not usuario.activo:
        raise ErrorAutenticacion("Tu cuenta está desactivada. Contactá soporte para más información.")

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

        # Asignar plan inicial automáticamente
        await _asignar_plan_inicial(usuario.id, db)

        # Email de bienvenida (fire-and-forget)
        try:
            await ServicioEmail.enviar_bienvenida(usuario.email, usuario.nombre)
        except Exception:
            logger.warning("No se pudo enviar email de bienvenida a %s", usuario.email)

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


def _validar_contrasena_fuerte(contrasena: str) -> None:
    """Valida que la contraseña cumpla requisitos de seguridad."""
    errores = []
    if len(contrasena) < 8:
        errores.append("mínimo 8 caracteres")
    if not re.search(r"[A-Z]", contrasena):
        errores.append("al menos una mayúscula")
    if not re.search(r"\d", contrasena):
        errores.append("al menos un número")
    if not re.search(r"[!@#$%^&*(),.?\":{}|<>\-_=+\[\]\\;'/`~]", contrasena):
        errores.append("al menos un símbolo")
    if errores:
        raise CosmicEngineError(
            f"La contraseña debe tener: {', '.join(errores)}",
            codigo=422,
        )


@router.post("/solicitar-reset")
async def solicitar_reset(
    datos: EsquemaSolicitarReset,
    db: AsyncSession = Depends(_obtener_db_placeholder),
    redis: Redis = Depends(_obtener_redis_placeholder),
):
    """Envía un código OTP de 6 dígitos por email para restablecer contraseña.

    Siempre retorna 200 para no revelar si el email existe.
    """
    repo = RepositorioUsuario(db)
    usuario = await repo.obtener_por_email(datos.email)

    if usuario and usuario.proveedor_auth == "local" and usuario.activo:
        codigo = f"{random.randint(0, 999999):06d}"
        await redis.set(
            f"otp:{datos.email.lower()}", codigo, ex=600,  # 10 minutos
        )
        try:
            await ServicioEmail.enviar_codigo_otp(
                usuario.email, usuario.nombre, codigo
            )
        except Exception:
            logger.warning("No se pudo enviar OTP a %s", datos.email)

    return {"exito": True, "mensaje": "Si el email está registrado, recibirás un código de verificación"}


@router.post("/verificar-otp")
async def verificar_otp(
    datos: EsquemaVerificarOTP,
    db: AsyncSession = Depends(_obtener_db_placeholder),
    redis: Redis = Depends(_obtener_redis_placeholder),
):
    """Verifica el código OTP y retorna un token temporal para cambiar la contraseña."""
    clave = f"otp:{datos.email.lower()}"
    codigo_guardado = await redis.get(clave)

    if not codigo_guardado:
        raise ErrorTokenInvalido("Código expirado. Solicitá uno nuevo.")

    if isinstance(codigo_guardado, bytes):
        codigo_guardado = codigo_guardado.decode()

    if codigo_guardado != datos.codigo:
        raise ErrorAutenticacion("Código incorrecto")

    # OTP válido — generar token temporal para el paso de nueva contraseña
    repo = RepositorioUsuario(db)
    usuario = await repo.obtener_por_email(datos.email)
    if not usuario or not usuario.activo:
        raise ErrorTokenInvalido("Código expirado. Solicitá uno nuevo.")

    token_reset = str(uuid.uuid4())
    await redis.set(f"reset:{token_reset}", str(usuario.id), ex=900)  # 15 min

    # Eliminar OTP (uso único)
    await redis.delete(clave)

    return {"exito": True, "datos": {"token": token_reset}}


@router.post("/confirmar-reset")
async def confirmar_reset(
    datos: EsquemaConfirmarReset,
    db: AsyncSession = Depends(_obtener_db_placeholder),
    redis: Redis = Depends(_obtener_redis_placeholder),
):
    """Confirma el reset de contraseña con un token válido (post-OTP)."""
    _validar_contrasena_fuerte(datos.contrasena_nueva)

    user_id_str = await redis.get(f"reset:{datos.token}")
    if not user_id_str:
        raise ErrorTokenInvalido("Sesión expirada. Volvé a iniciar el proceso.")

    if isinstance(user_id_str, bytes):
        user_id_str = user_id_str.decode()

    repo = RepositorioUsuario(db)
    usuario = await repo.obtener_por_id(uuid.UUID(user_id_str))
    if not usuario or not usuario.activo:
        raise ErrorTokenInvalido("Sesión expirada. Volvé a iniciar el proceso.")

    nuevo_hash = ServicioAuth.hashear_contrasena(datos.contrasena_nueva)
    await repo.cambiar_contrasena(usuario.id, nuevo_hash)

    await redis.delete(f"reset:{datos.token}")

    return {"exito": True, "mensaje": "Contraseña actualizada correctamente"}


@router.post("/eliminar-cuenta")
async def eliminar_cuenta(
    datos: EsquemaEliminarCuenta,
    usuario: Usuario = Depends(obtener_usuario_actual),
    db: AsyncSession = Depends(_obtener_db_placeholder),
    redis: Redis = Depends(_obtener_redis_placeholder),
):
    """Elimina (soft-delete) la cuenta del usuario autenticado."""
    repo = RepositorioUsuario(db)

    # Verificar contraseña para usuarios locales
    if usuario.proveedor_auth == "local":
        if not datos.contrasena:
            raise CosmicEngineError("Se requiere contraseña para eliminar la cuenta", codigo=400)
        if not ServicioAuth.verificar_contrasena(datos.contrasena, usuario.hash_contrasena):
            raise ErrorAutenticacion("Contraseña incorrecta")

    # Cancelar suscripción premium si tiene
    try:
        repo_sus = RepositorioSuscripcion(db)
        suscripcion = await repo_sus.obtener_activa(usuario.id)
        if suscripcion and suscripcion.mp_preapproval_id:
            config_pais = await repo_sus.obtener_config_pais(suscripcion.pais_codigo)
            if config_pais:
                from app.servicios.servicio_mercadopago import ServicioMercadoPago
                try:
                    await ServicioMercadoPago.cancelar_preapproval(
                        access_token=config_pais.mp_access_token,
                        preapproval_id=suscripcion.mp_preapproval_id,
                    )
                except Exception:
                    logger.warning("No se pudo cancelar preapproval al eliminar cuenta")
        # Cancelar todas las suscripciones
        await repo_sus.cancelar_activas_usuario(usuario.id)
    except Exception:
        logger.warning("Error cancelando suscripciones al eliminar cuenta de %s", usuario.id)

    # Soft-delete
    await repo.desactivar(usuario.id)

    # Revocar token
    await ServicioAuth.revocar_token(redis, datos.token_refresco)

    # Email confirmación (fire-and-forget)
    try:
        await ServicioEmail.enviar_cuenta_eliminada(usuario.email, usuario.nombre)
    except Exception:
        logger.warning("No se pudo enviar email de eliminación a %s", usuario.email)

    return {"exito": True, "mensaje": "Cuenta eliminada correctamente"}


@router.get("/me")
async def obtener_perfil_usuario(
    usuario: Usuario = Depends(obtener_usuario_actual),
    db: AsyncSession = Depends(_obtener_db_placeholder),
):
    """Retorna los datos del usuario autenticado, incluyendo su plan actual."""
    # Obtener suscripción y plan activo
    plan_slug = None
    plan_nombre = None
    suscripcion_estado = None

    try:
        repo_sus = RepositorioSuscripcion(db)
        suscripcion = await repo_sus.obtener_activa(
            usuario.id,
            email_usuario=usuario.email,
            nombre_usuario=usuario.nombre,
        )
        if suscripcion:
            suscripcion_estado = suscripcion.estado
            repo_plan = RepositorioPlan(db)
            plan = await repo_plan.obtener_por_id(suscripcion.plan_id)
            if plan:
                plan_slug = plan.slug
                plan_nombre = plan.nombre
    except Exception:
        pass

    # Verificar si el usuario tiene perfil creado
    tiene_perfil = False
    try:
        repo_perfil = RepositorioPerfil(db)
        perfil = await repo_perfil.obtener_por_usuario(usuario.id)
        tiene_perfil = perfil is not None
    except Exception:
        pass

    return {
        "exito": True,
        "datos": {
            "id": str(usuario.id),
            "email": usuario.email,
            "nombre": usuario.nombre,
            "activo": usuario.activo,
            "verificado": usuario.verificado,
            "proveedor_auth": usuario.proveedor_auth,
            "rol": usuario.rol,
            "plan_slug": plan_slug,
            "plan_nombre": plan_nombre,
            "suscripcion_estado": suscripcion_estado,
            "tiene_perfil": tiene_perfil,
            "ultimo_acceso": usuario.ultimo_acceso.isoformat() if usuario.ultimo_acceso else None,
            "creado_en": usuario.creado_en.isoformat() if usuario.creado_en else None,
        },
    }
