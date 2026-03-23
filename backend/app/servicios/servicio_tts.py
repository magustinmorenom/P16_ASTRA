"""Servicio Text-to-Speech via Google Gemini API."""

import io
import wave

from google import genai
from google.genai import types

from app.configuracion import obtener_configuracion
from app.registro import logger


class ServicioTTS:
    """Genera audio desde texto usando Google Gemini TTS."""

    @classmethod
    async def generar_audio(cls, texto: str) -> tuple[bytes, float]:
        """Genera audio MP3 desde texto.

        Returns:
            (bytes_mp3, duracion_segundos)
        """
        config = obtener_configuracion()
        if not config.gemini_api_key:
            raise ValueError("GEMINI_API_KEY no configurada")

        cliente = genai.Client(api_key=config.gemini_api_key)

        respuesta = await cliente.aio.models.generate_content(
            model="gemini-2.5-flash-preview-tts",
            contents=texto,
            config=types.GenerateContentConfig(
                response_modalities=["AUDIO"],
                speech_config=types.SpeechConfig(
                    voice_config=types.VoiceConfig(
                        prebuilt_voice_config=types.PrebuiltVoiceConfig(
                            voice_name="Zephyr",
                        )
                    )
                ),
            ),
        )

        datos_audio = respuesta.candidates[0].content.parts[0].inline_data.data

        # Gemini retorna PCM raw — convertir a WAV y luego a MP3
        wav_bytes = cls._pcm_a_wav(datos_audio, sample_rate=24000)

        # Convertir WAV a MP3 con pydub
        mp3_bytes = cls._wav_a_mp3(wav_bytes)

        # Calcular duración desde los datos PCM (16-bit, 24kHz)
        num_muestras = len(datos_audio) // 2  # 16-bit = 2 bytes por muestra
        duracion = num_muestras / 24000.0

        logger.info("Audio TTS generado: %.1f segundos, %d bytes MP3", duracion, len(mp3_bytes))
        return mp3_bytes, duracion

    @staticmethod
    def _pcm_a_wav(pcm_data: bytes, sample_rate: int = 24000) -> bytes:
        """Convierte PCM raw 16-bit mono a WAV."""
        buffer = io.BytesIO()
        with wave.open(buffer, "wb") as wf:
            wf.setnchannels(1)
            wf.setsampwidth(2)  # 16-bit
            wf.setframerate(sample_rate)
            wf.writeframes(pcm_data)
        return buffer.getvalue()

    @staticmethod
    def _wav_a_mp3(wav_bytes: bytes) -> bytes:
        """Convierte WAV a MP3 usando pydub."""
        from pydub import AudioSegment

        audio = AudioSegment.from_wav(io.BytesIO(wav_bytes))
        buffer = io.BytesIO()
        audio.export(buffer, format="mp3", bitrate="128k")
        return buffer.getvalue()
