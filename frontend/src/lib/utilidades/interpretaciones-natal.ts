/**
 * Constantes y sistema de interpretaciones narrativas para carta natal.
 * Centraliza datos estáticos de astrología + templates de texto.
 */

// ---------------------------------------------------------------------------
// Constantes de colores y estilos
// ---------------------------------------------------------------------------

export const COLORES_PLANETA: Record<string, string> = {
  Sol: "#B388FF", Luna: "#9575CD", Mercurio: "#E57373", Venus: "#66BB6A",
  Marte: "#EF5350", Júpiter: "#7C4DFF", Saturno: "#78909C", Urano: "#26C6DA",
  Neptuno: "#5C6BC0", Plutón: "#9C6DFF", "Nodo Norte": "#66BB6A", "Nodo Sur": "#8C9EFF",
};

export const SIMBOLOS_ASPECTO: Record<string, string> = {
  conjuncion: "☌", trigono: "△", sextil: "⚹", cuadratura: "□", oposicion: "☍",
};

export const BADGE_ASPECTO: Record<string, { bg: string; text: string; label: string }> = {
  conjuncion: { bg: "bg-[#7C4DFF]/16", text: "text-[#E4D5FF]", label: "Conjunción" },
  trigono: { bg: "bg-emerald-500/16", text: "text-emerald-200", label: "Trígono" },
  sextil: { bg: "bg-sky-500/16", text: "text-sky-200", label: "Sextil" },
  cuadratura: { bg: "bg-rose-500/16", text: "text-rose-200", label: "Cuadratura" },
  oposicion: { bg: "bg-violet-500/16", text: "text-violet-200", label: "Oposición" },
};

export const DIGNIDAD_BADGE: Record<string, { bg: string; text: string }> = {
  domicilio: { bg: "bg-emerald-500/16", text: "text-emerald-200" },
  exaltacion: { bg: "bg-cyan-500/16", text: "text-cyan-200" },
  detrimento: { bg: "bg-red-500/16", text: "text-red-200" },
  caida: { bg: "bg-rose-500/16", text: "text-rose-200" },
  peregrino: { bg: "bg-white/10", text: "text-white/72" },
};

// ---------------------------------------------------------------------------
// Datos estáticos de astrología
// ---------------------------------------------------------------------------

export const ELEMENTO_SIGNO: Record<string, string> = {
  Aries: "Fuego", Tauro: "Tierra", Géminis: "Aire", Cáncer: "Agua",
  Leo: "Fuego", Virgo: "Tierra", Libra: "Aire", Escorpio: "Agua",
  Sagitario: "Fuego", Capricornio: "Tierra", Acuario: "Aire", Piscis: "Agua",
};

export const MODALIDAD_SIGNO: Record<string, string> = {
  Aries: "Cardinal", Tauro: "Fijo", Géminis: "Mutable", Cáncer: "Cardinal",
  Leo: "Fijo", Virgo: "Mutable", Libra: "Cardinal", Escorpio: "Fijo",
  Sagitario: "Mutable", Capricornio: "Cardinal", Acuario: "Fijo", Piscis: "Mutable",
};

export const REGENTE_SIGNO: Record<string, string> = {
  Aries: "Marte", Tauro: "Venus", Géminis: "Mercurio", Cáncer: "Luna",
  Leo: "Sol", Virgo: "Mercurio", Libra: "Venus", Escorpio: "Plutón",
  Sagitario: "Júpiter", Capricornio: "Saturno", Acuario: "Urano", Piscis: "Neptuno",
};

export const ROMANO: Record<number, string> = {
  1: "I", 2: "II", 3: "III", 4: "IV", 5: "V", 6: "VI",
  7: "VII", 8: "VIII", 9: "IX", 10: "X", 11: "XI", 12: "XII",
};

export const COLORES_ELEMENTO: Record<string, string> = {
  Fuego: "#EF5350", Tierra: "#66BB6A", Aire: "#B388FF", Agua: "#42A5F5",
};

export const COLORES_MODALIDAD: Record<string, string> = {
  Cardinal: "#7C4DFF", Fijo: "#26C6DA", Mutable: "#B388FF",
};

