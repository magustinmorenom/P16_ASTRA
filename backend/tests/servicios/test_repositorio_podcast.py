"""Tests para RepositorioPodcast."""

import uuid
from unittest.mock import AsyncMock, MagicMock

import pytest

from app.datos.repositorio_podcast import (
    LIMITE_HISTORIAL_PODCAST,
    RETENCION_EPISODIOS_PODCAST,
    RepositorioPodcast,
)


def _resultado_ids(ids):
    resultado = MagicMock()
    scalars = MagicMock()
    scalars.all.return_value = ids
    resultado.scalars.return_value = scalars
    return resultado


class TestNormalizarRetencionUsuario:
    """Tests para la purga por tipo del historial de podcasts."""

    @pytest.mark.anyio
    async def test_elimina_excedentes_por_tipo_y_hace_un_solo_commit(self):
        usuario_id = uuid.uuid4()
        ids_dia = [uuid.uuid4(), uuid.uuid4()]
        ids_semana = [uuid.uuid4()]
        sesion = AsyncMock()
        sesion.execute = AsyncMock(
            side_effect=[
                _resultado_ids(ids_dia),
                MagicMock(),
                _resultado_ids(ids_semana),
                MagicMock(),
                _resultado_ids([]),
            ]
        )
        sesion.commit = AsyncMock()

        repo = RepositorioPodcast(sesion)

        eliminados = await repo.normalizar_retencion_usuario(usuario_id)

        assert eliminados == 3
        assert sesion.commit.await_count == 1
        assert sesion.execute.await_count == 5

        stmt_dia = sesion.execute.await_args_list[0].args[0]
        stmt_semana = sesion.execute.await_args_list[2].args[0]
        stmt_mes = sesion.execute.await_args_list[4].args[0]

        assert stmt_dia.compile().params["momento_1"] == "dia"
        assert stmt_dia._offset_clause.value == RETENCION_EPISODIOS_PODCAST["dia"]
        assert stmt_semana.compile().params["momento_1"] == "semana"
        assert stmt_semana._offset_clause.value == RETENCION_EPISODIOS_PODCAST["semana"]
        assert stmt_mes.compile().params["momento_1"] == "mes"
        assert stmt_mes._offset_clause.value == RETENCION_EPISODIOS_PODCAST["mes"]

        assert "podcast_episodios.fecha DESC" in str(stmt_dia)
        assert "podcast_episodios.creado_en DESC" in str(stmt_dia)

    @pytest.mark.anyio
    async def test_no_hace_commit_si_no_hay_excedentes(self):
        sesion = AsyncMock()
        sesion.execute = AsyncMock(
            side_effect=[_resultado_ids([]), _resultado_ids([]), _resultado_ids([])]
        )
        sesion.commit = AsyncMock()

        repo = RepositorioPodcast(sesion)

        eliminados = await repo.normalizar_retencion_usuario(uuid.uuid4())

        assert eliminados == 0
        assert sesion.commit.await_count == 0
        assert sesion.execute.await_count == 3


def test_limite_historial_suma_todos_los_cupos():
    """El historial completo conserva 7 diarios, 4 semanales y 4 mensuales."""
    assert LIMITE_HISTORIAL_PODCAST == 15
