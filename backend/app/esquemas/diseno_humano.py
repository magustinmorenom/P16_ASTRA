"""Esquemas de respuesta para Diseño Humano."""

from pydantic import BaseModel


class ActivacionRespuesta(BaseModel):
    """Activación de un planeta en una puerta/línea."""
    planeta: str
    longitud: float
    puerta: int
    linea: int
    color: int


class CanalRespuesta(BaseModel):
    """Canal definido en el Body Graph."""
    puertas: list[int]
    nombre: str
    centros: list[str]


class CruzEncarnacionRespuesta(BaseModel):
    """Cruz de Encarnación."""
    puertas: list[int | None]
    sol_consciente: int | None
    tierra_consciente: int | None
    sol_inconsciente: int | None
    tierra_inconsciente: int | None


class DisenoHumanoRespuesta(BaseModel):
    """Respuesta completa de Diseño Humano."""
    tipo: str
    autoridad: str
    perfil: str
    definicion: str
    cruz_encarnacion: CruzEncarnacionRespuesta
    centros: dict[str, str]
    canales: list[CanalRespuesta]
    activaciones_conscientes: list[ActivacionRespuesta]
    activaciones_inconscientes: list[ActivacionRespuesta]
    puertas_conscientes: list[int]
    puertas_inconscientes: list[int]
    dia_juliano_consciente: float
    dia_juliano_inconsciente: float
