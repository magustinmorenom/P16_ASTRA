"""Modelo de factura."""

import uuid
from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.modelos.base import ModeloBase


class Factura(ModeloBase):
    """Factura generada automáticamente al aprobarse un pago."""

    __tablename__ = "facturas"

    usuario_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("usuarios.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    pago_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("pagos.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    suscripcion_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("suscripciones.id", ondelete="SET NULL"),
        nullable=True,
    )
    numero_factura: Mapped[str] = mapped_column(
        String(30), unique=True, nullable=False
    )
    estado: Mapped[str] = mapped_column(
        String(20), nullable=False, default="emitida"
    )
    monto_centavos: Mapped[int] = mapped_column(Integer, nullable=False)
    moneda: Mapped[str] = mapped_column(String(3), default="ARS")
    concepto: Mapped[str] = mapped_column(String(200), nullable=False)
    email_cliente: Mapped[str | None] = mapped_column(
        String(200), nullable=True
    )
    nombre_cliente: Mapped[str | None] = mapped_column(
        String(200), nullable=True
    )
    pais_codigo: Mapped[str] = mapped_column(String(2), default="AR")
    periodo_inicio: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    periodo_fin: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    notas: Mapped[str | None] = mapped_column(Text, nullable=True)
    datos_extra: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
