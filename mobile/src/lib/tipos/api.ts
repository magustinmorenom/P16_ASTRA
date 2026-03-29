export interface RespuestaBase<T = unknown> {
  exito: boolean;
  datos: T;
  mensaje?: string | null;
  cache?: boolean;
}

export interface RespuestaError {
  exito: false;
  error: string;
  detalle?: string | null;
}

export interface DatosNacimiento {
  nombre: string;
  fecha_nacimiento: string;
  hora_nacimiento: string;
  ciudad_nacimiento: string;
  pais_nacimiento: string;
  sistema_casas?: string;
  latitud?: number;
  longitud?: number;
  zona_horaria?: string;
}

export interface DatosNumerologia {
  nombre: string;
  fecha_nacimiento: string;
  sistema?: "pitagorico" | "caldeo";
}
