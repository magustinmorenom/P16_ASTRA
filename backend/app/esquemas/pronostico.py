"""Esquemas Pydantic para el Pronóstico Cósmico."""

from pydantic import BaseModel, Field


class ClimaCosmicoSchema(BaseModel):
    """Estado general del clima cósmico del día."""

    estado: str = Field(description="despejado|soleado|nublado|tormenta|arcoiris")
    titulo: str
    frase_sintesis: str
    energia: int = Field(ge=1, le=10)
    claridad: int = Field(ge=1, le=10)
    intuicion: int = Field(ge=1, le=10)


class AreaVidaSchema(BaseModel):
    """Una de las 6 áreas de vida evaluadas."""

    id: str
    nombre: str
    nivel: str = Field(description="favorable|neutro|precaucion")
    icono: str
    frase: str
    detalle: str


class MomentoClaveSchema(BaseModel):
    """Un bloque temporal del día."""

    bloque: str = Field(description="manana|tarde|noche")
    titulo: str
    icono: str
    frase: str
    nivel: str = Field(description="favorable|neutro|precaucion")


class AlertaCosmicaSchema(BaseModel):
    """Alerta de evento cósmico relevante."""

    tipo: str
    titulo: str
    descripcion: str
    urgencia: str = Field(description="baja|media|alta")


class ConsejoHDSchema(BaseModel):
    """Consejo de Diseño Humano personalizado."""

    titulo: str
    mensaje: str
    centro_destacado: str


class LunaInfoSchema(BaseModel):
    """Información lunar del día."""

    signo: str
    fase: str
    significado: str


class NumeroPersonalSchema(BaseModel):
    """Número personal del día."""

    numero: int
    descripcion: str


class PronosticoDiarioSchema(BaseModel):
    """Pronóstico cósmico completo del día."""

    clima: ClimaCosmicoSchema
    areas: list[AreaVidaSchema]
    momentos: list[MomentoClaveSchema]
    alertas: list[AlertaCosmicaSchema] = []
    consejo_hd: ConsejoHDSchema
    luna: LunaInfoSchema
    numero_personal: NumeroPersonalSchema


class DiaSemanalSchema(BaseModel):
    """Resumen de un día dentro del pronóstico semanal."""

    fecha: str
    clima_estado: str
    energia: int = Field(ge=1, le=10)
    frase_corta: str
    numero_personal: int


class PronosticoSemanalSchema(BaseModel):
    """Pronóstico semanal resumido."""

    semana: list[DiaSemanalSchema]
