/**
 * Tipos para Numerología de CosmicEngine.
 * Sistemas Pitagórico y Caldeo. Números maestros (11, 22, 33) preservados.
 */

/** Un número calculado con su descripción interpretativa. */
export interface NumeroRespuesta {
  numero: number;
  descripcion: string;
}

/** Respuesta completa de carta numerológica. */
export interface Numerologia {
  nombre: string;
  fecha_nacimiento: string;
  /** "pitagorico" o "caldeo" */
  sistema: string;
  camino_de_vida: NumeroRespuesta;
  expresion: NumeroRespuesta;
  impulso_del_alma: NumeroRespuesta;
  personalidad: NumeroRespuesta;
  numero_nacimiento: NumeroRespuesta;
  anio_personal: NumeroRespuesta;
  /** Números maestros presentes en la carta (11, 22, 33). */
  numeros_maestros_presentes: number[];
}
