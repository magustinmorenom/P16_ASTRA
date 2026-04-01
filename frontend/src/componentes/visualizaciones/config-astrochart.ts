/**
 * Factory de configuración @astrodraw/astrochart — paleta ciruela ASTRA.
 *
 * Modo oscuro: fondo nocturno ciruela, arcos en degradé morado,
 * contraste sutil y premium. Sin naranja. Sin colores primarios crudos.
 *
 * Modo claro: mantenido por retrocompatibilidad pero el producto
 * siempre usa oscuro.
 */

import type { Settings } from "@astrodraw/astrochart";

// ── Arcos zodiacales por elemento — monocromáticos morados ──
// Cuatro tonos de violeta con diferencia sutil para distinguir
// elementos sin romper la atmósfera ciruela.

const FUEGO  = "#6D3FA0"; // Violeta cálido
const TIERRA = "#4A2D8C"; // Ciruela profundo
const AIRE   = "#8B5CF6"; // Violeta medio luminoso
const AGUA   = "#5B3E9E"; // Violeta intermedio

const COLORES_SIGNOS = [
  FUEGO,  TIERRA, AIRE, AGUA,   // Aries, Tauro, Géminis, Cáncer
  FUEGO,  TIERRA, AIRE, AGUA,   // Leo, Virgo, Libra, Escorpio
  FUEGO,  TIERRA, AIRE, AGUA,   // Sagitario, Capricornio, Acuario, Piscis
];

/**
 * Configuración oscura ciruela (default del producto).
 */
function configOscura(): Partial<Settings> {
  return {
    COLOR_BACKGROUND: "transparent",

    // Estructura
    CIRCLE_COLOR: "#3D2A6E",
    CIRCLE_STRONG: 2,
    LINE_COLOR: "#2D1B55",

    // Planetas
    POINTS_COLOR: "#D4C0FF",
    POINTS_TEXT_SIZE: 9,
    POINTS_STROKE: 2,

    // Signos (glifos en anillo exterior)
    SIGNS_COLOR: "#C4ADFF",
    SIGNS_STROKE: 2,

    // Arcos zodiacales
    COLOR_ARIES: COLORES_SIGNOS[0],
    COLOR_TAURUS: COLORES_SIGNOS[1],
    COLOR_GEMINI: COLORES_SIGNOS[2],
    COLOR_CANCER: COLORES_SIGNOS[3],
    COLOR_LEO: COLORES_SIGNOS[4],
    COLOR_VIRGO: COLORES_SIGNOS[5],
    COLOR_LIBRA: COLORES_SIGNOS[6],
    COLOR_SCORPIO: COLORES_SIGNOS[7],
    COLOR_SAGITTARIUS: COLORES_SIGNOS[8],
    COLOR_CAPRICORN: COLORES_SIGNOS[9],
    COLOR_AQUARIUS: COLORES_SIGNOS[10],
    COLOR_PISCES: COLORES_SIGNOS[11],
    COLORS_SIGNS: COLORES_SIGNOS,

    // Ejes cardinales
    SYMBOL_AXIS_FONT_COLOR: "#B388FF",
    SYMBOL_AXIS_STROKE: 2,

    // Cúspides (números de casas)
    CUSPS_FONT_COLOR: "#6B5A96",
    CUSPS_STROKE: 1,

    // Aspectos — únicos toques de color que rompen el monocromático
    ASPECTS: {
      conjunction: { degree: 0, orbit: 8, color: "#D4A234" },
      sextile:     { degree: 60, orbit: 6, color: "#7DD3C0" },
      square:      { degree: 90, orbit: 7, color: "#E07070" },
      trine:       { degree: 120, orbit: 8, color: "#6DD4A0" },
      opposition:  { degree: 180, orbit: 8, color: "#C084FC" },
    },
  };
}

/**
 * Configuración clara (retrocompat).
 */
function configClara(): Partial<Settings> {
  return {
    COLOR_BACKGROUND: "#ffffff",

    CIRCLE_COLOR: "#C4B8E0",
    CIRCLE_STRONG: 2,
    LINE_COLOR: "#D8CEF0",

    POINTS_COLOR: "#4A2D8C",
    POINTS_TEXT_SIZE: 9,
    POINTS_STROKE: 2,

    SIGNS_COLOR: "#4A2D8C",
    SIGNS_STROKE: 2,

    COLOR_ARIES: "#D4C0FF",
    COLOR_TAURUS: "#BEB0E0",
    COLOR_GEMINI: "#C8B8F0",
    COLOR_CANCER: "#B5A5D8",
    COLOR_LEO: "#D4C0FF",
    COLOR_VIRGO: "#BEB0E0",
    COLOR_LIBRA: "#C8B8F0",
    COLOR_SCORPIO: "#B5A5D8",
    COLOR_SAGITTARIUS: "#D4C0FF",
    COLOR_CAPRICORN: "#BEB0E0",
    COLOR_AQUARIUS: "#C8B8F0",
    COLOR_PISCES: "#B5A5D8",
    COLORS_SIGNS: [
      "#D4C0FF", "#BEB0E0", "#C8B8F0", "#B5A5D8",
      "#D4C0FF", "#BEB0E0", "#C8B8F0", "#B5A5D8",
      "#D4C0FF", "#BEB0E0", "#C8B8F0", "#B5A5D8",
    ],

    SYMBOL_AXIS_FONT_COLOR: "#7C4DFF",
    SYMBOL_AXIS_STROKE: 2,

    CUSPS_FONT_COLOR: "#9585B5",
    CUSPS_STROKE: 1,

    ASPECTS: {
      conjunction: { degree: 0, orbit: 8, color: "#B8960A" },
      sextile:     { degree: 60, orbit: 6, color: "#0E9AA7" },
      square:      { degree: 90, orbit: 7, color: "#D63031" },
      trine:       { degree: 120, orbit: 8, color: "#27AE60" },
      opposition:  { degree: 180, orbit: 8, color: "#7C3AED" },
    },
  };
}

/**
 * Crea configuración de astrochart para ASTRA.
 */
export function crearConfigAstrochart(
  claro: boolean
): Partial<Settings> {
  const base = claro ? configClara() : configOscura();

  return {
    ...base,
    MARGIN: 40,
    PADDING: 16,
    STROKE_ONLY: false,
    ADD_CLICK_AREA: true,
    COLLISION_RADIUS: 12,
    SHOW_DIGNITIES_TEXT: false,
    SYMBOL_SCALE: 1,
    DEBUG: false,
  };
}
