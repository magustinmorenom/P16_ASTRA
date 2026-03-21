"""Rutas de revolución solar."""

from fastapi import APIRouter

from app.esquemas.entrada import DatosNacimiento
from app.nucleo.servicio_geo import ServicioGeo
from app.nucleo.servicio_zona_horaria import ServicioZonaHoraria
from app.servicios.servicio_retorno_solar import ServicioRetornoSolar

router = APIRouter()


@router.post("/solar-return/{anio}")
async def calcular_retorno_solar(anio: int, datos: DatosNacimiento):
    """Calcula la revolución solar para un año específico."""
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

    # 3. Calcular retorno solar
    retorno = ServicioRetornoSolar.calcular_retorno_solar(
        dia_juliano,
        anio,
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
            **retorno,
        },
    }
