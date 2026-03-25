"""Agregar soporte chat web a conversaciones_oraculo.

Revision ID: 009
Revises: 008
"""

import sqlalchemy as sa
from alembic import op

revision = "009"
down_revision = "008"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Hacer telegram_id nullable (web chat no tiene telegram_id)
    op.alter_column(
        "conversaciones_oraculo",
        "telegram_id",
        existing_type=sa.BigInteger,
        nullable=True,
    )

    # Agregar columna canal
    op.add_column(
        "conversaciones_oraculo",
        sa.Column(
            "canal",
            sa.String(20),
            nullable=False,
            server_default="telegram",
        ),
    )

    # Índice para búsquedas de chat web por usuario
    op.create_index(
        "ix_conversaciones_oraculo_usuario_canal",
        "conversaciones_oraculo",
        ["usuario_id", "canal", "activa"],
    )


def downgrade() -> None:
    op.drop_index(
        "ix_conversaciones_oraculo_usuario_canal",
        "conversaciones_oraculo",
    )
    op.drop_column("conversaciones_oraculo", "canal")
    op.alter_column(
        "conversaciones_oraculo",
        "telegram_id",
        existing_type=sa.BigInteger,
        nullable=False,
    )
