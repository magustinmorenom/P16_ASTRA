"""Crear tabla usuarios con autenticación.

Revision ID: 003
Create Date: 2026-03-21
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID

revision = "003"
down_revision = "002"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "usuarios",
        sa.Column("id", UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("email", sa.String(255), unique=True, nullable=False),
        sa.Column("hash_contrasena", sa.String(255), nullable=True),
        sa.Column("nombre", sa.String(100), nullable=False),
        sa.Column("activo", sa.Boolean(), server_default=sa.text("true"), nullable=False),
        sa.Column("verificado", sa.Boolean(), server_default=sa.text("false"), nullable=False),
        sa.Column("proveedor_auth", sa.String(20), server_default="local", nullable=False),
        sa.Column("google_id", sa.String(255), unique=True, nullable=True),
        sa.Column("ultimo_acceso", sa.DateTime(timezone=True), nullable=True),
        sa.Column("creado_en", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )
    op.create_index("ix_usuarios_email", "usuarios", ["email"])
    op.create_index("ix_usuarios_google_id", "usuarios", ["google_id"])


def downgrade() -> None:
    op.drop_index("ix_usuarios_google_id", table_name="usuarios")
    op.drop_index("ix_usuarios_email", table_name="usuarios")
    op.drop_table("usuarios")
