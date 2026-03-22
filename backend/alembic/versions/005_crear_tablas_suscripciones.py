"""Crear tablas de suscripciones, pagos y configuración MP.

Revision ID: 005
Create Date: 2026-03-21
"""

import uuid

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import JSONB, UUID

revision = "005"
down_revision = "004"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # ── Tabla: planes ──────────────────────────────────────────
    op.create_table(
        "planes",
        sa.Column("id", UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("nombre", sa.String(50), nullable=False),
        sa.Column("slug", sa.String(30), unique=True, nullable=False),
        sa.Column("descripcion", sa.Text(), nullable=True),
        sa.Column("precio_usd_centavos", sa.Integer(), server_default="0", nullable=False),
        sa.Column("intervalo", sa.String(10), server_default="months"),
        sa.Column("limite_perfiles", sa.Integer(), server_default="3"),
        sa.Column("limite_calculos_dia", sa.Integer(), server_default="5"),
        sa.Column("features", JSONB(), server_default="[]"),
        sa.Column("activo", sa.Boolean(), server_default=sa.text("true"), nullable=False),
        sa.Column("orden", sa.Integer(), server_default="0"),
        sa.Column("creado_en", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )

    # ── Tabla: precios_plan ────────────────────────────────────
    op.create_table(
        "precios_plan",
        sa.Column("id", UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("plan_id", UUID(as_uuid=True), sa.ForeignKey("planes.id", ondelete="CASCADE"), nullable=False),
        sa.Column("pais_codigo", sa.String(2), nullable=False),
        sa.Column("moneda", sa.String(3), nullable=False),
        sa.Column("precio_local", sa.Integer(), nullable=False),
        sa.Column("intervalo", sa.String(10), server_default="months"),
        sa.Column("frecuencia", sa.Integer(), server_default="1"),
        sa.Column("mp_plan_id", sa.String(100), nullable=True),
        sa.Column("activo", sa.Boolean(), server_default=sa.text("true"), nullable=False),
        sa.Column("creado_en", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.UniqueConstraint("plan_id", "pais_codigo", name="uq_precios_plan_pais"),
    )

    # ── Tabla: config_pais_mp ──────────────────────────────────
    op.create_table(
        "config_pais_mp",
        sa.Column("id", UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("pais_codigo", sa.String(2), unique=True, nullable=False),
        sa.Column("pais_nombre", sa.String(50), nullable=False),
        sa.Column("moneda", sa.String(3), nullable=False),
        sa.Column("tipo_cambio_usd", sa.Numeric(12, 4), nullable=False),
        sa.Column("mp_access_token", sa.String(200), nullable=False),
        sa.Column("mp_public_key", sa.String(200), nullable=False),
        sa.Column("mp_webhook_secret", sa.String(200), nullable=True),
        sa.Column("activo", sa.Boolean(), server_default=sa.text("true"), nullable=False),
        sa.Column("creado_en", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("actualizado_en", sa.DateTime(timezone=True), nullable=True),
    )

    # ── Tabla: suscripciones ───────────────────────────────────
    op.create_table(
        "suscripciones",
        sa.Column("id", UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("usuario_id", UUID(as_uuid=True), sa.ForeignKey("usuarios.id", ondelete="CASCADE"), nullable=False),
        sa.Column("plan_id", UUID(as_uuid=True), sa.ForeignKey("planes.id"), nullable=False),
        sa.Column("precio_plan_id", UUID(as_uuid=True), sa.ForeignKey("precios_plan.id"), nullable=True),
        sa.Column("pais_codigo", sa.String(2), nullable=False, server_default="AR"),
        sa.Column("mp_preapproval_id", sa.String(100), unique=True, nullable=True),
        sa.Column("mp_payer_id", sa.String(100), nullable=True),
        sa.Column("estado", sa.String(20), nullable=False, server_default="activa"),
        sa.Column("fecha_inicio", sa.DateTime(timezone=True), nullable=True),
        sa.Column("fecha_fin", sa.DateTime(timezone=True), nullable=True),
        sa.Column("referencia_externa", sa.String(200), nullable=True),
        sa.Column("datos_mp", JSONB(), nullable=True),
        sa.Column("creado_en", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("actualizado_en", sa.DateTime(timezone=True), nullable=True),
    )
    op.create_index("ix_suscripciones_usuario_id", "suscripciones", ["usuario_id"])
    op.create_index("ix_suscripciones_mp_preapproval_id", "suscripciones", ["mp_preapproval_id"])
    op.create_index("ix_suscripciones_referencia_externa", "suscripciones", ["referencia_externa"])

    # ── Tabla: pagos ───────────────────────────────────────────
    op.create_table(
        "pagos",
        sa.Column("id", UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("suscripcion_id", UUID(as_uuid=True), sa.ForeignKey("suscripciones.id", ondelete="SET NULL"), nullable=True),
        sa.Column("usuario_id", UUID(as_uuid=True), sa.ForeignKey("usuarios.id", ondelete="SET NULL"), nullable=True),
        sa.Column("mp_pago_id", sa.String(100), unique=True, nullable=True),
        sa.Column("estado", sa.String(30), nullable=False, server_default="pendiente"),
        sa.Column("monto_centavos", sa.Integer(), nullable=False),
        sa.Column("moneda", sa.String(3), server_default="ARS"),
        sa.Column("metodo_pago", sa.String(30), nullable=True),
        sa.Column("detalle_estado", sa.String(100), nullable=True),
        sa.Column("referencia_externa", sa.String(200), nullable=True),
        sa.Column("datos_mp", JSONB(), nullable=True),
        sa.Column("fecha_pago", sa.DateTime(timezone=True), nullable=True),
        sa.Column("creado_en", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("actualizado_en", sa.DateTime(timezone=True), nullable=True),
    )
    op.create_index("ix_pagos_usuario_id", "pagos", ["usuario_id"])
    op.create_index("ix_pagos_mp_pago_id", "pagos", ["mp_pago_id"])
    op.create_index("ix_pagos_referencia_externa", "pagos", ["referencia_externa"])

    # ── Tabla: eventos_webhook ─────────────────────────────────
    op.create_table(
        "eventos_webhook",
        sa.Column("id", sa.String(100), primary_key=True),
        sa.Column("tipo", sa.String(100), nullable=False),
        sa.Column("accion", sa.String(100), nullable=True),
        sa.Column("payload", JSONB(), nullable=True),
        sa.Column("estado", sa.String(20), server_default="procesado"),
        sa.Column("procesado_en", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )

    # ── Datos semilla: planes ──────────────────────────────────
    planes = sa.table(
        "planes",
        sa.column("id", UUID(as_uuid=True)),
        sa.column("nombre", sa.String),
        sa.column("slug", sa.String),
        sa.column("descripcion", sa.Text),
        sa.column("precio_usd_centavos", sa.Integer),
        sa.column("intervalo", sa.String),
        sa.column("limite_perfiles", sa.Integer),
        sa.column("limite_calculos_dia", sa.Integer),
        sa.column("features", JSONB),
        sa.column("activo", sa.Boolean),
        sa.column("orden", sa.Integer),
    )

    id_gratis = uuid.uuid4()
    id_premium = uuid.uuid4()

    op.bulk_insert(planes, [
        {
            "id": id_gratis,
            "nombre": "Gratis",
            "slug": "gratis",
            "descripcion": "Plan gratuito con funcionalidades básicas",
            "precio_usd_centavos": 0,
            "intervalo": "months",
            "limite_perfiles": 3,
            "limite_calculos_dia": 5,
            "features": ["natal_basico", "numerologia_basica"],
            "activo": True,
            "orden": 0,
        },
        {
            "id": id_premium,
            "nombre": "Premium",
            "slug": "premium",
            "descripcion": "Plan premium con todas las funcionalidades",
            "precio_usd_centavos": 900,
            "intervalo": "months",
            "limite_perfiles": -1,
            "limite_calculos_dia": -1,
            "features": [
                "natal",
                "diseno_humano",
                "numerologia",
                "retorno_solar",
                "transitos",
                "exportar_pdf",
            ],
            "activo": True,
            "orden": 1,
        },
    ])

    # ── Datos semilla: config_pais_mp ──────────────────────────
    config_pais = sa.table(
        "config_pais_mp",
        sa.column("id", UUID(as_uuid=True)),
        sa.column("pais_codigo", sa.String),
        sa.column("pais_nombre", sa.String),
        sa.column("moneda", sa.String),
        sa.column("tipo_cambio_usd", sa.Numeric),
        sa.column("mp_access_token", sa.String),
        sa.column("mp_public_key", sa.String),
        sa.column("activo", sa.Boolean),
    )

    op.bulk_insert(config_pais, [
        {
            "id": uuid.uuid4(),
            "pais_codigo": "AR",
            "pais_nombre": "Argentina",
            "moneda": "ARS",
            "tipo_cambio_usd": 1200.0000,
            "mp_access_token": "TEST-placeholder-ar",
            "mp_public_key": "TEST-placeholder-ar",
            "activo": True,
        },
        {
            "id": uuid.uuid4(),
            "pais_codigo": "BR",
            "pais_nombre": "Brasil",
            "moneda": "BRL",
            "tipo_cambio_usd": 5.5000,
            "mp_access_token": "TEST-placeholder-br",
            "mp_public_key": "TEST-placeholder-br",
            "activo": True,
        },
        {
            "id": uuid.uuid4(),
            "pais_codigo": "MX",
            "pais_nombre": "México",
            "moneda": "MXN",
            "tipo_cambio_usd": 17.5000,
            "mp_access_token": "TEST-placeholder-mx",
            "mp_public_key": "TEST-placeholder-mx",
            "activo": True,
        },
    ])

    # ── Datos semilla: precios_plan por país (solo Premium) ────
    precios = sa.table(
        "precios_plan",
        sa.column("id", UUID(as_uuid=True)),
        sa.column("plan_id", UUID(as_uuid=True)),
        sa.column("pais_codigo", sa.String),
        sa.column("moneda", sa.String),
        sa.column("precio_local", sa.Integer),
        sa.column("intervalo", sa.String),
        sa.column("frecuencia", sa.Integer),
        sa.column("activo", sa.Boolean),
    )

    op.bulk_insert(precios, [
        {
            "id": uuid.uuid4(),
            "plan_id": id_premium,
            "pais_codigo": "AR",
            "moneda": "ARS",
            "precio_local": 1080000,  # $10,800 ARS en centavos
            "intervalo": "months",
            "frecuencia": 1,
            "activo": True,
        },
        {
            "id": uuid.uuid4(),
            "plan_id": id_premium,
            "pais_codigo": "BR",
            "moneda": "BRL",
            "precio_local": 4950,  # R$49,50 BRL en centavos
            "intervalo": "months",
            "frecuencia": 1,
            "activo": True,
        },
        {
            "id": uuid.uuid4(),
            "plan_id": id_premium,
            "pais_codigo": "MX",
            "moneda": "MXN",
            "precio_local": 15750,  # $157,50 MXN en centavos
            "intervalo": "months",
            "frecuencia": 1,
            "activo": True,
        },
    ])


def downgrade() -> None:
    op.drop_table("eventos_webhook")
    op.drop_index("ix_pagos_referencia_externa", table_name="pagos")
    op.drop_index("ix_pagos_mp_pago_id", table_name="pagos")
    op.drop_index("ix_pagos_usuario_id", table_name="pagos")
    op.drop_table("pagos")
    op.drop_index("ix_suscripciones_referencia_externa", table_name="suscripciones")
    op.drop_index("ix_suscripciones_mp_preapproval_id", table_name="suscripciones")
    op.drop_index("ix_suscripciones_usuario_id", table_name="suscripciones")
    op.drop_table("suscripciones")
    op.drop_table("config_pais_mp")
    op.drop_table("precios_plan")
    op.drop_table("planes")
