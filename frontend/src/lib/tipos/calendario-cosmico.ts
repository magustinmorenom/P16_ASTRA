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

/** Tránsitos planetarios de un día específico (mediodía UTC). */
export interface TransitosDia {
  fecha: string;
  fecha_utc: string;
  dia_juliano: number;
  planetas: PlanetaCalendario[];
}

/** Tránsitos de un rango de fechas. */
export interface CalendarioRango {
  fecha_inicio: string;
  fecha_fin: string;
  dias: TransitosDia[];
}
