"""Esquemas de entrada (request) comunes."""

from datetime import date

from pydantic import BaseModel, Field


class DatosNacimiento(BaseModel):
    """Datos de nacimiento requeridos para todos los cálculos."""

    nombre: str = Field(..., min_length=1, max_length=100, description="Nombre de la persona")
    fecha_nacimiento: date = Field(..., description="Fecha de nacimiento (YYYY-MM-DD)")
    hora_nacimiento: str = Field(
        ...,
        pattern=r"^\d{2}:\d{2}$",
        description="Hora de nacimiento (HH:MM)",
    )
    ciudad_nacimiento: str = Field(..., min_length=1, max_length=100, description="Ciudad de nacimiento")
    pais_nacimiento: str = Field(..., min_length=1, max_length=60, description="País de nacimiento")
    sistema_casas: str = Field(default="placidus", description="Sistema de casas astrológicas")


class DatosNumerologia(BaseModel):
    """Datos para cálculo numerológico."""

    nombre: str = Field(..., min_length=1, max_length=100)
    fecha_nacimiento: date = Field(...)
    sistema: str = Field(default="pitagorico", pattern=r"^(pitagorico|caldeo)$")
