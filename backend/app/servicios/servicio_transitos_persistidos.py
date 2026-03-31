"""Servicio de tránsitos persistidos — ventana deslizante 1 año."""

from datetime import date, datetime, timedelta

import pytz

from app.datos.repositorio_transito import RepositorioTransito
from app.nucleo.servicio_efemerides import ServicioEfemerides
from app.nucleo.servicio_zona_horaria import ServicioZonaHoraria
from app.registro import logger
from app.utilidades.constantes import ASPECTOS
from app.utilidades.convertidores import diferencia_angular

# Ventana por defecto: 365 días hacia adelante
DIAS_VENTANA_FUTURO = 365
# Retención máxima: 5 años hacia atrás
DIAS_RETENCION_PASADO = 365 * 5


def calcular_fase_lunar(lon_sol: float, lon_luna: float) -> str:
    """Calcula la fase lunar según la distancia angular Sol-Luna."""
    diff = (lon_luna - lon_sol) % 360
    if diff < 15:
        return "Luna Nueva"
    elif diff < 85:
        return "Creciente"
    elif diff < 95:
        return "Cuarto Creciente"
    elif diff < 175:
        return "Gibosa Creciente"
    elif diff < 185:
        return "Luna Llena"
    elif diff < 265:
        return "Gibosa Menguante"
    elif diff < 275:
        return "Cuarto Menguante"
    else:
        return "Menguante"


def calcular_aspectos_entre_planetas(planetas: list[dict]) -> list[dict]:
    """Calcula aspectos entre todos los pares de planetas en tránsito."""
    aspectos_resultado = []
    cantidad = len(planetas)

    for i in range(cantidad):
        for j in range(i + 1, cantidad):
            pa = planetas[i]
            pb = planetas[j]
            diff = diferencia_angular(pa["longitud"], pb["longitud"])

            for nombre, config in ASPECTOS.items():
                orbe = abs(diff - config["angulo"])
                if orbe <= config["orbe"]:
                    aspectos_resultado.append({
                        "planeta_a": pa["nombre"],
                        "planeta_b": pb["nombre"],
                        "tipo": nombre,
                        "angulo": round(diff, 4),
                        "orbe": round(orbe, 4),
                    })

    return aspectos_resultado


def calcular_transito_para_fecha(fecha: date) -> dict:
    """Calcula planetas, aspectos y fase lunar para una fecha (mediodía UTC).

    Retorna un dict listo para persistir como TransitoDiario.
    """
    mediodia_utc = datetime(
        fecha.year, fecha.month, fecha.day, 12, 0, 0, tzinfo=pytz.UTC
    )
    jd = ServicioZonaHoraria.calcular_dia_juliano(mediodia_utc)
    planetas_pos = ServicioEfemerides.calcular_todos_los_planetas(jd)

    planetas_dict = [
        {
            "nombre": p.nombre,
            "longitud": round(p.longitud, 4),
            "latitud": round(p.latitud, 4),
            "signo": p.signo,
            "grado_en_signo": round(p.grado_en_signo, 4),
            "retrogrado": p.retrogrado,
            "velocidad": round(p.velocidad, 4),
        }
        for p in planetas_pos
    ]

    # Fase lunar
    sol = next(p for p in planetas_dict if p["nombre"] == "Sol")
    luna = next(p for p in planetas_dict if p["nombre"] == "Luna")
    fase = calcular_fase_lunar(sol["longitud"], luna["longitud"])

    # Aspectos entre planetas en tránsito
    aspectos = calcular_aspectos_entre_planetas(planetas_dict)

    return {
        "fecha": fecha,
        "dia_juliano": round(jd, 6),
        "planetas": planetas_dict,
        "aspectos": aspectos,
        "fase_lunar": fase,
    }


