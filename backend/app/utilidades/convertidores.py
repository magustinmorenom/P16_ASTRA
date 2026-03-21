"""Convertidores y utilidades de transformación."""

from app.utilidades.constantes import SIGNOS


def longitud_a_signo(longitud: float) -> str:
    """Convierte longitud eclíptica (0-360) al nombre del signo zodiacal."""
    indice = int(longitud / 30) % 12
    return SIGNOS[indice]


def longitud_a_grado_en_signo(longitud: float) -> float:
    """Convierte longitud eclíptica al grado dentro del signo (0-30)."""
    return round(longitud % 30, 4)


def normalizar_grados(grados: float) -> float:
    """Normaliza un ángulo al rango 0-360."""
    return grados % 360


def grados_a_dms(grados_decimales: float) -> dict:
    """Convierte grados decimales a grados, minutos, segundos."""
    grados_abs = abs(grados_decimales)
    g = int(grados_abs)
    resto = (grados_abs - g) * 60
    m = int(resto)
    s = round((resto - m) * 60, 2)
    signo = -1 if grados_decimales < 0 else 1
    return {"grados": g * signo, "minutos": m, "segundos": s}


def diferencia_angular(angulo1: float, angulo2: float) -> float:
    """Calcula la diferencia angular mínima entre dos ángulos (0-180)."""
    diff = abs(normalizar_grados(angulo1) - normalizar_grados(angulo2))
    if diff > 180:
        diff = 360 - diff
    return diff
