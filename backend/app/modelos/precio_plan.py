"""Modelo de precio por país para un plan."""

import uuid

from sqlalchemy import Boolean, ForeignKey, Integer, String, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.modelos.base import ModeloBase


class PrecioPlan(ModeloBase):
    """Precio local de un plan para un país específico."""

    __tablename__ = "precios_plan"
    __table_args__ = (
        UniqueConstraint("plan_id", "pais_codigo", name="uq_precios_plan_pais"),
    )

    plan_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("planes.id", ondelete="CASCADE"),
        nullable=False,
    )
    pais_codigo: Mapped[str] = mapped_column(String(2), nullable=False)
    moneda: Mapped[str] = mapped_column(String(3), nullable=False)
    precio_local: Mapped[int] = mapped_column(Integer, nullable=False)
    intervalo: Mapped[str] = mapped_column(String(10), default="months")
    frecuencia: Mapped[int] = mapped_column(Integer, default=1)
    mp_plan_id: Mapped[str | None] = mapped_column(String(100), nullable=True)
    activo: Mapped[bool] = mapped_column(Boolean, default=True)

    plan: Mapped["Plan"] = relationship(  # noqa: F821
        back_populates="precios",
    )
