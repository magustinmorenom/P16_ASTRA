import type { ColorSchemeName } from "react-native";

type GradienteTriple = readonly [string, string, string];

export interface TokensColor {
  fondo: string;
  fondoSecundario: string;
  superficie: string;
  superficieHover: string;
  fondoTarjeta: string;
  primario: string;
  secundario: string;
  acento: string;
  acentoHover: string;
  textoBase: string;
  textoSecundario: string;
  textoMuted: string;
  borde: string;
  exito: string;
  error: string;
  advertencia: string;
  vidrioFondo: string;
  vidrioBorde: string;
  vidrioOverlay: string;
  tabBarFondo: string;
  tabBarBorde: string;
  tabBarActivo: string;
  tabBarInactivo: string;
  gradienteFondo: GradienteTriple;
  gradienteHero: GradienteTriple;
  svgFondoCentro: string;
  svgStrokePrincipal: string;
  svgStrokeSecundario: string;
  svgTexto: string;
}

// ── Tokens semánticos — Modo Claro ───────────────────────────────────────

export const ColoresClaro: TokensColor = {
  fondo: "#F7F3FC",
  fondoSecundario: "#EEE7F8",
  superficie: "#FFFFFF",
  superficieHover: "#F6F2FC",
  fondoTarjeta: "#FFFFFF",
  primario: "#2C2926",
  secundario: "#7C4DFF",
  acento: "#7C4DFF",
  acentoHover: "#6D28D9",
  textoBase: "#2C2926",
  textoSecundario: "#6B7280",
  textoMuted: "#9CA3AF",
  borde: "#E5E7EB",
  exito: "#059669",
  error: "#DC2626",
  advertencia: "#D96B83",

  vidrioFondo: "rgba(255, 255, 255, 0.72)",
  vidrioBorde: "rgba(124, 77, 255, 0.12)",
  vidrioOverlay: "rgba(255, 255, 255, 0.24)",

  tabBarFondo: "rgba(247, 243, 252, 0.9)",
  tabBarBorde: "rgba(124, 77, 255, 0.14)",
  tabBarActivo: "#7C4DFF",
  tabBarInactivo: "#9CA3AF",

  gradienteFondo: ["#F7F3FC", "#EEE7F8", "#F8F6FC"],
  gradienteHero: ["#F2EBFE", "#E8DDFB", "#F7F3FC"],

  svgFondoCentro: "#FFFFFF",
  svgStrokePrincipal: "#7C4DFF",
  svgStrokeSecundario: "#E5E7EB",
  svgTexto: "#2C2926",
};

// ── Tokens semánticos — Modo Oscuro ──────────────────────────────────────

export const ColoresOscuro: TokensColor = {
  fondo: "#0a0a1a",
  fondoSecundario: "#111128",
  superficie: "#1a1a3e",
  superficieHover: "#252550",
  fondoTarjeta: "#0F0826",
  primario: "#e0d4fc",
  secundario: "#a78bfa",
  acento: "#c084fc",
  acentoHover: "#a855f7",
  textoBase: "#e0d4fc",
  textoSecundario: "#9ca3af",
  textoMuted: "#6b7280",
  borde: "#2a2a5a",
  exito: "#34d399",
  error: "#f87171",
  advertencia: "#F39AA9",

  vidrioFondo: "rgba(26, 26, 62, 0.6)",
  vidrioBorde: "rgba(192, 132, 252, 0.15)",
  vidrioOverlay: "rgba(26, 26, 62, 0.3)",

  tabBarFondo: "rgba(17, 17, 40, 0.85)",
  tabBarBorde: "rgba(42, 42, 90, 0.5)",
  tabBarActivo: "#c084fc",
  tabBarInactivo: "#6b7280",

  gradienteFondo: ["#0a0a1a", "#111128", "#0a0a1a"],
  gradienteHero: ["#1a1a3e", "#2a1a5e", "#0a0a1a"],

  svgFondoCentro: "#1a1a3e",
  svgStrokePrincipal: "#c084fc",
  svgStrokeSecundario: "#2a2a5a",
  svgTexto: "#e0d4fc",
};

/** Obtener paleta según esquema activo */
export function obtenerColores(esquema: ColorSchemeName): TokensColor {
  return esquema === "dark" ? ColoresOscuro : ColoresClaro;
}

/** Alias backward-compatible (oscuro por defecto) — para imports existentes */
export const Colores = ColoresOscuro;
