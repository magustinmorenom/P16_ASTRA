"""Configuración de logging estructurado."""

import logging
import sys

from app.configuracion import obtener_configuracion


def configurar_logging() -> logging.Logger:
    """Configura logging para la aplicación."""
    config = obtener_configuracion()

    formato = logging.Formatter(
        "%(asctime)s | %(levelname)-8s | %(name)s | %(message)s",
        datefmt="%Y-%m-%d %H:%M:%S",
    )

    handler = logging.StreamHandler(sys.stdout)
    handler.setFormatter(formato)

    logger = logging.getLogger("cosmic_engine")
    logger.setLevel(getattr(logging, config.log_level.upper(), logging.INFO))
    logger.addHandler(handler)
    logger.propagate = False

    return logger


logger = configurar_logging()
