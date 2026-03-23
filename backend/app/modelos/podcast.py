"""Modelo de episodios de podcast cósmico."""

import uuid
from datetime import date

from sqlalchemy import (
    Date,
    Float,
    ForeignKey,
    Integer,
    String,
    Text,
    UniqueConstraint,
)
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.modelos.base import ModeloBase


class PodcastEpisodio(ModeloBase):
    """Episodio de podcast cósmico personalizado."""

    __tablename__ = "podcast_episodios"
    __table_args__ = (
        UniqueConstraint("usuario_id", "fecha", "momento", name="uq_podcast_usuario_fecha_momento"),
    )

    usuario_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("usuarios.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    fecha: Mapped[date] = mapped_column(Date, nullable=False, index=True)
    momento: Mapped[str] = mapped_column(String(20), nullable=False)
    titulo: Mapped[str] = mapped_column(String(200), nullable=False)
    guion_md: Mapped[str | None] = mapped_column(Text, nullable=True)
    segmentos_json: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    duracion_segundos: Mapped[float | None] = mapped_column(Float, nullable=True)
    url_audio: Mapped[str | None] = mapped_column(String(500), nullable=True)
    estado: Mapped[str] = mapped_column(String(20), nullable=False, default="pendiente")
    error_detalle: Mapped[str | None] = mapped_column(Text, nullable=True)
    tokens_usados: Mapped[int | None] = mapped_column(Integer, nullable=True)
