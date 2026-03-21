"""Servicio de cálculo astrológico — carta natal completa."""

from app.nucleo.servicio_efemerides import ServicioEfemerides
from app.utilidades.constantes import (
    ASPECTOS,
    CAIDA,
    DOMICILIO,
    EXALTACION,
    EXILIO,
    IDS_TODOS_LOS_CUERPOS,
    SISTEMA_CASAS_PLACIDUS,
)
from app.utilidades.convertidores import (
    diferencia_angular,
    longitud_a_grado_en_signo,
    longitud_a_signo,
)


class ServicioAstro:
    """Calcula carta natal completa: planetas, casas, aspectos, dignidades."""

    SISTEMAS_CASAS = {
        "placidus": SISTEMA_CASAS_PLACIDUS,
        "koch": b"K",
        "regiomontanus": b"R",
        "whole_sign": b"W",
    }

    @classmethod
    def calcular_carta_natal(
        cls,
        dia_juliano: float,
        latitud: float,
        longitud: float,
        sistema_casas: str = "placidus",
    ) -> dict:
        """Calcula una carta natal completa.

        Args:
            dia_juliano: Día juliano en UTC
            latitud: Latitud geográfica
            longitud: Longitud geográfica
            sistema_casas: Sistema de casas a usar

        Returns:
            Dict con planetas, casas, aspectos
        """
        sistema = cls.SISTEMAS_CASAS.get(sistema_casas, SISTEMA_CASAS_PLACIDUS)

        # Calcular casas
        casas = ServicioEfemerides.calcular_casas(
            dia_juliano, latitud, longitud, sistema
        )

        # Calcular planetas y asignar casas
        planetas_raw = ServicioEfemerides.calcular_todos_los_planetas(dia_juliano)
        planetas = []
        for p in planetas_raw:
            casa = ServicioEfemerides.determinar_casa(p.longitud, casas.cuspides)
            dignidad = cls._determinar_dignidad(p.nombre, p.signo)
            planetas.append({
                "nombre": p.nombre,
                "longitud": round(p.longitud, 4),
                "latitud": round(p.latitud, 4),
                "signo": p.signo,
                "grado_en_signo": round(p.grado_en_signo, 4),
                "casa": casa,
                "retrogrado": p.retrogrado,
                "velocidad": round(p.velocidad, 4),
                "dignidad": dignidad,
            })

        # Casas formateadas
        casas_respuesta = []
        for i, grado in enumerate(casas.cuspides):
            casas_respuesta.append({
                "numero": i + 1,
                "signo": longitud_a_signo(grado),
                "grado": round(grado, 4),
                "grado_en_signo": round(longitud_a_grado_en_signo(grado), 4),
            })

        # Aspectos
        aspectos = cls._calcular_aspectos(planetas_raw)

        # Ángulos
        ascendente = {
            "longitud": round(casas.ascendente, 4),
            "signo": longitud_a_signo(casas.ascendente),
            "grado_en_signo": round(longitud_a_grado_en_signo(casas.ascendente), 4),
        }
        medio_cielo = {
            "longitud": round(casas.medio_cielo, 4),
            "signo": longitud_a_signo(casas.medio_cielo),
            "grado_en_signo": round(longitud_a_grado_en_signo(casas.medio_cielo), 4),
        }

        return {
            "planetas": planetas,
            "casas": casas_respuesta,
            "aspectos": aspectos,
            "ascendente": ascendente,
            "medio_cielo": medio_cielo,
            "sistema_casas": casas.sistema,
        }

    @classmethod
    def _calcular_aspectos(cls, planetas) -> list[dict]:
        """Calcula aspectos entre todos los pares de planetas."""
        aspectos = []

        for i in range(len(planetas)):
            for j in range(i + 1, len(planetas)):
                p1 = planetas[i]
                p2 = planetas[j]
                diff = diferencia_angular(p1.longitud, p2.longitud)

                for nombre_aspecto, config in ASPECTOS.items():
                    angulo_aspecto = config["angulo"]
                    orbe_max = config["orbe"]
                    orbe_actual = abs(diff - angulo_aspecto)

                    if orbe_actual <= orbe_max:
                        # Determinar si es aplicativo o separativo
                        aplicativo = cls._es_aplicativo(
                            p1.longitud, p1.velocidad,
                            p2.longitud, p2.velocidad,
                            angulo_aspecto,
                        )
                        aspectos.append({
                            "planeta1": p1.nombre,
                            "planeta2": p2.nombre,
                            "tipo": nombre_aspecto,
                            "angulo_exacto": round(diff, 4),
                            "orbe": round(orbe_actual, 4),
                            "aplicativo": aplicativo,
                        })

        return aspectos

    @staticmethod
    def _es_aplicativo(
        lon1: float, vel1: float,
        lon2: float, vel2: float,
        angulo_aspecto: float,
    ) -> bool:
        """Determina si un aspecto es aplicativo (se está formando)."""
        diff_actual = diferencia_angular(lon1, lon2)
        # Simular posiciones futuras
        lon1_futura = lon1 + vel1
        lon2_futura = lon2 + vel2
        diff_futura = diferencia_angular(lon1_futura, lon2_futura)
        return abs(diff_futura - angulo_aspecto) < abs(diff_actual - angulo_aspecto)

    @staticmethod
    def _determinar_dignidad(nombre_planeta: str, signo: str) -> str | None:
        """Determina la dignidad esencial de un planeta en un signo."""
        if nombre_planeta in DOMICILIO and signo in DOMICILIO[nombre_planeta]:
            return "domicilio"
        if nombre_planeta in EXALTACION and EXALTACION[nombre_planeta] == signo:
            return "exaltación"
        if nombre_planeta in CAIDA and CAIDA[nombre_planeta] == signo:
            return "caída"
        if nombre_planeta in EXILIO and signo in EXILIO[nombre_planeta]:
            return "exilio"
        return None
