"""Esquemas de respuesta para numerología."""

from pydantic import BaseModel


class NumeroRespuesta(BaseModel):
    """Un número calculado con su descripción."""
    numero: int
    descripcion: str


class NumerologiaRespuesta(BaseModel):
    """Respuesta completa de carta numerológica."""
    nombre: str
    fecha_nacimiento: str
    sistema: str
    camino_de_vida: NumeroRespuesta
    expresion: NumeroRespuesta
    impulso_del_alma: NumeroRespuesta
    personalidad: NumeroRespuesta
    numero_nacimiento: NumeroRespuesta
    anio_personal: NumeroRespuesta
    numeros_maestros_presentes: list[int]
