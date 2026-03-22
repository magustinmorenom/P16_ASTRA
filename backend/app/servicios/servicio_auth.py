"""Servicio de autenticación — JWT, hashing y blacklist."""

import uuid
from datetime import datetime, timedelta, timezone

import bcrypt
import jwt
from redis.asyncio import Redis

from app.configuracion import obtener_configuracion


class ServicioAuth:
    """Gestión de tokens JWT, hashing de contraseñas y blacklist."""

    # ── Hashing de contraseñas ──────────────────────────────────

    @staticmethod
    def hashear_contrasena(contrasena: str) -> str:
        """Genera hash bcrypt de una contraseña."""
        sal = bcrypt.gensalt()
        return bcrypt.hashpw(contrasena.encode("utf-8"), sal).decode("utf-8")

    @staticmethod
    def verificar_contrasena(contrasena: str, hash_almacenado: str) -> bool:
        """Verifica una contraseña contra su hash."""
        return bcrypt.checkpw(
            contrasena.encode("utf-8"), hash_almacenado.encode("utf-8")
        )

    # ── Tokens JWT ──────────────────────────────────────────────

    @staticmethod
    def crear_token_acceso(usuario_id: uuid.UUID, email: str) -> str:
        """Crea un token de acceso JWT."""
        config = obtener_configuracion()
        ahora = datetime.now(timezone.utc)
        payload = {
            "sub": str(usuario_id),
            "email": email,
            "tipo": "acceso",
            "jti": str(uuid.uuid4()),
            "iat": ahora,
            "exp": ahora + timedelta(minutes=config.expiracion_token_acceso),
        }
        return jwt.encode(payload, config.clave_secreta, algorithm=config.algoritmo_jwt)

    @staticmethod
    def crear_token_refresco(usuario_id: uuid.UUID) -> str:
        """Crea un token de refresco JWT."""
        config = obtener_configuracion()
        ahora = datetime.now(timezone.utc)
        payload = {
            "sub": str(usuario_id),
            "tipo": "refresco",
            "jti": str(uuid.uuid4()),
            "iat": ahora,
            "exp": ahora + timedelta(minutes=config.expiracion_token_refresco),
        }
        return jwt.encode(payload, config.clave_secreta, algorithm=config.algoritmo_jwt)

    @staticmethod
    def decodificar_token(token: str) -> dict:
        """Decodifica y valida un token JWT. Lanza jwt.PyJWTError si es inválido."""
        config = obtener_configuracion()
        return jwt.decode(
            token, config.clave_secreta, algorithms=[config.algoritmo_jwt]
        )

    @staticmethod
    def generar_tokens(usuario_id: uuid.UUID, email: str) -> dict:
        """Genera par de tokens (acceso + refresco)."""
        return {
            "token_acceso": ServicioAuth.crear_token_acceso(usuario_id, email),
            "token_refresco": ServicioAuth.crear_token_refresco(usuario_id),
            "tipo": "bearer",
        }

    # ── Blacklist Redis ─────────────────────────────────────────

    @staticmethod
    async def revocar_token(redis: Redis, token: str) -> None:
        """Agrega un token a la blacklist en Redis."""
        try:
            config = obtener_configuracion()
            payload = jwt.decode(
                token, config.clave_secreta, algorithms=[config.algoritmo_jwt]
            )
            jti = payload.get("jti")
            exp = payload.get("exp")
            if jti and exp:
                ttl = int(exp - datetime.now(timezone.utc).timestamp())
                if ttl > 0:
                    await redis.setex(f"blacklist:{jti}", ttl, "1")
        except jwt.PyJWTError:
            pass  # Token inválido, no hace falta revocar

    @staticmethod
    async def token_revocado(redis: Redis, jti: str) -> bool:
        """Verifica si un token está en la blacklist."""
        return await redis.exists(f"blacklist:{jti}") > 0
