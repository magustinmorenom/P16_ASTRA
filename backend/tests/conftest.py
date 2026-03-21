"""Configuración de fixtures para tests."""

import pytest
from httpx import ASGITransport, AsyncClient

from app.principal import crear_aplicacion


@pytest.fixture
def app():
    """Crea una instancia de la aplicación para testing."""
    return crear_aplicacion()


@pytest.fixture
async def cliente(app):
    """Cliente HTTP async para testing de endpoints."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac
