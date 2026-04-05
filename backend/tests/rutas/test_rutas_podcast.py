"""Tests para las rutas de Podcasts Cósmicos."""

import uuid
from datetime import date, datetime, timezone
from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from httpx import ASGITransport, AsyncClient

from app.modelos.podcast import PodcastEpisodio
from app.modelos.usuario import Usuario
from app.principal import (
    _obtener_db_placeholder,
    _obtener_redis_placeholder,
    crear_aplicacion,
)
from app.servicios.servicio_auth import ServicioAuth


# ── Helpers ────────────────────────────────────────────────────


def _crear_usuario(uid=None, email="astro@test.com"):
    usuario = MagicMock(spec=Usuario)
    usuario.id = uid or uuid.uuid4()
    usuario.email = email
    usuario.nombre = "Astro"
    usuario.activo = True
    usuario.verificado = False
    usuario.proveedor_auth = "local"
    usuario.hash_contrasena = "hash"
    usuario.google_id = None
    usuario.ultimo_acceso = None
    usuario.creado_en = None
    return usuario


def _crear_episodio(
    uid=None,
    usuario_id=None,
    estado="listo",
    momento="dia",
    titulo="Cómo influyen hoy los tránsitos en vos — 23/03",
    guion="Texto del guión.",
    duracion=120.0,
    url_audio="podcasts/u/2026-03-23/dia.mp3",
):
    ep = MagicMock(spec=PodcastEpisodio)
    ep.id = uid or uuid.uuid4()
    ep.usuario_id = usuario_id or uuid.uuid4()
    ep.fecha = date(2026, 3, 23)
    ep.momento = momento
    ep.titulo = titulo
    ep.guion_md = guion
    ep.segmentos_json = [{"inicio_seg": 0, "fin_seg": 120, "texto": guion}]
    ep.duracion_segundos = duracion
    ep.url_audio = url_audio
    ep.estado = estado
    ep.error_detalle = None
    ep.tokens_usados = 500
    ep.creado_en = datetime.now(timezone.utc)
    return ep


def _plan_mock(slug="premium"):
    plan = MagicMock()
    plan.slug = slug
    return plan


def _sus_mock():
    sus = MagicMock()
    sus.plan_id = uuid.uuid4()
    return sus


# ── Fixtures ───────────────────────────────────────────────────


@pytest.fixture
def redis_falso():
    almacen = {}
    redis = AsyncMock()
    redis.get = AsyncMock(side_effect=lambda k: almacen.get(k))
    redis.set = AsyncMock(side_effect=lambda k, v: almacen.update({k: v}))
    redis.setex = AsyncMock(side_effect=lambda k, t, v: almacen.update({k: v}))
    redis.exists = AsyncMock(side_effect=lambda k: 1 if k in almacen else 0)
    return redis


@pytest.fixture
def db_falsa():
    return AsyncMock()


@pytest.fixture
def usuario_test():
    return _crear_usuario()


@pytest.fixture
def token_test(usuario_test):
    return ServicioAuth.crear_token_acceso(usuario_test.id, usuario_test.email)


@pytest.fixture
def app_test(db_falsa, redis_falso, usuario_test, token_test):
    app = crear_aplicacion()

    async def db_override():
        yield db_falsa

    async def redis_override():
        return redis_falso

    app.dependency_overrides[_obtener_db_placeholder] = db_override
    app.dependency_overrides[_obtener_redis_placeholder] = redis_override

    # Override dependencias.obtener_db también
    from app.dependencias import obtener_db, obtener_redis
    app.dependency_overrides[obtener_db] = db_override
    app.dependency_overrides[obtener_redis] = redis_override

    return app


@pytest.fixture
def headers_auth(token_test):
    return {"Authorization": f"Bearer {token_test}"}


