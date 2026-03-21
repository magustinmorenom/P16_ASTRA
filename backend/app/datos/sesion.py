"""Configuración de sesión de base de datos."""

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.configuracion import obtener_configuracion


def crear_motor_async():
    """Crea el motor async de SQLAlchemy."""
    config = obtener_configuracion()
    return create_async_engine(
        config.database_url,
        echo=config.ambiente == "desarrollo",
        pool_size=5,
        max_overflow=10,
    )


def crear_sesion_factory(motor) -> async_sessionmaker[AsyncSession]:
    """Crea la factory de sesiones async."""
    return async_sessionmaker(
        motor,
        class_=AsyncSession,
        expire_on_commit=False,
    )
