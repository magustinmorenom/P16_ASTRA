"""Modelo de evento de webhook para idempotencia."""

from datetime import datetime

from sqlalchemy import DateTime, String, func
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column

from app.modelos.base import Base


class EventoWebhook(Base):
    """Evento de webhook procesado (idempotencia)."""

    __tablename__ = "eventos_webhook"

    id: Mapped[str] = mapped_column(String(100), primary_key=True)
    tipo: Mapped[str] = mapped_column(String(100), nullable=False)
    accion: Mapped[str | None] = mapped_column(String(100), nullable=True)
    payload: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    estado: Mapped[str] = mapped_column(String(20), default="procesado")
    procesado_en: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
    )
