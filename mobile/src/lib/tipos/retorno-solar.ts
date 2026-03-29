import type { Planeta, Casa, Aspecto } from "./natal";

export interface FechaRetorno {
  anio: number;
  mes: number;
  dia: number;
  hora_decimal: number;
}

export interface CartaRetorno {
  planetas: Planeta[];
  casas: Casa[];
  aspectos: Aspecto[];
  ascendente: { longitud: number; signo: string; grado_en_signo: number };
  medio_cielo: { longitud: number; signo: string; grado_en_signo: number };
  sistema_casas: string;
}

export interface AspectoNatalRetorno {
  planeta_retorno: string;
  planeta_natal: string;
  tipo: string;
  angulo: number;
  orbe: number;
}

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
