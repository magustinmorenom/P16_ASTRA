"""Esquemas de respuesta para tránsitos."""

from pydantic import BaseModel


class PlanetaTransitoRespuesta(BaseModel):
    """Posición de un planeta en tránsito."""
    nombre: str
    longitud: float
    latitud: float
    signo: str
    grado_en_signo: float
    retrogrado: bool
    velocidad: float


class TransitosRespuesta(BaseModel):
    """Respuesta de tránsitos actuales."""
    fecha_utc: str
    dia_juliano: float
    planetas: list[PlanetaTransitoRespuesta]
    aspectos_natal: list[dict] | None = None
