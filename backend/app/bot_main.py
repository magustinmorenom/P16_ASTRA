"""Entrypoint del bot de Telegram — Oráculo ASTRA.

Ejecutar con: python -m app.bot_main
"""

import asyncio
import os
import signal
import sys

import swisseph as swe
from redis.asyncio import Redis

from app.configuracion import obtener_configuracion
from app.datos.sesion import crear_motor_async, crear_sesion_factory
from app.registro import logger
from app.servicios.bot_telegram import BotTelegram


async def main() -> None:
    """Inicializa y ejecuta el bot de Telegram."""
    config = obtener_configuracion()

    if not config.telegram_bot_token:
        logger.error("TELEGRAM_BOT_TOKEN no configurado en .env")
        sys.exit(1)

    if not config.anthropic_api_key:
        logger.warning("ANTHROPIC_API_KEY no configurado — el oráculo no responderá")

    # Swiss Ephemeris
    ruta_efemerides = os.path.abspath(config.ephe_path)
    swe.set_ephe_path(ruta_efemerides)
    logger.info("Efemérides configuradas en: %s", ruta_efemerides)

    # Base de datos
    motor = crear_motor_async()
    sesion_factory = crear_sesion_factory(motor)
    logger.info("Motor de base de datos creado")

    # Redis
    redis = Redis.from_url(config.redis_url, decode_responses=True)
    logger.info("Conexión Redis establecida")

    # Bot
    bot = BotTelegram(sesion_factory=sesion_factory, redis=redis)

    # Señal de apagado
    parar = asyncio.Event()

    def _signal_handler():
        logger.info("Señal de apagado recibida")
        parar.set()

    loop = asyncio.get_running_loop()
    for sig in (signal.SIGINT, signal.SIGTERM):
        loop.add_signal_handler(sig, _signal_handler)

    try:
        await bot.iniciar_polling()
        logger.info("Bot Telegram Oráculo ASTRA iniciado correctamente")
        await parar.wait()
    finally:
        await bot.detener()
        await redis.close()
        await motor.dispose()
        swe.close()
        logger.info("Bot Telegram detenido")


if __name__ == "__main__":
    asyncio.run(main())
