"""Servicio de Revolución Solar."""

from app.nucleo.servicio_efemerides import ServicioEfemerides
from app.registro import logger
from app.servicios.servicio_astro import ServicioAstro
from app.utilidades.convertidores import diferencia_angular

import swisseph as swe


class ServicioRetornoSolar:
    """Calcula la Revolución Solar para un año dado."""

    @classmethod
    def calcular_retorno_solar(
        cls,
        dia_juliano_natal: float,
        anio: int,
        latitud: float,
        longitud: float,
        sistema_casas: str = "placidus",
    ) -> dict:
        """Calcula la revolución solar para un año específico.

        Busca el momento exacto en que el Sol vuelve a la posición natal.

        Args:
            dia_juliano_natal: JD del nacimiento
            anio: Año para el cual calcular la revolución
            latitud: Latitud del lugar
            longitud: Longitud del lugar
            sistema_casas: Sistema de casas

        Returns:
            Carta completa del retorno solar + comparativa
        """
        # Obtener longitud solar natal
        lon_sol_natal = ServicioEfemerides.obtener_longitud_solar(dia_juliano_natal)

        # Estimar JD para el retorno solar en el año dado
        # El retorno ocurre ~365.25 días después del nacimiento
        diferencia_anios = anio - cls._jd_a_anio(dia_juliano_natal)
        jd_estimado = dia_juliano_natal + (diferencia_anios * 365.25)

        # Búsqueda precisa
        jd_retorno = ServicioEfemerides.buscar_fecha_por_longitud_solar(
            lon_sol_natal, jd_estimado, precision=0.0001
        )

        # Verificar precisión
        lon_retorno = ServicioEfemerides.obtener_longitud_solar(jd_retorno)
        error = diferencia_angular(lon_sol_natal, lon_retorno)

        logger.info(
            "Retorno Solar %d: JD=%.6f, lon natal=%.4f°, lon retorno=%.4f°, error=%.6f°",
            anio, jd_retorno, lon_sol_natal, lon_retorno, error,
        )

        # Calcular carta completa para el momento del retorno
        carta_retorno = ServicioAstro.calcular_carta_natal(
            jd_retorno, latitud, longitud, sistema_casas
        )

        # Carta natal para comparación
        carta_natal = ServicioAstro.calcular_carta_natal(
            dia_juliano_natal, latitud, longitud, sistema_casas
        )

        # Aspectos entre tránsitos del retorno y natal
        aspectos_comparativos = cls._calcular_aspectos_comparativos(
            carta_retorno["planetas"], carta_natal["planetas"]
        )

        # Convertir JD a fecha legible
        fecha_retorno = swe.revjul(jd_retorno)

        return {
            "anio": anio,
            "dia_juliano_retorno": round(jd_retorno, 6),
            "fecha_retorno": {
                "anio": fecha_retorno[0],
                "mes": fecha_retorno[1],
                "dia": fecha_retorno[2],
                "hora_decimal": round(fecha_retorno[3], 4),
            },
            "longitud_sol_natal": round(lon_sol_natal, 4),
            "longitud_sol_retorno": round(lon_retorno, 4),
            "error_grados": round(error, 6),
            "carta_retorno": carta_retorno,
            "aspectos_natal_retorno": aspectos_comparativos,
        }

    @staticmethod
    def _jd_a_anio(jd: float) -> int:
        """Convierte JD a año calendario."""
        return swe.revjul(jd)[0]

    @staticmethod
    def _calcular_aspectos_comparativos(
        planetas_retorno: list[dict],
        planetas_natal: list[dict],
    ) -> list[dict]:
        """Calcula aspectos entre planetas del retorno y planetas natales."""
        from app.utilidades.constantes import ASPECTOS

        aspectos = []
        for pr in planetas_retorno:
            for pn in planetas_natal:
                diff = diferencia_angular(pr["longitud"], pn["longitud"])
                for nombre, config in ASPECTOS.items():
                    orbe = abs(diff - config["angulo"])
                    if orbe <= config["orbe"]:
                        aspectos.append({
                            "planeta_retorno": pr["nombre"],
                            "planeta_natal": pn["nombre"],
                            "tipo": nombre,
                            "angulo": round(diff, 4),
                            "orbe": round(orbe, 4),
                        })

        return aspectos
