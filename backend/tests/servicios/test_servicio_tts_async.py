"""Tests para ServicioTTS — generación de audio async via Gemini."""

from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from app.servicios.servicio_tts import ServicioTTS


class TestGenerarAudio:
    """Tests para ServicioTTS.generar_audio()."""

    @pytest.mark.anyio
    async def test_genera_audio_exitosamente(self):
        """Verifica que generar_audio retorna bytes MP3 y duración."""
        # PCM fake: 24000 muestras * 2 bytes = 48000 bytes = 1 segundo de audio 24kHz
        pcm_fake = b"\x00\x01" * 24000

        mock_part = MagicMock()
        mock_part.inline_data.data = pcm_fake

        mock_candidate = MagicMock()
        mock_candidate.content.parts = [mock_part]

        mock_respuesta = MagicMock()
        mock_respuesta.candidates = [mock_candidate]

        mock_models = MagicMock()
        mock_models.generate_content = AsyncMock(return_value=mock_respuesta)

        mock_aio = MagicMock()
        mock_aio.models = mock_models

        mock_cliente = MagicMock()
        mock_cliente.aio = mock_aio

        with patch("app.servicios.servicio_tts.genai") as mock_genai:
            mock_genai.Client.return_value = mock_cliente

            mp3_bytes, duracion = await ServicioTTS.generar_audio("Hola mundo")

        assert isinstance(mp3_bytes, bytes)
        assert len(mp3_bytes) > 0
        assert duracion == pytest.approx(1.0, abs=0.01)
        mock_models.generate_content.assert_awaited_once()

    @pytest.mark.anyio
    async def test_usa_modelo_tts_correcto(self):
        """Verifica que se usa el modelo gemini-2.5-flash-preview-tts."""
        pcm_fake = b"\x00\x01" * 24000

        mock_part = MagicMock()
        mock_part.inline_data.data = pcm_fake
        mock_candidate = MagicMock()
        mock_candidate.content.parts = [mock_part]
        mock_respuesta = MagicMock()
        mock_respuesta.candidates = [mock_candidate]

        mock_models = MagicMock()
        mock_models.generate_content = AsyncMock(return_value=mock_respuesta)
        mock_aio = MagicMock()
        mock_aio.models = mock_models
        mock_cliente = MagicMock()
        mock_cliente.aio = mock_aio

        with patch("app.servicios.servicio_tts.genai") as mock_genai:
            mock_genai.Client.return_value = mock_cliente

            await ServicioTTS.generar_audio("Test")

        call_kwargs = mock_models.generate_content.call_args
        assert call_kwargs.kwargs.get("model") == "gemini-2.5-flash-preview-tts"

    @pytest.mark.anyio
    async def test_sin_api_key_lanza_error(self):
        """Sin GEMINI_API_KEY debe lanzar ValueError."""
        with patch("app.servicios.servicio_tts.obtener_configuracion") as mock_config:
            mock_config.return_value.gemini_api_key = ""
            with pytest.raises(ValueError, match="GEMINI_API_KEY"):
                await ServicioTTS.generar_audio("Texto")

    @pytest.mark.anyio
    async def test_calcula_duracion_desde_pcm(self):
        """La duración se calcula como num_muestras / 24000."""
        # 48000 muestras = 2 segundos a 24kHz
        pcm_fake = b"\x00\x01" * 48000

        mock_part = MagicMock()
        mock_part.inline_data.data = pcm_fake
        mock_candidate = MagicMock()
        mock_candidate.content.parts = [mock_part]
        mock_respuesta = MagicMock()
        mock_respuesta.candidates = [mock_candidate]

        mock_models = MagicMock()
        mock_models.generate_content = AsyncMock(return_value=mock_respuesta)
        mock_aio = MagicMock()
        mock_aio.models = mock_models
        mock_cliente = MagicMock()
        mock_cliente.aio = mock_aio

        with patch("app.servicios.servicio_tts.genai") as mock_genai:
            mock_genai.Client.return_value = mock_cliente

            _, duracion = await ServicioTTS.generar_audio("Texto largo")

        assert duracion == pytest.approx(2.0, abs=0.01)


