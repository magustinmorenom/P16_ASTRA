/** Tipos para el sistema de Podcasts Cósmicos. */

export type TipoPodcast = "dia" | "semana" | "mes";

export interface SegmentoLetra {
  inicio_seg: number;
  fin_seg: number;
  texto: string;
}

export interface AccionPodcast {
  bloque: "manana" | "tarde" | "noche";
  accion: string;
  contexto: string;
}

export interface PodcastEpisodio {
  id: string;
  fecha: string;
  tipo: TipoPodcast;
  titulo: string;
  guion_md: string;
  segmentos: SegmentoLetra[];
  duracion_segundos: number;
  url_audio: string;
  estado: "pendiente" | "generando_guion" | "generando_audio" | "listo" | "error";
  acciones: AccionPodcast[];
  error_detalle?: string;
  creado_en?: string;
}
