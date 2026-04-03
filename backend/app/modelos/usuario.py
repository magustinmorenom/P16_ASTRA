"""Modelo de usuario para autenticación."""

from datetime import datetime

from sqlalchemy import Boolean, DateTime, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.modelos.base import ModeloBase


class Usuario(ModeloBase):
    """Usuario registrado en la plataforma."""

    __tablename__ = "usuarios"

    email: Mapped[str] = mapped_column(
        String(255), unique=True, nullable=False, index=True
    )
    hash_contrasena: Mapped[str | None] = mapped_column(
        String(255), nullable=True
    )
    nombre: Mapped[str] = mapped_column(String(100), nullable=False)
    activo: Mapped[bool] = mapped_column(Boolean, default=True)
    verificado: Mapped[bool] = mapped_column(Boolean, default=False)
    proveedor_auth: Mapped[str] = mapped_column(
        String(20), default="local",
    )
    google_id: Mapped[str | None] = mapped_column(
        String(255), unique=True, nullable=True, index=True
    )
    ultimo_acceso: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    rol: Mapped[str] = mapped_column(
        String(20), default="usuario", server_default="usuario"
    )

    perfiles: Mapped[list["Perfil"]] = relationship(  # noqa: F821
        back_populates="usuario",
    )
