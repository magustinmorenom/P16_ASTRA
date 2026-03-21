"""Rutas de carta natal."""

from fastapi import APIRouter, Depends
from redis.asyncio import Redis
from sqlalchemy.ext.asyncio import AsyncSession

from app.cache.gestor_cache import GestorCache
from app.datos.repositorio_calculo import RepositorioCalculo
from app.esquemas.entrada import DatosNacimiento
from app.nucleo.servicio_geo import ServicioGeo
from app.nucleo.servicio_zona_horaria import ServicioZonaHoraria
from app.principal import _obtener_db_placeholder, _obtener_redis_placeholder
from app.registro import logger
from app.servicios.servicio_astro import ServicioAstro
from app.utilidades.hash import generar_hash_parametros

router = APIRouter()

TIPO_CALCULO = "natal"


@router.post("/natal")
async def calcular_carta_natal(
    datos: DatosNacimiento,
    db: AsyncSession = Depends(_obtener_db_placeholder),
    redis: Redis = Depends(_obtener_redis_placeholder),
):
    """Calcula una carta natal completa.

    Flujo: hash → cache Redis → miss? → geocodificar → zona horaria → cálculo → cache + DB
    """
    # 1. Hash determinista de parámetros
    hash_params = generar_hash_parametros(
        tipo=TIPO_CALCULO,
        fecha=str(datos.fecha_nacimiento),
        hora=datos.hora_nacimiento,
        ciudad=datos.ciudad_nacimiento,
        pais=datos.pais_nacimiento,
        sistema_casas=datos.sistema_casas,
    )

    # 2. Buscar en cache Redis
    cache = GestorCache(redis)
    resultado_cache = await cache.obtener(hash_params)
    if resultado_cache is not None:
        return {"exito": True, "datos": resultado_cache, "cache": True}

    # 3. Calcular desde cero
    geo = await ServicioGeo.geocodificar(
        datos.ciudad_nacimiento,
        datos.pais_nacimiento,
    )

    fecha_utc, dia_juliano, zona = ServicioZonaHoraria.resolver_completo(
        datos.fecha_nacimiento,
        datos.hora_nacimiento,
        geo.latitud,
        geo.longitud,
    )

    carta = ServicioAstro.calcular_carta_natal(
        dia_juliano,
        geo.latitud,
        geo.longitud,
        datos.sistema_casas,
    )

    resultado = {
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
    }

    # 4. Guardar en cache Redis
    await cache.guardar(hash_params, resultado, TIPO_CALCULO)

    # 5. Persistir en DB (anónimo, sin perfil_id)
    try:
        repo = RepositorioCalculo(db)
        await repo.guardar(
            perfil_id=None,
            tipo=TIPO_CALCULO,
            hash_parametros=hash_params,
            resultado_json=resultado,
        )
    except Exception as e:
        logger.warning("Error persistiendo cálculo natal en DB: %s", e)

    return {"exito": True, "datos": resultado, "cache": False}
