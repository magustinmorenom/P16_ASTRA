"""Esquemas de respuesta para el Calendario Cósmico."""

from pydantic import BaseModel


class AspectoExactoRespuesta(BaseModel):
    """Aspecto exacto relevante del día."""

    planeta_a: str
    planeta_b: str
    tipo: str
    angulo: float
    orbe: float


class CambioSignoRespuesta(BaseModel):
    """Cambio de signo detectado respecto al día anterior."""

    planeta: str
    de: str
    a: str


class EventosCalendarioRespuesta(BaseModel):
    """Eventos notables calculados o persistidos para el día."""

    cambios_signo: list[CambioSignoRespuesta]
    retrogrados_inicio: list[str]
    retrogrados_fin: list[str]
    aspectos_exactos: list[AspectoExactoRespuesta]
    fases: str | None = None


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
    aspectos: list[AspectoExactoRespuesta]
    fase_lunar: str
    eventos: EventosCalendarioRespuesta
    estado: str


class CalendarioRangoRespuesta(BaseModel):
    """Tránsitos planetarios de un rango de fechas."""

    fecha_inicio: str
    fecha_fin: str
    dias: list[TransitosDiaRespuesta]
