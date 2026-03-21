"""Rutas de numerología."""

from fastapi import APIRouter

from app.esquemas.entrada import DatosNumerologia
from app.servicios.servicio_numerologia import ServicioNumerologia

router = APIRouter()


@router.post("/numerology")
async def calcular_numerologia(datos: DatosNumerologia):
    """Calcula una carta numerológica completa."""
    carta = ServicioNumerologia.calcular_carta_completa(
        datos.nombre,
        datos.fecha_nacimiento,
        datos.sistema,
    )

    return {
        "exito": True,
        "datos": carta,
    }
