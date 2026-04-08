"""Servicio Text-to-Speech via Google Gemini API."""

import asyncio
import io
import wave

from google import genai
from google.genai import types

from app.configuracion import obtener_configuracion
from app.registro import logger

# Máximo de caracteres por chunk para TTS paralelo
_MAX_CHARS_CHUNK = 900


class ServicioTTS:
    """Genera audio desde texto usando Google Gemini TTS."""

    @classmethod
    def _dividir_en_chunks(cls, texto: str) -> list[str]:
        """Divide el texto en chunks de ≤_MAX_CHARS_CHUNK chars, respetando párrafos.

        Si un párrafo supera el límite, lo corta en oraciones.
        """
        parrafos = [p.strip() for p in texto.split("\n\n") if p.strip()]
        chunks: list[str] = []
        buffer = ""

        for parrafo in parrafos:
            # Si el párrafo solo cabe en el buffer actual
            if len(buffer) + len(parrafo) + 2 <= _MAX_CHARS_CHUNK:
                buffer = (buffer + "\n\n" + parrafo).strip()
            else:
                # Volcar buffer si tiene contenido
                if buffer:
                    chunks.append(buffer)
                    buffer = ""

                # Si el párrafo es más largo que el límite, cortar por oraciones
                if len(parrafo) > _MAX_CHARS_CHUNK:
                    oraciones = parrafo.replace(". ", ".|").split("|")
                    sub_buffer = ""
                    for oracion in oraciones:
                        if len(sub_buffer) + len(oracion) + 1 <= _MAX_CHARS_CHUNK:
                            sub_buffer = (sub_buffer + " " + oracion).strip()
                        else:
                            if sub_buffer:
                                chunks.append(sub_buffer)
                            sub_buffer = oracion
                    if sub_buffer:
                        buffer = sub_buffer
                else:
                    buffer = parrafo

        if buffer:
            chunks.append(buffer)

        return chunks or [texto]

    @classmethod
    async def _generar_chunk(cls, cliente: genai.Client, texto: str) -> bytes:
        """Genera PCM raw para un chunk de texto."""
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
        return respuesta.candidates[0].content.parts[0].inline_data.data

    @classmethod
    async def generar_audio(cls, texto: str) -> tuple[bytes, float]:
        """Genera audio MP3 desde texto usando chunking paralelo.

        Divide el texto en chunks de ≤900 chars y los genera en paralelo,
        reduciendo el tiempo de espera para guiones largos.

        Returns:
            (bytes_mp3, duracion_segundos)
        """
        config = obtener_configuracion()
        if not config.gemini_api_key:
            raise ValueError("GEMINI_API_KEY no configurada")

        cliente = genai.Client(api_key=config.gemini_api_key)
        chunks = cls._dividir_en_chunks(texto)

        logger.info("TTS: %d chunks para %d chars", len(chunks), len(texto))

        # Generar todos los chunks en paralelo
        pcm_chunks: list[bytes] = await asyncio.gather(
            *[cls._generar_chunk(cliente, chunk) for chunk in chunks]
        )

        # Concatenar PCM raw (mismo formato: 16-bit mono 24kHz)
        pcm_total = b"".join(pcm_chunks)

        # PCM → WAV → MP3
        wav_bytes = cls._pcm_a_wav(pcm_total, sample_rate=24000)
        mp3_bytes = cls._wav_a_mp3(wav_bytes)

        num_muestras = len(pcm_total) // 2
        duracion = num_muestras / 24000.0

        logger.info(
            "Audio TTS generado: %.1f segundos, %d bytes MP3 (%d chunks paralelos)",
            duracion, len(mp3_bytes), len(chunks),
        )
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
