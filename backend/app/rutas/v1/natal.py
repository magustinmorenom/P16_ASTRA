"""Rutas de carta natal."""

from fastapi import APIRouter

from app.esquemas.entrada import DatosNacimiento
from app.nucleo.servicio_geo import ServicioGeo
from app.nucleo.servicio_zona_horaria import ServicioZonaHoraria
from app.servicios.servicio_astro import ServicioAstro

router = APIRouter()


@router.post("/natal")
async def calcular_carta_natal(datos: DatosNacimiento):
    """Calcula una carta natal completa.

    Flujo: geocodificar → zona horaria → día juliano → cálculo astro
    """
    # 1. Geocodificar
    geo = await ServicioGeo.geocodificar(
        datos.ciudad_nacimiento,
        datos.pais_nacimiento,
    )

    # 2. Resolver zona horaria y convertir a UTC/JD
    fecha_utc, dia_juliano, zona = ServicioZonaHoraria.resolver_completo(
        datos.fecha_nacimiento,
        datos.hora_nacimiento,
        geo.latitud,
        geo.longitud,
    )

    # 3. Calcular carta natal
    carta = ServicioAstro.calcular_carta_natal(
        dia_juliano,
        geo.latitud,
        geo.longitud,
        datos.sistema_casas,
    )

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
            "dia_juliano": round(dia_juliano, 6),
            **carta,
        },
    }
