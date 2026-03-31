"""Detector de intent temporal — identifica ventana, granularidad y área de vida.

Sin IA, basado en regex y keywords.
"""

import re
from datetime import date
from dataclasses import dataclass


@dataclass
class IntentTemporal:
    """Resultado del análisis de intent."""
    es_temporal: bool
    ventana_dias: int  # 7, 30, 180, 365
    granularidad: str  # "dia" o "mes"
    area: str | None  # "carrera", "viajes", etc. o None si no detecta
    mes_especifico: int | None  # 1-12 si se menciona un mes puntual
    anio: int | None  # año si se menciona uno específico


# ── Mapeo de meses en español ──
_MESES = {
    "enero": 1, "febrero": 2, "marzo": 3, "abril": 4,
    "mayo": 5, "junio": 6, "julio": 7, "agosto": 8,
    "septiembre": 9, "octubre": 10, "noviembre": 11, "diciembre": 12,
}

# ── Keywords por área de vida ──
_AREAS = {
    "carrera": [
        "trabajo", "carrera", "negocio", "emprender", "emprendimiento",
        "empresa", "lanzar", "lanzamiento", "proyecto", "profesional",
        "ascenso", "renunciar", "cambiar de trabajo", "abrir un local",
        "freelance", "startup",
    ],
    "viajes": [
        "viajar", "viaje", "viajes", "mudanza", "mudarme", "mudar",
        "trasladar", "irme", "emigrar", "vacaciones",
    ],
    "amor": [
        "amor", "pareja", "relación", "relacion", "casarme", "casamiento",
        "boda", "conocer gente", "noviazgo", "cita", "tinder", "match",
        "reconciliar", "enamorar",
    ],
    "finanzas": [
        "dinero", "plata", "invertir", "inversión", "inversion", "comprar",
        "vender", "finanzas", "ahorro", "cripto", "acciones", "bolsa",
        "inmueble", "propiedad",
    ],
    "comunicacion": [
        "comunicar", "presentar", "presentación", "publicar", "escribir",
        "libro", "podcast", "video", "contenido", "redes", "marketing",
        "charla", "conferencia",
    ],
    "salud": [
        "salud", "cirugía", "cirugia", "operación", "operacion",
        "operarme", "médico", "medico", "tratamiento", "dieta",
        "ejercicio", "energía", "energia",
    ],
    "estudio": [
        "estudiar", "curso", "aprender", "carrera universitaria",
        "examen", "certificación", "certificacion", "maestría",
        "maestria", "posgrado",
    ],
    "contratos": [
        "firmar", "contrato", "acuerdo", "escritura", "sociedad",
        "convenio", "legal",
    ],
}

# ── Patterns temporales ──
_RE_MEJOR = re.compile(
    r"mejor\s+(d[ií]a|momento|fecha|semana|mes|per[ií]odo|época)",
    re.IGNORECASE,
)
_RE_CUANDO = re.compile(
    r"cu[aá]ndo\s+(deber[ií]a|conviene|es\s+mejor|me\s+conviene|puedo|podr[ií]a)",
    re.IGNORECASE,
)
_RE_BUEN_MOMENTO = re.compile(
    r"(buen|bueno|ideal|[oó]ptimo|favorable)\s+(momento|d[ií]a|fecha|mes|per[ií]odo)",
    re.IGNORECASE,
)

_RE_SEMANA = re.compile(r"(esta\s+semana|pr[oó]ximos?\s+d[ií]as|próxima\s+semana)", re.IGNORECASE)
_RE_MES_ACTUAL = re.compile(r"este\s+mes", re.IGNORECASE)
_RE_MES_NOMBRE = re.compile(
    r"(?:en|para|durante)\s+(enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre)",
    re.IGNORECASE,
)
_RE_SEMESTRE = re.compile(r"(semestre|pr[oó]ximos?\s+\d+\s+meses|medio\s+a[ñn]o)", re.IGNORECASE)
_RE_ANIO = re.compile(r"(este\s+a[ñn]o|el\s+a[ñn]o|en\s+(20\d{2})|a[ñn]o\s+que\s+viene)", re.IGNORECASE)


def detectar_intent(mensaje: str) -> IntentTemporal:
    """Analiza el mensaje del usuario y extrae intent temporal si existe."""
    texto = mensaje.lower().strip()

    # 1. ¿Es una consulta temporal?
    es_temporal = bool(
        _RE_MEJOR.search(texto)
        or _RE_CUANDO.search(texto)
        or _RE_BUEN_MOMENTO.search(texto)
    )

    if not es_temporal:
        return IntentTemporal(
            es_temporal=False, ventana_dias=0,
            granularidad="dia", area=None,
            mes_especifico=None, anio=None,
        )

    # 2. Detectar ventana temporal
    ventana_dias = 30  # default
    granularidad = "dia"
    mes_especifico = None
    anio = None

    if _RE_SEMANA.search(texto):
        ventana_dias = 7
    elif _RE_MES_ACTUAL.search(texto):
        ventana_dias = 30
    elif match_mes := _RE_MES_NOMBRE.search(texto):
        mes_nombre = match_mes.group(1).lower()
        mes_especifico = _MESES.get(mes_nombre)
        ventana_dias = 30
    elif _RE_SEMESTRE.search(texto):
        ventana_dias = 180
        granularidad = "mes"
    elif match_anio := _RE_ANIO.search(texto):
        ventana_dias = 365
        granularidad = "mes"
        if match_anio.group(2):
            anio = int(match_anio.group(2))
        elif "que viene" in texto:
            anio = date.today().year + 1

    # Rangos largos → granularidad mes
    if ventana_dias > 31:
        granularidad = "mes"

    # 3. Detectar área de vida
    area = None
    mejor_coincidencia = 0
    for nombre_area, keywords in _AREAS.items():
        coincidencias = sum(1 for kw in keywords if kw in texto)
        if coincidencias > mejor_coincidencia:
            mejor_coincidencia = coincidencias
            area = nombre_area

    return IntentTemporal(
        es_temporal=True,
        ventana_dias=ventana_dias,
        granularidad=granularidad,
        area=area,
        mes_especifico=mes_especifico,
        anio=anio,
    )