# Parches comunes para auth + suscripción premium
def _patches_premium():
    """Retorna context managers para auth + plan premium."""
    return (
        patch("app.dependencias_auth.RepositorioUsuario"),
        patch("app.dependencias_suscripcion.RepositorioSuscripcion"),
        patch("app.dependencias_suscripcion.RepositorioPlan"),
    )


def _setup_premium(MockRepoUser, MockRepoSus, MockRepoPlan, usuario_test):
    """Configura mocks para un usuario premium autenticado."""
    mock_user_repo = MockRepoUser.return_value
    mock_user_repo.obtener_por_id = AsyncMock(return_value=usuario_test)

    mock_sus_repo = MockRepoSus.return_value
    mock_sus_repo.obtener_activa = AsyncMock(return_value=_sus_mock())

    mock_plan_repo = MockRepoPlan.return_value
    mock_plan_repo.obtener_por_id = AsyncMock(return_value=_plan_mock("premium"))


# ── GET /podcast/hoy ──────────────────────────────────────────


class TestPodcastHoy:
    """Tests para GET /podcast/hoy."""

    @pytest.mark.anyio
    async def test_retorna_episodios_existentes(
        self, app_test, headers_auth, usuario_test
    ):
        ep_dia = _crear_episodio(usuario_id=usuario_test.id, momento="dia")

        with (
            patch("app.rutas.v1.podcast.RepositorioPodcast") as MockRepo,
            patch("app.dependencias_auth.RepositorioUsuario") as MockRepoUser,
            patch("app.dependencias_suscripcion.RepositorioSuscripcion") as MockRepoSus,
            patch("app.dependencias_suscripcion.RepositorioPlan") as MockRepoPlan,
        ):
            _setup_premium(MockRepoUser, MockRepoSus, MockRepoPlan, usuario_test)

            mock_repo = MockRepo.return_value
            mock_repo.obtener_episodio = AsyncMock(
                side_effect=lambda uid, fecha, tipo: ep_dia if tipo == "dia" else None
            )

            async with AsyncClient(
                transport=ASGITransport(app=app_test),
                base_url="http://test",
            ) as ac:
                resp = await ac.get("/api/v1/podcast/hoy", headers=headers_auth)

            assert resp.status_code == 200
            datos = resp.json()
            assert datos["exito"] is True
            assert isinstance(datos["datos"], list)
            assert len(datos["datos"]) >= 1

    @pytest.mark.anyio
    async def test_sin_auth_retorna_401(self, app_test):
        async with AsyncClient(
            transport=ASGITransport(app=app_test),
            base_url="http://test",
        ) as ac:
            resp = await ac.get("/api/v1/podcast/hoy")

        assert resp.status_code == 401

    @pytest.mark.anyio
    async def test_plan_gratis_retorna_403(self, app_test, headers_auth, usuario_test):
        with (
            patch("app.dependencias_auth.RepositorioUsuario") as MockRepoUser,
            patch("app.dependencias_suscripcion.RepositorioSuscripcion") as MockRepoSus,
            patch("app.dependencias_suscripcion.RepositorioPlan") as MockRepoPlan,
        ):
            mock_user_repo = MockRepoUser.return_value
            mock_user_repo.obtener_por_id = AsyncMock(return_value=usuario_test)

            mock_sus_repo = MockRepoSus.return_value
            mock_sus_repo.obtener_activa = AsyncMock(return_value=_sus_mock())

            mock_plan_repo = MockRepoPlan.return_value
            mock_plan_repo.obtener_por_id = AsyncMock(return_value=_plan_mock("gratis"))

            async with AsyncClient(
                transport=ASGITransport(app=app_test),
                base_url="http://test",
            ) as ac:
                resp = await ac.get("/api/v1/podcast/hoy", headers=headers_auth)

            assert resp.status_code == 403


# ── POST /podcast/generar ─────────────────────────────────────


class TestPodcastGenerar:
    """Tests para POST /podcast/generar."""

    @pytest.mark.anyio
    async def test_tipo_invalido_retorna_422(
        self, app_test, headers_auth, usuario_test
    ):
        with (
            patch("app.dependencias_auth.RepositorioUsuario") as MockRepoUser,
            patch("app.dependencias_suscripcion.RepositorioSuscripcion") as MockRepoSus,
            patch("app.dependencias_suscripcion.RepositorioPlan") as MockRepoPlan,
        ):
            _setup_premium(MockRepoUser, MockRepoSus, MockRepoPlan, usuario_test)

            async with AsyncClient(
                transport=ASGITransport(app=app_test),
                base_url="http://test",
            ) as ac:
                resp = await ac.post(
                    "/api/v1/podcast/generar?tipo=invalido", headers=headers_auth
                )

            assert resp.status_code == 422

    @pytest.mark.anyio
    async def test_generar_retorna_episodio(
        self, app_test, headers_auth, usuario_test
    ):
        ep = _crear_episodio(usuario_id=usuario_test.id, estado="listo")

        with (
            patch("app.dependencias_auth.RepositorioUsuario") as MockRepoUser,
            patch("app.dependencias_suscripcion.RepositorioSuscripcion") as MockRepoSus,
            patch("app.dependencias_suscripcion.RepositorioPlan") as MockRepoPlan,
            patch("app.rutas.v1.podcast.ServicioPodcast") as MockServicio,
            patch("app.rutas.v1.podcast.RepositorioPodcast") as MockRepo,
        ):
            _setup_premium(MockRepoUser, MockRepoSus, MockRepoPlan, usuario_test)
            MockServicio.generar_episodio = AsyncMock(return_value=ep)
            MockRepo.return_value.normalizar_retencion_usuario = AsyncMock(return_value=0)

            async with AsyncClient(
                transport=ASGITransport(app=app_test),
                base_url="http://test",
            ) as ac:
                resp = await ac.post(
                    "/api/v1/podcast/generar?tipo=dia", headers=headers_auth
                )

            assert resp.status_code == 200
            datos = resp.json()
            assert datos["exito"] is True
            assert datos["datos"]["estado"] == "listo"
            assert datos["datos"]["titulo"] == ep.titulo
            MockRepo.return_value.normalizar_retencion_usuario.assert_awaited_once_with(
                usuario_test.id
            )


# ── GET /podcast/audio/{id} ───────────────────────────────────


