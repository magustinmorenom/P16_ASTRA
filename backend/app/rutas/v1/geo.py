"""Rutas de geocodificación — búsqueda de ciudades."""

from dataclasses import asdict

from fastapi import APIRouter, Query

from app.nucleo.servicio_geo import ServicioGeo

router = APIRouter(tags=["Geocodificación"])


@router.get("/geo/buscar")
async def buscar_ciudad(
    q: str = Query(..., min_length=3, max_length=100, description="Texto de búsqueda"),
    limite: int = Query(default=8, ge=1, le=15, description="Máximo de resultados"),
):
    """Busca ciudades por texto libre. Retorna coordenadas y zona horaria."""
    resultados = await ServicioGeo.buscar(q, limite)
    return {
        "exito": True,
        "datos": [asdict(r) for r in resultados],
    }
