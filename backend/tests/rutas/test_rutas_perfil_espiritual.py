"""Tests para la ruta del perfil espiritual."""

import uuid
from datetime import date, time
from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from httpx import ASGITransport, AsyncClient

from app.modelos.perfil import Perfil
from app.modelos.usuario import Usuario
from app.principal import (
    _obtener_db_placeholder,
    _obtener_redis_placeholder,
    crear_aplicacion,
)
from app.servicios.servicio_auth import ServicioAuth
from app.rutas.v1 import perfil_espiritual as modulo_perfil_espiritual


def _crear_usuario_mock(uid=None, email="test@test.com"):
    usuario = MagicMock(spec=Usuario)
    usuario.id = uid or uuid.uuid4()
    usuario.email = email
    usuario.nombre = "Test"
    usuario.activo = True
    usuario.verificado = False
    usuario.proveedor_auth = "local"
    usuario.hash_contrasena = "hash"
    usuario.google_id = None
    usuario.ultimo_acceso = None
    usuario.creado_en = None
    return usuario


def _crear_perfil_mock(uid=None, usuario_id=None, nombre="Lucía García"):
    perfil = MagicMock(spec=Perfil)
    perfil.id = uid or uuid.uuid4()
    perfil.usuario_id = usuario_id
    perfil.nombre = nombre
    perfil.fecha_nacimiento = date(1990, 1, 15)
    perfil.hora_nacimiento = time(14, 30)
    perfil.ciudad_nacimiento = "Buenos Aires"
    perfil.pais_nacimiento = "Argentina"
    return perfil


@pytest.fixture
def db_falsa():
    sesion = AsyncMock()
    sesion.add = MagicMock()
    sesion.commit = AsyncMock()
    sesion.refresh = AsyncMock()
    sesion.execute = AsyncMock()
    return sesion


@pytest.fixture
def redis_falso():
    redis = AsyncMock()
    redis.get = AsyncMock(return_value=None)
    redis.set = AsyncMock(return_value=True)
    redis.setex = AsyncMock(return_value=True)
    redis.exists = AsyncMock(return_value=0)
    return redis


@pytest.fixture
def app_test(db_falsa, redis_falso):
    app = crear_aplicacion()

    async def override_db():
        return db_falsa

    async def override_redis():
        return redis_falso

    app.dependency_overrides[_obtener_db_placeholder] = override_db
    app.dependency_overrides[_obtener_redis_placeholder] = override_redis
    return app


@pytest.fixture
async def cliente(app_test):
    transport = ASGITransport(app=app_test)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac


class TestObtenerPerfilEspiritual:
    @pytest.fixture(autouse=True)
    def limpiar_estado(self):
        modulo_perfil_espiritual._generando.clear()
        modulo_perfil_espiritual._errores_generacion.clear()
        yield
        modulo_perfil_espiritual._generando.clear()
        modulo_perfil_espiritual._errores_generacion.clear()

    @pytest.mark.asyncio
    @patch("app.rutas.v1.perfil_espiritual.RepositorioCalculo")
    @patch("app.rutas.v1.perfil_espiritual.RepositorioPerfil")
    @patch("app.dependencias_auth.RepositorioUsuario")
    async def test_retorna_perfil_existente(
        self, MockRepoAuth, MockRepoPerfil, MockRepoCalculo, cliente
    ):
        uid = uuid.uuid4()
        usuario = _crear_usuario_mock(uid=uid)
        perfil = _crear_perfil_mock(usuario_id=uid)
        calculo = MagicMock()
        calculo.resultado_json = {
            "resumen": "Resumen listo",
            "foda": {
                "fortalezas": [],
                "oportunidades": [],
                "debilidades": [],
                "amenazas": [],
            },
        }

        MockRepoAuth.return_value.obtener_por_id = AsyncMock(return_value=usuario)
        MockRepoPerfil.return_value.obtener_por_usuario = AsyncMock(return_value=perfil)
        MockRepoCalculo.return_value.obtener_por_perfil_y_tipo = AsyncMock(return_value=calculo)

        token = ServicioAuth.crear_token_acceso(uid, usuario.email)
        resp = await cliente.get(
            "/api/v1/perfil-espiritual",
            headers={"Authorization": f"Bearer {token}"},
        )

        assert resp.status_code == 200
        datos = resp.json()["datos"]
        assert datos["estado"] == "listo"
        assert datos["resumen"] == "Resumen listo"

    @pytest.mark.asyncio
    @patch("app.rutas.v1.perfil_espiritual._generar_en_background", new_callable=AsyncMock)
    @patch("app.rutas.v1.perfil_espiritual.RepositorioCalculo")
    @patch("app.rutas.v1.perfil_espiritual.RepositorioPerfil")
    @patch("app.dependencias_auth.RepositorioUsuario")
    async def test_dispara_generacion_en_background(
        self, MockRepoAuth, MockRepoPerfil, MockRepoCalculo, mock_generar, cliente
    ):
        uid = uuid.uuid4()
        usuario = _crear_usuario_mock(uid=uid)
        perfil = _crear_perfil_mock(usuario_id=uid)

        MockRepoAuth.return_value.obtener_por_id = AsyncMock(return_value=usuario)
        MockRepoPerfil.return_value.obtener_por_usuario = AsyncMock(return_value=perfil)
        MockRepoCalculo.return_value.obtener_por_perfil_y_tipo = AsyncMock(return_value=None)
        MockRepoCalculo.return_value.obtener_todos_por_perfil = AsyncMock(
            return_value={
                "natal": {"sol": "Capricornio"},
                "diseno_humano": {"tipo": "Generador"},
                "numerologia": {"camino_de_vida": 7},
                "retorno_solar": None,
                "perfil_espiritual": None,
            }
        )

        token = ServicioAuth.crear_token_acceso(uid, usuario.email)
        resp = await cliente.get(
            "/api/v1/perfil-espiritual",
            headers={"Authorization": f"Bearer {token}"},
        )

        assert resp.status_code == 200
        assert resp.json()["datos"] == {"estado": "generando"}
        mock_generar.assert_awaited_once_with(uid)

    @pytest.mark.asyncio
    @patch("app.rutas.v1.perfil_espiritual.RepositorioCalculo")
    @patch("app.rutas.v1.perfil_espiritual.RepositorioPerfil")
    @patch("app.dependencias_auth.RepositorioUsuario")
    async def test_rechaza_si_faltan_calculos_base(
        self, MockRepoAuth, MockRepoPerfil, MockRepoCalculo, cliente
    ):
        uid = uuid.uuid4()
        usuario = _crear_usuario_mock(uid=uid)
        perfil = _crear_perfil_mock(usuario_id=uid)

        MockRepoAuth.return_value.obtener_por_id = AsyncMock(return_value=usuario)
        MockRepoPerfil.return_value.obtener_por_usuario = AsyncMock(return_value=perfil)
        MockRepoCalculo.return_value.obtener_por_perfil_y_tipo = AsyncMock(return_value=None)
        MockRepoCalculo.return_value.obtener_todos_por_perfil = AsyncMock(
            return_value={
                "natal": {"sol": "Capricornio"},
                "diseno_humano": None,
                "numerologia": {"camino_de_vida": 7},
                "retorno_solar": None,
                "perfil_espiritual": None,
            }
        )

        token = ServicioAuth.crear_token_acceso(uid, usuario.email)
        resp = await cliente.get(
            "/api/v1/perfil-espiritual",
            headers={"Authorization": f"Bearer {token}"},
        )

        assert resp.status_code == 422
        assert resp.json()["detalle"] == "Completá tu carta natal, diseño humano y numerología primero."

    @pytest.mark.asyncio
    @patch("app.rutas.v1.perfil_espiritual.RepositorioCalculo")
    @patch("app.rutas.v1.perfil_espiritual.RepositorioPerfil")
    @patch("app.dependencias_auth.RepositorioUsuario")
    async def test_devuelve_error_si_la_generacion_fallo_previamente(
        self, MockRepoAuth, MockRepoPerfil, MockRepoCalculo, cliente
    ):
        uid = uuid.uuid4()
        usuario = _crear_usuario_mock(uid=uid)
        perfil = _crear_perfil_mock(usuario_id=uid)

        MockRepoAuth.return_value.obtener_por_id = AsyncMock(return_value=usuario)
        MockRepoPerfil.return_value.obtener_por_usuario = AsyncMock(return_value=perfil)
        MockRepoCalculo.return_value.obtener_por_perfil_y_tipo = AsyncMock(return_value=None)

        modulo_perfil_espiritual._errores_generacion[str(uid)] = (
            "La respuesta del análisis llegó incompleta. Reintentá la generación."
        )

        token = ServicioAuth.crear_token_acceso(uid, usuario.email)
        resp = await cliente.get(
            "/api/v1/perfil-espiritual",
            headers={"Authorization": f"Bearer {token}"},
        )

        assert resp.status_code == 500
        assert (
            resp.json()["detalle"]
            == "La respuesta del análisis llegó incompleta. Reintentá la generación."
        )
