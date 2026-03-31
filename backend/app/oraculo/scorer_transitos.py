"""Scorer de tránsitos — ponderación determinista astro + numero + eventos.

Calcula un score 0-10 por día para un área de vida,
cruzando tránsitos con carta natal y perfil numerológico del usuario.
"""

from datetime import date, timedelta

from app.servicios.servicio_numerologia import ServicioNumerologia
from app.utilidades.convertidores import diferencia_angular

# ================================================================== #
# Configuración de pesos                                             #
# ================================================================== #

PESO_ASTRO = 0.55
PESO_NUMERO = 0.30
PESO_EVENTOS = 0.15

# ================================================================== #
# Tablas de afinidad                                                 #
# ================================================================== #

# Casas natales relevantes por área (índice 0-based → casa 1 = índice 0)
CASAS_POR_AREA: dict[str, list[int]] = {
    "carrera":      [9, 5, 1],    # casas 10, 6, 2
    "viajes":       [8, 2],       # casas 9, 3
    "amor":         [6, 4],       # casas 7, 5
    "finanzas":     [1, 7],       # casas 2, 8
    "comunicacion": [2],          # casa 3
    "salud":        [0, 5],       # casas 1, 6
    "estudio":      [8, 2],       # casas 9, 3
    "contratos":    [6, 9],       # casas 7, 10
}

# Planetas clave por área (para bonus si el tránsito los involucra)
PLANETAS_CLAVE: dict[str, list[str]] = {
    "carrera":      ["Sol", "Saturno", "Júpiter"],
    "viajes":       ["Júpiter", "Mercurio"],
    "amor":         ["Venus", "Luna"],
    "finanzas":     ["Venus", "Júpiter"],
    "comunicacion": ["Mercurio"],
    "salud":        ["Marte", "Sol"],
    "estudio":      ["Mercurio", "Júpiter"],
    "contratos":    ["Mercurio", "Saturno"],
}

# Afinidad número personal del día ↔ área (base score 0-10)
AFINIDAD_DIA_AREA: dict[str, dict[int, float]] = {
    "carrera":      {1: 9, 2: 4, 3: 6, 4: 7, 5: 5, 6: 4, 7: 3, 8: 10, 9: 5, 11: 7, 22: 9, 33: 5},
    "viajes":       {1: 6, 2: 4, 3: 7, 4: 3, 5: 10, 6: 4, 7: 5, 8: 5, 9: 8, 11: 6, 22: 5, 33: 6},
    "amor":         {1: 4, 2: 9, 3: 7, 4: 5, 5: 6, 6: 10, 7: 3, 8: 4, 9: 7, 11: 8, 22: 5, 33: 9},
    "finanzas":     {1: 7, 2: 5, 3: 5, 4: 8, 5: 4, 6: 5, 7: 3, 8: 10, 9: 4, 11: 5, 22: 9, 33: 4},
    "comunicacion": {1: 7, 2: 5, 3: 10, 4: 4, 5: 8, 6: 6, 7: 5, 8: 6, 9: 5, 11: 9, 22: 6, 33: 7},
    "salud":        {1: 8, 2: 5, 3: 5, 4: 7, 5: 6, 6: 8, 7: 7, 8: 6, 9: 5, 11: 6, 22: 7, 33: 8},
    "estudio":      {1: 5, 2: 6, 3: 7, 4: 8, 5: 4, 6: 5, 7: 10, 8: 5, 9: 7, 11: 9, 22: 8, 33: 7},
    "contratos":    {1: 6, 2: 7, 3: 5, 4: 9, 5: 3, 6: 6, 7: 5, 8: 10, 9: 4, 11: 6, 22: 8, 33: 5},
}

# Tensiones entre números (pares que generan fricción)
TENSIONES = {
    frozenset({1, 2}), frozenset({1, 7}), frozenset({3, 4}),
    frozenset({5, 4}), frozenset({7, 5}), frozenset({8, 2}),
    frozenset({9, 1}),
}

# Aspectos armónicos vs tensos
_ARMONICOS = {"Trígono", "Sextil"}
_TENSOS = {"Cuadratura", "Oposición"}

# Ventana consecutiva ideal por área (para scoring mensual)
VENTANA_CONSECUTIVA: dict[str, int] = {
    "carrera": 1, "viajes": 7, "amor": 7, "finanzas": 1,
    "comunicacion": 3, "salud": 1, "estudio": 5, "contratos": 1,
}


# ================================================================== #
# Score astrológico                                                  #
# ================================================================== #

