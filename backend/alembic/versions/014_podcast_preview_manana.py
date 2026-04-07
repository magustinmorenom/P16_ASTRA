"""Agregar campos origen y fecha_objetivo a podcast_episodios.

Soporta la funcionalidad de preview de mañana y lazy generation.

Revision ID: 014
Revises: 013
"""

import sqlalchemy as sa
from alembic import op

revision = "014"
down_revision = "013"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "podcast_episodios",
        sa.Column("origen", sa.String(20), nullable=False, server_default="manual"),
    )
    op.add_column(
        "podcast_episodios",
        sa.Column("fecha_objetivo", sa.Date, nullable=True),
    )
    # Rellenar fecha_objetivo con fecha existente para registros históricos
    op.execute("UPDATE podcast_episodios SET fecha_objetivo = fecha WHERE fecha_objetivo IS NULL")


def downgrade() -> None:
    op.drop_column("podcast_episodios", "fecha_objetivo")
    op.drop_column("podcast_episodios", "origen")
