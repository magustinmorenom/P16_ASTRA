"""Modelo de perfil de usuario."""

import uuid
from datetime import date, time
from decimal import Decimal

from sqlalchemy import Date, ForeignKey, Numeric, String, Time
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.modelos.base import ModeloBase


class Perfil(ModeloBase):
    """Perfil de nacimiento de un usuario."""

    __tablename__ = "perfiles"

    usuario_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("usuarios.id", ondelete="SET NULL"),
        nullable=True,
    )
    nombre: Mapped[str] = mapped_column(String(100))
    fecha_nacimiento: Mapped[date] = mapped_column(Date, nullable=False)
    hora_nacimiento: Mapped[time] = mapped_column(Time, nullable=False)
    ciudad_nacimiento: Mapped[str] = mapped_column(String(100))
    pais_nacimiento: Mapped[str] = mapped_column(String(60))
    latitud: Mapped[Decimal | None] = mapped_column(Numeric(9, 6), nullable=True)
    longitud: Mapped[Decimal | None] = mapped_column(Numeric(9, 6), nullable=True)
    zona_horaria: Mapped[str | None] = mapped_column(String(60), nullable=True)

    usuario: Mapped["Usuario"] = relationship(  # noqa: F821
        back_populates="perfiles",
    )
    calculos: Mapped[list["Calculo"]] = relationship(  # noqa: F821
        back_populates="perfil",
        cascade="all, delete-orphan",
    )
