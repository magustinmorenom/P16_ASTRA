"""Modelo para tracking de consumo de APIs externas."""

import uuid

from sqlalchemy import Integer, String
from sqlalchemy.dialects.postgresql import JSONB, UUID as PG_UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.modelos.base import ModeloBase


class RegistroConsumoApi(ModeloBase):
    """Registro individual de consumo de una API externa."""

    __tablename__ = "registros_consumo_api"

    usuario_id: Mapped[uuid.UUID | None] = mapped_column(
        PG_UUID(as_uuid=True), nullable=True, index=True
    )
    servicio: Mapped[str] = mapped_column(
        String(30), nullable=False, index=True
    )  # anthropic, gemini, resend
    operacion: Mapped[str] = mapped_column(
        String(50), nullable=False
    )  # chat_oraculo, pronostico, podcast_tts, email_otp, etc.
    tokens_entrada: Mapped[int | None] = mapped_column(Integer, nullable=True)
    tokens_salida: Mapped[int | None] = mapped_column(Integer, nullable=True)
    costo_usd_centavos: Mapped[int] = mapped_column(Integer, default=0)
    modelo: Mapped[str | None] = mapped_column(String(50), nullable=True)
    metadata_extra: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
