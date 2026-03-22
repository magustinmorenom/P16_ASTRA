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


class ErrorAutenticacion(CosmicEngineError):
    """Credenciales inválidas."""

    def __init__(self, detalle: str = "Credenciales inválidas"):
        super().__init__(detalle, codigo=401)


class ErrorTokenInvalido(CosmicEngineError):
    """Token JWT inválido o expirado."""

    def __init__(self, detalle: str = "Token inválido o expirado"):
        super().__init__(detalle, codigo=401)


class ErrorAccesoDenegado(CosmicEngineError):
    """Acceso denegado al recurso."""

    def __init__(self, detalle: str = "No tiene permisos para acceder a este recurso"):
        super().__init__(detalle, codigo=403)


class UsuarioNoEncontrado(CosmicEngineError):
    """Usuario no encontrado."""

    def __init__(self, detalle: str = "Usuario no encontrado"):
        super().__init__(detalle, codigo=404)


class PlanNoEncontrado(CosmicEngineError):
    """Plan no encontrado."""

    def __init__(self, detalle: str = "Plan no encontrado"):
        super().__init__(detalle, codigo=404)


class SuscripcionNoEncontrada(CosmicEngineError):
    """Suscripción no encontrada."""

    def __init__(self, detalle: str = "Suscripción no encontrada"):
        super().__init__(detalle, codigo=404)


class LimiteExcedido(CosmicEngineError):
    """Límite del plan excedido."""

    def __init__(self, detalle: str = "Límite del plan excedido"):
        super().__init__(detalle, codigo=403)


class ErrorPasarelaPago(CosmicEngineError):
    """Error en la pasarela de pago (MercadoPago)."""

    def __init__(self, detalle: str = "Error en la pasarela de pago"):
        super().__init__(detalle, codigo=502)


class EmailYaRegistrado(CosmicEngineError):
    """El email ya está registrado."""

    def __init__(self, email: str):
        super().__init__(f"El email ya está registrado: {email}", codigo=409)


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
