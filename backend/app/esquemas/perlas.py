"""Schemas Pydantic del servicio Perlas del día."""

from __future__ import annotations

from pydantic import BaseModel, Field


class PerlasDiariasSchema(BaseModel):
    """Respuesta del endpoint /perlas/diaria."""

    perlas: list[str] = Field(
        ...,
        description="Lista de 2 o 3 aforismos cortos personalizados (≤ 70 chars).",
        min_length=1,
        max_length=5,
    )
    fuente: str = Field(
        ...,
        description="Origen de la generación: 'haiku' (IA) o 'curado' (fallback estático).",
    )
    tono: str = Field(
        ...,
        description="Variante de tono usada: 'voseo' (AR) o 'neutro' (LATAM).",
    )
