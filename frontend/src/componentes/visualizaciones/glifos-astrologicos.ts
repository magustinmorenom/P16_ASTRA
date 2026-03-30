/**
 * Glifos astrologicos como SVG path data.
 * Cada glifo esta normalizado a viewBox 0 0 24 24.
 * Se usan inline dentro de <svg> para evitar Unicode y mantener vectores crisp.
 */

// ---------------------------------------------------------------------------
// Signos zodiacales — path data (viewBox 0 0 24 24)
// ---------------------------------------------------------------------------

export const GLIFOS_SIGNOS: Record<string, string> = {
  // Aries: cuernos de carnero
  Aries:
    "M6 20C6 12 8 6 12 4C16 6 18 12 18 20M12 4V14",
  // Tauro: circulo con cuernos
  Tauro:
    "M6 6C6 4 8 2 12 2C16 2 18 4 18 6M8 8A6 6 0 1 0 16 8",
  // Geminis: pilares gemelos
  Geminis:
    "M6 4H18M6 20H18M9 4V20M15 4V20",
  // Cancer: pinzas de cangrejo (69 rotado)
  "Cáncer":
    "M4 10A4 4 0 0 1 12 10A4 4 0 0 1 20 10M20 14A4 4 0 0 1 12 14A4 4 0 0 1 4 14",
  // Leo: cola de leon
  Leo:
    "M6 14A4 4 0 1 1 10 14A4 4 0 0 0 14 10C14 6 16 4 18 4M18 4V8",
  // Virgo: M con cola
  Virgo:
    "M4 18V6L8 18V6L12 18V6C12 6 16 8 16 12C16 16 20 18 20 14",
  // Libra: balanza
  Libra:
    "M4 16H20M12 16V10M6 10C6 6 12 6 12 10M12 10C12 6 18 6 18 10",
  // Escorpio: M con flecha
  Escorpio:
    "M4 18V6L8 18V6L12 18V6L16 18L20 14M18 16L20 14L18 12",
  // Sagitario: flecha diagonal
  Sagitario:
    "M4 20L20 4M20 4V12M20 4H12",
  // Capricornio: cabra-pez
  Capricornio:
    "M4 4V14C4 18 8 18 8 14V8C8 8 12 10 12 14C12 18 16 20 20 18A4 4 0 0 0 16 14",
  // Acuario: ondas de agua
  Acuario:
    "M4 10L7 7L10 10L13 7L16 10L19 7M4 16L7 13L10 16L13 13L16 16L19 13",
  // Piscis: dos arcos con barra
  Piscis:
    "M4 4C8 4 12 8 12 12C12 16 8 20 4 20M20 4C16 4 12 8 12 12C12 16 16 20 20 20M4 12H20",
};

// ---------------------------------------------------------------------------
// Planetas — path data (viewBox 0 0 24 24)
// ---------------------------------------------------------------------------

export const GLIFOS_PLANETAS: Record<string, string> = {
  // Sol: circulo con punto
  Sol:
    "M12 5a7 7 0 1 0 0 14a7 7 0 0 0 0-14ZM12 10a2 2 0 1 0 0 4a2 2 0 0 0 0-4Z",
  // Luna: cuarto creciente
  Luna:
    "M15 4A8 8 0 1 0 15 20A6 6 0 0 1 15 4Z",
  // Mercurio: circulo + cruz + cuernos
  Mercurio:
    "M12 8a4 4 0 1 0 0 8a4 4 0 0 0 0-8ZM12 16v5M9 19h6M8 5a4 3 0 0 1 8 0",
  // Venus: circulo + cruz
  Venus:
    "M12 3a5 5 0 1 0 0 10a5 5 0 0 0 0-10ZM12 13v7M9 17h6",
  // Marte: circulo + flecha NE
  Marte:
    "M10 14a6 6 0 1 0 0-0.01ZM14 10L20 4M20 4v5M20 4h-5",
  // Jupiter: cruz con arco
  "Júpiter":
    "M4 10h12M10 4v16M16 4c0 0-2 4-6 6",
  // Saturno: cruz + arco superior
  Saturno:
    "M8 20L8 8C8 4 14 2 16 6M6 12h8",
  // Urano: circulo + H + antena
  Urano:
    "M12 14a2 2 0 1 0 0 4a2 2 0 0 0 0-4ZM12 14V6M8 6v6M16 6v6M12 6V2",
  // Neptuno: tridente
  Neptuno:
    "M12 6v14M6 6v6M18 6v6M6 6C6 2 12 2 12 6C12 2 18 2 18 6M6 18h12",
  // Pluton: circulo + arco + cruz
  "Plutón":
    "M12 10a4 4 0 1 1 0-0.01ZM8 6C8 2 16 2 16 6M12 14v6M9 17h6",
  // Nodo Norte: omega con patas
  "Nodo Norte":
    "M6 18V12A6 6 0 0 1 18 12V18M6 12A6 6 0 0 0 18 12",
  // Nodo Sur: omega invertido
  "Nodo Sur":
    "M6 6V12A6 6 0 0 0 18 12V6M6 12A6 6 0 0 1 18 12",
};

