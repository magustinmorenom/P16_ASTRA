"""Crear tabla transitos_diarios para ventana deslizante de tránsitos.

Revision ID: 010
Revises: 009
"""

import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import JSONB, UUID
from alembic import op

revision = "010"
down_revision = "009"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "transitos_diarios",
        sa.Column("id", UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("fecha", sa.Date, nullable=False, unique=True),
        sa.Column("dia_juliano", sa.Float, nullable=False),
        sa.Column("planetas", JSONB, nullable=False),
        sa.Column("aspectos", JSONB, nullable=False),
        sa.Column("fase_lunar", sa.String(30), nullable=False),
        sa.Column("estado", sa.String(10), nullable=False),
        sa.Column("creado_en", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )

    op.create_index("ix_transitos_diarios_estado", "transitos_diarios", ["estado"])
    op.create_index("ix_transitos_diarios_planetas", "transitos_diarios", ["planetas"], postgresql_using="gin")
    op.create_index("ix_transitos_diarios_aspectos", "transitos_diarios", ["aspectos"], postgresql_using="gin")


def downgrade() -> None:
    op.drop_index("ix_transitos_diarios_aspectos", "transitos_diarios")
    op.drop_index("ix_transitos_diarios_planetas", "transitos_diarios")
    op.drop_index("ix_transitos_diarios_estado", "transitos_diarios")
    op.drop_table("transitos_diarios")
