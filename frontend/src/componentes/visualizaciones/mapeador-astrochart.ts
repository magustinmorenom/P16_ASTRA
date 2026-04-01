/**
 * Mapeador ASTRA → @astrodraw/astrochart.
 * Convierte datos en español (Planeta[], Casa[]) al formato inglés de la librería.
 */

import type { Planeta, Casa } from "@/lib/tipos";

// ── Mapeo de nombres español → inglés ──

const NOMBRE_ES_A_EN: Record<string, string> = {
  sol: "Sun",
  luna: "Moon",
  mercurio: "Mercury",
  venus: "Venus",
  marte: "Mars",
  jupiter: "Jupiter",
  saturno: "Saturn",
  urano: "Uranus",
  neptuno: "Neptune",
  pluton: "Pluto",
  "nodo norte": "NNode",
  "nodo sur": "SNode",
  quiron: "Chiron",
  lilith: "Lilith",
};

const NOMBRE_EN_A_ES: Record<string, string> = {};
for (const [es, en] of Object.entries(NOMBRE_ES_A_EN)) {
  NOMBRE_EN_A_ES[en] = es;
}

/** Normaliza un nombre (quita acentos, minúsculas). */
function normalizar(nombre: string): string {
  return nombre
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

/** Convierte nombre español → clave inglesa de astrochart. */
export function nombreEspanolAIngles(nombre: string): string {
  return NOMBRE_ES_A_EN[normalizar(nombre)] ?? nombre;
}

/** Convierte nombre inglés de astrochart → nombre español original. */
export function nombreInglesAEspanol(nombreIngles: string): string {
  const clave = NOMBRE_EN_A_ES[nombreIngles];
  if (!clave) return nombreIngles;

  // Reconstituir con mayúscula y acentos originales
  const DISPLAY: Record<string, string> = {
    sol: "Sol",
    luna: "Luna",
    mercurio: "Mercurio",
    venus: "Venus",
    marte: "Marte",
    jupiter: "Júpiter",
    saturno: "Saturno",
    urano: "Urano",
    neptuno: "Neptuno",
    pluton: "Plutón",
    "nodo norte": "Nodo Norte",
    "nodo sur": "Nodo Sur",
    quiron: "Quirón",
    lilith: "Lilith",
  };
  return DISPLAY[clave] ?? nombreIngles;
}

/**
 * Mapea planetas ASTRA → formato astrochart.
 * @returns Record<string, number[]> — { "Sun": [longitud, velocidad], ... }
 */
export function mapearPlanetas(
  planetas: Planeta[]
): Record<string, number[]> {
  const resultado: Record<string, number[]> = {};

  for (const p of planetas) {
    const clave = nombreEspanolAIngles(p.nombre);
    resultado[clave] = [p.longitud, p.velocidad];
  }

  return resultado;
}

/**
 * Mapea casas ASTRA → array de 12 cúspides (longitudes 0-360).
 * Ordenadas por número de casa (1-12).
 */
export function mapearCuspides(casas: Casa[]): number[] {
  const ordenadas = [...casas].sort((a, b) => a.numero - b.numero);
  return ordenadas.map((c) => c.grado);
}
