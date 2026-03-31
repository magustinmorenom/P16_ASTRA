"""Tests para las rutas del chat web del Oráculo ASTRA."""

import uuid
from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from httpx import ASGITransport, AsyncClient

from app.modelos.usuario import Usuario
from app.principal import (
    _obtener_db_placeholder,
    _obtener_redis_placeholder,
    crear_aplicacion,
)
from app.servicios.servicio_auth import ServicioAuth


def _crear_usuario_mock(
    uid=None, email="test@test.com", nombre="Test", activo=True
):
    """Crea un objeto Usuario mock."""
    usuario = MagicMock(spec=Usuario)
    usuario.id = uid or uuid.uuid4()
    usuario.email = email
    usuario.nombre = nombre
    usuario.activo = activo
    usuario.verificado = False
    usuario.proveedor_auth = "local"
    usuario.hash_contrasena = "hash"
    usuario.google_id = None
    usuario.ultimo_acceso = None
    usuario.creado_en = None
    return usuario


@pytest.fixture
def redis_falso():
    """Redis falso basado en diccionario en memoria."""
    almacen = {}
    redis = AsyncMock()

    async def fake_get(clave):
        return almacen.get(clave)

    async def fake_exists(clave):
        return 1 if clave in almacen else 0

    def fake_pipeline():
        comandos = []

        class PipelineFalso:
            def incr(self, clave):
                comandos.append(("incr", clave))
                return self

            def expire(self, clave, ttl):
                comandos.append(("expire", clave, ttl))
                return self

            async def execute(self):
                for comando in comandos:
                    if comando[0] == "incr":
                        clave = comando[1]
                        valor = almacen.get(clave)
                        valor = int(valor) if valor else 0
                        almacen[clave] = valor + 1
                return [True for _ in comandos]

        return PipelineFalso()

    redis.get = AsyncMock(side_effect=fake_get)
    redis.exists = AsyncMock(side_effect=fake_exists)
    redis.pipeline = MagicMock(side_effect=fake_pipeline)
    redis._almacen = almacen
    return redis


@pytest.fixture
def db_falsa():
    """Sesión de DB falsa."""
    sesion = AsyncMock()
    sesion.add = MagicMock()
    sesion.commit = AsyncMock()
    sesion.refresh = AsyncMock()
    sesion.execute = AsyncMock()
    return sesion


@pytest.fixture
def app_test(redis_falso, db_falsa):
    """Aplicación FastAPI con dependencias mockeadas."""
    app = crear_aplicacion()

    async def override_redis():
        return redis_falso

    async def override_db():
        return db_falsa

    app.dependency_overrides[_obtener_db_placeholder] = override_db
    app.dependency_overrides[_obtener_redis_placeholder] = override_redis
    return app


@pytest.fixture
async def cliente(app_test):
    """Cliente HTTP async."""
    transport = ASGITransport(app=app_test)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac


class TestEnviarMensajeChat:
    """Tests de POST /chat/mensaje."""

    @pytest.mark.asyncio
    @patch("app.rutas.v1.chat.ServicioOraculo")
    @patch("app.rutas.v1.chat.ServicioTransitos")
    @patch("app.rutas.v1.chat.RepositorioPerfil")
    @patch("app.rutas.v1.chat.RepositorioConversacion")
    @patch("app.rutas.v1.chat.RepositorioSuscripcion")
    @patch("app.dependencias_auth.RepositorioUsuario")
    async def test_envuelve_respuesta_chat_sin_error_de_validacion(
        self,
        MockRepoUsuario,
        MockRepoSuscripcion,
        MockRepoConversacion,
        MockRepoPerfil,
        MockServicioTransitos,
        MockServicioOraculo,
        cliente,
        redis_falso,
    ):
        """Debe responder 200 con el envoltorio estándar y datos del chat."""
        usuario_id = uuid.uuid4()
        usuario = _crear_usuario_mock(uid=usuario_id, nombre="Manuel")
        conversacion = MagicMock()
        conversacion.id = uuid.uuid4()

        MockRepoUsuario.return_value.obtener_por_id = AsyncMock(return_value=usuario)
        MockRepoSuscripcion.return_value.obtener_activa = AsyncMock(return_value=None)
        MockRepoPerfil.return_value.obtener_por_usuario = AsyncMock(return_value=None)
        MockRepoConversacion.return_value.obtener_o_crear_web = AsyncMock(return_value=conversacion)
        MockRepoConversacion.return_value.obtener_historial = AsyncMock(return_value=[])
        MockRepoConversacion.return_value.agregar_mensaje = AsyncMock()
        MockServicioTransitos.obtener_transitos_actuales = MagicMock(return_value={"planetas": []})
        MockServicioOraculo.consultar = AsyncMock(return_value=("Respuesta astral", 321))

        token = ServicioAuth.crear_token_acceso(usuario_id, "test@test.com")

        respuesta = await cliente.post(
            "/api/v1/chat/mensaje",
            json={"mensaje": "Necesito un consejo para hoy"},
            headers={"Authorization": f"Bearer {token}"},
        )

        assert respuesta.status_code == 200
        cuerpo = respuesta.json()
        assert cuerpo["exito"] is True
        assert cuerpo["datos"]["respuesta"] == "Respuesta astral"
        assert cuerpo["datos"]["mensajes_restantes"] == 2
        assert MockRepoConversacion.return_value.agregar_mensaje.await_count == 2
