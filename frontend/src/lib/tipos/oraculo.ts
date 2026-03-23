/**
 * Tipos para el Oráculo ASTRA — vinculación Telegram.
 */

/** Respuesta de generación de código de vinculación. */
export interface CodigoVinculacion {
  codigo: string;
  expira_en: string | null;
}

/** Estado de vinculación Telegram. */
export interface EstadoVinculacion {
  vinculado: boolean;
  telegram_username: string | null;
}
