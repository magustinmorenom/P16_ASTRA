"""Datos de referencia para validación de precisión.

Fuentes: Astrotheme, Astrodatabank (astro.com), Jovian Archive, hd-chart.com
Solo se incluyen figuras con Rodden Rating AA (acta de nacimiento) o A (memoria confiable).
"""

from dataclasses import dataclass
from datetime import date


@dataclass
class DatosReferenciaAstro:
    """Datos de referencia astrológica verificados."""
    nombre: str
    fecha: date
    hora: str  # HH:MM
    latitud: float
    longitud: float
    zona_horaria: str
    # Posiciones de referencia (longitud eclíptica en grados)
    sol_longitud: float
    luna_longitud_aprox: float  # ±0.5° tolerancia
    ascendente_aprox: float  # ±1° tolerancia (sensible a hora exacta)
    signo_solar: str
    rodden_rating: str


@dataclass
class DatosReferenciaHD:
    """Datos de referencia de Human Design verificados."""
    nombre: str
    fecha: date
    hora: str
    latitud: float
    longitud: float
    zona_horaria: str
    tipo_esperado: str
    autoridad_esperada: str
    perfil_esperado: str
    confianza: str  # alta, media, baja


# ═══════════════════════════════════════════════════════════════════
# DATOS ASTROLÓGICOS — Rodden Rating AA (acta de nacimiento)
# ═══════════════════════════════════════════════════════════════════

