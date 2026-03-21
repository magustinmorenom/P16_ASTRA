"""Excepciones personalizadas de CosmicEngine."""

from fastapi import Request
from fastapi.responses import JSONResponse


class CosmicEngineError(Exception):
    """Error base de la aplicación."""

    def __init__(self, mensaje: str, codigo: int = 500):
        self.mensaje = mensaje
        self.codigo = codigo
        super().__init__(mensaje)


class UbicacionNoEncontrada(CosmicEngineError):
    """No se pudo geocodificar la ubicación."""

    def __init__(self, ciudad: str, pais: str):
        super().__init__(
            f"No se encontró la ubicación: {ciudad}, {pais}",
            codigo=404,
        )


class ErrorZonaHoraria(CosmicEngineError):
    """Error al resolver zona horaria."""

    def __init__(self, detalle: str):
        super().__init__(f"Error de zona horaria: {detalle}", codigo=400)


class ErrorCalculoEfemerides(CosmicEngineError):
    """Error en cálculo de efemérides."""

    def __init__(self, detalle: str):
        super().__init__(f"Error de efemérides: {detalle}", codigo=500)


class ErrorDatosEntrada(CosmicEngineError):
    """Datos de entrada inválidos."""

    def __init__(self, detalle: str):
        super().__init__(f"Datos inválidos: {detalle}", codigo=422)


class PerfilNoEncontrado(CosmicEngineError):
    """Perfil no encontrado en la base de datos."""

    def __init__(self, perfil_id: str):
        super().__init__(f"Perfil no encontrado: {perfil_id}", codigo=404)


async def manejar_error_cosmic(request: Request, exc: CosmicEngineError) -> JSONResponse:
    """Handler global para errores de CosmicEngine."""
    return JSONResponse(
        status_code=exc.codigo,
        content={
            "exito": False,
            "error": exc.__class__.__name__,
            "detalle": exc.mensaje,
        },
    )
