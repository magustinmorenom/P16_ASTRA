"""Tests para el bootstrap automático del podcast del día."""

import uuid
from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from app.servicios import servicio_podcast_bootstrap
from app.servicios.servicio_podcast_bootstrap import (
    _bootstrap_en_curso,
    bootstrap_dia_podcast,
)


@pytest.fixture(autouse=True)
def _limpiar_guard():
    """Limpia el guard en memoria entre tests."""
    _bootstrap_en_curso.clear()
    yield
    _bootstrap_en_curso.clear()


def _motor_y_factory_mock(sesion_mock: AsyncMock):
    """Construye los mocks para crear_motor_async + crear_sesion_factory."""
    motor = AsyncMock()
    motor.dispose = AsyncMock()

    # factory() retorna un context manager async que da `sesion_mock`
    class _CM:
        async def __aenter__(self):
            return sesion_mock

        async def __aexit__(self, *args):
            return False

    factory = MagicMock(return_value=_CM())
    return motor, factory


@pytest.mark.asyncio
async def test_usuario_inactivo_skipea():
    usuario_id = uuid.uuid4()
    sesion = AsyncMock()

    usuario_mock = MagicMock()
    usuario_mock.activo = False

    repo_usuario = MagicMock()
    repo_usuario.obtener_por_id = AsyncMock(return_value=usuario_mock)

    motor, factory = _motor_y_factory_mock(sesion)

    with (
        patch("app.datos.sesion.crear_motor_async", return_value=motor),
        patch("app.datos.sesion.crear_sesion_factory", return_value=factory),
        patch(
            "app.datos.repositorio_usuario.RepositorioUsuario",
            return_value=repo_usuario,
        ),
        patch(
            "app.servicios.servicio_podcast.ServicioPodcast.generar_episodio"
        ) as generar_mock,
    ):
        await bootstrap_dia_podcast(usuario_id)

    generar_mock.assert_not_called()


@pytest.mark.asyncio
async def test_usuario_sin_suscripcion_skipea():
    usuario_id = uuid.uuid4()
    sesion = AsyncMock()

    usuario_mock = MagicMock()
    usuario_mock.activo = True

    repo_usuario = MagicMock()
    repo_usuario.obtener_por_id = AsyncMock(return_value=usuario_mock)

    repo_sus = MagicMock()
    repo_sus.obtener_activa = AsyncMock(return_value=None)

    motor, factory = _motor_y_factory_mock(sesion)

    with (
        patch("app.datos.sesion.crear_motor_async", return_value=motor),
        patch("app.datos.sesion.crear_sesion_factory", return_value=factory),
        patch(
            "app.datos.repositorio_usuario.RepositorioUsuario",
            return_value=repo_usuario,
        ),
        patch(
            "app.datos.repositorio_suscripcion.RepositorioSuscripcion",
            return_value=repo_sus,
        ),
        patch(
            "app.servicios.servicio_podcast.ServicioPodcast.generar_episodio"
        ) as generar_mock,
    ):
        await bootstrap_dia_podcast(usuario_id)

    generar_mock.assert_not_called()


@pytest.mark.asyncio
async def test_usuario_plan_gratis_skipea():
    usuario_id = uuid.uuid4()
    sesion = AsyncMock()

    usuario_mock = MagicMock()
    usuario_mock.activo = True
    suscripcion_mock = MagicMock()
    suscripcion_mock.plan_id = uuid.uuid4()
    plan_mock = MagicMock()
    plan_mock.slug = "gratis"

    repo_usuario = MagicMock()
    repo_usuario.obtener_por_id = AsyncMock(return_value=usuario_mock)
    repo_sus = MagicMock()
    repo_sus.obtener_activa = AsyncMock(return_value=suscripcion_mock)
    repo_plan = MagicMock()
    repo_plan.obtener_por_id = AsyncMock(return_value=plan_mock)

    motor, factory = _motor_y_factory_mock(sesion)

    with (
        patch("app.datos.sesion.crear_motor_async", return_value=motor),
        patch("app.datos.sesion.crear_sesion_factory", return_value=factory),
        patch(
            "app.datos.repositorio_usuario.RepositorioUsuario",
            return_value=repo_usuario,
        ),
        patch(
            "app.datos.repositorio_suscripcion.RepositorioSuscripcion",
            return_value=repo_sus,
        ),
        patch(
            "app.datos.repositorio_plan.RepositorioPlan", return_value=repo_plan
        ),
        patch(
            "app.servicios.servicio_podcast.ServicioPodcast.generar_episodio"
        ) as generar_mock,
    ):
        await bootstrap_dia_podcast(usuario_id)

    generar_mock.assert_not_called()