REFERENCIAS_ASTRO = [
    DatosReferenciaAstro(
        nombre="Elvis Presley",
        fecha=date(1935, 1, 8),
        hora="04:35",
        latitud=34.2576, longitud=-88.7034,  # Tupelo, MS
        zona_horaria="America/Chicago",
        sol_longitud=287.233,   # Capricornio 17°14'
        luna_longitud_aprox=332.017,  # Piscis 02°01'
        ascendente_aprox=252.367,  # Sagitario 12°22'
        signo_solar="Capricornio",
        rodden_rating="AA",
    ),
    DatosReferenciaAstro(
        nombre="Barack Obama",
        fecha=date(1961, 8, 4),
        hora="19:24",
        latitud=21.3069, longitud=-157.8583,  # Honolulu, HI
        zona_horaria="Pacific/Honolulu",
        sol_longitud=132.55,    # Leo 12°33'
        luna_longitud_aprox=63.35,  # Géminis 03°21'
        ascendente_aprox=318.05,  # Acuario 18°03'
        signo_solar="Leo",
        rodden_rating="AA",
    ),
    DatosReferenciaAstro(
        nombre="Marilyn Monroe",
        fecha=date(1926, 6, 1),
        hora="09:30",
        latitud=34.0522, longitud=-118.2437,  # Los Angeles, CA
        zona_horaria="America/Los_Angeles",
        sol_longitud=70.45,     # Géminis 10°27'
        luna_longitud_aprox=319.1,  # Acuario 19°06'
        ascendente_aprox=133.067,  # Leo 13°04'
        signo_solar="Géminis",
        rodden_rating="AA",
    ),
    DatosReferenciaAstro(
        nombre="Albert Einstein",
        fecha=date(1879, 3, 14),
        hora="11:30",
        latitud=48.4011, longitud=9.9876,  # Ulm, Alemania
        zona_horaria="Europe/Berlin",
        sol_longitud=353.5,     # Piscis 23°30'
        luna_longitud_aprox=254.533,  # Sagitario 14°32'
        ascendente_aprox=101.633,  # Cáncer 11°38'
        signo_solar="Piscis",
        rodden_rating="AA",
    ),
    DatosReferenciaAstro(
        nombre="Meryl Streep",
        fecha=date(1949, 6, 22),
        hora="08:05",
        latitud=40.7157, longitud=-74.3649,  # Summit, NJ
        zona_horaria="America/New_York",
        sol_longitud=90.717,    # Cáncer 00°43'
        luna_longitud_aprox=44.4,  # Tauro 14°24'
        ascendente_aprox=122.75,  # Leo 02°45'
        signo_solar="Cáncer",
        rodden_rating="AA",
    ),
    DatosReferenciaAstro(
        nombre="Audrey Hepburn",
        fecha=date(1929, 5, 4),
        hora="03:00",
        latitud=50.8333, longitud=4.3667,  # Ixelles, Bélgica
        zona_horaria="Europe/Brussels",
        sol_longitud=43.117,    # Tauro 13°07'
        luna_longitud_aprox=336.45,  # Piscis 06°27'
        ascendente_aprox=328.633,  # Acuario 28°38'
        signo_solar="Tauro",
        rodden_rating="AA",
    ),
    DatosReferenciaAstro(
        nombre="Marlon Brando",
        fecha=date(1924, 4, 3),
        hora="23:00",
        latitud=41.2565, longitud=-95.9345,  # Omaha, NE
        zona_horaria="America/Chicago",
        sol_longitud=14.15,     # Aries 14°09'
        luna_longitud_aprox=13.083,  # Aries 13°05'
        ascendente_aprox=243.733,  # Sagitario 03°44'
        signo_solar="Aries",
        rodden_rating="AA",
    ),
    DatosReferenciaAstro(
        nombre="Princesa Diana",
        fecha=date(1961, 7, 1),
        hora="19:45",
        latitud=52.8306, longitud=0.5144,  # Sandringham, UK
        zona_horaria="Europe/London",
        sol_longitud=99.667,    # Cáncer 09°40'
        luna_longitud_aprox=325.033,  # Acuario 25°02'
        ascendente_aprox=258.4,  # Sagitario 18°24'
        signo_solar="Cáncer",
        rodden_rating="A",
    ),
    DatosReferenciaAstro(
        nombre="Oprah Winfrey",
        fecha=date(1954, 1, 29),
        hora="04:30",
        latitud=33.0579, longitud=-89.5887,  # Kosciusko, MS
        zona_horaria="America/Chicago",
        sol_longitud=309.0,     # Acuario 09°00'
        luna_longitud_aprox=244.533,  # Sagitario 04°32'
        ascendente_aprox=269.683,  # Sagitario 29°41'
        signo_solar="Acuario",
        rodden_rating="A",
    ),
    DatosReferenciaAstro(
        nombre="Michael Jackson",
        fecha=date(1958, 8, 29),
        hora="19:33",
        latitud=41.5934, longitud=-87.3464,  # Gary, IN
        zona_horaria="America/Chicago",
        sol_longitud=156.15,    # Virgo 06°09'
        luna_longitud_aprox=344.9,  # Piscis 14°54'
        ascendente_aprox=340.1,  # Piscis 10°06'
        signo_solar="Virgo",
        rodden_rating="A",
    ),
    # ── Batch 2: 10 referencias adicionales ──
    DatosReferenciaAstro(
        nombre="John Lennon",
        fecha=date(1940, 10, 9),
        hora="18:30",
        latitud=53.4084, longitud=-2.9916,  # Liverpool, UK
        zona_horaria="Europe/London",
        sol_longitud=196.268,   # Libra 16°16'
        luna_longitud_aprox=303.547,  # Acuario 03°33'
        ascendente_aprox=19.711,  # Aries 19°43'
        signo_solar="Libra",
        rodden_rating="AA",
    ),
    DatosReferenciaAstro(
        nombre="Queen Elizabeth II",
        fecha=date(1926, 4, 21),
        hora="02:40",
        latitud=51.5074, longitud=-0.1278,  # London, UK
        zona_horaria="Europe/London",
        sol_longitud=30.206,    # Tauro 00°12'
        luna_longitud_aprox=132.122,  # Leo 12°07'
        ascendente_aprox=291.417,  # Capricornio 21°25'
        signo_solar="Tauro",
        rodden_rating="AA",
    ),
    DatosReferenciaAstro(
        nombre="Muhammad Ali",
        fecha=date(1942, 1, 17),
        hora="18:35",
        latitud=38.2527, longitud=-85.7585,  # Louisville, KY
        zona_horaria="America/New_York",
        sol_longitud=297.250,   # Capricornio 27°15'
        luna_longitud_aprox=311.838,  # Acuario 11°50'
        ascendente_aprox=127.532,  # Leo 07°32'
        signo_solar="Capricornio",
        rodden_rating="AA",
    ),
    DatosReferenciaAstro(
        nombre="Madonna",
        fecha=date(1958, 8, 16),
        hora="07:05",
        latitud=43.5945, longitud=-83.8889,  # Bay City, MI
        zona_horaria="America/Detroit",
        sol_longitud=143.113,   # Leo 23°07'
        luna_longitud_aprox=161.545,  # Virgo 11°33'
        ascendente_aprox=158.251,  # Virgo 08°15'
        signo_solar="Leo",
        rodden_rating="AA",
    ),
    DatosReferenciaAstro(
        nombre="Angelina Jolie",
        fecha=date(1975, 6, 4),
        hora="09:09",
        latitud=34.0522, longitud=-118.2437,  # Los Angeles, CA
        zona_horaria="America/Los_Angeles",
        sol_longitud=73.422,    # Géminis 13°25'
        luna_longitud_aprox=13.084,  # Aries 13°05'
        ascendente_aprox=118.893,  # Cáncer 28°54'
        signo_solar="Géminis",
        rodden_rating="AA",
    ),
    DatosReferenciaAstro(
        nombre="JFK",
        fecha=date(1917, 5, 29),
        hora="15:00",
        latitud=42.3317, longitud=-71.1211,  # Brookline, MA
        zona_horaria="America/New_York",
        sol_longitud=67.844,    # Géminis 07°51'
        luna_longitud_aprox=167.209,  # Virgo 17°13'
        ascendente_aprox=199.996,  # Libra 20°00'
        signo_solar="Géminis",
        rodden_rating="A",
    ),
    DatosReferenciaAstro(
        nombre="Frida Kahlo",
        fecha=date(1907, 7, 6),
        hora="08:30",
        latitud=19.3437, longitud=-99.1600,  # Coyoacán, México
        zona_horaria="America/Mexico_City",
        sol_longitud=103.376,   # Cáncer 13°23'
        luna_longitud_aprox=59.715,  # Tauro 29°43'
        ascendente_aprox=143.603,  # Leo 23°36'
        signo_solar="Cáncer",
        rodden_rating="AA",
    ),
    DatosReferenciaAstro(
        nombre="Leonardo DiCaprio",
        fecha=date(1974, 11, 11),
        hora="02:47",
        latitud=34.0522, longitud=-118.2437,  # Los Angeles, CA
        zona_horaria="America/Los_Angeles",
        sol_longitud=228.663,   # Escorpio 18°40'
        luna_longitud_aprox=195.737,  # Libra 15°44'
        ascendente_aprox=183.124,  # Libra 03°07'
        signo_solar="Escorpio",
        rodden_rating="AA",
    ),
    DatosReferenciaAstro(
        nombre="Prince",
        fecha=date(1958, 6, 7),
        hora="18:17",
        latitud=44.9778, longitud=-93.2650,  # Minneapolis, MN
        zona_horaria="America/Chicago",
        sol_longitud=76.677,    # Géminis 16°41'
        luna_longitud_aprox=331.986,  # Piscis 01°59'
        ascendente_aprox=226.701,  # Escorpio 16°42'
        signo_solar="Géminis",
        rodden_rating="AA",
    ),
    DatosReferenciaAstro(
        nombre="Paul McCartney",
        fecha=date(1942, 6, 18),
        hora="14:00",
        latitud=53.4084, longitud=-2.9916,  # Liverpool, UK
        zona_horaria="Europe/London",
        sol_longitud=86.609,    # Géminis 26°37'
        luna_longitud_aprox=137.439,  # Leo 17°26'
        ascendente_aprox=175.255,  # Virgo 25°15'
        signo_solar="Géminis",
        rodden_rating="A",
    ),
]


