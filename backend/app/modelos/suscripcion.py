"""Modelo de suscripción de usuario."""

import uuid
from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, String
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.modelos.base import ModeloBase


class Suscripcion(ModeloBase):
    """Suscripción de un usuario a un plan."""

    __tablename__ = "suscripciones"

    usuario_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("usuarios.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    plan_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("planes.id"),
        nullable=False,
    )
    precio_plan_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("precios_plan.id"),
        nullable=True,
    )
    pais_codigo: Mapped[str] = mapped_column(
        String(2), nullable=False, default="AR"
    )
    mp_preapproval_id: Mapped[str | None] = mapped_column(
        String(100), unique=True, nullable=True, index=True
    )
    mp_payer_id: Mapped[str | None] = mapped_column(
        String(100), nullable=True
    )
    estado: Mapped[str] = mapped_column(
        String(20), nullable=False, default="activa"
    )
    fecha_inicio: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    fecha_fin: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    referencia_externa: Mapped[str | None] = mapped_column(
        String(200), nullable=True, index=True
    )
    datos_mp: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    actualizado_en: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )

    plan: Mapped["Plan"] = relationship(  # noqa: F821
        back_populates="suscripciones",
    )
    pagos: Mapped[list["Pago"]] = relationship(  # noqa: F821
        back_populates="suscripcion",
    )