def _score_astrologico(
    planetas_transito: list[dict],
    aspectos_transito: list[dict],
    carta_natal: dict | None,
    area: str,
) -> float:
    """Score 0-10 basado en tránsitos vs carta natal para un área."""
    if not carta_natal:
        return 5.0  # neutral sin carta

    puntos = 0.0
    max_puntos = 10.0

    # Obtener planetas y casas natales
    natal_data = carta_natal.get("natal") or {}
    planetas_natales = natal_data.get("planetas", [])
    casas_natales = natal_data.get("casas", [])

    # Cúspides de casas relevantes para el área
    casas_relevantes = CASAS_POR_AREA.get(area, [])
    cuspides_relevantes = []
    for idx in casas_relevantes:
        if idx < len(casas_natales):
            casa = casas_natales[idx]
            if isinstance(casa, dict):
                cuspides_relevantes.append(casa.get("grado_inicio", 0))

    # Planetas natales relevantes
    planetas_clave_area = PLANETAS_CLAVE.get(area, [])
    natales_relevantes = [
        p for p in planetas_natales
        if p.get("nombre") in planetas_clave_area
    ]

    # Evaluar aspectos entre tránsitos y posiciones natales relevantes
    for pt in planetas_transito:
        lon_t = pt.get("longitud", 0)

        # Aspectos a cúspides de casas relevantes
        for cuspide in cuspides_relevantes:
            diff = diferencia_angular(lon_t, cuspide)
            # Conjunción a cúspide de casa relevante
            if diff < 8:
                puntos += 1.5
            # Trígono a cúspide
            elif abs(diff - 120) < 8:
                puntos += 1.0
            # Sextil a cúspide
            elif abs(diff - 60) < 6:
                puntos += 0.7
            # Cuadratura a cúspide
            elif abs(diff - 90) < 7:
                puntos -= 0.5

        # Aspectos a planetas natales relevantes
        for pn in natales_relevantes:
            lon_n = pn.get("longitud", 0)
            diff = diferencia_angular(lon_t, lon_n)
            nombre_transito = pt.get("nombre", "")

            # Bonus extra si el planeta en tránsito también es clave
            es_planeta_clave = nombre_transito in planetas_clave_area
            mult = 1.5 if es_planeta_clave else 1.0

            if diff < 8:  # Conjunción
                # Benéfico (Júpiter, Venus) conjunción = bueno
                if nombre_transito in ("Júpiter", "Venus"):
                    puntos += 2.0 * mult
                # Maléfico (Marte, Saturno) conjunción = tenso
                elif nombre_transito in ("Marte", "Saturno"):
                    puntos -= 0.5 * mult
                else:
                    puntos += 1.0 * mult
            elif abs(diff - 120) < 8:  # Trígono
                puntos += 1.5 * mult
            elif abs(diff - 60) < 6:  # Sextil
                puntos += 1.0 * mult
            elif abs(diff - 90) < 7:  # Cuadratura
                puntos -= 1.0 * mult
            elif abs(diff - 180) < 8:  # Oposición
                puntos -= 0.8 * mult

    # Penalty por Mercurio retrógrado en áreas sensibles
    mercurio = next((p for p in planetas_transito if p.get("nombre") == "Mercurio"), None)
    if mercurio and mercurio.get("retrogrado"):
        if area in ("comunicacion", "contratos", "viajes"):
            puntos -= 2.0

    # Normalizar a 0-10
    score = 5.0 + puntos
    return max(0.0, min(10.0, round(score, 1)))


# ================================================================== #
# Score numerológico                                                 #
# ================================================================== #

