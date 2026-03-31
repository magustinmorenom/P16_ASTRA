"""Modelo de tránsito diario persistido."""

from datetime import date, datetime

from sqlalchemy import Date, Float, Index, String, func
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column

from app.modelos.base import ModeloBase


class TransitoDiario(ModeloBase):
    """Posiciones planetarias y aspectos de un día, precalculados."""

    __tablename__ = "transitos_diarios"

    fecha: Mapped[date] = mapped_column(Date, nullable=False, unique=True)
    dia_juliano: Mapped[float] = mapped_column(Float, nullable=False)
    planetas: Mapped[dict] = mapped_column(JSONB, nullable=False)
    aspectos: Mapped[dict] = mapped_column(JSONB, nullable=False)
    fase_lunar: Mapped[str] = mapped_column(String(30), nullable=False)
    eventos: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    estado: Mapped[str] = mapped_column(String(10), nullable=False, index=True)

    __table_args__ = (
        Index("ix_transitos_diarios_planetas", "planetas", postgresql_using="gin"),
        Index("ix_transitos_diarios_aspectos", "aspectos", postgresql_using="gin"),
    )
