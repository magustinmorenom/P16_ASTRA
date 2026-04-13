"""Tests para el pipeline de accionables: extracción con IA, inyección y síntesis."""

import json
from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from app.servicios.servicio_podcast import ServicioPodcast
from app.servicios.servicio_pronostico import ServicioPronostico


# ---------------------------------------------------------------------------
# Tests: _extraer_acciones_con_ia
# ---------------------------------------------------------------------------

class TestExtraerAccionesConIA:
    """Verifica la extracción de acciones vía Claude Haiku."""

    @pytest.fixture
    def mock_sesion(self):
        return AsyncMock()

    @pytest.fixture
    def acciones_ejemplo(self):
        return [
            {"bloque": "manana", "accion": "Registrá qué proyectos te generan un sí visceral", "contexto": "Júpiter conjunción Sol"},
            {"bloque": "manana", "accion": "Evitá arrancar con tareas por obligación", "contexto": "Autoridad sacral"},
            {"bloque": "tarde", "accion": "Comunicá eso importante que venís postergando", "contexto": "Canal 17-62 activo"},
            {"bloque": "tarde", "accion": "Evitá decisiones financieras grandes", "contexto": "Mercurio en Piscis"},
            {"bloque": "noche", "accion": "Escribí brevemente qué se expandió hoy en vos", "contexto": "Júpiter sobre Sol natal"},
            {"bloque": "noche", "accion": "Cerrá pantallas temprano", "contexto": "Luna menguante"},
        ]

    @pytest.mark.asyncio
    async def test_extraccion_exitosa(self, mock_sesion, acciones_ejemplo):
        mock_respuesta = MagicMock()
        mock_respuesta.content = [MagicMock(text=json.dumps(acciones_ejemplo))]
        mock_respuesta.usage = MagicMock(input_tokens=500, output_tokens=200)

        with patch("app.servicios.servicio_podcast.obtener_configuracion") as mock_config, \
             patch("anthropic.AsyncAnthropic") as mock_anthropic, \
             patch("app.servicios.servicio_consumo_api.registrar_consumo", new_callable=AsyncMock):
            mock_config.return_value = MagicMock(
                anthropic_api_key="test-key",
                oraculo_modelo="claude-haiku-4-5-20251001",
            )
            mock_cliente = AsyncMock()
            mock_cliente.messages.create = AsyncMock(return_value=mock_respuesta)
            mock_anthropic.return_value = mock_cliente

            import uuid
            resultado = await ServicioPodcast._extraer_acciones_con_ia(
                mock_sesion, uuid.uuid4(), "Un guion de podcast de prueba."
            )

        assert resultado is not None
        assert len(resultado) == 6
        assert resultado[0]["bloque"] == "manana"
        assert resultado[3]["bloque"] == "tarde"

    @pytest.mark.asyncio
    async def test_sin_api_key_retorna_none(self, mock_sesion):
        with patch("app.servicios.servicio_podcast.obtener_configuracion") as mock_config:
            mock_config.return_value = MagicMock(anthropic_api_key="")

            import uuid
            resultado = await ServicioPodcast._extraer_acciones_con_ia(
                mock_sesion, uuid.uuid4(), "Un guion."
            )

        assert resultado is None

    @pytest.mark.asyncio
    async def test_guion_vacio_retorna_none(self, mock_sesion):
        resultado = await ServicioPodcast._extraer_acciones_con_ia(
            mock_sesion, __import__("uuid").uuid4(), ""
        )
        assert resultado is None


# ---------------------------------------------------------------------------
# Tests: _inyectar_acciones_podcast
# ---------------------------------------------------------------------------

class TestInyectarAccionesPodcast:
    """Verifica la inyección de acciones del podcast en momentos."""

    def test_inyeccion_basica(self):
        resultado = {
            "momentos": [
                {"bloque": "manana", "frase": "X", "accionables": []},
                {"bloque": "tarde", "frase": "Y", "accionables": []},
                {"bloque": "noche", "frase": "Z", "accionables": []},
            ]
        }
        acciones = [
            {"bloque": "manana", "accion": "Mandá el mail", "contexto": "Mercurio"},
            {"bloque": "manana", "accion": "Planificá el día", "contexto": "Sol"},
            {"bloque": "tarde", "accion": "Evitá firmar", "contexto": "Venus"},
            {"bloque": "noche", "accion": "Descansá", "contexto": "Luna"},
        ]
        res = ServicioPronostico._inyectar_acciones_podcast(resultado, acciones)
        assert len(res["momentos"][0]["accionables"]) == 2
        assert res["momentos"][0]["accionables"][0] == "Mandá el mail"
        assert len(res["momentos"][1]["accionables"]) == 1
        assert len(res["momentos"][2]["accionables"]) == 1

    def test_acciones_vacias_no_modifica(self):
        resultado = {
            "momentos": [
                {"bloque": "manana", "frase": "X", "accionables": ["Original"]},
            ]
        }
        res = ServicioPronostico._inyectar_acciones_podcast(resultado, [])
        assert res["momentos"][0]["accionables"] == ["Original"]

    def test_sintetiza_acciones_largas(self):
        resultado = {
            "momentos": [
                {"bloque": "manana", "frase": "X", "accionables": []},
            ]
        }
        texto_largo = "Mandá ese mail pendiente que venís postergando desde la semana pasada antes de las 10 para liberar la cabeza y poder concentrarte en el proyecto"
        acciones = [{"bloque": "manana", "accion": texto_largo, "contexto": "X"}]
        res = ServicioPronostico._inyectar_acciones_podcast(resultado, acciones)
        accion_resultado = res["momentos"][0]["accionables"][0]
        assert len(accion_resultado) <= 115  # ~110 + "…"


# ---------------------------------------------------------------------------
# Tests: _sintetizar_accion
# ---------------------------------------------------------------------------

class TestSintetizarAccion:
    """Verifica el truncado inteligente de acciones."""

    def test_accion_corta_no_se_modifica(self):
        assert ServicioPronostico._sintetizar_accion("Mandá el mail") == "Mandá el mail"

    def test_accion_larga_se_trunca(self):
        texto = "Mandá ese mail pendiente que venís postergando desde la semana pasada antes de las 10 para liberar la cabeza y poder concentrarte en el proyecto principal"
        resultado = ServicioPronostico._sintetizar_accion(texto)
        assert len(resultado) <= 115
        assert resultado.endswith("…")

    def test_accion_vacia(self):
        assert ServicioPronostico._sintetizar_accion("") == ""
        assert ServicioPronostico._sintetizar_accion(None) == ""
