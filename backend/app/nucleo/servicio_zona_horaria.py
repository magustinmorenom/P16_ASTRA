"""Servicio de zona horaria — resolución histórica correcta."""

from datetime import date, datetime, time

import pytz
import swisseph as swe
from timezonefinder import TimezoneFinder

from app.excepciones import ErrorZonaHoraria
from app.registro import logger

# Singleton del buscador de zonas horarias
_buscador_tz = TimezoneFinder()


class ServicioZonaHoraria:
    """Resuelve zonas horarias históricas y convierte a UTC/JD."""

    @staticmethod
    def obtener_zona_horaria(latitud: float, longitud: float) -> str:
        """Obtiene la zona horaria IANA para coordenadas dadas.

        Returns:
            Nombre IANA de la zona horaria (ej: "America/Argentina/Buenos_Aires")
        """
        zona = _buscador_tz.timezone_at(lat=latitud, lng=longitud)
        if zona is None:
            raise ErrorZonaHoraria(
                f"No se encontró zona horaria para lat={latitud}, lon={longitud}"
            )
        logger.debug("Zona horaria: lat=%.4f, lon=%.4f → %s", latitud, longitud, zona)
        return zona

    @staticmethod
    def convertir_a_utc(
        fecha: date,
        hora: time,
        nombre_zona: str,
    ) -> datetime:
        """Convierte fecha/hora local a UTC usando la zona horaria histórica.

        CRÍTICO: Usa pytz.localize() para respetar el offset UTC
        que estaba vigente en la fecha histórica, no el actual.
        """
        try:
            zona = pytz.timezone(nombre_zona)
        except pytz.exceptions.UnknownTimeZoneError:
            raise ErrorZonaHoraria(f"Zona horaria desconocida: {nombre_zona}")

        fecha_hora_local = datetime.combine(fecha, hora)

        # localize() aplica el offset correcto para esa fecha histórica
        fecha_hora_localizada = zona.localize(fecha_hora_local)
        fecha_hora_utc = fecha_hora_localizada.astimezone(pytz.UTC)

        logger.debug(
            "Conversión TZ: %s %s (%s) → %s UTC",
            fecha,
            hora,
            nombre_zona,
            fecha_hora_utc,
        )
        return fecha_hora_utc

    @staticmethod
    def calcular_dia_juliano(fecha_utc: datetime) -> float:
        """Convierte datetime UTC a día juliano usando Swiss Ephemeris.

        El día juliano es el sistema de referencia temporal para
        todos los cálculos astronómicos.
        """
        hora_decimal = (
            fecha_utc.hour
            + fecha_utc.minute / 60.0
            + fecha_utc.second / 3600.0
        )
        jd = swe.julday(
            fecha_utc.year,
            fecha_utc.month,
            fecha_utc.day,
            hora_decimal,
        )
        return jd

    @classmethod
    def resolver_completo(
        cls,
        fecha: date,
        hora_str: str,
        latitud: float,
        longitud: float,
    ) -> tuple[datetime, float, str]:
        """Pipeline completo: fecha+hora+coords → UTC + JD + zona.

        Returns:
            Tupla de (datetime_utc, dia_juliano, nombre_zona)
        """
        hora = time.fromisoformat(hora_str)
        nombre_zona = cls.obtener_zona_horaria(latitud, longitud)
        fecha_utc = cls.convertir_a_utc(fecha, hora, nombre_zona)
        dia_juliano = cls.calcular_dia_juliano(fecha_utc)
        return fecha_utc, dia_juliano, nombre_zona
