/**
 * Tipos para el feature "Explicame mejor" — micro-chat sobre selección de texto.
 *
 * El usuario selecciona texto en cualquier zona explicable de la app, aparece
 * un menú contextual con "Copiar" y "Explicame mejor", y este último abre un
 * tooltip con una explicación personalizada generada por Claude Haiku.
 */

/** Body que se manda al endpoint POST /chat/explicar. */
export interface ExplicarRequest {
  texto: string;
  contexto_seccion: string;
  /**
   * Texto del bloque (oración / párrafo / item) que rodea a la selección.
   * Se usa para que Astra pueda interpretar fragmentos cortos en su contexto
   * natural en vez de adivinar a partir de palabras sueltas.
   */
  contexto_extendido?: string;
}

/** Datos devueltos por POST /chat/explicar. */
export interface ExplicarResponse {
  respuesta: string;
  desde_cache: boolean;
  /** null = ilimitado (premium). */
  mensajes_restantes: number | null;
}

/** Selección activa que dispara el menú contextual. */
export interface SeleccionActiva {
  /** Texto seleccionado, normalizado (trim, sin saltos de línea múltiples). */
  texto: string;
  /** Bounding box del Range — usado para posicionar menú y tooltip. */
  rect: DOMRect;
  /** Pathname normalizado de Next.js, ej: "diseno-humano", "podcast". */
  contextoSeccion: string;
  /**
   * Bloque (oración / párrafo / item) que contiene la selección, normalizado.
   * Permite que Astra entienda selecciones cortas en su contexto natural.
   * Puede ser igual al texto si la selección ya cubre todo el bloque.
   */
  contextoExtendido?: string;
}
