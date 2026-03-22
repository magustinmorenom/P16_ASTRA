"""Agregar usuario_id nullable a perfiles.

Revision ID: 004
Create Date: 2026-03-21
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID

revision = "004"
down_revision = "003"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "perfiles",
        sa.Column("usuario_id", UUID(as_uuid=True), nullable=True),
    )
    op.create_foreign_key(
        "fk_perfiles_usuario_id",
        "perfiles",
        "usuarios",
        ["usuario_id"],
        ["id"],
        ondelete="SET NULL",
    )
    op.create_index("ix_perfiles_usuario_id", "perfiles", ["usuario_id"])


def downgrade() -> None:
    op.drop_index("ix_perfiles_usuario_id", table_name="perfiles")
    op.drop_constraint("fk_perfiles_usuario_id", "perfiles", type_="foreignkey")
    op.drop_column("perfiles", "usuario_id")