@pytest.mark.asyncio
async def test_usuario_sin_perfil_skipea():
    usuario_id = uuid.uuid4()
    sesion = AsyncMock()

    usuario_mock = MagicMock()
    usuario_mock.activo = True
    suscripcion_mock = MagicMock()
    suscripcion_mock.plan_id = uuid.uuid4()
    plan_mock = MagicMock()
    plan_mock.slug = "premium"

    repo_usuario = MagicMock()
    repo_usuario.obtener_por_id = AsyncMock(return_value=usuario_mock)
    repo_sus = MagicMock()
    repo_sus.obtener_activa = AsyncMock(return_value=suscripcion_mock)
    repo_plan = MagicMock()
    repo_plan.obtener_por_id = AsyncMock(return_value=plan_mock)
    repo_perfil = MagicMock()
    repo_perfil.obtener_por_usuario = AsyncMock(return_value=None)

    motor, factory = _motor_y_factory_mock(sesion)

    with (
        patch("app.datos.sesion.crear_motor_async", return_value=motor),
        patch("app.datos.sesion.crear_sesion_factory", return_value=factory),
        patch(
            "app.datos.repositorio_usuario.RepositorioUsuario",
            return_value=repo_usuario,
        ),
        patch(
            "app.datos.repositorio_suscripcion.RepositorioSuscripcion",
            return_value=repo_sus,
        ),
        patch(
            "app.datos.repositorio_plan.RepositorioPlan", return_value=repo_plan
        ),
        patch(
            "app.datos.repositorio_perfil.RepositorioPerfil",
            return_value=repo_perfil,
        ),
        patch(
            "app.servicios.servicio_podcast.ServicioPodcast.generar_episodio"
        ) as generar_mock,
    ):
        await bootstrap_dia_podcast(usuario_id)

    generar_mock.assert_not_called()


@pytest.mark.asyncio
async def test_usuario_premium_con_perfil_dispara_pipeline():
    usuario_id = uuid.uuid4()
    sesion = AsyncMock()

    usuario_mock = MagicMock()
    usuario_mock.activo = True
    suscripcion_mock = MagicMock()
    suscripcion_mock.plan_id = uuid.uuid4()
    plan_mock = MagicMock()
    plan_mock.slug = "premium"
    perfil_mock = MagicMock()

    repo_usuario = MagicMock()
    repo_usuario.obtener_por_id = AsyncMock(return_value=usuario_mock)
    repo_sus = MagicMock()
    repo_sus.obtener_activa = AsyncMock(return_value=suscripcion_mock)
    repo_plan = MagicMock()
    repo_plan.obtener_por_id = AsyncMock(return_value=plan_mock)
    repo_perfil = MagicMock()
    repo_perfil.obtener_por_usuario = AsyncMock(return_value=perfil_mock)

    motor, factory = _motor_y_factory_mock(sesion)
    generar_mock = AsyncMock(return_value=MagicMock())

    with (
        patch("app.datos.sesion.crear_motor_async", return_value=motor),
        patch("app.datos.sesion.crear_sesion_factory", return_value=factory),
        patch(
            "app.datos.repositorio_usuario.RepositorioUsuario",
            return_value=repo_usuario,
        ),
        patch(
            "app.datos.repositorio_suscripcion.RepositorioSuscripcion",
            return_value=repo_sus,
        ),
        patch(
            "app.datos.repositorio_plan.RepositorioPlan", return_value=repo_plan
        ),
        patch(
            "app.datos.repositorio_perfil.RepositorioPerfil",
            return_value=repo_perfil,
        ),
        patch(
            "app.servicios.servicio_podcast.ServicioPodcast.generar_episodio",
            generar_mock,
        ),
    ):
        await bootstrap_dia_podcast(usuario_id)

    generar_mock.assert_awaited_once()
    kwargs = generar_mock.await_args
    # Argumentos posicionales: (sesion, usuario_id, fecha, tipo)
    assert kwargs.args[1] == usuario_id
    assert kwargs.args[3] == "dia"
    assert kwargs.kwargs.get("origen") == "auto"


@pytest.mark.asyncio
async def test_guard_evita_disparo_duplicado_en_paralelo():
    """Si ya hay un bootstrap en curso para el mismo usuario, skipea."""
    usuario_id = uuid.uuid4()
    _bootstrap_en_curso.add(str(usuario_id))

    with patch(
        "app.servicios.servicio_podcast.ServicioPodcast.generar_episodio"
    ) as generar_mock:
        await bootstrap_dia_podcast(usuario_id)

    generar_mock.assert_not_called()
    # El guard no debe ser removido por una llamada que no fue la dueña.
    assert str(usuario_id) in _bootstrap_en_curso


@pytest.mark.asyncio
async def test_excepcion_en_pipeline_no_propaga():
    """Una excepción interna no debe romper el background task."""
    usuario_id = uuid.uuid4()

    with patch(
        "app.datos.sesion.crear_motor_async",
        side_effect=RuntimeError("boom"),
    ):
        # No debe lanzar
        await bootstrap_dia_podcast(usuario_id)

    # El guard queda limpio para permitir reintentos futuros
    assert str(usuario_id) not in _bootstrap_en_curso