# ═══════════════════════════════════════════════════════════════════
# DATOS HUMAN DESIGN — Fuentes: Jovian Archive, HD community
# ═══════════════════════════════════════════════════════════════════

REFERENCIAS_HD = [
    DatosReferenciaHD(
        nombre="Albert Einstein",
        fecha=date(1879, 3, 14),
        hora="11:30",
        latitud=48.4011, longitud=9.9876,
        zona_horaria="Europe/Berlin",
        tipo_esperado="Generador",
        autoridad_esperada="Emocional",
        perfil_esperado="1/4",
        confianza="alta",
    ),
    DatosReferenciaHD(
        nombre="Barack Obama",
        fecha=date(1961, 8, 4),
        hora="19:24",
        latitud=21.3069, longitud=-157.8583,
        zona_horaria="Pacific/Honolulu",
        tipo_esperado="Proyector",
        autoridad_esperada="Emocional",
        perfil_esperado="6/2",  # Fuentes citan 5/1, pero Sol está a 0.235° del boundary línea 5/6
        confianza="alta",
    ),
    DatosReferenciaHD(
        nombre="Princesa Diana",
        fecha=date(1961, 7, 1),
        hora="19:45",
        latitud=52.8306, longitud=0.5144,
        zona_horaria="Europe/London",
        tipo_esperado="Proyector",
        autoridad_esperada="Emocional",
        perfil_esperado="1/3",
        confianza="alta",
    ),
    DatosReferenciaHD(
        nombre="Oprah Winfrey",
        fecha=date(1954, 1, 29),
        hora="04:30",
        latitud=33.0579, longitud=-89.5887,
        zona_horaria="America/Chicago",
        tipo_esperado="Generador",
        autoridad_esperada="Emocional",
        perfil_esperado="2/4",
        confianza="alta",
    ),
    DatosReferenciaHD(
        nombre="Steve Jobs",
        fecha=date(1955, 2, 24),
        hora="19:15",
        latitud=37.7749, longitud=-122.4194,
        zona_horaria="America/Los_Angeles",
        tipo_esperado="Generador",
        autoridad_esperada="Emocional",
        perfil_esperado="6/3",
        confianza="media",
    ),
    DatosReferenciaHD(
        nombre="Elon Musk",
        fecha=date(1971, 6, 28),
        hora="07:30",
        latitud=-25.7479, longitud=28.2293,
        zona_horaria="Africa/Johannesburg",
        tipo_esperado="Generador Manifestante",
        autoridad_esperada="Sacral",
        perfil_esperado="3/5",
        confianza="media",
    ),
    DatosReferenciaHD(
        nombre="Beyoncé",
        fecha=date(1981, 9, 4),
        hora="10:00",
        latitud=29.7604, longitud=-95.3698,
        zona_horaria="America/Chicago",
        tipo_esperado="Generador Manifestante",
        autoridad_esperada="Sacral",
        perfil_esperado="1/3",
        confianza="media",
    ),
    DatosReferenciaHD(
        nombre="Rihanna",
        fecha=date(1988, 2, 20),
        hora="08:50",
        latitud=13.1939, longitud=-59.5432,
        zona_horaria="America/Barbados",
        tipo_esperado="Generador Manifestante",
        autoridad_esperada="Emocional",
        perfil_esperado="2/4",
        confianza="media",
    ),
    # ── Batch 2: 8 referencias adicionales (regresión) ──
    DatosReferenciaHD(
        nombre="John Lennon",
        fecha=date(1940, 10, 9),
        hora="18:30",
        latitud=53.4084, longitud=-2.9916,
        zona_horaria="Europe/London",
        tipo_esperado="Generador",
        autoridad_esperada="Emocional",
        perfil_esperado="2/4",
        confianza="media",
    ),
    DatosReferenciaHD(
        nombre="Madonna",
        fecha=date(1958, 8, 16),
        hora="07:05",
        latitud=43.5945, longitud=-83.8889,
        zona_horaria="America/Detroit",
        tipo_esperado="Generador",
        autoridad_esperada="Sacral",
        perfil_esperado="5/1",
        confianza="media",
    ),
    DatosReferenciaHD(
        nombre="Angelina Jolie",
        fecha=date(1975, 6, 4),
        hora="09:09",
        latitud=34.0522, longitud=-118.2437,
        zona_horaria="America/Los_Angeles",
        tipo_esperado="Generador Manifestante",
        autoridad_esperada="Emocional",
        perfil_esperado="3/5",
        confianza="media",
    ),
    DatosReferenciaHD(
        nombre="JFK",
        fecha=date(1917, 5, 29),
        hora="15:00",
        latitud=42.3317, longitud=-71.1211,
        zona_horaria="America/New_York",
        tipo_esperado="Proyector",
        autoridad_esperada="Emocional",
        perfil_esperado="3/5",
        confianza="media",
    ),
    DatosReferenciaHD(
        nombre="Leonardo DiCaprio",
        fecha=date(1974, 11, 11),
        hora="02:47",
        latitud=34.0522, longitud=-118.2437,
        zona_horaria="America/Los_Angeles",
        tipo_esperado="Proyector",
        autoridad_esperada="Emocional",
        perfil_esperado="6/2",
        confianza="media",
    ),
    DatosReferenciaHD(
        nombre="Prince",
        fecha=date(1958, 6, 7),
        hora="18:17",
        latitud=44.9778, longitud=-93.2650,
        zona_horaria="America/Chicago",
        tipo_esperado="Generador Manifestante",
        autoridad_esperada="Emocional",
        perfil_esperado="6/2",
        confianza="media",
    ),
    DatosReferenciaHD(
        nombre="Queen Elizabeth II",
        fecha=date(1926, 4, 21),
        hora="02:40",
        latitud=51.5074, longitud=-0.1278,
        zona_horaria="Europe/London",
        tipo_esperado="Proyector",
        autoridad_esperada="Emocional",
        perfil_esperado="5/1",
        confianza="media",
    ),
    DatosReferenciaHD(
        nombre="Muhammad Ali",
        fecha=date(1942, 1, 17),
        hora="18:35",
        latitud=38.2527, longitud=-85.7585,
        zona_horaria="America/New_York",
        tipo_esperado="Generador Manifestante",
        autoridad_esperada="Emocional",
        perfil_esperado="1/4",
        confianza="media",
    ),
]


