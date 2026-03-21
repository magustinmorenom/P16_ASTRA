"""Constantes globales del sistema CosmicEngine."""

# ── Signos zodiacales (español) ──
SIGNOS = [
    "Aries", "Tauro", "Géminis", "Cáncer",
    "Leo", "Virgo", "Libra", "Escorpio",
    "Sagitario", "Capricornio", "Acuario", "Piscis",
]

# ── IDs de planetas en Swiss Ephemeris ──
PLANETAS_SE = {
    "Sol": 0,
    "Luna": 1,
    "Mercurio": 2,
    "Venus": 3,
    "Marte": 4,
    "Júpiter": 5,
    "Saturno": 6,
    "Urano": 7,
    "Neptuno": 8,
    "Plutón": 9,
    "Nodo Norte": 10,  # True node (SE_TRUE_NODE = 11 en swisseph, pero 10 es mean node)
}

# IDs internos de Swiss Ephemeris
ID_SOL = 0
ID_LUNA = 1
ID_MERCURIO = 2
ID_VENUS = 3
ID_MARTE = 4
ID_JUPITER = 5
ID_SATURNO = 6
ID_URANO = 7
ID_NEPTUNO = 8
ID_PLUTON = 9
ID_NODO_NORTE_MEDIO = 10
ID_NODO_NORTE_VERDADERO = 11

# Planetas principales para cálculos astrológicos
IDS_PLANETAS_PRINCIPALES = [
    ID_SOL, ID_LUNA, ID_MERCURIO, ID_VENUS, ID_MARTE,
    ID_JUPITER, ID_SATURNO, ID_URANO, ID_NEPTUNO, ID_PLUTON,
]

# Planetas + nodos
IDS_TODOS_LOS_CUERPOS = IDS_PLANETAS_PRINCIPALES + [ID_NODO_NORTE_VERDADERO]

NOMBRES_PLANETAS = {
    0: "Sol", 1: "Luna", 2: "Mercurio", 3: "Venus", 4: "Marte",
    5: "Júpiter", 6: "Saturno", 7: "Urano", 8: "Neptuno", 9: "Plutón",
    11: "Nodo Norte",
}

# ── Aspectos con orbes por defecto ──
ASPECTOS = {
    "Conjunción": {"angulo": 0.0, "orbe": 8.0},
    "Sextil": {"angulo": 60.0, "orbe": 6.0},
    "Cuadratura": {"angulo": 90.0, "orbe": 7.0},
    "Trígono": {"angulo": 120.0, "orbe": 8.0},
    "Oposición": {"angulo": 180.0, "orbe": 8.0},
}

# ── Sistema de casas por defecto ──
SISTEMA_CASAS_PLACIDUS = b"P"
SISTEMA_CASAS_KOCH = b"K"
SISTEMA_CASAS_REGIOMONTANUS = b"R"
SISTEMA_CASAS_WHOLE_SIGN = b"W"

# ── Dignidades planetarias ──
DOMICILIO = {
    "Sol": ["Leo"],
    "Luna": ["Cáncer"],
    "Mercurio": ["Géminis", "Virgo"],
    "Venus": ["Tauro", "Libra"],
    "Marte": ["Aries", "Escorpio"],
    "Júpiter": ["Sagitario", "Piscis"],
    "Saturno": ["Capricornio", "Acuario"],
    "Urano": ["Acuario"],
    "Neptuno": ["Piscis"],
    "Plutón": ["Escorpio"],
}

EXALTACION = {
    "Sol": "Aries",
    "Luna": "Tauro",
    "Mercurio": "Virgo",
    "Venus": "Piscis",
    "Marte": "Capricornio",
    "Júpiter": "Cáncer",
    "Saturno": "Libra",
}

CAIDA = {
    "Sol": "Libra",
    "Luna": "Escorpio",
    "Mercurio": "Piscis",
    "Venus": "Virgo",
    "Marte": "Cáncer",
    "Júpiter": "Capricornio",
    "Saturno": "Aries",
}

EXILIO = {
    "Sol": ["Acuario"],
    "Luna": ["Capricornio"],
    "Mercurio": ["Sagitario", "Piscis"],
    "Venus": ["Aries", "Escorpio"],
    "Marte": ["Tauro", "Libra"],
    "Júpiter": ["Géminis", "Virgo"],
    "Saturno": ["Cáncer", "Leo"],
}

# ── Human Design: Orden de puertas I Ching ──
ORDEN_PUERTAS_HD = [
    41, 19, 13, 49, 30, 55, 37, 63, 22, 36, 25, 17, 21, 51, 42, 3,
    27, 24, 2, 23, 8, 20, 16, 35, 45, 12, 15, 52, 39, 53, 62, 56,
    31, 33, 7, 4, 29, 59, 40, 64, 47, 6, 46, 18, 48, 57, 32, 50,
    28, 44, 1, 43, 14, 34, 9, 5, 26, 11, 10, 58, 38, 54, 61, 60,
]

# Grado de inicio de la puerta 41 (2° Acuario = 332.0° eclíptico)
GRADO_INICIO_PUERTA_41 = 332.0

# Cada puerta ocupa 5.625° (360° / 64 puertas)
GRADOS_POR_PUERTA = 5.625

# Cada línea ocupa 0.9375° (5.625° / 6 líneas)
GRADOS_POR_LINEA = 0.9375

# ── Numerología Pitagórica ──
TABLA_PITAGORICA = {
    "A": 1, "B": 2, "C": 3, "D": 4, "E": 5, "F": 6, "G": 7, "H": 8, "I": 9,
    "J": 1, "K": 2, "L": 3, "M": 4, "N": 5, "O": 6, "P": 7, "Q": 8, "R": 9,
    "S": 1, "T": 2, "U": 3, "V": 4, "W": 5, "X": 6, "Y": 7, "Z": 8,
}

TABLA_CALDEA = {
    "A": 1, "B": 2, "C": 3, "D": 4, "E": 5, "F": 8, "G": 3, "H": 5, "I": 1,
    "J": 1, "K": 2, "L": 3, "M": 4, "N": 5, "O": 7, "P": 8, "Q": 1, "R": 2,
    "S": 3, "T": 4, "U": 6, "V": 6, "W": 6, "X": 5, "Y": 1, "Z": 7,
}

VOCALES = set("AEIOU")
NUMEROS_MAESTROS = {11, 22, 33}
