"""Modelo de configuración de MercadoPago por país."""

from datetime import datetime

from sqlalchemy import Boolean, DateTime, Numeric, String
from sqlalchemy.orm import Mapped, mapped_column

from app.modelos.base import ModeloBase


class ConfigPaisMp(ModeloBase):
    """Configuración de MercadoPago por país (credenciales + tipo de cambio)."""

    __tablename__ = "config_pais_mp"

    pais_codigo: Mapped[str] = mapped_column(
        String(2), unique=True, nullable=False
    )
    pais_nombre: Mapped[str] = mapped_column(String(50), nullable=False)
    moneda: Mapped[str] = mapped_column(String(3), nullable=False)
    tipo_cambio_usd: Mapped[float] = mapped_column(
        Numeric(12, 4), nullable=False
    )
    mp_access_token: Mapped[str] = mapped_column(String(200), nullable=False)
    mp_public_key: Mapped[str] = mapped_column(String(200), nullable=False)
    mp_webhook_secret: Mapped[str | None] = mapped_column(
        String(200), nullable=True
    )
    activo: Mapped[bool] = mapped_column(Boolean, default=True)
    actualizado_en: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
