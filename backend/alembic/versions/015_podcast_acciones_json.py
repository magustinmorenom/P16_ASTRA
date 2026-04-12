"""Agregar campo acciones_json a podcast_episodios.

Almacena las acciones estructuradas extraídas del guion del podcast
para consumo directo por las tarjetas mañana/tarde/noche.

Revision ID: 015
Revises: 014
"""

import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import JSONB
from alembic import op

revision = "015"
down_revision = "014"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "podcast_episodios",
        sa.Column("acciones_json", JSONB, nullable=True),
    )


def downgrade() -> None:
    op.drop_column("podcast_episodios", "acciones_json")
