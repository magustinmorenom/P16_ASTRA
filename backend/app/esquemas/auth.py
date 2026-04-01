"""Esquemas Pydantic para autenticación."""

from datetime import datetime

from pydantic import BaseModel, EmailStr, Field


class EsquemaRegistro(BaseModel):
    """Datos para registrar un nuevo usuario."""

    email: EmailStr
    nombre: str = Field(min_length=1, max_length=100)
    contrasena: str = Field(min_length=8, max_length=128)


class EsquemaLogin(BaseModel):
    """Datos para iniciar sesión."""

    email: EmailStr
    contrasena: str


class EsquemaCambioContrasena(BaseModel):
    """Datos para cambiar contraseña."""

    contrasena_actual: str
    contrasena_nueva: str = Field(min_length=8, max_length=128)


class EsquemaRenovarToken(BaseModel):
    """Datos para renovar token de acceso."""

    token_refresco: str


class EsquemaLogout(BaseModel):
    """Datos para cerrar sesión."""

    token_refresco: str


class EsquemaSolicitarReset(BaseModel):
    """Datos para solicitar reset de contraseña (envía OTP por email)."""

    email: EmailStr


class EsquemaVerificarOTP(BaseModel):
    """Datos para verificar código OTP."""

    email: EmailStr
    codigo: str = Field(min_length=6, max_length=6, pattern=r"^\d{6}$")


class EsquemaConfirmarReset(BaseModel):
    """Datos para confirmar reset de contraseña con OTP verificado."""

    token: str
    contrasena_nueva: str = Field(min_length=8, max_length=128)


class EsquemaEliminarCuenta(BaseModel):
    """Datos para eliminar la cuenta del usuario."""

    contrasena: str | None = None  # obligatorio para local, None para Google
    token_refresco: str


class RespuestaTokens(BaseModel):
    """Respuesta con tokens de autenticación."""

    token_acceso: str
    token_refresco: str
    tipo: str = "bearer"


class RespuestaUsuario(BaseModel):
    """Datos públicos del usuario."""

    id: str
    email: str
    nombre: str
    activo: bool
    verificado: bool
    proveedor_auth: str
    ultimo_acceso: datetime | None = None
    creado_en: datetime
