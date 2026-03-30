"""Esquemas de respuesta para numerología."""

from pydantic import BaseModel


class NumeroRespuesta(BaseModel):
    """Un número calculado con su descripción."""
    numero: int
    descripcion: str
    descripcion_larga: str = ""


class EtapaVida(BaseModel):
    """Una etapa (pináculo) de la vida con rango de edad."""
    numero: int
    nombre: str = ""
    descripcion: str
    descripcion_larga: str = ""
    edad_inicio: int
    edad_fin: int | None


class MesPersonalItem(BaseModel):
    """Un mes personal con su número y nombre del mes."""
    mes: int
    nombre_mes: str
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
    mes_personal: NumeroRespuesta
    dia_personal: NumeroRespuesta
    meses_personales: list[MesPersonalItem] = []
    etapas_de_la_vida: list[EtapaVida]
    numeros_maestros_presentes: list[int]
