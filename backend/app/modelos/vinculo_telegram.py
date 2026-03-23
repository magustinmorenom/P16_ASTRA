"""Modelo de vinculación Telegram ↔ Usuario."""

import uuid
from datetime import datetime

from sqlalchemy import BigInteger, Boolean, DateTime, ForeignKey, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.modelos.base import ModeloBase


class VinculoTelegram(ModeloBase):
    """Vinculación entre un usuario de la plataforma y su cuenta de Telegram."""

    __tablename__ = "vinculos_telegram"

    usuario_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("usuarios.id", ondelete="CASCADE"),
        nullable=False,
        unique=True,
    )
    telegram_id: Mapped[int | None] = mapped_column(
        BigInteger, unique=True, index=True, nullable=True,
    )
    telegram_username: Mapped[str | None] = mapped_column(
        String(100), nullable=True,
    )
    activo: Mapped[bool] = mapped_column(Boolean, default=True)
    codigo_vinculacion: Mapped[str | None] = mapped_column(
        String(6), nullable=True,
    )
    codigo_expira_en: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True,
    )