// ---------------------------------------------------------------------------
// Utilidades
// ---------------------------------------------------------------------------

export function normalizarClave(s: string): string {
  return s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

// ---------------------------------------------------------------------------
// Arquetipos y temas (base para interpretaciones)
// ---------------------------------------------------------------------------

export const ARQUETIPO_PLANETA: Record<string, string> = {
  Sol: "tu identidad esencial y propósito vital",
  Luna: "tu mundo emocional y necesidades internas",
  Mercurio: "tu forma de pensar y comunicarte",
  Venus: "cómo amas, valoras y disfrutas",
  Marte: "tu impulso de acción y deseo",
  Júpiter: "tu expansión, fe y búsqueda de sentido",
  Saturno: "tus lecciones, estructura y madurez",
  Urano: "tu originalidad y necesidad de libertad",
  Neptuno: "tu espiritualidad, imaginación y trascendencia",
  Plutón: "tu poder transformador y procesos profundos",
  "Nodo Norte": "la dirección de crecimiento del alma",
  "Nodo Sur": "los talentos heredados y patrones a soltar",
};

const ESENCIA_ELEMENTO: Record<string, string> = {
  Fuego: "una energía dinámica, entusiasta y orientada a la acción",
  Tierra: "una naturaleza práctica, sensorial y constructiva",
  Aire: "una mente inquieta, sociable y orientada a las ideas",
  Agua: "una sensibilidad profunda, intuitiva y empática",
};

const ESENCIA_MODALIDAD: Record<string, string> = {
  Cardinal: "iniciando, liderando y abriendo caminos nuevos",
  Fijo: "con determinación, constancia y profundidad",
  Mutable: "adaptándose, fluyendo y encontrando versatilidad",
};

export const TEMA_CASA: Record<number, string> = {
  1: "la identidad personal y la forma de presentarse al mundo",
  2: "los recursos, valores propios y la relación con lo material",
  3: "la comunicación, el aprendizaje y el entorno cercano",
  4: "las raíces, el hogar y la vida emocional íntima",
  5: "la creatividad, el placer, el romance y la autoexpresión",
  6: "la rutina diaria, el servicio, la salud y el perfeccionamiento",
  7: "las relaciones de pareja, asociaciones y el encuentro con el otro",
  8: "la transformación, la intimidad profunda y los recursos compartidos",
  9: "la filosofía de vida, los viajes largos y la expansión del horizonte",
  10: "la vocación, la reputación pública y las metas de largo plazo",
  11: "los ideales, las amistades, los grupos y los proyectos colectivos",
  12: "el mundo interior, la espiritualidad y los procesos inconscientes",
};

const EFECTO_DIGNIDAD: Record<string, string> = {
  domicilio: "Se encuentra en su propio signo, operando con plena potencia y naturalidad.",
  exaltacion: "Está exaltado, expresándose con fuerza y brillo excepcional.",
  detrimento: "Está en detrimento — necesita esfuerzo consciente para expresarse con claridad.",
  caida: "Está en caída — invita a trabajar con humildad sobre estos temas.",
  peregrino: "Es peregrino — opera sin ventajas ni desventajas especiales, con tono neutro.",
};

export const NARRATIVA_ASPECTO: Record<string, string> = {
  conjuncion: "Estas energías se fusionan intensamente, potenciándose y amplificándose mutuamente.",
  trigono: "Fluyen con armonía natural, generando facilidad y talentos innatos.",
  sextil: "Se complementan con oportunidades que requieren un paso consciente para activarse.",
  cuadratura: "Generan tensión creativa — un motor de crecimiento que exige integración.",
  oposicion: "Representan polaridades que buscan equilibrio — el desafío es encontrar el punto medio.",
};

// ---------------------------------------------------------------------------
// Funciones de interpretación
// ---------------------------------------------------------------------------

export function interpretarPlaneta(
  nombre: string,
  signo: string,
  casa: number,
  dignidad: string | null,
  retrogrado: boolean,
): string {
  const arquetipo = ARQUETIPO_PLANETA[nombre] || "una influencia cósmica";
  const elemento = ELEMENTO_SIGNO[signo] || "Fuego";
  const modalidad = MODALIDAD_SIGNO[signo] || "Cardinal";
  const esencia = ESENCIA_ELEMENTO[elemento] || "";
  const modo = ESENCIA_MODALIDAD[modalidad] || "";
  const tema = TEMA_CASA[casa] || "";

  let texto = `${nombre} representa ${arquetipo}. En ${signo}, se expresa con ${esencia}, ${modo}.`;

  if (tema) {
    texto += ` En la Casa ${ROMANO[casa]}, este impulso se manifiesta en el área de ${tema}.`;
  }

  if (dignidad) {
    const clave = normalizarClave(dignidad);
    const efecto = EFECTO_DIGNIDAD[clave];
    if (efecto) texto += ` ${efecto}`;
  }

  if (retrogrado) {
    texto += ` Al estar retrógrado, invita a una revisión interna profunda de estos temas antes de actuar hacia afuera.`;
  }

  return texto;
}

export function interpretarAspecto(
  planeta1: string,
  planeta2: string,
  tipo: string,
  orbe: number,
  aplicativo: boolean,
): string {
  const clave = normalizarClave(tipo);
  const narrativa = NARRATIVA_ASPECTO[clave] || "Estas energías interactúan de forma significativa.";
  const arq1 = ARQUETIPO_PLANETA[planeta1] || planeta1;
  const arq2 = ARQUETIPO_PLANETA[planeta2] || planeta2;
  const precision = orbe < 2 ? "con mucha intensidad (orbe estrecho)" : orbe < 5 ? "de manera clara" : "con influencia sutil";

  const movimiento = aplicativo
    ? "Este aspecto se está formando — su influencia va en aumento."
    : "Este aspecto se está separando — su influencia va decreciendo.";

  return `La conexión entre ${planeta1} (${arq1}) y ${planeta2} (${arq2}) se activa ${precision}. ${narrativa} ${movimiento}`;
}

export function interpretarCasa(
  numero: number,
  signo: string,
  planetasEnCasa: string[],
): string {
  const tema = TEMA_CASA[numero] || "";
  const regente = REGENTE_SIGNO[signo] || signo;

  let texto = `La Casa ${ROMANO[numero]} abarca ${tema}. Con ${signo} en la cúspide, el planeta regente es ${regente}, quien colorea tu experiencia en esta área con las cualidades de ${signo}.`;

  if (planetasEnCasa.length > 0) {
    texto += ` Los planetas presentes (${planetasEnCasa.join(", ")}) activan y dinamizan especialmente esta área de tu vida.`;
  } else {
    texto += ` No hay planetas presentes — el tema se vive a través del regente ${regente} y su posición en tu carta.`;
  }

  return texto;
}

export function generarEsencia(
  solSigno: string,
  lunaSigno: string,
  ascSigno: string,
): string {
  const elSol = ELEMENTO_SIGNO[solSigno] || "Fuego";
  const elLuna = ELEMENTO_SIGNO[lunaSigno] || "Agua";
  const elAsc = ELEMENTO_SIGNO[ascSigno] || "Aire";

  const descriptorSol: Record<string, string> = {
    Fuego: "de fuego", Tierra: "terrenal", Aire: "mental", Agua: "de agua profunda",
  };
  const descriptorLuna: Record<string, string> = {
    Fuego: "un corazón apasionado", Tierra: "un corazón estable",
    Aire: "un corazón libre", Agua: "un corazón sensible",
  };
  const descriptorAsc: Record<string, string> = {
    Fuego: "presencia magnética", Tierra: "presencia sólida",
    Aire: "presencia ligera y sociable", Agua: "presencia misteriosa",
  };

  return `Alma ${descriptorSol[elSol]} con ${descriptorLuna[elLuna]} y ${descriptorAsc[elAsc]}`;
}

export function interpretarTriada(
  solSigno: string,
  solCasa: number,
  lunaSigno: string,
  lunaCasa: number,
  ascSigno: string,
): string {
  const elSol = ELEMENTO_SIGNO[solSigno] || "Fuego";
  const elLuna = ELEMENTO_SIGNO[lunaSigno] || "Agua";
  const modSol = MODALIDAD_SIGNO[solSigno] || "Cardinal";

  let texto = `Tu Sol en ${solSigno} (Casa ${ROMANO[solCasa]}) define tu identidad central con la energía del ${elSol} y un modo ${modSol.toLowerCase()} de actuar en el mundo.`;

  texto += ` Tu Luna en ${lunaSigno} (Casa ${ROMANO[lunaCasa]}) revela que emocionalmente necesitas ${
    elLuna === "Fuego" ? "entusiasmo y libertad" :
    elLuna === "Tierra" ? "seguridad y estabilidad" :
    elLuna === "Aire" ? "estímulo intelectual y conexión social" :
    "contención emocional y profundidad"
  }.`;

  texto += ` Tu Ascendente en ${ascSigno} es la máscara que llevas al mundo — la primera impresión que generas y el filtro a través del cual experimentas la vida.`;

  if (elSol === elLuna) {
    texto += ` Con Sol y Luna en el mismo elemento (${elSol}), hay coherencia natural entre tu esencia y tus emociones.`;
  } else {
    texto += ` La combinación de ${elSol} (Sol) y ${elLuna} (Luna) crea una dinámica rica donde tu esencia y tus emociones se nutren desde registros diferentes.`;
  }

  return texto;
}

// ---------------------------------------------------------------------------
// Contadores para distribución energética
// ---------------------------------------------------------------------------

export interface DistribucionEnergetica {
  elementos: Record<string, number>;
  modalidades: Record<string, number>;
  hemisferios: { norte: number; sur: number; este: number; oeste: number };
}

export function calcularDistribucion(
  planetas: Array<{ signo: string; casa: number }>,
): DistribucionEnergetica {
  const elementos: Record<string, number> = { Fuego: 0, Tierra: 0, Aire: 0, Agua: 0 };
  const modalidades: Record<string, number> = { Cardinal: 0, Fijo: 0, Mutable: 0 };
  const hemisferios = { norte: 0, sur: 0, este: 0, oeste: 0 };

  for (const p of planetas) {
    const el = ELEMENTO_SIGNO[p.signo];
    if (el) elementos[el]++;
    const mod = MODALIDAD_SIGNO[p.signo];
    if (mod) modalidades[mod]++;

    // Norte = casas 1-6, Sur = casas 7-12
    if (p.casa >= 1 && p.casa <= 6) hemisferios.norte++;
    else hemisferios.sur++;
    // Este = casas 10-3 (sentido anti-horario), Oeste = casas 4-9
    if ([10, 11, 12, 1, 2, 3].includes(p.casa)) hemisferios.este++;
    else hemisferios.oeste++;
  }

  return { elementos, modalidades, hemisferios };
}

// ---------------------------------------------------------------------------
// Orden canónico de planetas
// ---------------------------------------------------------------------------

export const ORDEN_PLANETAS = [
  "Sol", "Luna", "Mercurio", "Venus", "Marte",
  "Júpiter", "Saturno", "Urano", "Neptuno", "Plutón",
  "Nodo Norte", "Nodo Sur",
];

export function ordenarPlanetas<T extends { nombre: string }>(planetas: T[]): T[] {
  return [...planetas].sort((a, b) => {
    const ia = ORDEN_PLANETAS.indexOf(a.nombre);
    const ib = ORDEN_PLANETAS.indexOf(b.nombre);
    return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib);
  });
}

// ---------------------------------------------------------------------------
// Agrupación de aspectos por tipo
// ---------------------------------------------------------------------------

export const ORDEN_TIPO_ASPECTO = ["conjuncion", "trigono", "sextil", "cuadratura", "oposicion"];

export function agruparAspectos<T extends { tipo: string }>(
  aspectos: T[],
): { tipo: string; label: string; aspectos: T[] }[] {
  const grupos: Record<string, T[]> = {};
  for (const a of aspectos) {
    const clave = normalizarClave(a.tipo);
    if (!grupos[clave]) grupos[clave] = [];
    grupos[clave].push(a);
  }
  return ORDEN_TIPO_ASPECTO
    .filter((t) => grupos[t]?.length)
    .map((t) => ({
      tipo: t,
      label: BADGE_ASPECTO[t]?.label || t,
      aspectos: grupos[t],
    }));
}
