"""Tests para las rutas del Oráculo ASTRA — vinculación Telegram."""

import uuid
from datetime import datetime, timedelta, timezone
from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from httpx import ASGITransport, AsyncClient

from app.modelos.plan import Plan
from app.modelos.suscripcion import Suscripcion
from app.modelos.usuario import Usuario
from app.modelos.vinculo_telegram import VinculoTelegram
from app.principal import (
    _obtener_db_placeholder,
    _obtener_redis_placeholder,
    crear_aplicacion,
)
from app.servicios.servicio_auth import ServicioAuth


# ── Helpers ────────────────────────────────────────────────────


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


def _crear_plan_mock(slug="premium"):
    plan = MagicMock(spec=Plan)
    plan.id = uuid.uuid4()
    plan.slug = slug
    plan.nombre = slug.capitalize()
    plan.activo = True
    return plan


def _crear_suscripcion_mock(usuario_id, plan_id, estado="activa"):
    sus = MagicMock(spec=Suscripcion)
    sus.id = uuid.uuid4()
    sus.usuario_id = usuario_id
    sus.plan_id = plan_id
    sus.estado = estado
    sus.pais_codigo = "AR"
    sus.fecha_inicio = datetime.now(timezone.utc)
    sus.fecha_fin = None
    sus.creado_en = datetime.now(timezone.utc)
    return sus


def _crear_vinculo_mock(usuario_id, telegram_id=None, activo=True, codigo=None):
    vinculo = MagicMock(spec=VinculoTelegram)
    vinculo.id = uuid.uuid4()
    vinculo.usuario_id = usuario_id
    vinculo.telegram_id = telegram_id
    vinculo.telegram_username = "test_user" if telegram_id else None
    vinculo.activo = activo
    vinculo.codigo_vinculacion = codigo
    vinculo.codigo_expira_en = (
        datetime.now(timezone.utc) + timedelta(minutes=10) if codigo else None
    )
    vinculo.creado_en = datetime.now(timezone.utc)
    return vinculo


# ── Fixtures ───────────────────────────────────────────────────


@pytest.fixture
def redis_falso():
    almacen = {}
    redis = AsyncMock()

    async def fake_get(clave):
        return almacen.get(clave)

    async def fake_set(clave, valor):
        almacen[clave] = valor

    async def fake_setex(clave, ttl, valor):
        almacen[clave] = valor

    async def fake_exists(clave):
        return 1 if clave in almacen else 0

    redis.get = AsyncMock(side_effect=fake_get)
    redis.set = AsyncMock(side_effect=fake_set)
    redis.setex = AsyncMock(side_effect=fake_setex)
    redis.exists = AsyncMock(side_effect=fake_exists)
    redis._almacen = almacen
    return redis


@pytest.fixture
def db_falsa():
    sesion = AsyncMock()
    sesion.add = MagicMock()
    sesion.commit = AsyncMock()
    sesion.refresh = AsyncMock()
    sesion.execute = AsyncMock()
    return sesion


@pytest.fixture
def app_test(redis_falso, db_falsa):
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
    transport = ASGITransport(app=app_test)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac


# ── Tests: POST /oraculo/generar-codigo ───────────────────────


class TestGenerarCodigo:
    """Tests de POST /oraculo/generar-codigo."""

    @pytest.mark.asyncio
    @patch("app.rutas.v1.oraculo.RepositorioTelegram")
    @patch("app.dependencias_suscripcion.RepositorioPlan")
    @patch("app.dependencias_suscripcion.RepositorioSuscripcion")
    @patch("app.dependencias_auth.RepositorioUsuario")
    async def test_generar_codigo_exitoso(
        self, MockRepoAuth, MockRepoSus, MockRepoPlan, MockRepoTg, cliente, redis_falso
    ):
        uid = uuid.uuid4()
        usuario = _crear_usuario_mock(uid=uid)
        MockRepoAuth.return_value.obtener_por_id = AsyncMock(return_value=usuario)

        plan = _crear_plan_mock(slug="premium")
        sus = _crear_suscripcion_mock(uid, plan.id)
        MockRepoSus.return_value.obtener_activa = AsyncMock(return_value=sus)
        MockRepoPlan.return_value.obtener_por_id = AsyncMock(return_value=plan)

        vinculo = _crear_vinculo_mock(uid, codigo="123456")
        MockRepoTg.return_value.crear_codigo_vinculacion = AsyncMock(return_value="123456")
        MockRepoTg.return_value.obtener_por_usuario_id = AsyncMock(return_value=vinculo)

        token = ServicioAuth.crear_token_acceso(uid, usuario.email)
        resp = await cliente.post(
            "/api/v1/oraculo/generar-codigo",
            headers={"Authorization": f"Bearer {token}"},
        )

        assert resp.status_code == 200
        cuerpo = resp.json()
        assert cuerpo["exito"] is True
        assert cuerpo["datos"]["codigo"] == "123456"
        assert cuerpo["datos"]["expira_en"] is not None

    @pytest.mark.asyncio
    async def test_generar_codigo_sin_auth(self, cliente):
        resp = await cliente.post("/api/v1/oraculo/generar-codigo")
        assert resp.status_code == 401

    @pytest.mark.asyncio
    @patch("app.dependencias_suscripcion.RepositorioPlan")
    @patch("app.dependencias_suscripcion.RepositorioSuscripcion")
    @patch("app.dependencias_auth.RepositorioUsuario")
    async def test_generar_codigo_sin_premium(
        self, MockRepoAuth, MockRepoSus, MockRepoPlan, cliente, redis_falso
    ):
        uid = uuid.uuid4()
        usuario = _crear_usuario_mock(uid=uid)
        MockRepoAuth.return_value.obtener_por_id = AsyncMock(return_value=usuario)

        plan = _crear_plan_mock(slug="gratis")
        sus = _crear_suscripcion_mock(uid, plan.id)
        MockRepoSus.return_value.obtener_activa = AsyncMock(return_value=sus)
        MockRepoPlan.return_value.obtener_por_id = AsyncMock(return_value=plan)

        token = ServicioAuth.crear_token_acceso(uid, usuario.email)
        resp = await cliente.post(
            "/api/v1/oraculo/generar-codigo",
            headers={"Authorization": f"Bearer {token}"},
        )

        assert resp.status_code == 403


