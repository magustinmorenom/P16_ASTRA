/**
 * Tipos para carta natal de CosmicEngine.
 * Planetas, casas (Placidus por defecto), aspectos y dignidades.
 */

/** Posición de un planeta en la carta natal. */
export interface Planeta {
  nombre: string;
  longitud: number;
  latitud: number;
  signo: string;
  grado_en_signo: number;
  casa: number;
  retrogrado: boolean;
  velocidad: number;
  dignidad: string | null;
}

/** Cúspide de una casa astrológica. */
export interface Casa {
  numero: number;
  signo: string;
  grado: number;
  grado_en_signo: number;
}

/** Aspecto entre dos planetas. */
export interface Aspecto {
  planeta1: string;
  planeta2: string;
  tipo: string;
  angulo_exacto: number;
  orbe: number;
  aplicativo: boolean;
}

/** Punto sensible de la carta (Ascendente, Medio Cielo). */
export interface PuntoSensible {
  longitud: number;
  signo: string;
  grado_en_signo: number;
}

/** Respuesta completa de carta natal. */
export interface CartaNatal {
  nombre: string;
  fecha_nacimiento: string;
  hora_nacimiento: string;
  ciudad: string;
  pais: string;
  latitud: number;
  longitud: number;
  zona_horaria: string;
  dia_juliano: number;
  sistema_casas: string;
  planetas: Planeta[];
  casas: Casa[];
  aspectos: Aspecto[];
  ascendente: PuntoSensible;
  medio_cielo: PuntoSensible;
}
