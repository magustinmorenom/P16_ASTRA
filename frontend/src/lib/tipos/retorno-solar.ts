/**
 * Tipos para Revolución Solar de CosmicEngine.
 * Momento exacto del retorno solar y carta comparativa.
 */

import type { Planeta, Casa, Aspecto } from "./natal";

/** Fecha desglosada del retorno solar. */
export interface FechaRetorno {
  anio: number;
  mes: number;
  dia: number;
  hora_decimal: number;
}

/** Carta del retorno solar — misma estructura que carta natal. */
export interface CartaRetorno {
  planetas: Planeta[];
  casas: Casa[];
  aspectos: Aspecto[];
  ascendente: { longitud: number; signo: string; grado_en_signo: number };
  medio_cielo: { longitud: number; signo: string; grado_en_signo: number };
  sistema_casas: string;
}

/** Aspecto cruzado entre planeta de retorno y planeta natal. */
export interface AspectoNatalRetorno {
  planeta_retorno: string;
  planeta_natal: string;
  tipo: string;
  angulo: number;
  orbe: number;
}

/** Respuesta completa de revolución solar. */
export interface RetornoSolar {
  nombre: string;
  fecha_nacimiento: string;
  hora_nacimiento: string;
  ciudad: string;
  pais: string;
  anio: number;
  dia_juliano_retorno: number;
  fecha_retorno: FechaRetorno;
  longitud_sol_natal: number;
  longitud_sol_retorno: number;
  error_grados: number;
  carta_retorno: CartaRetorno;
  aspectos_natal_retorno: AspectoNatalRetorno[];
}
