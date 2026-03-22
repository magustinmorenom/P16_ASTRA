"""Servicio de geocodificación con Nominatim/OSM."""

from dataclasses import dataclass

from geopy.adapters import AioHTTPAdapter
from geopy.geocoders import Nominatim

from app.configuracion import obtener_configuracion
from app.excepciones import UbicacionNoEncontrada
from app.registro import logger


@dataclass
class ResultadoGeo:
    """Resultado de geocodificación."""
    latitud: float
    longitud: float
    direccion_completa: str


class ServicioGeo:
    """Servicio de geocodificación usando Nominatim."""

    _cache: dict[str, ResultadoGeo] = {}

    @classmethod
    async def geocodificar(cls, ciudad: str, pais: str) -> ResultadoGeo:
        """Geocodifica una ciudad/país a coordenadas.

        Usa cache en memoria para evitar llamadas repetidas.
        """
        clave = f"{ciudad.lower().strip()}|{pais.lower().strip()}"

        if clave in cls._cache:
            logger.debug("Cache hit geo: %s", clave)
            return cls._cache[clave]

        config = obtener_configuracion()
        consulta = f"{ciudad}, {pais}"

        async with Nominatim(
            user_agent=config.nominatim_user_agent,
            adapter_factory=AioHTTPAdapter,
            timeout=10,
        ) as geocodificador:
            ubicacion = await geocodificador.geocode(consulta)

        if ubicacion is None:
            raise UbicacionNoEncontrada(ciudad, pais)

        resultado = ResultadoGeo(
            latitud=ubicacion.latitude,
            longitud=ubicacion.longitude,
            direccion_completa=ubicacion.address,
        )

        cls._cache[clave] = resultado
        logger.info(
            "Geocodificado: %s → lat=%.4f, lon=%.4f",
            consulta,
            resultado.latitud,
            resultado.longitud,
        )
        return resultado
