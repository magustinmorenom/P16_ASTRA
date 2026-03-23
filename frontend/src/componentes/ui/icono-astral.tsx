import { cn } from "@/lib/utilidades/cn";

/**
 * Mapeo de nombres amigables a archivos SVG en /public/img/icons/.
 * Los SVGs son monocromáticos y se colorean vía CSS mask-image + bg-current.
 */
const MAPA_ARCHIVOS: Record<string, string> = {
  // Signos zodiacales
  aries: "004-aries",
  tauro: "005-taurus",
  geminis: "006-gemini",
  cancer: "007-cancer",
  leo: "008-leo",
  virgo: "009-virgo",
  libra: "010-libra",
  escorpio: "011-scorpio",
  sagitario: "017-sagittarius",
  capricornio: "001-capricorn",
  acuario: "002-aquarius",
  piscis: "003-pisces",
  // Secciones temáticas
  astrologia: "020-astrology",
  numerologia: "021-numerology",
  horoscopo: "016-horoscope",
  personal: "014-personal",
  compatibilidad: "012-compatibility",
  tarot: "013-tarot",
  suerte: "018-luck",
  salud: "019-healthy",
  emocion: "022-emotion",
  libro: "023-book",
  carrera: "024-career",
  "bola-cristal": "028-crystal ball",
};

/**
 * Mapeo de nombre de signo zodiacal (en español) a clave del MAPA_ARCHIVOS.
 */
const MAPA_SIGNOS: Record<string, string> = {
  Aries: "aries",
  Tauro: "tauro",
  "Géminis": "geminis",
  Geminis: "geminis",
  "Cáncer": "cancer",
  Cancer: "cancer",
  Leo: "leo",
  Virgo: "virgo",
  Libra: "libra",
  Escorpio: "escorpio",
  Sagitario: "sagitario",
  Capricornio: "capricornio",
  Acuario: "acuario",
  Piscis: "piscis",
};

export type NombreIconoAstral = keyof typeof MAPA_ARCHIVOS;

interface IconoAstralProps {
  /** Nombre del icono (clave de MAPA_ARCHIVOS) */
  nombre: NombreIconoAstral;
  /** Tamaño en px (ancho y alto) */
  tamaño?: number;
  className?: string;
}

/**
 * Renderiza un SVG de /public/img/icons/ usando CSS mask-image.
 * Hereda el color del texto del padre via `bg-current`.
 *
 * Uso: <IconoAstral nombre="astrologia" tamaño={24} className="text-acento" />
 */
export function IconoAstral({ nombre, tamaño = 24, className }: IconoAstralProps) {
  const archivo = MAPA_ARCHIVOS[nombre];
  if (!archivo) return null;

  const url = `/img/icons/${archivo}.svg`;

  return (
    <span
      role="img"
      aria-hidden
      className={cn("inline-block shrink-0 bg-current", className)}
      style={{
        width: tamaño,
        height: tamaño,
        maskImage: `url(${url})`,
        maskSize: "contain",
        maskRepeat: "no-repeat",
        maskPosition: "center",
        WebkitMaskImage: `url(${url})`,
        WebkitMaskSize: "contain",
        WebkitMaskRepeat: "no-repeat",
        WebkitMaskPosition: "center",
      }}
    />
  );
}

interface IconoSignoProps {
  /** Nombre del signo zodiacal en español (ej: "Aries", "Géminis") */
  signo: string;
  /** Tamaño en px */
  tamaño?: number;
  className?: string;
}

/**
 * Renderiza el icono SVG del signo zodiacal.
 * Acepta el nombre del signo en español.
 *
 * Uso: <IconoSigno signo="Aries" tamaño={20} className="text-acento" />
 */
export function IconoSigno({ signo, tamaño = 20, className }: IconoSignoProps) {
  const clave = MAPA_SIGNOS[signo];
  if (!clave) {
    return <span className={cn("text-xs", className)}>{signo.slice(0, 2)}</span>;
  }
  return <IconoAstral nombre={clave} tamaño={tamaño} className={className} />;
}

/** Lista de nombres disponibles */
export const nombresIconosAstrales = Object.keys(MAPA_ARCHIVOS) as NombreIconoAstral[];
