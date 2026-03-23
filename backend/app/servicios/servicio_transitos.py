"""Servicio de tránsitos planetarios en tiempo real."""

from datetime import datetime, date, timedelta

import pytz
import swisseph as swe

from app.nucleo.servicio_efemerides import ServicioEfemerides
from app.nucleo.servicio_zona_horaria import ServicioZonaHoraria
from app.servicios.servicio_astro import ServicioAstro
from app.utilidades.constantes import ASPECTOS
from app.utilidades.convertidores import diferencia_angular


class ServicioTransitos:
    """Calcula posiciones planetarias actuales y aspectos con carta natal."""

    @classmethod
    def obtener_transitos_actuales(cls) -> dict:
        """Obtiene las posiciones actuales de todos los planetas."""
        ahora = datetime.now(pytz.UTC)
        jd_ahora = ServicioZonaHoraria.calcular_dia_juliano(ahora)

        planetas = ServicioEfemerides.calcular_todos_los_planetas(jd_ahora)

        return {
            "fecha_utc": ahora.isoformat(),
            "dia_juliano": round(jd_ahora, 6),
            "planetas": [
                {
                    "nombre": p.nombre,
                    "longitud": round(p.longitud, 4),
                    "latitud": round(p.latitud, 4),
                    "signo": p.signo,
                    "grado_en_signo": round(p.grado_en_signo, 4),
                    "retrogrado": p.retrogrado,
                    "velocidad": round(p.velocidad, 4),
                }
                for p in planetas
            ],
        }

    @classmethod
    def calcular_aspectos_transito_natal(
        cls,
        dia_juliano_natal: float,
        latitud_natal: float,
        longitud_natal: float,
    ) -> dict:
        """Calcula aspectos entre tránsitos actuales y carta natal.

        Args:
            dia_juliano_natal: JD del nacimiento
            latitud_natal: Latitud del nacimiento
            longitud_natal: Longitud del nacimiento

        Returns:
            Tránsitos actuales + aspectos con la carta natal
        """
        transitos = cls.obtener_transitos_actuales()

        # Obtener posiciones natales
        planetas_natales = ServicioEfemerides.calcular_todos_los_planetas(dia_juliano_natal)

        aspectos = []
        for pt in transitos["planetas"]:
            for pn in planetas_natales:
                diff = diferencia_angular(pt["longitud"], pn.longitud)
                for nombre, config in ASPECTOS.items():
                    orbe = abs(diff - config["angulo"])
                    if orbe <= config["orbe"]:
                        aspectos.append({
                            "planeta_transito": pt["nombre"],
                            "planeta_natal": pn.nombre,
                            "tipo": nombre,
                            "angulo": round(diff, 4),
                            "orbe": round(orbe, 4),
                        })

        transitos["aspectos_natal"] = aspectos
        return transitos

    @classmethod
    def obtener_transitos_fecha(cls, fecha: str) -> dict:
        """Obtiene las posiciones planetarias para una fecha específica a mediodía UTC.

        Args:
            fecha: Fecha en formato YYYY-MM-DD

        Returns:
            Dict con fecha, fecha_utc, dia_juliano y planetas
        """
        fecha_obj = date.fromisoformat(fecha)
        mediodia_utc = datetime(
            fecha_obj.year, fecha_obj.month, fecha_obj.day,
            12, 0, 0, tzinfo=pytz.UTC,
        )
        jd = ServicioZonaHoraria.calcular_dia_juliano(mediodia_utc)
        planetas = ServicioEfemerides.calcular_todos_los_planetas(jd)

        return {
            "fecha": fecha,
            "fecha_utc": mediodia_utc.isoformat(),
            "dia_juliano": round(jd, 6),
            "planetas": [
                {
                    "nombre": p.nombre,
                    "longitud": round(p.longitud, 4),
                    "latitud": round(p.latitud, 4),
                    "signo": p.signo,
                    "grado_en_signo": round(p.grado_en_signo, 4),
                    "retrogrado": p.retrogrado,
                    "velocidad": round(p.velocidad, 4),
                }
                for p in planetas
            ],
        }

    @classmethod
    def obtener_transitos_rango(cls, fecha_inicio: str, fecha_fin: str) -> dict:
        """Obtiene tránsitos para un rango de fechas (máximo 31 días).

        Args:
            fecha_inicio: Fecha inicio en formato YYYY-MM-DD
            fecha_fin: Fecha fin en formato YYYY-MM-DD

        Returns:
            Dict con fecha_inicio, fecha_fin y lista de días

        Raises:
            ValueError: Si el rango excede 31 días
        """
        inicio = date.fromisoformat(fecha_inicio)
        fin = date.fromisoformat(fecha_fin)
        cantidad_dias = (fin - inicio).days + 1

        if cantidad_dias > 31:
            raise ValueError("El rango no puede exceder 31 días")
        if cantidad_dias < 1:
            raise ValueError("La fecha de inicio debe ser anterior o igual a la fecha de fin")

        dias = []
        fecha_actual = inicio
        while fecha_actual <= fin:
            dia = cls.obtener_transitos_fecha(fecha_actual.isoformat())
            dias.append(dia)
            fecha_actual += timedelta(days=1)

        return {
            "fecha_inicio": fecha_inicio,
            "fecha_fin": fecha_fin,
            "dias": dias,
        }
