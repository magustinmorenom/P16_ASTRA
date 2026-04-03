"""Servicio de tracking de consumo de APIs externas.

Registra cada llamada a Anthropic, Gemini o Resend con tokens y costo estimado.
Diseñado para ser fire-and-forget: los errores se loguean sin afectar el flujo.
"""

import logging
import uuid

from sqlalchemy.ext.asyncio import AsyncSession

from app.modelos.registro_consumo_api import RegistroConsumoApi

logger = logging.getLogger(__name__)

# ── Precios por millón de tokens (USD centavos) ──────────────────
# Fuente: pricing pages de Anthropic y Google, abril 2026
PRECIOS: dict[str, dict[str, float]] = {
    # modelo: {input_por_millon, output_por_millon} en centavos USD
    "claude-opus-4-6": {"input": 1500, "output": 7500},
    "claude-sonnet-4-6": {"input": 300, "output": 1500},
    "claude-haiku-4-5-20251001": {"input": 80, "output": 400},
    # Gemini TTS: ~$0.01/1000 chars → se estima como tokens
    "gemini-2.5-flash-preview-tts": {"input": 1, "output": 4},
    # Resend: costo fijo por email
    "resend": {"fijo_centavos": 0.1},  # ~$0.001/email
}


def estimar_costo_centavos(
    modelo: str,
    tokens_entrada: int = 0,
    tokens_salida: int = 0,
) -> int:
    """Estima el costo en centavos USD basado en modelo y tokens."""
    precios = PRECIOS.get(modelo)
    if not precios:
        return 0

    if "fijo_centavos" in precios:
        return max(1, round(precios["fijo_centavos"]))

    costo_in = (tokens_entrada / 1_000_000) * precios.get("input", 0)
    costo_out = (tokens_salida / 1_000_000) * precios.get("output", 0)
    return max(1, round(costo_in + costo_out))


async def registrar_consumo(
    sesion: AsyncSession,
    *,
    usuario_id: uuid.UUID | None,
    servicio: str,
    operacion: str,
    tokens_entrada: int = 0,
    tokens_salida: int = 0,
    modelo: str | None = None,
    metadata_extra: dict | None = None,
) -> None:
    """Registra un consumo de API en la tabla de tracking.

    Fire-and-forget: loguea errores sin propagarlos.
    """
    try:
        costo = estimar_costo_centavos(
            modelo or servicio,
            tokens_entrada,
            tokens_salida,
        )

        registro = RegistroConsumoApi(
            usuario_id=usuario_id,
            servicio=servicio,
            operacion=operacion,
            tokens_entrada=tokens_entrada,
            tokens_salida=tokens_salida,
            costo_usd_centavos=costo,
            modelo=modelo,
            metadata_extra=metadata_extra,
        )
        sesion.add(registro)
        await sesion.commit()
    except Exception as e:
        logger.warning("Error registrando consumo API: %s", e)
        try:
            await sesion.rollback()
        except Exception:
            pass
