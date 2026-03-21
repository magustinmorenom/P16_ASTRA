"""Esquemas de respuesta comunes."""

from typing import Any

from pydantic import BaseModel


class RespuestaBase(BaseModel):
    """Envolvente estándar de respuesta."""

    exito: bool = True
    datos: Any = None
    mensaje: str | None = None


class RespuestaError(BaseModel):
    """Respuesta de error estándar."""

    exito: bool = False
    error: str
    detalle: str | None = None


class RespuestaSalud(BaseModel):
    """Respuesta del health check."""

    estado: str
    version: str
    base_datos: str
    redis: str
    efemerides: str
