"""Crear tablas vinculos_telegram y conversaciones_oraculo.

Revision ID: 007
Revises: 006
"""

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects.postgresql import JSONB, UUID

revision = "007"
down_revision = "006"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # -- vinculos_telegram --
    op.create_table(
        "vinculos_telegram",
        sa.Column("id", UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("creado_en", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("usuario_id", UUID(as_uuid=True), sa.ForeignKey("usuarios.id", ondelete="CASCADE"), nullable=False, unique=True),
        sa.Column("telegram_id", sa.BigInteger, unique=True, nullable=True),
        sa.Column("telegram_username", sa.String(100), nullable=True),
        sa.Column("activo", sa.Boolean, server_default=sa.text("true"), nullable=False),
        sa.Column("codigo_vinculacion", sa.String(6), nullable=True),
        sa.Column("codigo_expira_en", sa.DateTime(timezone=True), nullable=True),
    )
    op.create_index("ix_vinculos_telegram_telegram_id", "vinculos_telegram", ["telegram_id"])

    # -- conversaciones_oraculo --
    op.create_table(
        "conversaciones_oraculo",
        sa.Column("id", UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("creado_en", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("usuario_id", UUID(as_uuid=True), sa.ForeignKey("usuarios.id", ondelete="CASCADE"), nullable=False),
        sa.Column("telegram_id", sa.BigInteger, nullable=False),
        sa.Column("mensajes", JSONB, server_default="[]", nullable=False),
        sa.Column("tokens_usados", sa.Integer, server_default="0", nullable=False),
        sa.Column("activa", sa.Boolean, server_default=sa.text("true"), nullable=False),
    )
    op.create_index("ix_conversaciones_oraculo_usuario_id", "conversaciones_oraculo", ["usuario_id"])


def downgrade() -> None:
    op.drop_index("ix_conversaciones_oraculo_usuario_id", "conversaciones_oraculo")
    op.drop_table("conversaciones_oraculo")
    op.drop_index("ix_vinculos_telegram_telegram_id", "vinculos_telegram")
    op.drop_table("vinculos_telegram")
