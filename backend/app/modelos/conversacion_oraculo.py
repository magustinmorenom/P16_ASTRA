"""Modelo de conversaciones del oráculo vía Telegram."""

import uuid

from sqlalchemy import BigInteger, Boolean, ForeignKey, Integer
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.modelos.base import ModeloBase


class ConversacionOraculo(ModeloBase):
    """Conversación entre un usuario y el oráculo ASTRA vía Telegram."""

    __tablename__ = "conversaciones_oraculo"

    usuario_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("usuarios.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    telegram_id: Mapped[int] = mapped_column(
        BigInteger, nullable=False,
    )
    mensajes: Mapped[list] = mapped_column(
        JSONB, default=list, server_default="[]",
    )
    tokens_usados: Mapped[int] = mapped_column(
        Integer, default=0,
    )
    activa: Mapped[bool] = mapped_column(
        Boolean, default=True,
    )