def _score_numerologico(
    fecha_dia: date,
    perfil_cosmico: dict | None,
    area: str,
) -> float:
    """Score 0-10 basado en número del día personal + resonancia con perfil."""
    if not perfil_cosmico:
        return 5.0

    datos = perfil_cosmico.get("datos_personales") or {}
    fecha_nac_str = datos.get("fecha_nacimiento")
    if not fecha_nac_str:
        return 5.0

    try:
        fecha_nac = date.fromisoformat(fecha_nac_str)
    except (ValueError, TypeError):
        return 5.0

    # Calcular día personal
    dia_personal = ServicioNumerologia._dia_personal(fecha_nac, fecha_dia)

    # Afinidad base día ↔ área
    tabla_area = AFINIDAD_DIA_AREA.get(area, {})
    afinidad_base = tabla_area.get(dia_personal, 5.0)

    # Obtener números del perfil numerológico
    perfil_num = perfil_cosmico.get("numerologia") or {}
    numeros_perfil: dict[str, int] = {}

    # Extraer números del formato de la carta numerológica
    for clave in ("camino_de_vida", "expresion", "impulso_del_alma", "personalidad"):
        dato = perfil_num.get(clave)
        if isinstance(dato, dict):
            numeros_perfil[clave] = dato.get("numero", 0)
        elif isinstance(dato, (int, float)):
            numeros_perfil[clave] = int(dato)

    # Año personal para la fecha objetivo
    anio_personal = ServicioNumerologia._anio_personal(fecha_nac, fecha_dia)

    # Calcular multiplicador de resonancia
    multiplicador = 1.0

    sendero = numeros_perfil.get("camino_de_vida", 0)
    expresion = numeros_perfil.get("expresion", 0)
    alma = numeros_perfil.get("impulso_del_alma", 0)

    # Resonancia alta
    if dia_personal == sendero:
        multiplicador = max(multiplicador, 1.5)
    if dia_personal == anio_personal:
        multiplicador = max(multiplicador, 1.5)

    # Resonancia media
    if dia_personal == expresion:
        multiplicador = max(multiplicador, 1.25)
    if dia_personal == alma:
        multiplicador = max(multiplicador, 1.25)

    # Factor tensión
    factor_tension = 1.0
    if sendero and frozenset({dia_personal, sendero}) in TENSIONES:
        factor_tension = 0.75

    score = afinidad_base * multiplicador * factor_tension
    return max(0.0, min(10.0, round(score, 1)))


# ================================================================== #
# Score de eventos                                                   #
# ================================================================== #

def _score_eventos(eventos: dict | None, area: str) -> float:
    """Score basado en eventos notables del día (bonus/penalty)."""
    if not eventos:
        return 5.0

    puntos = 0.0

    # Fases lunares
    fase = eventos.get("fases")
    if fase == "Luna Nueva":
        if area in ("carrera", "comunicacion", "estudio"):
            puntos += 1.5  # Buen momento para inicios
        elif area == "amor":
            puntos += 1.0
    elif fase == "Luna Llena":
        if area in ("carrera", "finanzas"):
            puntos += 1.0  # Culminación
        if area in ("contratos",):
            puntos -= 0.5  # Emociones altas, no ideal para firmar

    # Cambios de signo
    for cambio in eventos.get("cambios_signo", []):
        planeta = cambio.get("planeta", "")
        # Beneficio si un planeta clave para el área cambia a signo favorable
        if planeta == "Júpiter" and area in ("carrera", "finanzas", "viajes"):
            puntos += 1.5
        elif planeta == "Venus" and area in ("amor", "finanzas"):
            puntos += 1.0
        elif planeta == "Mercurio" and area in ("comunicacion", "contratos", "estudio"):
            puntos += 0.5

    # Inicio de retrogradaciones
    for planeta in eventos.get("retrogrados_inicio", []):
        if planeta == "Mercurio" and area in ("comunicacion", "contratos", "viajes"):
            puntos -= 2.0
        elif planeta == "Venus" and area == "amor":
            puntos -= 1.5
        elif planeta == "Marte" and area in ("carrera", "salud"):
            puntos -= 1.0

    # Fin de retrogradaciones
    for planeta in eventos.get("retrogrados_fin", []):
        if planeta == "Mercurio" and area in ("comunicacion", "contratos", "viajes"):
            puntos += 1.5
        elif planeta == "Venus" and area == "amor":
            puntos += 1.0

    # Aspectos exactos
    for aspecto in eventos.get("aspectos_exactos", []):
        tipo = aspecto.get("tipo", "")
        pa = aspecto.get("planeta_a", "")
        pb = aspecto.get("planeta_b", "")
        planetas_clave = PLANETAS_CLAVE.get(area, [])

        involucra_clave = pa in planetas_clave or pb in planetas_clave
        if not involucra_clave:
            continue

        if tipo in _ARMONICOS:
            puntos += 1.0
        elif tipo in _TENSOS:
            puntos -= 0.8

    score = 5.0 + puntos
    return max(0.0, min(10.0, round(score, 1)))


# ================================================================== #
# Score final ponderado                                              #
# ================================================================== #

