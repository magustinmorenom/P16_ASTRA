"""Tests para RepositorioConversacion — foco en el corte de día del chat web."""

import uuid
from datetime import datetime, timedelta, timezone
from unittest.mock import AsyncMock, MagicMock
from zoneinfo import ZoneInfo

import pytest

from app.datos.repositorio_conversacion import (
    RepositorioConversacion,
    _dia_arg_de_iso,
)
from app.modelos.conversacion_oraculo import ConversacionOraculo


TZ_ARG = ZoneInfo("America/Argentina/Buenos_Aires")


def _iso(dt: datetime) -> str:
    return dt.isoformat()


def _conv_fake(mensajes: list[dict] | None) -> MagicMock:
    """Crea una conversación mock con los mensajes dados."""
    conv = MagicMock(spec=ConversacionOraculo)
    conv.id = uuid.uuid4()
    conv.usuario_id = uuid.uuid4()
    conv.canal = "web"
    conv.activa = True
    conv.mensajes = mensajes or []
    return conv


def _sesion_con_conversacion(conv: ConversacionOraculo | None) -> AsyncMock:
    """Sesión async mock que devuelve `conv` al primer execute()."""
    sesion = AsyncMock()
    sesion.add = MagicMock()
    sesion.commit = AsyncMock()
    sesion.refresh = AsyncMock()

    resultado = MagicMock()
    resultado.scalar_one_or_none = MagicMock(return_value=conv)
    sesion.execute = AsyncMock(return_value=resultado)
    return sesion


class TestDiaArgDeIso:
    def test_devuelve_none_si_vacio(self):
        assert _dia_arg_de_iso(None) is None
        assert _dia_arg_de_iso("") is None

    def test_iso_utc_se_convierte_a_arg(self):
        # 2026-04-11T02:30:00Z → en ARG (UTC-3) es 2026-04-10
        resultado = _dia_arg_de_iso("2026-04-11T02:30:00Z")
        assert resultado.isoformat() == "2026-04-10"

    def test_iso_con_offset_explicito(self):
        resultado = _dia_arg_de_iso("2026-04-11T15:00:00+00:00")
        assert resultado.isoformat() == "2026-04-11"

    def test_iso_invalido_devuelve_none(self):
        assert _dia_arg_de_iso("no-es-una-fecha") is None


class TestObtenerOCrearWebCorteDeDia:
    @pytest.mark.asyncio
    async def test_conv_con_mensaje_de_hoy_se_reutiliza(self):
        ahora_arg = datetime.now(TZ_ARG)
        conv = _conv_fake([
            {"rol": "user", "contenido": "hola", "fecha": _iso(ahora_arg)},
        ])
        sesion = _sesion_con_conversacion(conv)
        repo = RepositorioConversacion(sesion)

        resultado = await repo.obtener_o_crear_web(uuid.uuid4())

        assert resultado is conv
        assert conv.activa is True
        sesion.add.assert_not_called()

    @pytest.mark.asyncio
    async def test_conv_con_mensaje_de_ayer_se_desactiva_y_crea_nueva(self):
        ayer_arg = datetime.now(TZ_ARG) - timedelta(days=1)
        conv_vieja = _conv_fake([
            {"rol": "user", "contenido": "hola", "fecha": _iso(ayer_arg)},
        ])
        sesion = _sesion_con_conversacion(conv_vieja)
        repo = RepositorioConversacion(sesion)

        resultado = await repo.obtener_o_crear_web(uuid.uuid4())

        assert conv_vieja.activa is False
        assert resultado is not conv_vieja
        sesion.add.assert_called_once()
        agregada = sesion.add.call_args[0][0]
        assert agregada.canal == "web"
        assert agregada.mensajes == []

    @pytest.mark.asyncio
    async def test_conv_vacia_se_reutiliza_aunque_sea_vieja(self):
        """Una conv sin mensajes no tiene día de referencia; se reutiliza."""
        conv_vacia = _conv_fake([])
        sesion = _sesion_con_conversacion(conv_vacia)
        repo = RepositorioConversacion(sesion)

        resultado = await repo.obtener_o_crear_web(uuid.uuid4())

        assert resultado is conv_vacia
        assert conv_vacia.activa is True
        sesion.add.assert_not_called()

    @pytest.mark.asyncio
    async def test_sin_conversacion_previa_crea_una_nueva(self):
        sesion = _sesion_con_conversacion(None)
        repo = RepositorioConversacion(sesion)

        resultado = await repo.obtener_o_crear_web(uuid.uuid4())

        sesion.add.assert_called_once()
        assert resultado is not None
