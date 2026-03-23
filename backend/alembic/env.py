"""Configuración de Alembic para migraciones."""

import os
from logging.config import fileConfig

from alembic import context
from sqlalchemy import engine_from_config, pool

from app.modelos.base import Base
from app.modelos.calculo import Calculo  # noqa: F401
from app.modelos.perfil import Perfil  # noqa: F401

config = context.config

# En producción (Docker), leer DATABASE_URL_SYNC desde env var
database_url_sync = os.environ.get("DATABASE_URL_SYNC")
if database_url_sync:
    config.set_main_option("sqlalchemy.url", database_url_sync)

if config.config_file_name is not None:
    fileConfig(config.config_file_name)

target_metadata = Base.metadata


def run_migrations_offline() -> None:
    """Ejecutar migraciones en modo offline."""
    url = config.get_main_option("sqlalchemy.url")
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )
    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    """Ejecutar migraciones en modo online."""
    connectable = engine_from_config(
        config.get_section(config.config_ini_section, {}),
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )
    with connectable.connect() as connection:
        context.configure(
            connection=connection,
            target_metadata=target_metadata,
        )
        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
