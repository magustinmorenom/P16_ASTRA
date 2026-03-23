"""Esquemas Pydantic para suscripciones y pagos."""

from datetime import datetime

from pydantic import BaseModel, Field


class EsquemaSuscribirse(BaseModel):
    """Datos para suscribirse a un plan."""

    plan_id: str
    pais_codigo: str = Field(default="AR", pattern="^(AR|BR|MX)$")


class RespuestaPlan(BaseModel):
    """Datos públicos de un plan."""

    id: str
    nombre: str
    slug: str
    descripcion: str | None = None
    precio_usd_centavos: int
    intervalo: str
    limite_perfiles: int
    limite_calculos_dia: int
    features: list[str] = []
    precio_local: int | None = None
    moneda_local: str | None = None


class RespuestaSuscripcion(BaseModel):
    """Datos de una suscripción."""

    id: str
    plan_id: str
    plan_nombre: str | None = None
    plan_slug: str | None = None
    pais_codigo: str
    estado: str
    mp_preapproval_id: str | None = None
    fecha_inicio: datetime | None = None
    fecha_fin: datetime | None = None
    creado_en: datetime | None = None


class RespuestaPago(BaseModel):
    """Datos de un pago."""

    id: str
    estado: str
    monto_centavos: int
    moneda: str
    metodo_pago: str | None = None
    detalle_estado: str | None = None
    fecha_pago: datetime | None = None
    creado_en: datetime | None = None


class RespuestaFactura(BaseModel):
    """Datos de una factura."""

    id: str
    numero_factura: str
    estado: str
    monto_centavos: int
    moneda: str
    concepto: str
    pais_codigo: str
    email_cliente: str | None = None
    nombre_cliente: str | None = None
    periodo_inicio: datetime | None = None
    periodo_fin: datetime | None = None
    creado_en: datetime | None = None


class RespuestaCheckout(BaseModel):
    """URL de checkout de MercadoPago."""

    init_point: str
    suscripcion_id: str
    mp_preapproval_id: str | None = None