class TestMercadoPagoPreapprovalPlan:
    """Tests para el nuevo flujo de preapproval_plan de MercadoPago."""

    @pytest.mark.anyio
    async def test_crear_preapproval_usa_preapproval_plan(self):
        """Verifica que crear_preapproval llama a /preapproval_plan."""
        from app.servicios.servicio_mercadopago import ServicioMercadoPago

        respuesta_mp = {
            "id": "plan_123",
            "init_point": "https://mp.com/checkout?plan=123",
            "sandbox_init_point": "https://sandbox.mp.com/checkout?plan=123",
            "status": "active",
        }

        with patch("app.servicios.servicio_mercadopago.httpx.AsyncClient") as MockClient:
            mock_response = MagicMock()
            mock_response.status_code = 201
            mock_response.json.return_value = respuesta_mp

            mock_instance = AsyncMock()
            mock_instance.post = AsyncMock(return_value=mock_response)
            mock_instance.__aenter__ = AsyncMock(return_value=mock_instance)
            mock_instance.__aexit__ = AsyncMock(return_value=False)
            MockClient.return_value = mock_instance

            resultado = await ServicioMercadoPago.crear_preapproval(
                access_token="TEST-token",
                motivo="Plan Premium",
                monto=1000.0,
                moneda="ARS",
                email_pagador="test@test.com",
                referencia_externa="ref_123",
                url_retorno="https://app.com/exito",
            )

        # Verificar que se llamó a /preapproval_plan
        call_args = mock_instance.post.call_args
        assert "/preapproval_plan" in call_args.args[0]

        assert resultado["id"] == "plan_123"
        assert "init_point" in resultado
        assert resultado["external_reference"] == "ref_123"

    @pytest.mark.anyio
    async def test_crear_preapproval_incluye_billing_day(self):
        """El payload debe incluir billing_day en auto_recurring."""
        from app.servicios.servicio_mercadopago import ServicioMercadoPago

        with patch("app.servicios.servicio_mercadopago.httpx.AsyncClient") as MockClient:
            mock_response = MagicMock()
            mock_response.status_code = 201
            mock_response.json.return_value = {"id": "p", "status": "active"}

            mock_instance = AsyncMock()
            mock_instance.post = AsyncMock(return_value=mock_response)
            mock_instance.__aenter__ = AsyncMock(return_value=mock_instance)
            mock_instance.__aexit__ = AsyncMock(return_value=False)
            MockClient.return_value = mock_instance

            await ServicioMercadoPago.crear_preapproval(
                access_token="TEST",
                motivo="Premium",
                monto=500.0,
                moneda="ARS",
                email_pagador="t@t.com",
                referencia_externa="ref",
                url_retorno="https://app.com/ok",
            )

        payload = mock_instance.post.call_args.kwargs["json"]
        assert "billing_day" in payload["auto_recurring"]
        assert payload["auto_recurring"]["billing_day_proportional"] is True

    @pytest.mark.anyio
    async def test_error_mp_lanza_excepcion(self):
        """Si MP responde con error, se lanza ErrorPasarelaPago."""
        from app.excepciones import ErrorPasarelaPago
        from app.servicios.servicio_mercadopago import ServicioMercadoPago

        with patch("app.servicios.servicio_mercadopago.httpx.AsyncClient") as MockClient:
            mock_response = MagicMock()
            mock_response.status_code = 400
            mock_response.text = '{"message":"bad request"}'

            mock_instance = AsyncMock()
            mock_instance.post = AsyncMock(return_value=mock_response)
            mock_instance.__aenter__ = AsyncMock(return_value=mock_instance)
            mock_instance.__aexit__ = AsyncMock(return_value=False)
            MockClient.return_value = mock_instance

            with pytest.raises(ErrorPasarelaPago):
                await ServicioMercadoPago.crear_preapproval(
                    access_token="TEST",
                    motivo="Premium",
                    monto=500.0,
                    moneda="ARS",
                    email_pagador="t@t.com",
                    referencia_externa="ref",
                    url_retorno="https://app.com/ok",
                )

    @pytest.mark.anyio
    async def test_back_url_localhost_usa_placeholder(self):
        """Si url_retorno tiene localhost, usa URL de producción."""
        from app.servicios.servicio_mercadopago import ServicioMercadoPago

        with patch("app.servicios.servicio_mercadopago.httpx.AsyncClient") as MockClient:
            mock_response = MagicMock()
            mock_response.status_code = 201
            mock_response.json.return_value = {"id": "p", "status": "active"}

            mock_instance = AsyncMock()
            mock_instance.post = AsyncMock(return_value=mock_response)
            mock_instance.__aenter__ = AsyncMock(return_value=mock_instance)
            mock_instance.__aexit__ = AsyncMock(return_value=False)
            MockClient.return_value = mock_instance

            await ServicioMercadoPago.crear_preapproval(
                access_token="TEST",
                motivo="Premium",
                monto=500.0,
                moneda="ARS",
                email_pagador="t@t.com",
                referencia_externa="ref",
                url_retorno="http://localhost:3000/exito",
            )

        payload = mock_instance.post.call_args.kwargs["json"]
        assert "localhost" not in payload["back_url"]
        assert "cosmicengine" in payload["back_url"]