def calcular_score_dia(
    transito: dict,
    carta_natal: dict | None,
    perfil_cosmico: dict | None,
    area: str,
    fecha_dia: date,
) -> dict:
    """Calcula el score final ponderado de un día para un área.

    Args:
        transito: fila de transitos_diarios (planetas, aspectos, eventos, fase_lunar)
        carta_natal: datos de carta natal del usuario
        perfil_cosmico: perfil cósmico completo (incluye numerología)
        area: área de vida
        fecha_dia: fecha del día a scorear

    Returns:
        dict con scores desglosados y final
    """
    s_astro = _score_astrologico(
        transito.get("planetas", []),
        transito.get("aspectos", []),
        carta_natal if carta_natal else perfil_cosmico,
        area,
    )
    s_numero = _score_numerologico(fecha_dia, perfil_cosmico, area)
    s_eventos = _score_eventos(transito.get("eventos"), area)

    score_final = round(
        s_astro * PESO_ASTRO + s_numero * PESO_NUMERO + s_eventos * PESO_EVENTOS,
        1,
    )

    return {
        "fecha": fecha_dia.isoformat(),
        "score_final": score_final,
        "score_astro": s_astro,
        "score_numero": s_numero,
        "score_eventos": s_eventos,
        "fase_lunar": transito.get("fase_lunar", ""),
        "eventos": transito.get("eventos") or {},
    }


# ================================================================== #
# Ranking: top días y agrupación mensual                             #
# ================================================================== #

def rankear_dias(
    transitos: list[dict],
    carta_natal: dict | None,
    perfil_cosmico: dict | None,
    area: str,
    top_n: int = 5,
) -> dict:
    """Scorea una lista de tránsitos diarios y retorna ranking.

    Args:
        transitos: lista de dicts de transitos_diarios
        carta_natal: carta natal del usuario
        perfil_cosmico: perfil cósmico completo
        area: área de vida
        top_n: cantidad de mejores días a retornar

    Returns:
        dict con "mejores" (top N) y "evitar" (peores 3)
    """
    scores = []
    for t in transitos:
        fecha = t.get("fecha")
        if isinstance(fecha, str):
            fecha = date.fromisoformat(fecha)
        s = calcular_score_dia(t, carta_natal, perfil_cosmico, area, fecha)
        scores.append(s)

    scores.sort(key=lambda x: x["score_final"], reverse=True)

    return {
        "mejores": scores[:top_n],
        "evitar": sorted(scores[-3:], key=lambda x: x["score_final"]),
    }


def rankear_meses(
    transitos: list[dict],
    carta_natal: dict | None,
    perfil_cosmico: dict | None,
    area: str,
    top_n: int = 3,
) -> dict:
    """Scorea tránsitos y agrupa por mes para ranking mensual.

    Usa: promedio × 0.4 + mejor ventana consecutiva × 0.4 + días sin penalty × 0.2
    """
    # Calcular scores diarios
    scores_por_fecha: dict[str, dict] = {}
    for t in transitos:
        fecha = t.get("fecha")
        if isinstance(fecha, str):
            fecha = date.fromisoformat(fecha)
        s = calcular_score_dia(t, carta_natal, perfil_cosmico, area, fecha)
        scores_por_fecha[fecha.isoformat()] = s

    # Agrupar por mes
    meses: dict[str, list[dict]] = {}
    for fecha_str, score in scores_por_fecha.items():
        clave_mes = fecha_str[:7]  # "2026-04"
        meses.setdefault(clave_mes, []).append(score)

    ventana = VENTANA_CONSECUTIVA.get(area, 3)
    resultados_meses = []

    for clave_mes, dias in meses.items():
        dias.sort(key=lambda x: x["fecha"])
        scores_finales = [d["score_final"] for d in dias]

        # Promedio
        promedio = sum(scores_finales) / len(scores_finales)

        # Mejor ventana consecutiva
        mejor_ventana = 0.0
        mejor_ventana_inicio = ""
        if len(scores_finales) >= ventana:
            for i in range(len(scores_finales) - ventana + 1):
                avg_ventana = sum(scores_finales[i:i + ventana]) / ventana
                if avg_ventana > mejor_ventana:
                    mejor_ventana = avg_ventana
                    mejor_ventana_inicio = dias[i]["fecha"]
        else:
            mejor_ventana = promedio
            mejor_ventana_inicio = dias[0]["fecha"] if dias else ""

        # Días sin penalty (score > 4.5)
        dias_ok = sum(1 for s in scores_finales if s > 4.5)
        pct_ok = dias_ok / len(scores_finales) if scores_finales else 0

        score_mes = round(
            promedio * 0.4 + mejor_ventana * 0.4 + pct_ok * 10 * 0.2,
            1,
        )

        # Mejor día del mes
        mejor_dia = max(dias, key=lambda x: x["score_final"])

        resultados_meses.append({
            "mes": clave_mes,
            "score_mes": score_mes,
            "promedio_diario": round(promedio, 1),
            "mejor_ventana_score": round(mejor_ventana, 1),
            "mejor_ventana_inicio": mejor_ventana_inicio,
            "ventana_dias": ventana,
            "mejor_dia": mejor_dia,
            "dias_favorables": dias_ok,
            "total_dias": len(dias),
        })

    resultados_meses.sort(key=lambda x: x["score_mes"], reverse=True)

    return {
        "mejores": resultados_meses[:top_n],
        "evitar": sorted(resultados_meses[-2:], key=lambda x: x["score_mes"]),
    }


