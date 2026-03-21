"""Esquemas de respuesta para carta natal."""

from pydantic import BaseModel


class PosicionPlanetaRespuesta(BaseModel):
    """Posición de un planeta en la carta natal."""
    nombre: str
    longitud: float
    latitud: float
    signo: str
    grado_en_signo: float
    casa: int
    retrogrado: bool
    velocidad: float
    dignidad: str | None = None


class CasaRespuesta(BaseModel):
    """Cúspide de una casa astrológica."""
    numero: int
    signo: str
    grado: float
    grado_en_signo: float


class AspectoRespuesta(BaseModel):
    """Aspecto entre dos planetas."""
    planeta1: str
    planeta2: str
    tipo: str
    angulo_exacto: float
    orbe: float
    aplicativo: bool


class CartaNatalRespuesta(BaseModel):
    """Respuesta completa de carta natal."""
    nombre: str
    fecha_nacimiento: str
    hora_nacimiento: str
    ciudad: str
    pais: str
    latitud: float
    longitud: float
    zona_horaria: str
    dia_juliano: float
    planetas: list[PosicionPlanetaRespuesta]
    casas: list[CasaRespuesta]
    aspectos: list[AspectoRespuesta]
    ascendente: dict
    medio_cielo: dict
    sistema_casas: str
