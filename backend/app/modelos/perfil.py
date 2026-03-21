"""Modelo de perfil de usuario."""

from datetime import date, time
from decimal import Decimal

from sqlalchemy import Date, Numeric, String, Time
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.modelos.base import ModeloBase


class Perfil(ModeloBase):
    """Perfil de nacimiento de un usuario."""

    __tablename__ = "perfiles"

    nombre: Mapped[str] = mapped_column(String(100))
    fecha_nacimiento: Mapped[date] = mapped_column(Date, nullable=False)
    hora_nacimiento: Mapped[time] = mapped_column(Time, nullable=False)
    ciudad_nacimiento: Mapped[str] = mapped_column(String(100))
    pais_nacimiento: Mapped[str] = mapped_column(String(60))
    latitud: Mapped[Decimal | None] = mapped_column(Numeric(9, 6), nullable=True)
    longitud: Mapped[Decimal | None] = mapped_column(Numeric(9, 6), nullable=True)
    zona_horaria: Mapped[str | None] = mapped_column(String(60), nullable=True)

    calculos: Mapped[list["Calculo"]] = relationship(  # noqa: F821
        back_populates="perfil",
        cascade="all, delete-orphan",
    )
