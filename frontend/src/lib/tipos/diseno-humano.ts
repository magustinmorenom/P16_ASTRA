/**
 * Tipos para Diseño Humano (Human Design) de CosmicEngine.
 * Body Graph: tipo, autoridad, perfil, centros, canales, activaciones.
 */

/** Activación de un planeta en una puerta/línea del I-Ching. */
export interface Activacion {
  planeta: string;
  longitud: number;
  puerta: number;
  linea: number;
  color: number;
}

/** Canal definido en el Body Graph. */
export interface Canal {
  puertas: [number, number];
  nombre: string;
  centros: [string, string];
}

/** Cruz de Encarnación. */
export interface CruzEncarnacion {
  puertas: (number | null)[];
  sol_consciente: number | null;
  tierra_consciente: number | null;
  sol_inconsciente: number | null;
  tierra_inconsciente: number | null;
}

/**
 * Mapa de centros del Body Graph.
 * Clave: nombre del centro (ej. "sacral", "garganta").
 * Valor: estado ("definido" | "abierto").
 */
export type MapaCentros = Record<string, "definido" | "abierto">;

/** Respuesta completa de Diseño Humano. */
export interface DisenoHumano {
  tipo: string;
  autoridad: string;
  perfil: string;
  definicion: string;
  cruz_encarnacion: CruzEncarnacion;
  centros: MapaCentros;
  canales: Canal[];
  activaciones_conscientes: Activacion[];
  activaciones_inconscientes: Activacion[];
  puertas_conscientes: number[];
  puertas_inconscientes: number[];
  dia_juliano_consciente: number;
  dia_juliano_inconsciente: number;
}

/** Metadatos comunes del Body Graph incluidos en la respuesta de la API. */
export interface DisenoHumanoConDatos extends DisenoHumano {
  nombre: string;
  fecha_nacimiento: string;
  hora_nacimiento: string;
  ciudad: string;
  pais: string;
  latitud: number;
  longitud: number;
  zona_horaria: string;
}
