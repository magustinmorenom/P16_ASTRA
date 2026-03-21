"""Modelo de cálculo persistido."""

import uuid
from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, String, func
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.modelos.base import ModeloBase


class Calculo(ModeloBase):
    """Resultado de cálculo persistido en base de datos."""

    __tablename__ = "calculos"

    perfil_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("perfiles.id"),
        nullable=True,
    )
    tipo: Mapped[str] = mapped_column(String(20), nullable=False)
    hash_parametros: Mapped[str] = mapped_column(String(64), nullable=False, index=True)
    resultado_json: Mapped[dict] = mapped_column(JSONB, nullable=False)
    calculado_en: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
    )

    perfil: Mapped["Perfil"] = relationship(back_populates="calculos")  # noqa: F821
