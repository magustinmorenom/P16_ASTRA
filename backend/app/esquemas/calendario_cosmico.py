"""Esquemas de respuesta para el Calendario Cósmico."""

from pydantic import BaseModel


class PlanetaCalendarioRespuesta(BaseModel):
    """Posición de un planeta en una fecha específica."""
    nombre: str
    longitud: float
    latitud: float
    signo: str
    grado_en_signo: float
    retrogrado: bool
    velocidad: float


class TransitosDiaRespuesta(BaseModel):
    """Tránsitos planetarios de un día específico."""
    fecha: str
    fecha_utc: str
    dia_juliano: float
    planetas: list[PlanetaCalendarioRespuesta]


class CalendarioRangoRespuesta(BaseModel):
    """Tránsitos planetarios de un rango de fechas."""
    fecha_inicio: str
    fecha_fin: str
    dias: list[TransitosDiaRespuesta]