// ---------------------------------------------------------------------------
// Colores de planetas (sin naranja — Jupiter usa violeta)
// ---------------------------------------------------------------------------

export const COLORES_PLANETAS: Record<string, string> = {
  Sol: "#D4A234",
  Luna: "#9575CD",
  Mercurio: "#E57373",
  Venus: "#66BB6A",
  Marte: "#EF5350",
  "Júpiter": "#7C4DFF",
  Saturno: "#78909C",
  Urano: "#26C6DA",
  Neptuno: "#5C6BC0",
  "Plutón": "#8D6E63",
  "Nodo Norte": "#66BB6A",
  "Nodo Sur": "#A1887F",
};

// ---------------------------------------------------------------------------
// Colores de signos por elemento (sin naranja)
// ---------------------------------------------------------------------------

export const ELEMENTO_SIGNO: Record<string, "Fuego" | "Tierra" | "Aire" | "Agua"> = {
  Aries: "Fuego", Tauro: "Tierra", "Géminis": "Aire", "Cáncer": "Agua",
  Leo: "Fuego", Virgo: "Tierra", Libra: "Aire", Escorpio: "Agua",
  Sagitario: "Fuego", Capricornio: "Tierra", Acuario: "Aire", Piscis: "Agua",
};

export const COLORES_ELEMENTO = {
  Fuego: { fondo: "#FEE2E2", borde: "#EF4444" },
  Tierra: { fondo: "#DCFCE7", borde: "#22C55E" },
  Aire:   { fondo: "#F5F0FF", borde: "#B388FF" },
  Agua:   { fondo: "#DBEAFE", borde: "#6366F1" },
} as const;

// ---------------------------------------------------------------------------
// Estilos de aspectos diferenciados
// ---------------------------------------------------------------------------

export const ESTILOS_ASPECTO: Record<string, {
  color: string;
  dash: string;
  ancho: number;
}> = {
  conjuncion:  { color: "#D4A234", dash: "",         ancho: 1.5 },
  trigono:     { color: "#22C55E", dash: "",         ancho: 1.2 },
  sextil:      { color: "#26C6DA", dash: "6 3",     ancho: 1.0 },
  cuadratura:  { color: "#EF4444", dash: "4 2",     ancho: 1.2 },
  oposicion:   { color: "#9333EA", dash: "8 3 2 3", ancho: 1.0 },
};

// ---------------------------------------------------------------------------
// Helper: renderizar glifo SVG inline dentro de <svg>
// ---------------------------------------------------------------------------

export interface PropsGlifo {
  tipo: "signo" | "planeta";
  nombre: string;
  cx: number;
  cy: number;
  tamaño: number;
  fill: string;
  opacity?: number;
  className?: string;
}

export function glifoPath(tipo: "signo" | "planeta", nombre: string): string {
  const mapa = tipo === "signo" ? GLIFOS_SIGNOS : GLIFOS_PLANETAS;
  return mapa[nombre] || "";
}
