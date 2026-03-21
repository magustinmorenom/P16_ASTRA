"""Rutas de Diseño Humano."""

from fastapi import APIRouter

from app.esquemas.entrada import DatosNacimiento
from app.nucleo.servicio_geo import ServicioGeo
from app.nucleo.servicio_zona_horaria import ServicioZonaHoraria
from app.servicios.servicio_diseno_humano import ServicioDisenoHumano

router = APIRouter()


@router.post("/human-design")
async def calcular_diseno_humano(datos: DatosNacimiento):
    """Calcula el Body Graph completo de Human Design."""
    # 1. Geocodificar
    geo = await ServicioGeo.geocodificar(
        datos.ciudad_nacimiento,
        datos.pais_nacimiento,
    )

    # 2. Resolver zona horaria y JD
    fecha_utc, dia_juliano, zona = ServicioZonaHoraria.resolver_completo(
        datos.fecha_nacimiento,
        datos.hora_nacimiento,
        geo.latitud,
        geo.longitud,
    )

    # 3. Calcular diseño completo
    diseno = ServicioDisenoHumano.calcular_diseno_completo(dia_juliano)

    return {
        "exito": True,
        "datos": {
            "nombre": datos.nombre,
            "fecha_nacimiento": str(datos.fecha_nacimiento),
            "hora_nacimiento": datos.hora_nacimiento,
            "ciudad": datos.ciudad_nacimiento,
            "pais": datos.pais_nacimiento,
            "latitud": round(geo.latitud, 4),
            "longitud": round(geo.longitud, 4),
            "zona_horaria": zona,
            **diseno,
        },
    }
