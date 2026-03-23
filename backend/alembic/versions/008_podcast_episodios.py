"""Crear tabla podcast_episodios.

Revision ID: 008
Revises: 007
"""

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects.postgresql import JSONB, UUID

revision = "008"
down_revision = "007"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "podcast_episodios",
        sa.Column(
            "id",
            UUID(as_uuid=True),
            primary_key=True,
            server_default=sa.text("gen_random_uuid()"),
        ),
        sa.Column(
            "creado_en",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.Column(
            "usuario_id",
            UUID(as_uuid=True),
            sa.ForeignKey("usuarios.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("fecha", sa.Date, nullable=False),
        sa.Column("momento", sa.String(20), nullable=False),
        sa.Column("titulo", sa.String(200), nullable=False),
        sa.Column("guion_md", sa.Text, nullable=True),
        sa.Column("segmentos_json", JSONB, nullable=True),
        sa.Column("duracion_segundos", sa.Float, nullable=True),
        sa.Column("url_audio", sa.String(500), nullable=True),
        sa.Column("estado", sa.String(20), nullable=False, server_default="pendiente"),
        sa.Column("error_detalle", sa.Text, nullable=True),
        sa.Column("tokens_usados", sa.Integer, nullable=True),
        sa.UniqueConstraint(
            "usuario_id", "fecha", "momento", name="uq_podcast_usuario_fecha_momento"
        ),
    )
    op.create_index(
        "ix_podcast_episodios_usuario_fecha",
        "podcast_episodios",
        ["usuario_id", "fecha"],
    )


def downgrade() -> None:
    op.drop_index("ix_podcast_episodios_usuario_fecha", "podcast_episodios")
    op.drop_table("podcast_episodios")
