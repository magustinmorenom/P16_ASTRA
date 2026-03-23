"""Tests de startup de la aplicación y dependency injection."""

import pytest
from httpx import ASGITransport, AsyncClient
from unittest.mock import AsyncMock

from app.principal import crear_aplicacion, _obtener_db_placeholder, _obtener_redis_placeholder
from app.dependencias import obtener_db, obtener_redis


class TestCrearAplicacion:
    """Tests para crear_aplicacion() y dependency overrides."""

    def test_crea_app_fastapi(self):
        app = crear_aplicacion()
        assert app.title == "CosmicEngine"

    def test_registra_dependency_overrides_placeholder(self):
        """Los placeholders locales deben tener override."""
        app = crear_aplicacion()
        assert _obtener_db_placeholder in app.dependency_overrides
        assert _obtener_redis_placeholder in app.dependency_overrides

    def test_registra_dependency_overrides_dependencias(self):
        """Las funciones de app.dependencias también deben tener override."""
        app = crear_aplicacion()
        assert obtener_db in app.dependency_overrides
        assert obtener_redis in app.dependency_overrides

    def test_total_overrides(self):
        """Debe haber 4 overrides: 2 placeholders + 2 dependencias."""
        app = crear_aplicacion()
        assert len(app.dependency_overrides) == 4

    def test_registra_todas_las_rutas(self):
        """Verifica que se registran los routers principales."""
        app = crear_aplicacion()
        rutas = [r.path for r in app.routes]
        assert "/api/v1/auth/login" in rutas or any("/auth/" in r for r in rutas)
        assert any("/podcast/" in r for r in rutas)
        assert any("/suscripcion/" in r for r in rutas)


class TestHealthCheck:
    """Tests para GET /health."""

    @pytest.mark.anyio
    async def test_health_responde(self):
        app = crear_aplicacion()

        # Mock lifespan state
        app.state.sesion_factory = AsyncMock()
        mock_sesion = AsyncMock()
        mock_sesion.execute = AsyncMock()
        app.state.sesion_factory.return_value.__aenter__ = AsyncMock(return_value=mock_sesion)
        app.state.sesion_factory.return_value.__aexit__ = AsyncMock(return_value=False)

        mock_redis = AsyncMock()
        mock_redis.ping = AsyncMock(return_value=True)
        app.state.redis = mock_redis

        async with AsyncClient(
            transport=ASGITransport(app=app),
            base_url="http://test",
        ) as ac:
            resp = await ac.get("/health")

        assert resp.status_code == 200
        datos = resp.json()
        assert datos["estado"] in ("saludable", "degradado")
        assert "version" in datos


class TestDependencyInjection:
    """Tests para verificar que las dependencias se resuelven correctamente."""

    def test_placeholder_obtener_db_es_funcion(self):
        """_obtener_db_placeholder debe ser callable."""
        assert callable(_obtener_db_placeholder)

    def test_placeholder_obtener_redis_es_funcion(self):
        """_obtener_redis_placeholder debe ser callable."""
        assert callable(_obtener_redis_placeholder)

    def test_dependencias_obtener_db_es_diferente_de_placeholder(self):
        """Las funciones de dependencias.py y principal.py son distintas."""
        assert obtener_db is not _obtener_db_placeholder

    def test_ambas_tienen_override(self):
        """Ambas funciones (placeholder y dependencias) deben tener override."""
        app = crear_aplicacion()
        # Verificar que el override de dependencias apunta a la misma implementación
        # que el override del placeholder
        override_dep = app.dependency_overrides[obtener_db]
        override_placeholder = app.dependency_overrides[_obtener_db_placeholder]
        # Ambos deben ser la misma función de override
        assert override_dep is override_placeholder
