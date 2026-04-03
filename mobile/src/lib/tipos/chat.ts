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
