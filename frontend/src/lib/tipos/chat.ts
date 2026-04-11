/**
 * Tipos para el Chat web del Oráculo ASTRA.
 */

export interface MensajeChat {
  rol: "user" | "assistant";
  contenido: string;
  fecha: string;
}

export interface RespuestaChat {
  respuesta: string;
  mensajes_restantes: number | null;
}

export interface HistorialChat {
  mensajes: MensajeChat[];
  conversacion_id: string;
}

export interface NuevaConversacion {
  conversacion_id: string;
}

export interface ConversacionResumen {
  id: string;
  preview: string;
  titulo: string | null;
  total_mensajes: number;
  activa: boolean;
  anclada: boolean;
  archivada: boolean;
  creado_en: string | null;
  ultimo_mensaje_en: string | null;
}

export interface CambiarConversacionRespuesta {
  conversacion_id: string;
  mensajes: MensajeChat[];
}
