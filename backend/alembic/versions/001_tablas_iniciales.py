"""Tablas iniciales: perfiles y cálculos.

Revision ID: 001
Create Date: 2026-03-21
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID, JSONB

revision = "001"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "perfiles",
        sa.Column("id", UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("nombre", sa.String(100), nullable=False),
        sa.Column("fecha_nacimiento", sa.Date(), nullable=False),
        sa.Column("hora_nacimiento", sa.Time(), nullable=False),
        sa.Column("ciudad_nacimiento", sa.String(100), nullable=True),
        sa.Column("pais_nacimiento", sa.String(60), nullable=True),
        sa.Column("latitud", sa.Numeric(9, 6), nullable=True),
        sa.Column("longitud", sa.Numeric(9, 6), nullable=True),
        sa.Column("zona_horaria", sa.String(60), nullable=True),
        sa.Column("creado_en", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )

    op.create_table(
        "calculos",
        sa.Column("id", UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("perfil_id", UUID(as_uuid=True), sa.ForeignKey("perfiles.id"), nullable=False),
        sa.Column("tipo", sa.String(20), nullable=False),
        sa.Column("hash_parametros", sa.String(64), nullable=False, index=True),
        sa.Column("resultado_json", JSONB(), nullable=False),
        sa.Column("calculado_en", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("creado_en", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )


def downgrade() -> None:
    op.drop_table("calculos")
    op.drop_table("perfiles")
