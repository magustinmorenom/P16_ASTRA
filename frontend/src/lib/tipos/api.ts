/**
 * Tipos base de la API de CosmicEngine.
 * Envolventes de respuesta y datos de entrada comunes.
 */

/** Envolvente estándar de respuesta exitosa. */
export interface RespuestaBase<T = unknown> {
  exito: boolean;
  datos: T;
  mensaje?: string | null;
  cache?: boolean;
}

/** Respuesta de error estándar. */
export interface RespuestaError {
  exito: false;
  error: string;
  detalle?: string | null;
}

/** Respuesta del health check. */
export interface RespuestaSalud {
  estado: "saludable" | "degradado";
  version: string;
  base_datos: string;
  redis: string;
  efemerides: string;
}

/**
 * Datos de nacimiento requeridos para los cálculos principales
 * (carta natal, diseño humano, revolución solar).
 */
export interface DatosNacimiento {
  nombre: string;
  /** Formato: YYYY-MM-DD */
  fecha_nacimiento: string;
  /** Formato: HH:MM */
  hora_nacimiento: string;
  ciudad_nacimiento: string;
  pais_nacimiento: string;
  /** Sistema de casas astrológicas. Por defecto: "placidus" */
  sistema_casas?: string;
}

/**
 * Datos para cálculo numerológico.
 */
export interface DatosNumerologia {
  nombre: string;
  /** Formato: YYYY-MM-DD */
  fecha_nacimiento: string;
  /** "pitagorico" o "caldeo". Por defecto: "pitagorico" */
  sistema?: "pitagorico" | "caldeo";
}
