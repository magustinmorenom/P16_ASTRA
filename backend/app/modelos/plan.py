"""Modelo de plan de suscripción."""

from sqlalchemy import Boolean, Integer, String, Text
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.modelos.base import ModeloBase


class Plan(ModeloBase):
    """Plan de suscripción (Gratis, Premium, etc.)."""

    __tablename__ = "planes"

    nombre: Mapped[str] = mapped_column(String(50), nullable=False)
    slug: Mapped[str] = mapped_column(String(30), unique=True, nullable=False)
    descripcion: Mapped[str | None] = mapped_column(Text, nullable=True)
    precio_usd_centavos: Mapped[int] = mapped_column(Integer, default=0)
    intervalo: Mapped[str] = mapped_column(String(10), default="months")
    limite_perfiles: Mapped[int] = mapped_column(Integer, default=3)
    limite_calculos_dia: Mapped[int] = mapped_column(Integer, default=5)
    features: Mapped[dict | None] = mapped_column(JSONB, default=list)
    activo: Mapped[bool] = mapped_column(Boolean, default=True)
    orden: Mapped[int] = mapped_column(Integer, default=0)

    precios: Mapped[list["PrecioPlan"]] = relationship(  # noqa: F821
        back_populates="plan",
    )
    suscripciones: Mapped[list["Suscripcion"]] = relationship(  # noqa: F821
        back_populates="plan",
    )