def calcular_eventos(planetas_hoy: list[dict], planetas_ayer: list[dict] | None, fase_lunar: str) -> dict:
    """Calcula eventos notables comparando día actual con día anterior.

    Detecta: cambios de signo, inicio/fin retrogradaciones,
    aspectos exactos (orbe < 1°), fases lunares principales.
    """
    eventos: dict = {
        "cambios_signo": [],
        "retrogrados_inicio": [],
        "retrogrados_fin": [],
        "aspectos_exactos": [],
        "fases": None,
    }

    # Fases principales
    if fase_lunar in ("Luna Nueva", "Luna Llena"):
        eventos["fases"] = fase_lunar

    # Sin día anterior no podemos comparar cambios
    if planetas_ayer is None:
        # Aun así incluir aspectos exactos
        aspectos = calcular_aspectos_entre_planetas(planetas_hoy)
        eventos["aspectos_exactos"] = [a for a in aspectos if a["orbe"] < 1.0]
        return eventos

    # Indexar ayer por nombre
    ayer_por_nombre = {p["nombre"]: p for p in planetas_ayer}

    for p_hoy in planetas_hoy:
        nombre = p_hoy["nombre"]
        p_ayer = ayer_por_nombre.get(nombre)
        if p_ayer is None:
            continue

        # Cambio de signo
        if p_hoy["signo"] != p_ayer["signo"]:
            eventos["cambios_signo"].append({
                "planeta": nombre,
                "de": p_ayer["signo"],
                "a": p_hoy["signo"],
            })

        # Inicio retrogradación (ayer directo, hoy retrógrado)
        if not p_ayer["retrogrado"] and p_hoy["retrogrado"]:
            eventos["retrogrados_inicio"].append(nombre)

        # Fin retrogradación (ayer retrógrado, hoy directo)
        if p_ayer["retrogrado"] and not p_hoy["retrogrado"]:
            eventos["retrogrados_fin"].append(nombre)

    # Aspectos exactos (orbe < 1°)
    aspectos = calcular_aspectos_entre_planetas(planetas_hoy)
    eventos["aspectos_exactos"] = [a for a in aspectos if a["orbe"] < 1.0]

    return eventos


def _determinar_estado(fecha: date, hoy: date) -> str:
    """Determina el estado de un tránsito según la fecha."""
    if fecha < hoy:
        return "pasado"
    elif fecha == hoy:
        return "presente"
    else:
        return "futuro"


async def verificar_y_completar_ventana(repo: RepositorioTransito) -> int:
    """Verifica la ventana deslizante y rellena los días faltantes.

    - Detecta gaps en la ventana futura (hoy + 365)
    - Rellena los días que faltan
    - Rota estados (pasado/presente/futuro)
    - Es idempotente: llamar 2 veces no duplica filas

    Retorna la cantidad de días insertados.
    """
    hoy = date.today()
    fecha_objetivo = hoy + timedelta(days=DIAS_VENTANA_FUTURO)

    # 1. Rotar estados
    await repo.actualizar_estados(hoy)

    # 2. Detectar hasta dónde llega la ventana actual
    ultima_futuro = await repo.obtener_ultima_fecha_futuro()

    if ultima_futuro and ultima_futuro >= fecha_objetivo:
        logger.debug("Ventana de tránsitos completa hasta %s", fecha_objetivo)
        return 0

    # 3. Calcular desde dónde rellenar
    fecha_inicio_relleno = (ultima_futuro + timedelta(days=1)) if ultima_futuro else hoy

    # Si no hay nada, también necesitamos el presente
    if ultima_futuro is None:
        primera = await repo.obtener_primera_fecha()
        if primera is None:
            # DB vacía: no rellenamos atrás aquí (eso lo hace el script de carga)
            fecha_inicio_relleno = hoy

    # 4. Calcular y preparar lote
    datos_lote = []
    fecha_actual = fecha_inicio_relleno
    while fecha_actual <= fecha_objetivo:
        transito = calcular_transito_para_fecha(fecha_actual)
        transito["estado"] = _determinar_estado(fecha_actual, hoy)
        datos_lote.append(transito)
        fecha_actual += timedelta(days=1)

    if not datos_lote:
        return 0

    # 5. Insertar en lote (ON CONFLICT DO NOTHING para idempotencia)
    insertados = await repo.crear_lote(datos_lote)
    logger.info(
        "Ventana de tránsitos: %d días insertados (rango %s → %s)",
        insertados,
        datos_lote[0]["fecha"],
        datos_lote[-1]["fecha"],
    )

    return insertados


async def purgar_transitos_antiguos(repo: RepositorioTransito) -> int:
    """Elimina tránsitos con más de 5 años de antigüedad."""
    fecha_limite = date.today() - timedelta(days=DIAS_RETENCION_PASADO)
    eliminados = await repo.purgar_antiguos(fecha_limite)
    if eliminados > 0:
        logger.info("Purga de tránsitos: %d filas eliminadas (anteriores a %s)", eliminados, fecha_limite)
    return eliminados
