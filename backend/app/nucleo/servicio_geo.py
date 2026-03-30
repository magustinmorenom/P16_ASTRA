"""Servicio de geocodificación con Nominatim/OSM."""

import time
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


@dataclass
class ResultadoBusquedaGeo:
    """Resultado de búsqueda de geocodificación (múltiples resultados)."""
    nombre_mostrar: str
    ciudad: str
    estado: str
    pais: str
    latitud: float
    longitud: float
    zona_horaria: str


class ServicioGeo:
    """Servicio de geocodificación usando Nominatim."""

    _cache: dict[str, ResultadoGeo] = {}
    _cache_busqueda: dict[str, list[ResultadoBusquedaGeo]] = {}
    _ultimo_request: float = 0.0

    @classmethod
    async def _respetar_rate_limit(cls) -> None:
        """Espera mínimo 1 segundo entre requests a Nominatim."""
        ahora = time.monotonic()
        diferencia = ahora - cls._ultimo_request
        if diferencia < 1.0:
            import asyncio
            await asyncio.sleep(1.0 - diferencia)
        cls._ultimo_request = time.monotonic()

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

        await cls._respetar_rate_limit()

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

    @classmethod
    async def buscar(cls, consulta: str, limite: int = 8) -> list[ResultadoBusquedaGeo]:
        """Busca ubicaciones por texto libre. Retorna múltiples resultados.

        Usa cache en memoria y rate limit de 1 req/s a Nominatim.
        """
        from app.nucleo.servicio_zona_horaria import ServicioZonaHoraria

        clave = f"{consulta.lower().strip()}|{limite}"
        if clave in cls._cache_busqueda:
            logger.debug("Cache hit búsqueda geo: %s", clave)
            return cls._cache_busqueda[clave]

        config = obtener_configuracion()

        await cls._respetar_rate_limit()

        async with Nominatim(
            user_agent=config.nominatim_user_agent,
            adapter_factory=AioHTTPAdapter,
            timeout=10,
        ) as geocodificador:
            ubicaciones = await geocodificador.geocode(
                consulta,
                exactly_one=False,
                limit=limite,
                addressdetails=True,
            )

        if not ubicaciones:
            cls._cache_busqueda[clave] = []
            return []

        resultados: list[ResultadoBusquedaGeo] = []
        for ub in ubicaciones:
            addr = ub.raw.get("address", {})
            ciudad = (
                addr.get("city")
                or addr.get("town")
                or addr.get("village")
                or addr.get("municipality")
                or addr.get("state")
                or ""
            )
            estado = addr.get("state", "")
            pais = addr.get("country", "")

            # Armar nombre para mostrar
            partes = [p for p in [ciudad, estado, pais] if p]
            nombre_mostrar = ", ".join(dict.fromkeys(partes))  # eliminar duplicados

            try:
                zona = ServicioZonaHoraria.obtener_zona_horaria(
                    ub.latitude, ub.longitude
                )
            except Exception:
                zona = ""

            resultados.append(ResultadoBusquedaGeo(
                nombre_mostrar=nombre_mostrar,
                ciudad=ciudad,
                estado=estado,
                pais=pais,
                latitud=ub.latitude,
                longitud=ub.longitude,
                zona_horaria=zona,
            ))

        cls._cache_busqueda[clave] = resultados
        logger.info("Búsqueda geo '%s' → %d resultados", consulta, len(resultados))
        return resultados
