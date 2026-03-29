import type { ColorSchemeName } from "react-native";

// ── Tokens semánticos — Modo Claro ───────────────────────────────────────

export const ColoresClaro = {
  fondo: '#FAFAFA',
  fondoSecundario: '#F0EEF6',
  superficie: '#FFFFFF',
  superficieHover: '#F5F3FF',
  primario: '#2C2926',
  secundario: '#7C4DFF',
  acento: '#7C4DFF',
  acentoHover: '#6D28D9',
  textoBase: '#2C2926',
  textoSecundario: '#6B7280',
  textoMuted: '#9CA3AF',
  borde: '#E5E7EB',
  exito: '#059669',
  error: '#DC2626',
  advertencia: '#D97706',

  // Glassmorphism
  vidrioFondo: 'rgba(255, 255, 255, 0.6)',
  vidrioBorde: 'rgba(255, 255, 255, 0.3)',
  vidrioOverlay: 'rgba(255, 255, 255, 0.15)',

  // Tab Bar
  tabBarFondo: 'rgba(250, 250, 250, 0.85)',
  tabBarBorde: 'rgba(0, 0, 0, 0.08)',
  tabBarActivo: '#7C4DFF',
  tabBarInactivo: '#9CA3AF',

  // Gradientes
  gradienteFondo: ['#FAFAFA', '#F0EEF6', '#FAFAFA'] as const,
  gradienteHero: ['#F5F3FF', '#EDE9FE', '#FAFAFA'] as const,

  // SVG / Visualizaciones
  svgFondoCentro: '#FFFFFF',
  svgStrokePrincipal: '#7C4DFF',
  svgStrokeSecundario: '#E5E7EB',
  svgTexto: '#2C2926',
} as const;

// ── Tokens semánticos — Modo Oscuro ──────────────────────────────────────

export const ColoresOscuro = {
  fondo: '#0a0a1a',
  fondoSecundario: '#111128',
  superficie: '#1a1a3e',
  superficieHover: '#252550',
  primario: '#e0d4fc',
  secundario: '#a78bfa',
  acento: '#c084fc',
  acentoHover: '#a855f7',
  textoBase: '#e0d4fc',
  textoSecundario: '#9ca3af',
  textoMuted: '#6b7280',
  borde: '#2a2a5a',
  exito: '#34d399',
  error: '#f87171',
  advertencia: '#fbbf24',

  // Glassmorphism
  vidrioFondo: 'rgba(26, 26, 62, 0.6)',
  vidrioBorde: 'rgba(192, 132, 252, 0.15)',
  vidrioOverlay: 'rgba(26, 26, 62, 0.3)',

  // Tab Bar
  tabBarFondo: 'rgba(17, 17, 40, 0.85)',
  tabBarBorde: 'rgba(42, 42, 90, 0.5)',
  tabBarActivo: '#c084fc',
  tabBarInactivo: '#6b7280',

  // Gradientes
  gradienteFondo: ['#0a0a1a', '#111128', '#0a0a1a'] as const,
  gradienteHero: ['#1a1a3e', '#2a1a5e', '#0a0a1a'] as const,

  // SVG / Visualizaciones
  svgFondoCentro: '#1a1a3e',
  svgStrokePrincipal: '#c084fc',
  svgStrokeSecundario: '#2a2a5a',
  svgTexto: '#e0d4fc',
} as const;

export type TokensColor = typeof ColoresClaro;

/** Obtener paleta según esquema activo */
export function obtenerColores(esquema: ColorSchemeName): TokensColor {
  return esquema === 'dark' ? ColoresOscuro : ColoresClaro;
}

/** Alias backward-compatible (oscuro por defecto) — para imports existentes */
export const Colores = ColoresOscuro;
