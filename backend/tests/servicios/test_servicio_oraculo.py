"""Tests para ServicioOraculo — integración con Claude API."""

from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from app.servicios.servicio_oraculo import ServicioOraculo


class TestConstruirSystem:
    """Tests para la construcción del system prompt."""

    def test_system_sin_contexto(self):
        prompt = ServicioOraculo._construir_system()
        # El prompt base se carga + se agregan secciones de contexto al final
        assert "Contexto del Consultante" in prompt
        assert "No hay perfil cósmico disponible" in prompt
        assert "No hay datos de tránsitos disponibles" in prompt
        # Siempre inyecta fecha/hora actual
        assert "Momento de la Consulta" in prompt
        assert "Día de la semana" in prompt

    def test_system_con_perfil_cosmico(self):
        perfil = {
            "datos_personales": {
                "nombre": "María",
                "fecha_nacimiento": "1990-01-15",
                "hora_nacimiento": "14:30:00",
                "ciudad_nacimiento": "Buenos Aires",
                "pais_nacimiento": "Argentina",
            },
            "natal": {
                "planetas": [
                    {"nombre": "Sol", "signo": "Capricornio", "casa": 10},
                    {"nombre": "Luna", "signo": "Cáncer", "casa": 4},
                ],
                "casas": [{"signo": "Aries"}],
                "aspectos": [{"tipo": "conjunción"}],
            },
            "diseno_humano": {
                "tipo": "Generador",
                "autoridad": "Sacral",
                "perfil": "1/3",
                "estrategia": "Responder",
                "cruz_encarnacion": {"nombre": "Cruz del Ángulo Recto de la Esfinge"},
            },
            "numerologia": {
                "camino_de_vida": {"numero": 7, "descripcion": "Análisis, espiritualidad"},
                "expresion": {"numero": 3, "descripcion": "Creatividad, comunicación"},
            },
        }
        prompt = ServicioOraculo._construir_system(perfil_cosmico=perfil)
        assert "María" in prompt
        assert "1990-01-15" in prompt
        assert "Buenos Aires" in prompt
        assert "Sol en Capricornio" in prompt
        assert "Luna en Cáncer" in prompt
        assert "Ascendente en Aries" in prompt
        assert "Generador" in prompt
        assert "Sacral" in prompt
        assert "1/3" in prompt
        assert "Camino de Vida: 7" in prompt

    def test_system_con_transitos(self):
        transitos = {
            "planetas": [
                {"nombre": "Sol", "signo": "Aries", "grado_en_signo": 15.5, "retrogrado": False},
                {"nombre": "Mercurio", "signo": "Piscis", "grado_en_signo": 28.3, "retrogrado": True},
            ],
        }
        prompt = ServicioOraculo._construir_system(transitos=transitos)
        assert "15.5° Aries" in prompt
        assert "28.3° Piscis" in prompt
        assert "(R)" in prompt


class TestContextoTemporal:
    """Tests para la generación de contexto temporal."""

    def test_contexto_temporal_contiene_fecha(self):
        resultado = ServicioOraculo._generar_contexto_temporal()
        assert "Fecha:" in resultado
        assert "Hora (Argentina):" in resultado
        assert "Hora UTC:" in resultado
        assert "Día de la semana:" in resultado
        assert "Día del año:" in resultado

    def test_contexto_temporal_dia_en_español(self):
        resultado = ServicioOraculo._generar_contexto_temporal()
        dias_validos = [
            "lunes", "martes", "miércoles", "jueves",
            "viernes", "sábado", "domingo",
        ]
        assert any(dia in resultado for dia in dias_validos)

    def test_system_siempre_incluye_momento(self):
        prompt = ServicioOraculo._construir_system()
        assert "Momento de la Consulta" in prompt
        assert "Fecha:" in prompt