# ================================================================== #
# Formateador de resumen compacto para el prompt                     #
# ================================================================== #

_NOMBRES_MES = {
    "01": "Enero", "02": "Febrero", "03": "Marzo", "04": "Abril",
    "05": "Mayo", "06": "Junio", "07": "Julio", "08": "Agosto",
    "09": "Septiembre", "10": "Octubre", "11": "Noviembre", "12": "Diciembre",
}

_NOMBRES_AREA = {
    "carrera": "Carrera/Negocio", "viajes": "Viajes", "amor": "Amor/Relaciones",
    "finanzas": "Finanzas", "comunicacion": "Comunicación", "salud": "Salud",
    "estudio": "Estudio", "contratos": "Contratos/Firmas",
}


def formatear_resumen(ranking: dict, area: str, granularidad: str) -> str:
    """Genera resumen compacto (~400 tokens) para inyectar al prompt del oráculo."""
    nombre_area = _NOMBRES_AREA.get(area, area.capitalize())
    lineas = [f"## Análisis: {nombre_area}\n"]

    mejores = ranking.get("mejores", [])
    evitar = ranking.get("evitar", [])

    if granularidad == "dia":
        lineas.append("Mejores días:")
        for i, d in enumerate(mejores, 1):
            eventos_str = _resumir_eventos_breve(d.get("eventos", {}))
            fase = d.get("fase_lunar", "")
            extra = f", {fase}" if fase in ("Luna Nueva", "Luna Llena") else ""
            lineas.append(
                f"{i}. {d['fecha']} (score {d['score_final']}): "
                f"astro={d['score_astro']}, número={d['score_numero']}{extra}"
                f"{', ' + eventos_str if eventos_str else ''}"
            )

        if evitar:
            lineas.append("\nDías a evitar:")
            for d in evitar:
                eventos_str = _resumir_eventos_breve(d.get("eventos", {}))
                lineas.append(
                    f"- {d['fecha']} (score {d['score_final']})"
                    f"{': ' + eventos_str if eventos_str else ''}"
                )
    else:
        lineas.append("Mejores meses:")
        for i, m in enumerate(mejores, 1):
            mes_num = m["mes"].split("-")[1]
            nombre_mes = _NOMBRES_MES.get(mes_num, m["mes"])
            mejor_dia = m.get("mejor_dia", {})
            lineas.append(
                f"{i}. {nombre_mes} (score {m['score_mes']}): "
                f"promedio {m['promedio_diario']}, "
                f"mejor ventana {m['mejor_ventana_inicio']} "
                f"({m['ventana_dias']}d, score {m['mejor_ventana_score']}), "
                f"mejor día {mejor_dia.get('fecha', '?')} ({mejor_dia.get('score_final', '?')})"
            )

        if evitar:
            lineas.append("\nMeses a evitar:")
            for m in evitar:
                mes_num = m["mes"].split("-")[1]
                nombre_mes = _NOMBRES_MES.get(mes_num, m["mes"])
                lineas.append(
                    f"- {nombre_mes} (score {m['score_mes']})"
                )

    return "\n".join(lineas)


def _resumir_eventos_breve(eventos: dict) -> str:
    """Resumen de eventos en una línea corta."""
    partes = []
    for c in eventos.get("cambios_signo", []):
        partes.append(f"{c['planeta']} entra en {c['a']}")
    for p in eventos.get("retrogrados_inicio", []):
        partes.append(f"{p} retro")
    for p in eventos.get("retrogrados_fin", []):
        partes.append(f"{p} directo")
    fase = eventos.get("fases")
    if fase:
        partes.append(fase)
    return ", ".join(partes[:3])  # Máximo 3 eventos
