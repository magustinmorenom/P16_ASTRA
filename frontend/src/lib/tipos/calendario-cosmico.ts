/**
 * Tipos para el Calendario Cósmico de CosmicEngine.
 * Tránsitos planetarios por día y rango de fechas.
 */

/** Posición de un planeta en una fecha específica. */
export interface PlanetaCalendario {
  nombre: string;
  longitud: number;
  latitud: number;
  signo: string;
  grado_en_signo: number;
  retrogrado: boolean;
  velocidad: number;
}

export interface AspectoCalendario {
  planeta_a: string;
  planeta_b: string;
  tipo: string;
  angulo: number;
  orbe: number;
}

export interface CambioSignoCalendario {
  planeta: string;
  de: string;
  a: string;
}

export interface EventosCalendario {
  cambios_signo: CambioSignoCalendario[];
  retrogrados_inicio: string[];
  retrogrados_fin: string[];
  aspectos_exactos: AspectoCalendario[];
  fases: string | null;
}

/** Tránsitos planetarios de un día específico (mediodía UTC). */
export interface TransitosDia {
  fecha: string;
  fecha_utc: string;
  dia_juliano: number;
  planetas: PlanetaCalendario[];
  aspectos: AspectoCalendario[];
  fase_lunar: string;
  eventos: EventosCalendario;
  estado: "pasado" | "presente" | "futuro";
}

/** Tránsitos de un rango de fechas. */
export interface CalendarioRango {
  fecha_inicio: string;
  fecha_fin: string;
  dias: TransitosDia[];
}
