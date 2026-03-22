"""Modelo de pago."""

import uuid
from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Integer, String
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.modelos.base import ModeloBase


class Pago(ModeloBase):
    """Registro de pago asociado a una suscripción."""

    __tablename__ = "pagos"

    suscripcion_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("suscripciones.id", ondelete="SET NULL"),
        nullable=True,
    )
    usuario_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("usuarios.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    mp_pago_id: Mapped[str | None] = mapped_column(
        String(100), unique=True, nullable=True, index=True
    )
    estado: Mapped[str] = mapped_column(
        String(30), nullable=False, default="pendiente"
    )
    monto_centavos: Mapped[int] = mapped_column(Integer, nullable=False)
    moneda: Mapped[str] = mapped_column(String(3), default="ARS")
    metodo_pago: Mapped[str | None] = mapped_column(String(30), nullable=True)
    detalle_estado: Mapped[str | None] = mapped_column(
        String(100), nullable=True
    )
    referencia_externa: Mapped[str | None] = mapped_column(
        String(200), nullable=True, index=True
    )
    datos_mp: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    fecha_pago: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    actualizado_en: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )

    suscripcion: Mapped["Suscripcion | None"] = relationship(  # noqa: F821
        back_populates="pagos",
    )
