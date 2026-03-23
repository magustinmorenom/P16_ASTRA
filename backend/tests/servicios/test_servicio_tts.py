"""Tests para ServicioTTS."""

import io
import struct
import wave
from unittest.mock import MagicMock, patch

import pytest

from app.servicios.servicio_tts import ServicioTTS


class TestPCMaWAV:
    """Tests para la conversión PCM → WAV."""

    def test_genera_wav_valido(self):
        """PCM raw se convierte a WAV válido."""
        # 1 segundo de silencio a 24kHz, 16-bit mono
        num_muestras = 24000
        pcm_data = b"\x00\x00" * num_muestras
        wav_bytes = ServicioTTS._pcm_a_wav(pcm_data, sample_rate=24000)

        # Verificar que es WAV válido
        wav_io = io.BytesIO(wav_bytes)
        with wave.open(wav_io, "rb") as wf:
            assert wf.getnchannels() == 1
            assert wf.getsampwidth() == 2
            assert wf.getframerate() == 24000
            assert wf.getnframes() == num_muestras


class TestGenerarAudio:
    """Tests para generar_audio con mocks."""

    @pytest.mark.asyncio
    async def test_sin_api_key_lanza_error(self):
        """Sin GEMINI_API_KEY configurada, lanza ValueError."""
        with patch("app.servicios.servicio_tts.obtener_configuracion") as mock_config:
            mock_config.return_value = MagicMock(gemini_api_key="")
            with pytest.raises(ValueError, match="GEMINI_API_KEY"):
                await ServicioTTS.generar_audio("Hola mundo")