class TestResumirPerfil:
    """Tests para el resumen de perfil cósmico."""

    def test_perfil_vacio(self):
        resultado = ServicioOraculo._resumir_perfil({})
        assert resultado == "Perfil cósmico no disponible."

    def test_solo_datos_personales(self):
        perfil = {
            "datos_personales": {
                "nombre": "Juan",
                "fecha_nacimiento": "1985-06-20",
                "hora_nacimiento": "08:00:00",
                "ciudad_nacimiento": "Córdoba",
                "pais_nacimiento": "Argentina",
            },
        }
        resultado = ServicioOraculo._resumir_perfil(perfil)
        assert "Juan" in resultado
        assert "1985-06-20" in resultado
        assert "Córdoba" in resultado

    def test_perfil_natal_parcial(self):
        perfil = {
            "natal": {
                "planetas": [
                    {"nombre": "Sol", "signo": "Leo", "casa": 5},
                ],
                "casas": [],
                "aspectos": [],
            },
        }
        resultado = ServicioOraculo._resumir_perfil(perfil)
        assert "Sol en Leo" in resultado


class TestResumirTransitos:
    """Tests para el resumen de tránsitos."""

    def test_transitos_vacios(self):
        resultado = ServicioOraculo._resumir_transitos({})
        assert resultado == "Sin datos de tránsitos."

    def test_transitos_con_retrogrado(self):
        transitos = {
            "planetas": [
                {"nombre": "Saturno", "signo": "Piscis", "grado_en_signo": 12.4, "retrogrado": True},
            ],
        }
        resultado = ServicioOraculo._resumir_transitos(transitos)
        assert "Saturno" in resultado
        assert "12.4° Piscis" in resultado
        assert "(R)" in resultado

    def test_transitos_con_fase_lunar(self):
        transitos = {
            "planetas": [
                {"nombre": "Sol", "signo": "Aries", "longitud": 5.0, "grado_en_signo": 5.0, "retrogrado": False},
                {"nombre": "Luna", "signo": "Aries", "longitud": 8.0, "grado_en_signo": 8.0, "retrogrado": False},
            ],
        }
        resultado = ServicioOraculo._resumir_transitos(transitos)
        assert "Luna Nueva" in resultado

    def test_transitos_luna_llena(self):
        transitos = {
            "planetas": [
                {"nombre": "Sol", "signo": "Aries", "longitud": 10.0, "grado_en_signo": 10.0, "retrogrado": False},
                {"nombre": "Luna", "signo": "Libra", "longitud": 190.0, "grado_en_signo": 10.0, "retrogrado": False},
            ],
        }
        resultado = ServicioOraculo._resumir_transitos(transitos)
        assert "Luna Llena" in resultado

    def test_transitos_incluye_fecha_calculo(self):
        transitos = {
            "fecha_utc": "2026-03-23T12:00:00+00:00",
            "planetas": [
                {"nombre": "Marte", "signo": "Leo", "grado_en_signo": 20.0, "retrogrado": False},
            ],
        }
        resultado = ServicioOraculo._resumir_transitos(transitos)
        assert "2026-03-23" in resultado


class TestFormatearRespuestaChat:
    """Tests para el formateo corto del chatbot."""

    def test_formatea_respuesta_a_maximo_tres_lineas(self):
        texto = """# Consejo para hoy

        Manuel, hoy conviene bajar un cambio y ordenar lo que venís sintiendo.
        La Luna activa una energía de observación y eso combina bien con tu necesidad de claridad.
        Si podés, hacé una sola cosa importante y no te llenes de pendientes.
        También te puede servir hablar menos y escuchar más.
        """

        resultado = ServicioOraculo._formatear_respuesta_chat(texto)

        assert len(resultado.splitlines()) <= 3
        assert "#" not in resultado

    def test_respuesta_vacia_devuelve_fallback_corto(self):
        resultado = ServicioOraculo._formatear_respuesta_chat("   ")

        assert len(resultado.splitlines()) <= 3
        assert "Estoy acá." in resultado


