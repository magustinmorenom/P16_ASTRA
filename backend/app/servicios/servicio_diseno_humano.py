"""Servicio de Human Design — Body Graph completo."""

import json
import os
from collections import defaultdict
from pathlib import Path

from app.nucleo.servicio_efemerides import ServicioEfemerides
from app.registro import logger
from app.utilidades.constantes import (
    GRADO_INICIO_PUERTA_41,
    GRADOS_POR_LINEA,
    GRADOS_POR_PUERTA,
    ID_SOL,
    IDS_PLANETAS_PRINCIPALES,
    ORDEN_PUERTAS_HD,
)
from app.utilidades.convertidores import normalizar_grados

# ── Cargar datos estáticos ──
_RUTA_DATOS = Path(__file__).parent.parent / "datos_estaticos"


def _cargar_json(nombre: str) -> dict:
    with open(_RUTA_DATOS / nombre, "r", encoding="utf-8") as f:
        return json.load(f)


_TABLA_ICHING = _cargar_json("tabla_iching.json")
_PUERTAS_CENTROS = _cargar_json("puertas_centros.json")
_CANALES = _cargar_json("canales.json")

# Construir mapeo inverso: puerta → centro
_PUERTA_A_CENTRO: dict[int, str] = {}
for nombre_centro, info in _PUERTAS_CENTROS["centros"].items():
    for puerta in info["puertas"]:
        _PUERTA_A_CENTRO[puerta] = nombre_centro

# Construir mapeo de canales: frozenset de puertas → info del canal
_CANALES_MAP: dict[frozenset, dict] = {}
for canal in _CANALES["canales"]:
    clave = frozenset(canal["puertas"])
    _CANALES_MAP[clave] = canal

# Centros que son motores
_CENTROS_MOTOR = {"raiz", "sacral", "emocional", "ego"}


