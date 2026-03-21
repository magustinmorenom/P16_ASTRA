"""Middleware para medir tiempo de respuesta."""

import time

from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response

from app.registro import logger


class MiddlewareTiempoRespuesta(BaseHTTPMiddleware):
    """Mide y registra el tiempo de cada request."""

    async def dispatch(self, request: Request, call_next) -> Response:
        inicio = time.perf_counter()
        respuesta = await call_next(request)
        duracion = time.perf_counter() - inicio

        respuesta.headers["X-Tiempo-Respuesta"] = f"{duracion:.4f}s"

        if duracion > 2.0:
            logger.warning(
                "Respuesta lenta: %s %s — %.2fs",
                request.method,
                request.url.path,
                duracion,
            )

        return respuesta
