"""Agregar columna eventos a transitos_diarios.

Revision ID: 011
Revises: 010
"""

import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import JSONB
from alembic import op

revision = "011"
down_revision = "010"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "transitos_diarios",
        sa.Column("eventos", JSONB, nullable=True),
    )


def downgrade() -> None:
    op.drop_column("transitos_diarios", "eventos")
