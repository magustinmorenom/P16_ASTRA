/**
 * Tipos para Numerología de CosmicEngine.
 * Sistemas Pitagórico y Caldeo. Números maestros (11, 22, 33) preservados.
 */

/** Un número calculado con su descripción interpretativa. */
export interface NumeroRespuesta {
  numero: number;
  descripcion: string;
}

/** Una etapa (pináculo) de la vida con rango de edad. */
export interface EtapaVida {
  numero: number;
  descripcion: string;
  edad_inicio: number;
  edad_fin: number | null;
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
  mes_personal: NumeroRespuesta;
  dia_personal: NumeroRespuesta;
  etapas_de_la_vida: EtapaVida[];
  /** Números maestros presentes en la carta (11, 22, 33). */
  numeros_maestros_presentes: number[];
}
