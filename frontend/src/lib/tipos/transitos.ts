/**
 * Tipos para Tránsitos planetarios de CosmicEngine.
 * Posiciones actuales de planetas en tiempo real (cache 10 min).
 */

/** Posición de un planeta en tránsito. */
export interface PlanetaTransito {
  nombre: string;
  longitud: number;
  latitud: number;
  signo: string;
  grado_en_signo: number;
  retrogrado: boolean;
  velocidad: number;
}

/** Aspecto de un planeta en tránsito versus un planeta natal. */
export interface AspectoTransitoNatal {
  planeta1: string;
  planeta2: string;
  tipo: string;
  angulo_exacto: number;
  orbe: number;
  aplicativo: boolean;
}

/** Respuesta completa de tránsitos actuales. */
export interface Transitos {
  /** Fecha y hora UTC del cálculo. Formato ISO 8601. */
  fecha_utc: string;
  dia_juliano: number;
  planetas: PlanetaTransito[];
  /** Aspectos versus carta natal. Solo se incluye si se proporciona perfil_id. */
  aspectos_natal: AspectoTransitoNatal[] | null;
}
