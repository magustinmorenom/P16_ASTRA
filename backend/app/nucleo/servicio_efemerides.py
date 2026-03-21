"""Servicio de efemérides — motor astronómico central con pyswisseph."""

from dataclasses import dataclass

import swisseph as swe

from app.excepciones import ErrorCalculoEfemerides
from app.registro import logger
from app.utilidades.constantes import (
    ID_SOL,
    IDS_PLANETAS_PRINCIPALES,
    IDS_TODOS_LOS_CUERPOS,
    NOMBRES_PLANETAS,
    SISTEMA_CASAS_PLACIDUS,
)
from app.utilidades.convertidores import (
    longitud_a_grado_en_signo,
    longitud_a_signo,
    normalizar_grados,
)


@dataclass
class PosicionPlaneta:
    """Posición calculada de un cuerpo celeste."""
    id_planeta: int
    nombre: str
    longitud: float
    latitud: float
    distancia: float
    velocidad: float
    signo: str
    grado_en_signo: float
    retrogrado: bool


@dataclass
class ResultadoCasas:
    """Resultado del cálculo de casas."""
    cuspides: list[float]  # 12 cúspides
    ascendente: float
    medio_cielo: float
    descendente: float
    fondo_cielo: float
    sistema: str


class ServicioEfemerides:
    """Motor central de cálculos astronómicos usando Swiss Ephemeris."""

    # Flags para cálculos de alta precisión
    _flags = swe.FLG_SWIEPH | swe.FLG_SPEED

    @classmethod
    def calcular_posicion_planeta(
        cls,
        dia_juliano: float,
        id_planeta: int,
    ) -> PosicionPlaneta:
        """Calcula la posición de un planeta para un día juliano dado.

        Args:
            dia_juliano: Día juliano (JD)
            id_planeta: ID del planeta en Swiss Ephemeris

        Returns:
            PosicionPlaneta con todos los datos calculados
        """
        try:
            resultado = swe.calc_ut(dia_juliano, id_planeta, cls._flags)
        except Exception as e:
            raise ErrorCalculoEfemerides(
                f"Error calculando planeta {id_planeta}: {e}"
            )

        # resultado es una tupla: ((lon, lat, dist, speed_lon, speed_lat, speed_dist), flag)
        datos = resultado[0]
        longitud = datos[0]
        latitud_ecl = datos[1]
        distancia = datos[2]
        velocidad = datos[3]

        nombre = NOMBRES_PLANETAS.get(id_planeta, f"Cuerpo_{id_planeta}")

        return PosicionPlaneta(
            id_planeta=id_planeta,
            nombre=nombre,
            longitud=normalizar_grados(longitud),
            latitud=latitud_ecl,
            distancia=distancia,
            velocidad=velocidad,
            signo=longitud_a_signo(longitud),
            grado_en_signo=longitud_a_grado_en_signo(longitud),
            retrogrado=velocidad < 0,
        )

    @classmethod
    def calcular_todos_los_planetas(
        cls,
        dia_juliano: float,
        incluir_nodos: bool = True,
    ) -> list[PosicionPlaneta]:
        """Calcula posición de todos los planetas principales.

        Args:
            dia_juliano: Día juliano
            incluir_nodos: Si True, incluye nodo norte verdadero

        Returns:
            Lista de PosicionPlaneta para cada cuerpo
        """
        ids = IDS_TODOS_LOS_CUERPOS if incluir_nodos else IDS_PLANETAS_PRINCIPALES
        return [cls.calcular_posicion_planeta(dia_juliano, pid) for pid in ids]

    @classmethod
    def calcular_casas(
        cls,
        dia_juliano: float,
        latitud: float,
        longitud: float,
        sistema: bytes = SISTEMA_CASAS_PLACIDUS,
    ) -> ResultadoCasas:
        """Calcula las 12 casas astrológicas.

        Args:
            dia_juliano: Día juliano
            latitud: Latitud geográfica
            longitud: Longitud geográfica
            sistema: Sistema de casas (b'P' = Placidus por defecto)

        Returns:
            ResultadoCasas con cúspides y ángulos
        """
        try:
            cuspides, angulos = swe.houses(dia_juliano, latitud, longitud, sistema)
        except Exception as e:
            raise ErrorCalculoEfemerides(f"Error calculando casas: {e}")

        # cuspides: tupla de 12 valores (cúspides de casas 1-12)
        # angulos: (ASC, MC, ARMC, Vertex, equatorial_asc, ...)
        nombres_sistema = {
            b"P": "Placidus",
            b"K": "Koch",
            b"R": "Regiomontanus",
            b"W": "Whole Sign",
        }

        return ResultadoCasas(
            cuspides=list(cuspides),
            ascendente=angulos[0],
            medio_cielo=angulos[1],
            descendente=normalizar_grados(angulos[0] + 180),
            fondo_cielo=normalizar_grados(angulos[1] + 180),
            sistema=nombres_sistema.get(sistema, "Desconocido"),
        )

    @classmethod
    def obtener_longitud_solar(cls, dia_juliano: float) -> float:
        """Obtiene la longitud eclíptica del Sol para un JD dado.

        Método de conveniencia usado por HD y Retorno Solar.
        """
        pos = cls.calcular_posicion_planeta(dia_juliano, ID_SOL)
        return pos.longitud

    @classmethod
    def buscar_fecha_por_longitud_solar(
        cls,
        longitud_objetivo: float,
        jd_estimado: float,
        precision: float = 0.0001,
        max_iteraciones: int = 100,
    ) -> float:
        """Búsqueda binaria para encontrar el JD donde el Sol alcanza una longitud.

        Usado por:
        - Human Design: fecha inconsciente (88° antes)
        - Retorno Solar: momento exacto del retorno

        Args:
            longitud_objetivo: Longitud eclíptica objetivo (0-360)
            jd_estimado: JD inicial estimado para la búsqueda
            precision: Precisión en grados (default 0.0001°)
            max_iteraciones: Máximo de iteraciones

        Returns:
            Día juliano donde el Sol está en la longitud objetivo
        """
        longitud_objetivo = normalizar_grados(longitud_objetivo)

        # Rango de búsqueda: ±5 días alrededor del estimado
        jd_min = jd_estimado - 5
        jd_max = jd_estimado + 5

        for _ in range(max_iteraciones):
            jd_medio = (jd_min + jd_max) / 2
            lon_actual = cls.obtener_longitud_solar(jd_medio)

            # Calcular diferencia angular considerando el cruce por 0°/360°
            diff = lon_actual - longitud_objetivo
            if diff > 180:
                diff -= 360
            elif diff < -180:
                diff += 360

            if abs(diff) < precision:
                logger.debug(
                    "Búsqueda solar convergió en JD=%.6f, lon=%.4f° (obj=%.4f°)",
                    jd_medio,
                    lon_actual,
                    longitud_objetivo,
                )
                return jd_medio

            # El Sol se mueve en dirección creciente de longitud (~1°/día)
            if diff > 0:
                jd_max = jd_medio
            else:
                jd_min = jd_medio

        raise ErrorCalculoEfemerides(
            f"Búsqueda solar no convergió después de {max_iteraciones} iteraciones "
            f"(objetivo={longitud_objetivo}°)"
        )

    @classmethod
    def determinar_casa(cls, longitud_planeta: float, cuspides: list[float]) -> int:
        """Determina en qué casa cae un planeta dada la lista de cúspides.

        Args:
            longitud_planeta: Longitud eclíptica del planeta
            cuspides: Lista de 12 cúspides de casas

        Returns:
            Número de casa (1-12)
        """
        for i in range(12):
            inicio = cuspides[i]
            fin = cuspides[(i + 1) % 12]

            if inicio <= fin:
                if inicio <= longitud_planeta < fin:
                    return i + 1
            else:
                # Cruce por 0°/360°
                if longitud_planeta >= inicio or longitud_planeta < fin:
                    return i + 1

        return 1  # Fallback
