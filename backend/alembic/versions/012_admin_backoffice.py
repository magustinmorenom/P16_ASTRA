"""Agrega rol a usuarios y tabla registros_consumo_api.

Revision ID: 012
Revises: 011
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = "012"
down_revision = "011"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Campo rol en usuarios
    op.add_column(
        "usuarios",
        sa.Column("rol", sa.String(20), server_default="usuario", nullable=False),
    )

    # Tabla de consumo de APIs
    op.create_table(
        "registros_consumo_api",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("usuario_id", postgresql.UUID(as_uuid=True), nullable=True, index=True),
        sa.Column("servicio", sa.String(30), nullable=False, index=True),
        sa.Column("operacion", sa.String(50), nullable=False),
        sa.Column("tokens_entrada", sa.Integer(), nullable=True),
        sa.Column("tokens_salida", sa.Integer(), nullable=True),
        sa.Column("costo_usd_centavos", sa.Integer(), server_default="0", nullable=False),
        sa.Column("modelo", sa.String(50), nullable=True),
        sa.Column("metadata_extra", postgresql.JSONB(), nullable=True),
        sa.Column("creado_en", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )


def downgrade() -> None:
    op.drop_table("registros_consumo_api")
    op.drop_column("usuarios", "rol")