class TestPodcastAudio:
    """Tests para GET /podcast/audio/{episodio_id}."""

    @pytest.mark.anyio
    async def test_retorna_audio_stream(
        self, app_test, headers_auth, usuario_test
    ):
        ep = _crear_episodio(usuario_id=usuario_test.id, estado="listo")
        audio_bytes = b"\xff\xfb\x90\x00" * 100  # bytes simulando MP3

        with (
            patch("app.dependencias_auth.RepositorioUsuario") as MockRepoUser,
            patch("app.dependencias_suscripcion.RepositorioSuscripcion") as MockRepoSus,
            patch("app.dependencias_suscripcion.RepositorioPlan") as MockRepoPlan,
            patch("app.rutas.v1.podcast.RepositorioPodcast") as MockRepo,
            patch("app.rutas.v1.podcast.ServicioAlmacenamiento") as MockAlmacenamiento,
        ):
            _setup_premium(MockRepoUser, MockRepoSus, MockRepoPlan, usuario_test)

            mock_repo = MockRepo.return_value
            mock_repo.obtener_episodio_por_id = AsyncMock(return_value=ep)

            MockAlmacenamiento.obtener_objeto.return_value = audio_bytes

            async with AsyncClient(
                transport=ASGITransport(app=app_test),
                base_url="http://test",
            ) as ac:
                resp = await ac.get(
                    f"/api/v1/podcast/audio/{ep.id}", headers=headers_auth
                )

            assert resp.status_code == 200
            assert resp.headers["content-type"] == "audio/mpeg"
            assert resp.content == audio_bytes

    @pytest.mark.anyio
    async def test_audio_no_disponible_retorna_404(
        self, app_test, headers_auth, usuario_test
    ):
        ep = _crear_episodio(
            usuario_id=usuario_test.id, estado="generando_audio", url_audio=None
        )

        with (
            patch("app.dependencias_auth.RepositorioUsuario") as MockRepoUser,
            patch("app.dependencias_suscripcion.RepositorioSuscripcion") as MockRepoSus,
            patch("app.dependencias_suscripcion.RepositorioPlan") as MockRepoPlan,
            patch("app.rutas.v1.podcast.RepositorioPodcast") as MockRepo,
        ):
            _setup_premium(MockRepoUser, MockRepoSus, MockRepoPlan, usuario_test)

            mock_repo = MockRepo.return_value
            mock_repo.obtener_episodio_por_id = AsyncMock(return_value=ep)

            async with AsyncClient(
                transport=ASGITransport(app=app_test),
                base_url="http://test",
            ) as ac:
                resp = await ac.get(
                    f"/api/v1/podcast/audio/{ep.id}", headers=headers_auth
                )

            assert resp.status_code == 404

    @pytest.mark.anyio
    async def test_episodio_otro_usuario_retorna_404(
        self, app_test, headers_auth, usuario_test
    ):
        otro_uid = uuid.uuid4()
        ep = _crear_episodio(usuario_id=otro_uid, estado="listo")

        with (
            patch("app.dependencias_auth.RepositorioUsuario") as MockRepoUser,
            patch("app.dependencias_suscripcion.RepositorioSuscripcion") as MockRepoSus,
            patch("app.dependencias_suscripcion.RepositorioPlan") as MockRepoPlan,
            patch("app.rutas.v1.podcast.RepositorioPodcast") as MockRepo,
        ):
            _setup_premium(MockRepoUser, MockRepoSus, MockRepoPlan, usuario_test)

            mock_repo = MockRepo.return_value
            mock_repo.obtener_episodio_por_id = AsyncMock(return_value=ep)

            async with AsyncClient(
                transport=ASGITransport(app=app_test),
                base_url="http://test",
            ) as ac:
                resp = await ac.get(
                    f"/api/v1/podcast/audio/{ep.id}", headers=headers_auth
                )

            assert resp.status_code == 404


# ── GET /podcast/historial ────────────────────────────────────


class TestPodcastHistorial:
    """Tests para GET /podcast/historial."""

    @pytest.mark.anyio
    async def test_retorna_lista_episodios(
        self, app_test, headers_auth, usuario_test
    ):
        ep1 = _crear_episodio(usuario_id=usuario_test.id, momento="dia")
        ep2 = _crear_episodio(usuario_id=usuario_test.id, momento="semana")

        with (
            patch("app.dependencias_auth.RepositorioUsuario") as MockRepoUser,
            patch("app.dependencias_suscripcion.RepositorioSuscripcion") as MockRepoSus,
            patch("app.dependencias_suscripcion.RepositorioPlan") as MockRepoPlan,
            patch("app.rutas.v1.podcast.RepositorioPodcast") as MockRepo,
        ):
            _setup_premium(MockRepoUser, MockRepoSus, MockRepoPlan, usuario_test)

            mock_repo = MockRepo.return_value
            mock_repo.normalizar_retencion_usuario = AsyncMock(return_value=1)
            mock_repo.obtener_ultimos_episodios = AsyncMock(return_value=[ep1, ep2])

            async with AsyncClient(
                transport=ASGITransport(app=app_test),
                base_url="http://test",
            ) as ac:
                resp = await ac.get("/api/v1/podcast/historial", headers=headers_auth)

            assert resp.status_code == 200
            datos = resp.json()
            assert len(datos["datos"]) == 2
            mock_repo.normalizar_retencion_usuario.assert_awaited_once_with(
                usuario_test.id
            )