class TestConsultar:
    """Tests para la consulta al oráculo (Claude API mockeada)."""

    @pytest.mark.asyncio
    @patch("app.servicios.servicio_oraculo.obtener_configuracion")
    async def test_sin_api_key(self, mock_config):
        config = MagicMock()
        config.anthropic_api_key = ""
        mock_config.return_value = config

        respuesta, tokens = await ServicioOraculo.consultar("Hola")
        assert "no está configurado" in respuesta
        assert tokens == 0

    @pytest.mark.asyncio
    @patch("app.servicios.servicio_oraculo.anthropic")
    @patch("app.servicios.servicio_oraculo.obtener_configuracion")
    async def test_consulta_exitosa(self, mock_config, mock_anthropic):
        config = MagicMock()
        config.anthropic_api_key = "test-key"
        config.anthropic_modelo = "claude-opus-4-6"
        mock_config.return_value = config

        # Mock de la respuesta de Claude
        mock_content = MagicMock()
        mock_content.text = "Las estrellas indican un buen momento para vos."
        mock_usage = MagicMock()
        mock_usage.input_tokens = 100
        mock_usage.output_tokens = 50
        mock_response = MagicMock()
        mock_response.content = [mock_content]
        mock_response.usage = mock_usage

        mock_cliente = AsyncMock()
        mock_cliente.messages.create = AsyncMock(return_value=mock_response)
        mock_anthropic.AsyncAnthropic.return_value = mock_cliente

        respuesta, tokens = await ServicioOraculo.consultar(
            mensaje_usuario="¿Cómo está mi energía hoy?",
            perfil_cosmico={"datos_personales": {"nombre": "Ana"}},
            transitos={"planetas": []},
        )

        assert respuesta == "Las estrellas indican un buen momento para vos."
        assert tokens == 150
        mock_cliente.messages.create.assert_called_once()

    @pytest.mark.asyncio
    @patch("app.servicios.servicio_oraculo.anthropic")
    @patch("app.servicios.servicio_oraculo.obtener_configuracion")
    async def test_consulta_con_historial(self, mock_config, mock_anthropic):
        config = MagicMock()
        config.anthropic_api_key = "test-key"
        config.anthropic_modelo = "claude-opus-4-6"
        mock_config.return_value = config

        mock_content = MagicMock()
        mock_content.text = "Respuesta con contexto."
        mock_usage = MagicMock()
        mock_usage.input_tokens = 200
        mock_usage.output_tokens = 80
        mock_response = MagicMock()
        mock_response.content = [mock_content]
        mock_response.usage = mock_usage

        mock_cliente = AsyncMock()
        mock_cliente.messages.create = AsyncMock(return_value=mock_response)
        mock_anthropic.AsyncAnthropic.return_value = mock_cliente

        historial = [
            {"rol": "user", "contenido": "Hola"},
            {"rol": "assistant", "contenido": "Bienvenida"},
        ]

        respuesta, tokens = await ServicioOraculo.consultar(
            mensaje_usuario="¿Qué más me decís?",
            historial=historial,
        )

        assert respuesta == "Respuesta con contexto."
        # Verificar que el historial se pasó correctamente
        llamada = mock_cliente.messages.create.call_args
        mensajes = llamada.kwargs["messages"]
        assert len(mensajes) == 3  # 2 historial + 1 actual
        assert mensajes[0]["role"] == "user"
        assert mensajes[1]["role"] == "assistant"
        assert mensajes[2]["content"] == "¿Qué más me decís?"
        assert llamada.kwargs["max_tokens"] == 220

    @pytest.mark.asyncio
    @patch("app.servicios.servicio_oraculo.anthropic")
    @patch("app.servicios.servicio_oraculo.obtener_configuracion")
    async def test_error_api(self, mock_config, mock_anthropic):
        import anthropic as anthropic_real

        config = MagicMock()
        config.anthropic_api_key = "test-key"
        config.anthropic_modelo = "claude-opus-4-6"
        mock_config.return_value = config

        # Usar la excepción real de anthropic para que el except la capture
        mock_anthropic.APIError = anthropic_real.APIError

        mock_response = MagicMock()
        mock_response.status_code = 500
        mock_response.headers = {}

        mock_cliente = AsyncMock()
        mock_cliente.messages.create = AsyncMock(
            side_effect=anthropic_real.APIStatusError(
                "Error de API", response=mock_response, body=None
            )
        )
        mock_anthropic.AsyncAnthropic.return_value = mock_cliente

        respuesta, tokens = await ServicioOraculo.consultar("Hola")
        assert "error" in respuesta.lower() or "disculpá" in respuesta.lower()
        assert tokens == 0