class ServicioDisenoHumano:
    """Calcula el Body Graph completo de Human Design."""

    @classmethod
    def calcular_diseno_completo(cls, dia_juliano: float) -> dict:
        """Calcula el diseño humano completo.

        Args:
            dia_juliano: Día juliano del nacimiento en UTC

        Returns:
            Dict con tipo, autoridad, perfil, definición, centros, canales, etc.
        """
        # 1. Fecha inconsciente (88° solares antes)
        jd_inconsciente = cls._calcular_fecha_inconsciente(dia_juliano)

        # 2. Activaciones conscientes e inconscientes
        activaciones_conscientes = cls._obtener_activaciones(dia_juliano)
        activaciones_inconscientes = cls._obtener_activaciones(jd_inconsciente)

        # 3. Todas las puertas activadas
        puertas_conscientes = {a["puerta"] for a in activaciones_conscientes}
        puertas_inconscientes = {a["puerta"] for a in activaciones_inconscientes}
        todas_las_puertas = puertas_conscientes | puertas_inconscientes

        # 4. Canales definidos
        canales_definidos = cls._determinar_canales(todas_las_puertas)

        # 5. Centros definidos
        centros = cls._determinar_centros(canales_definidos)

        # 6. Tipo
        tipo = cls._determinar_tipo(centros, canales_definidos)

        # 7. Autoridad
        autoridad = cls._determinar_autoridad(centros)

        # 8. Perfil (líneas del Sol consciente e inconsciente)
        perfil = cls._determinar_perfil(activaciones_conscientes, activaciones_inconscientes)

        # 9. Definición (componentes conexos)
        definicion = cls._determinar_definicion(centros, canales_definidos)

        # 10. Cruz de encarnación
        cruz = cls._determinar_cruz_encarnacion(activaciones_conscientes, activaciones_inconscientes)

        return {
            "tipo": tipo,
            "autoridad": autoridad,
            "perfil": perfil,
            "definicion": definicion,
            "cruz_encarnacion": cruz,
            "centros": centros,
            "canales": [
                {
                    "puertas": sorted(list(c["puertas"])),
                    "nombre": c.get("nombre", ""),
                    "centros": c.get("centros_conectados", []),
                }
                for c in canales_definidos
            ],
            "activaciones_conscientes": activaciones_conscientes,
            "activaciones_inconscientes": activaciones_inconscientes,
            "puertas_conscientes": sorted(list(puertas_conscientes)),
            "puertas_inconscientes": sorted(list(puertas_inconscientes)),
            "dia_juliano_consciente": round(dia_juliano, 6),
            "dia_juliano_inconsciente": round(jd_inconsciente, 6),
        }

    @classmethod
    def _calcular_fecha_inconsciente(cls, jd_nacimiento: float) -> float:
        """Retrocede 88° eclípticos del Sol — NO 88 días.

        Usa búsqueda binaria sobre la longitud solar.
        """
        lon_natal = ServicioEfemerides.obtener_longitud_solar(jd_nacimiento)
        lon_objetivo = normalizar_grados(lon_natal - 88.0)

        # Estimación: ~88 días antes (Sol ≈ 1°/día)
        jd_estimado = jd_nacimiento - 88.0

        jd_inconsciente = ServicioEfemerides.buscar_fecha_por_longitud_solar(
            lon_objetivo, jd_estimado, precision=0.0001
        )

        logger.debug(
            "HD fecha inconsciente: JD natal=%.4f (lon=%.4f°) → JD inc=%.4f (lon obj=%.4f°)",
            jd_nacimiento, lon_natal, jd_inconsciente, lon_objetivo,
        )
        return jd_inconsciente

    @classmethod
    def _obtener_activaciones(cls, dia_juliano: float) -> list[dict]:
        """Obtiene las activaciones de los 13 cuerpos para un JD.

        13 cuerpos = 10 planetas principales + Tierra (Sol + 180°) + Nodo Norte + Nodo Sur
        En HD se usan: Sol, Tierra, Luna, Nodo Norte, Nodo Sur,
        Mercurio, Venus, Marte, Júpiter, Saturno, Urano, Neptuno, Plutón
        """
        activaciones = []

        for id_planeta in IDS_PLANETAS_PRINCIPALES:
            pos = ServicioEfemerides.calcular_posicion_planeta(dia_juliano, id_planeta)
            puerta, linea = cls._mapear_longitud_a_puerta_linea(pos.longitud)
            activaciones.append({
                "planeta": pos.nombre,
                "longitud": round(pos.longitud, 4),
                "puerta": puerta,
                "linea": linea,
                "color": cls._calcular_color(pos.longitud),
            })

            # Tierra = Sol + 180° (solo para el Sol)
            if id_planeta == ID_SOL:
                lon_tierra = normalizar_grados(pos.longitud + 180.0)
                puerta_t, linea_t = cls._mapear_longitud_a_puerta_linea(lon_tierra)
                activaciones.append({
                    "planeta": "Tierra",
                    "longitud": round(lon_tierra, 4),
                    "puerta": puerta_t,
                    "linea": linea_t,
                    "color": cls._calcular_color(lon_tierra),
                })

        # Nodo Norte y Nodo Sur (11 = true node)
        nodo_norte = ServicioEfemerides.calcular_posicion_planeta(dia_juliano, 11)
        puerta_nn, linea_nn = cls._mapear_longitud_a_puerta_linea(nodo_norte.longitud)
        activaciones.append({
            "planeta": "Nodo Norte",
            "longitud": round(nodo_norte.longitud, 4),
            "puerta": puerta_nn,
            "linea": linea_nn,
            "color": cls._calcular_color(nodo_norte.longitud),
        })

        lon_ns = normalizar_grados(nodo_norte.longitud + 180.0)
        puerta_ns, linea_ns = cls._mapear_longitud_a_puerta_linea(lon_ns)
        activaciones.append({
            "planeta": "Nodo Sur",
            "longitud": round(lon_ns, 4),
            "puerta": puerta_ns,
            "linea": linea_ns,
            "color": cls._calcular_color(lon_ns),
        })

        return activaciones

    @staticmethod
    def _mapear_longitud_a_puerta_linea(longitud: float) -> tuple[int, int]:
        """Mapea una longitud eclíptica a puerta y línea del I Ching.

        El mandala empieza en 332.0° con la puerta 41.
        Cada puerta ocupa 5.625°. Cada línea 0.9375°.
        """
        # Offset desde el inicio del mandala
        offset = normalizar_grados(longitud - GRADO_INICIO_PUERTA_41)

        # Índice de puerta (0-63)
        indice_puerta = int(offset / GRADOS_POR_PUERTA) % 64
        puerta = ORDEN_PUERTAS_HD[indice_puerta]

        # Línea dentro de la puerta (1-6)
        offset_en_puerta = offset % GRADOS_POR_PUERTA
        linea = int(offset_en_puerta / GRADOS_POR_LINEA) + 1
        linea = min(linea, 6)  # Clamp a 6

        return puerta, linea

    @staticmethod
    def _calcular_color(longitud: float) -> int:
        """Calcula el color (1-6) dentro de la línea."""
        offset = normalizar_grados(longitud - GRADO_INICIO_PUERTA_41)
        offset_en_linea = offset % GRADOS_POR_LINEA
        grados_por_color = GRADOS_POR_LINEA / 6
        color = int(offset_en_linea / grados_por_color) + 1
        return min(color, 6)

    @classmethod
    def _determinar_canales(cls, puertas_activadas: set[int]) -> list[dict]:
        """Determina qué canales están definidos.

        Un canal está definido si ambas puertas están activadas.
        """
        canales_definidos = []

        for canal in _CANALES["canales"]:
            p1, p2 = canal["puertas"]
            if p1 in puertas_activadas and p2 in puertas_activadas:
                canales_definidos.append({
                    "puertas": frozenset([p1, p2]),
                    "nombre": canal.get("nombre", ""),
                    "centros_conectados": canal["centros"],
                })

        return canales_definidos

    @classmethod
    def _determinar_centros(cls, canales_definidos: list[dict]) -> dict:
        """Determina qué centros están definidos o abiertos.

        Un centro está definido si al menos un canal que lo conecta está definido.
        """
        centros_definidos = set()
        for canal in canales_definidos:
            for centro in canal["centros_conectados"]:
                centros_definidos.add(centro)

        todos_los_centros = list(_PUERTAS_CENTROS["centros"].keys())
        resultado = {}
        for centro in todos_los_centros:
            resultado[centro] = "definido" if centro in centros_definidos else "abierto"

        return resultado

    @classmethod
    def _determinar_tipo(cls, centros: dict, canales_definidos: list[dict]) -> str:
        """Determina el Tipo de Human Design.

        Jerarquía:
        1. Reflector: 0 centros definidos
        2. Generador/Gen. Manifestante: Sacral definido
        3. Manifestador: Motor conectado a Garganta (sin Sacral)
        4. Proyector: Todo lo demás
        """
        centros_definidos = {c for c, estado in centros.items() if estado == "definido"}

        # Reflector
        if not centros_definidos:
            return "Reflector"

        sacral_definido = "sacral" in centros_definidos

        if sacral_definido:
            # Verificar si hay conexión motor→garganta para Gen. Manifestante
            if cls._hay_conexion_motor_garganta(centros_definidos, canales_definidos):
                return "Generador Manifestante"
            return "Generador"

        # Sin sacral: verificar motor→garganta para Manifestador
        if cls._hay_conexion_motor_garganta(centros_definidos, canales_definidos):
            return "Manifestador"

        return "Proyector"

    @classmethod
    def _hay_conexion_motor_garganta(
        cls,
        centros_definidos: set[str],
        canales_definidos: list[dict],
    ) -> bool:
        """BFS para verificar si hay ruta motor → garganta a través de centros definidos."""
        if "garganta" not in centros_definidos:
            return False

        motores_definidos = _CENTROS_MOTOR & centros_definidos
        if not motores_definidos:
            return False

        # Construir grafo de adyacencia entre centros definidos
        grafo: dict[str, set[str]] = defaultdict(set)
        for canal in canales_definidos:
            c1, c2 = canal["centros_conectados"]
            if c1 in centros_definidos and c2 in centros_definidos:
                grafo[c1].add(c2)
                grafo[c2].add(c1)

        # BFS desde cada motor hacia garganta
        for motor in motores_definidos:
            visitados = set()
            cola = [motor]
            while cola:
                actual = cola.pop(0)
                if actual == "garganta":
                    return True
                if actual in visitados:
                    continue
                visitados.add(actual)
                for vecino in grafo[actual]:
                    if vecino not in visitados:
                        cola.append(vecino)

        return False

    @staticmethod
    def _determinar_autoridad(centros: dict) -> str:
        """Determina la Autoridad interna.

        Jerarquía: Emocional > Sacral > Esplénica > Ego > Self > Lunar > Entorno
        """
        if centros.get("emocional") == "definido":
            return "Emocional"
        if centros.get("sacral") == "definido":
            return "Sacral"
        if centros.get("esplenico") == "definido":
            return "Esplénica"
        if centros.get("ego") == "definido":
            return "Ego Manifestado"

        centros_definidos = {c for c, e in centros.items() if e == "definido"}
        if centros_definidos:
            # Self-projected (G definido y conectado a garganta)
            if "g" in centros_definidos:
                return "Self Proyectada"
            return "Entorno"

        # Reflector — ningún centro definido
        return "Lunar"

    @staticmethod
    def _determinar_perfil(
        activaciones_conscientes: list[dict],
        activaciones_inconscientes: list[dict],
    ) -> str:
        """Determina el perfil a partir de las líneas del Sol.

        Perfil = línea Sol consciente / línea Sol inconsciente.
        """
        linea_consciente = None
        linea_inconsciente = None

        for a in activaciones_conscientes:
            if a["planeta"] == "Sol":
                linea_consciente = a["linea"]
                break

        for a in activaciones_inconscientes:
            if a["planeta"] == "Sol":
                linea_inconsciente = a["linea"]
                break

        if linea_consciente and linea_inconsciente:
            return f"{linea_consciente}/{linea_inconsciente}"
        return "desconocido"

    @classmethod
    def _determinar_definicion(cls, centros: dict, canales_definidos: list[dict]) -> str:
        """Determina el tipo de Definición (componentes conexos del grafo de centros).

        - Sin definición: Reflector
        - Definición Simple: 1 componente
        - Definición Partida: 2 componentes
        - Definición Triple: 3 componentes
        - Definición Cuádruple: 4+ componentes
        """
        centros_definidos = {c for c, e in centros.items() if e == "definido"}
        if not centros_definidos:
            return "Sin Definición"

        # Construir grafo
        grafo: dict[str, set[str]] = defaultdict(set)
        for canal in canales_definidos:
            c1, c2 = canal["centros_conectados"]
            if c1 in centros_definidos and c2 in centros_definidos:
                grafo[c1].add(c2)
                grafo[c2].add(c1)

        # Contar componentes conexos
        visitados = set()
        componentes = 0

        for centro in centros_definidos:
            if centro not in visitados:
                componentes += 1
                cola = [centro]
                while cola:
                    actual = cola.pop(0)
                    if actual in visitados:
                        continue
                    visitados.add(actual)
                    for vecino in grafo[actual]:
                        if vecino not in visitados:
                            cola.append(vecino)

        nombres = {
            1: "Definición Simple",
            2: "Definición Partida",
            3: "Definición Triple",
        }
        return nombres.get(componentes, "Definición Cuádruple")

    @staticmethod
    def _determinar_cruz_encarnacion(
        activaciones_conscientes: list[dict],
        activaciones_inconscientes: list[dict],
    ) -> dict:
        """Determina la Cruz de Encarnación.

        4 puertas: Sol+Tierra consciente, Sol+Tierra inconsciente.
        """
        sol_con = tierra_con = sol_inc = tierra_inc = None

        for a in activaciones_conscientes:
            if a["planeta"] == "Sol":
                sol_con = a["puerta"]
            elif a["planeta"] == "Tierra":
                tierra_con = a["puerta"]

        for a in activaciones_inconscientes:
            if a["planeta"] == "Sol":
                sol_inc = a["puerta"]
            elif a["planeta"] == "Tierra":
                tierra_inc = a["puerta"]

        return {
            "puertas": [sol_con, tierra_con, sol_inc, tierra_inc],
            "sol_consciente": sol_con,
            "tierra_consciente": tierra_con,
            "sol_inconsciente": sol_inc,
            "tierra_inconsciente": tierra_inc,
        }
