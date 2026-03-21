"""Rutas de tránsitos planetarios."""

from fastapi import APIRouter

from app.servicios.servicio_transitos import ServicioTransitos

router = APIRouter()


@router.get("/transits")
async def obtener_transitos():
    """Obtiene las posiciones actuales de todos los planetas."""
    transitos = ServicioTransitos.obtener_transitos_actuales()
    return {
        "exito": True,
        "datos": transitos,
    }
