"""Modelo de conversaciones del oráculo (Telegram y chat web)."""

import uuid

from sqlalchemy import BigInteger, Boolean, ForeignKey, Integer, String
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.modelos.base import ModeloBase


class ConversacionOraculo(ModeloBase):
    """Conversación entre un usuario y el oráculo ASTRA."""

    __tablename__ = "conversaciones_oraculo"

    usuario_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("usuarios.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    telegram_id: Mapped[int | None] = mapped_column(
        BigInteger, nullable=True,
    )
    canal: Mapped[str] = mapped_column(
        String(20), nullable=False, default="telegram", server_default="telegram",
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
    titulo: Mapped[str | None] = mapped_column(
        String(120), nullable=True,
    )
    anclada: Mapped[bool] = mapped_column(
        Boolean, default=False, server_default="false",
    )
    archivada: Mapped[bool] = mapped_column(
        Boolean, default=False, server_default="false",
    )
