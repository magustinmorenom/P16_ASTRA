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

export interface Casa {
  numero: number;
  signo: string;
  grado: number;
  grado_en_signo: number;
}

export interface Aspecto {
  planeta1: string;
  planeta2: string;
  tipo: string;
  angulo_exacto: number;
  orbe: number;
  aplicativo: boolean;
}

export interface PuntoSensible {
  longitud: number;
  signo: string;
  grado_en_signo: number;
}

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