# ── Tests: GET /oraculo/vinculacion ───────────────────────────


class TestEstadoVinculacion:
    """Tests de GET /oraculo/vinculacion."""

    @pytest.mark.asyncio
    @patch("app.rutas.v1.oraculo.RepositorioTelegram")
    @patch("app.dependencias_auth.RepositorioUsuario")
    async def test_vinculado(self, MockRepoAuth, MockRepoTg, cliente, redis_falso):
        uid = uuid.uuid4()
        usuario = _crear_usuario_mock(uid=uid)
        MockRepoAuth.return_value.obtener_por_id = AsyncMock(return_value=usuario)

        vinculo = _crear_vinculo_mock(uid, telegram_id=123456789, activo=True)
        MockRepoTg.return_value.obtener_por_usuario_id = AsyncMock(return_value=vinculo)

        token = ServicioAuth.crear_token_acceso(uid, usuario.email)
        resp = await cliente.get(
            "/api/v1/oraculo/vinculacion",
            headers={"Authorization": f"Bearer {token}"},
        )

        assert resp.status_code == 200
        datos = resp.json()["datos"]
        assert datos["vinculado"] is True
        assert datos["telegram_username"] == "test_user"

    @pytest.mark.asyncio
    @patch("app.rutas.v1.oraculo.RepositorioTelegram")
    @patch("app.dependencias_auth.RepositorioUsuario")
    async def test_no_vinculado(self, MockRepoAuth, MockRepoTg, cliente, redis_falso):
        uid = uuid.uuid4()
        usuario = _crear_usuario_mock(uid=uid)
        MockRepoAuth.return_value.obtener_por_id = AsyncMock(return_value=usuario)

        MockRepoTg.return_value.obtener_por_usuario_id = AsyncMock(return_value=None)

        token = ServicioAuth.crear_token_acceso(uid, usuario.email)
        resp = await cliente.get(
            "/api/v1/oraculo/vinculacion",
            headers={"Authorization": f"Bearer {token}"},
        )

        assert resp.status_code == 200
        datos = resp.json()["datos"]
        assert datos["vinculado"] is False
        assert datos["telegram_username"] is None

    @pytest.mark.asyncio
    async def test_vinculacion_sin_auth(self, cliente):
        resp = await cliente.get("/api/v1/oraculo/vinculacion")
        assert resp.status_code == 401


# ── Tests: DELETE /oraculo/desvincular ────────────────────────


class TestDesvincular:
    """Tests de DELETE /oraculo/desvincular."""

    @pytest.mark.asyncio
    @patch("app.rutas.v1.oraculo.RepositorioTelegram")
    @patch("app.dependencias_auth.RepositorioUsuario")
    async def test_desvincular_exitoso(self, MockRepoAuth, MockRepoTg, cliente, redis_falso):
        uid = uuid.uuid4()
        usuario = _crear_usuario_mock(uid=uid)
        MockRepoAuth.return_value.obtener_por_id = AsyncMock(return_value=usuario)

        MockRepoTg.return_value.desvincular = AsyncMock()

        token = ServicioAuth.crear_token_acceso(uid, usuario.email)
        resp = await cliente.delete(
            "/api/v1/oraculo/desvincular",
            headers={"Authorization": f"Bearer {token}"},
        )

        assert resp.status_code == 200
        assert resp.json()["exito"] is True
        MockRepoTg.return_value.desvincular.assert_called_once_with(uid)

    @pytest.mark.asyncio
    async def test_desvincular_sin_auth(self, cliente):
        resp = await cliente.delete("/api/v1/oraculo/desvincular")
        assert resp.status_code == 401
