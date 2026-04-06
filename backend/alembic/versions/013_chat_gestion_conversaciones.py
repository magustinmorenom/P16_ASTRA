"""Agrega titulo, anclada y archivada a conversaciones_oraculo.

Revision ID: 013
Revises: 012
"""

from alembic import op
import sqlalchemy as sa

revision = "013"
down_revision = "012"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "conversaciones_oraculo",
        sa.Column("titulo", sa.String(120), nullable=True),
    )
    op.add_column(
        "conversaciones_oraculo",
        sa.Column("anclada", sa.Boolean(), server_default="false", nullable=False),
    )
    op.add_column(
        "conversaciones_oraculo",
        sa.Column("archivada", sa.Boolean(), server_default="false", nullable=False),
    )


def downgrade() -> None:
    op.drop_column("conversaciones_oraculo", "archivada")
    op.drop_column("conversaciones_oraculo", "anclada")
    op.drop_column("conversaciones_oraculo", "titulo")
