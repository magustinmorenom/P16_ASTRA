"""Crear tabla de facturas.

Revision ID: 006
Create Date: 2026-03-22
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import JSONB, UUID

revision = "006"
down_revision = "005"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "facturas",
        sa.Column("id", UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("usuario_id", UUID(as_uuid=True), sa.ForeignKey("usuarios.id", ondelete="SET NULL"), nullable=True),
        sa.Column("pago_id", UUID(as_uuid=True), sa.ForeignKey("pagos.id", ondelete="SET NULL"), nullable=True),
        sa.Column("suscripcion_id", UUID(as_uuid=True), sa.ForeignKey("suscripciones.id", ondelete="SET NULL"), nullable=True),
        sa.Column("numero_factura", sa.String(30), unique=True, nullable=False),
        sa.Column("estado", sa.String(20), nullable=False, server_default="emitida"),
        sa.Column("monto_centavos", sa.Integer(), nullable=False),
        sa.Column("moneda", sa.String(3), server_default="ARS"),
        sa.Column("concepto", sa.String(200), nullable=False),
        sa.Column("email_cliente", sa.String(200), nullable=True),
        sa.Column("nombre_cliente", sa.String(200), nullable=True),
        sa.Column("pais_codigo", sa.String(2), server_default="AR"),
        sa.Column("periodo_inicio", sa.DateTime(timezone=True), nullable=True),
        sa.Column("periodo_fin", sa.DateTime(timezone=True), nullable=True),
        sa.Column("notas", sa.Text(), nullable=True),
        sa.Column("datos_extra", JSONB(), nullable=True),
        sa.Column("creado_en", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )
    op.create_index("ix_facturas_usuario_id", "facturas", ["usuario_id"])
    op.create_index("ix_facturas_pago_id", "facturas", ["pago_id"])


def downgrade() -> None:
    op.drop_index("ix_facturas_pago_id", table_name="facturas")
    op.drop_index("ix_facturas_usuario_id", table_name="facturas")
    op.drop_table("facturas")