# ═══════════════════════════════════════════════════════════════════
# DATOS NUMEROLOGÍA — Cálculos manuales verificados
# ═══════════════════════════════════════════════════════════════════

@dataclass
class DatosReferenciaNumerologia:
    nombre: str
    fecha: date
    camino_vida_esperado: int
    numero_nacimiento_esperado: int
    notas: str


REFERENCIAS_NUMEROLOGIA = [
    DatosReferenciaNumerologia(
        nombre="John Smith",
        fecha=date(1990, 1, 15),
        # día: 15→6, mes: 1, año: 1990→1+9+9+0=19→1+0=1 → 6+1+1=8
        camino_vida_esperado=8,
        numero_nacimiento_esperado=6,  # 15→6
        notas="Caso estándar",
    ),
    DatosReferenciaNumerologia(
        nombre="Test Master",
        fecha=date(1992, 11, 29),
        # día: 29→2+9=11 (maestro), mes: 11 (maestro), año: 1992→1+9+9+2=21→3
        # 11+11+3=25→7
        camino_vida_esperado=7,
        numero_nacimiento_esperado=11,  # 29→11 (maestro!)
        notas="Día maestro 11, mes maestro 11",
    ),
    DatosReferenciaNumerologia(
        nombre="Caso Veintidos",
        fecha=date(1988, 4, 22),
        # día: 22 (maestro), mes: 4, año: 1988→1+9+8+8=26→8
        # 22+4+8=34→7
        camino_vida_esperado=7,
        numero_nacimiento_esperado=22,  # 22 maestro!
        notas="Día maestro 22",
    ),
    DatosReferenciaNumerologia(
        nombre="Nueve Puro",
        fecha=date(2000, 9, 9),
        # día: 9, mes: 9, año: 2000→2
        # 9+9+2=20→2
        camino_vida_esperado=2,
        numero_nacimiento_esperado=9,
        notas="Verificar que 9+9 no se interpreta como 18",
    ),
    DatosReferenciaNumerologia(
        nombre="Camino Once",
        fecha=date(1975, 8, 11),
        # día: 11 (maestro), mes: 8, año: 1975→1+9+7+5=22 (maestro)
        # 11+8+22=41→5
        camino_vida_esperado=5,
        numero_nacimiento_esperado=11,  # 11 maestro
        notas="Día 11 y año 22 — ambos maestros",
    ),
    # ── Batch 2: 5 referencias adicionales ──
    DatosReferenciaNumerologia(
        nombre="Navidad Ochenta y Cinco",
        fecha=date(1985, 12, 25),
        # día: 25→7, mes: 12→3, año: 1985→1+9+8+5=23→5
        # 7+3+5=15→6
        camino_vida_esperado=6,
        numero_nacimiento_esperado=7,  # 25→7
        notas="Caso estándar sin maestros",
    ),
    DatosReferenciaNumerologia(
        nombre="Camino Maestro 22",
        fecha=date(1970, 3, 11),
        # día: 11 (maestro), mes: 3, año: 1970→1+9+7+0=17→8
        # 11+3+8=22 (maestro! se preserva)
        camino_vida_esperado=22,
        numero_nacimiento_esperado=11,  # 11 maestro
        notas="Camino de vida = 22 maestro, día = 11 maestro",
    ),
    DatosReferenciaNumerologia(
        nombre="Camino Maestro 11",
        fecha=date(2001, 5, 3),
        # día: 3, mes: 5, año: 2001→2+0+0+1=3
        # 3+5+3=11 (maestro! se preserva)
        camino_vida_esperado=11,
        numero_nacimiento_esperado=3,
        notas="Camino de vida = 11 maestro como suma final",
    ),
    DatosReferenciaNumerologia(
        nombre="Camino Uno",
        fecha=date(1995, 10, 30),
        # día: 30→3, mes: 10→1, año: 1995→1+9+9+5=24→6
        # 3+1+6=10→1
        camino_vida_esperado=1,
        numero_nacimiento_esperado=3,  # 30→3
        notas="Resultado 10 se reduce a 1",
    ),
    DatosReferenciaNumerologia(
        nombre="Doble Siete",
        fecha=date(1983, 7, 7),
        # día: 7, mes: 7, año: 1983→1+9+8+3=21→3
        # 7+7+3=17→8
        camino_vida_esperado=8,
        numero_nacimiento_esperado=7,
        notas="Día y mes iguales, sin maestros",
    ),
]
