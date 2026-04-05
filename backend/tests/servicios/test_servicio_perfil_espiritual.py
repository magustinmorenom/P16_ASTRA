"""Tests para el servicio de perfil espiritual."""

import uuid
from types import SimpleNamespace
from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from app.servicios.servicio_perfil_espiritual import ServicioPerfilEspiritual


def _respuesta_anthropic(texto: str, tokens_salida: int = 400):
    return SimpleNamespace(
        content=[SimpleNamespace(text=texto)],
        usage=SimpleNamespace(input_tokens=120, output_tokens=tokens_salida),
    )


class TestParsearRespuestaModelo:
    def test_extrae_json_de_bloque_markdown(self):
        texto = """```json
        {"resumen":"ok","foda":{"fortalezas":[],"oportunidades":[],"debilidades":[],"amenazas":[]}}
        ```"""

        resultado = ServicioPerfilEspiritual._parsear_respuesta_modelo(texto)

        assert resultado["resumen"] == "ok"
        assert resultado["foda"]["fortalezas"] == []

    def test_extrae_json_con_texto_extra(self):
        texto = """
        Acá va tu resultado:
        {"resumen":"ok","foda":{"fortalezas":[],"oportunidades":[],"debilidades":[],"amenazas":[]}}
        Gracias.
        """

        resultado = ServicioPerfilEspiritual._parsear_respuesta_modelo(texto)

        assert resultado["resumen"] == "ok"


class TestGenerarPerfilEspiritual:
    @pytest.mark.asyncio
    @patch("app.servicios.servicio_consumo_api.registrar_consumo", new_callable=AsyncMock)
    @patch("app.servicios.servicio_perfil_espiritual.obtener_configuracion")
    @patch("app.servicios.servicio_perfil_espiritual.anthropic.AsyncAnthropic")
    async def test_reintenta_si_la_primera_respuesta_sale_truncada(
        self,
        MockAnthropic,
        mock_config,
        mock_registrar_consumo,
    ):
        config = MagicMock()
        config.anthropic_api_key = "test-key"
        config.oraculo_modelo = "claude-sonnet-4-6"
        mock_config.return_value = config

        cliente = MagicMock()
        cliente.messages.create = AsyncMock(
            side_effect=[
                _respuesta_anthropic('{"resumen":"cortado"', tokens_salida=2800),
                _respuesta_anthropic(
                    """{
                      "resumen": "Síntesis válida",
                      "foda": {
                        "fortalezas": [{"titulo": "F1", "descripcion": "D1"}],
                        "oportunidades": [{"titulo": "O1", "descripcion": "D2"}],
                        "debilidades": [{"titulo": "D1", "descripcion": "D3"}],
                        "amenazas": [{"titulo": "A1", "descripcion": "D4"}]
                      }
                    }""",
                    tokens_salida=900,
                ),
            ]
        )
        MockAnthropic.return_value = cliente

        sesion = AsyncMock()

        resultado = await ServicioPerfilEspiritual._generar(
            sesion=sesion,
            perfil_cosmico={},
            usuario_id=uuid.uuid4(),
        )

        assert resultado["resumen"] == "Síntesis válida"
        assert cliente.messages.create.await_count == 2
        assert mock_registrar_consumo.await_count == 2
