"""Esquemas de respuesta para revolución solar."""

from pydantic import BaseModel


class FechaRetornoRespuesta(BaseModel):
    """Fecha del retorno solar."""
    anio: int
    mes: int
    dia: int
    hora_decimal: float


class RetornoSolarRespuesta(BaseModel):
    """Respuesta de revolución solar."""
    anio: int
    dia_juliano_retorno: float
    fecha_retorno: FechaRetornoRespuesta
    longitud_sol_natal: float
    longitud_sol_retorno: float
    error_grados: float
    carta_retorno: dict
    aspectos_natal_retorno: list[dict]
