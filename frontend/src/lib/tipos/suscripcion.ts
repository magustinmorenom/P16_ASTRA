/**
 * Tipos para suscripciones y pagos de CosmicEngine.
 * Integración con MercadoPago: planes, checkout, webhooks.
 */

/** Plan de suscripción con precios locales opcionales. */
export interface Plan {
  id: string;
  nombre: string;
  slug: string;
  descripcion: string | null;
  /** Precio en centavos de dólar. 0 = gratis. */
  precio_usd_centavos: number;
  /** Intervalo de cobro (ej. "months"). */
  intervalo: string;
  /** -1 = ilimitados. */
  limite_perfiles: number;
  /** -1 = ilimitados. */
  limite_calculos_dia: number;
  /** Lista de features habilitadas (ej. "natal", "diseno_humano"). */
  features: string[];
  /** Precio en centavos de la moneda local. null para plan gratis. */
  precio_local: number | null;
  /** Código de moneda local (ej. "ARS", "BRL", "MXN"). null para plan gratis. */
  moneda_local: string | null;
}

/** Precio de un plan en un país específico. */
export interface PrecioPlan {
  id: string;
  plan_id: string;
  /** Código ISO del país (AR, BR, MX). */
  pais_codigo: string;
  /** Precio en centavos de la moneda local. */
  precio_local_centavos: number;
  /** Tasa de conversión USD -> moneda local. */
  tipo_cambio: number;
}

/** Suscripción de un usuario a un plan. */
export interface Suscripcion {
  id: string;
  plan_id: string;
  plan_nombre?: string | null;
  plan_slug?: string | null;
  /** Código ISO del país. */
  pais_codigo: string;
  /** Estado de la suscripción: pendiente, activa, pausada, cancelada. */
  estado: string;
  /** ID del preapproval en MercadoPago. null si es plan gratis. */
  mp_preapproval_id?: string | null;
  /** Fecha ISO 8601 de inicio. */
  fecha_inicio: string | null;
  /** Fecha ISO 8601 de fin. null si sigue activa. */
  fecha_fin?: string | null;
  /** Fecha ISO 8601 de creación del registro. */
  creado_en?: string | null;
}

/** Registro de un pago procesado. */
export interface Pago {
  id: string;
  /** Estado local del pago: aprobado, pendiente, en_proceso, rechazado, cancelado, reembolsado, contracargo. */
  estado: string;
  /** Monto en centavos de la moneda. */
  monto_centavos: number;
  /** Código de moneda (ej. "ARS"). */
  moneda: string;
  /** Método de pago utilizado (ej. "credit_card"). */
  metodo_pago?: string | null;
  /** Detalle del estado del pago (ej. "accredited"). */
  detalle_estado?: string | null;
  /** Fecha ISO 8601 del pago. */
  fecha_pago?: string | null;
  /** Fecha ISO 8601 de creación del registro. */
  creado_en?: string | null;
}

/** Respuesta del checkout de MercadoPago. */
export interface RespuestaCheckout {
  /** URL de MercadoPago para redirigir al usuario a pagar. */
  init_point: string;
  /** ID de la suscripción local creada. */
  suscripcion_id: string;
  /** ID del preapproval en MercadoPago. */
  mp_preapproval_id?: string | null;
}

/** Datos para solicitar suscripción (body del POST /suscribirse). */
export interface EsquemaSuscribirse {
  plan_id: string;
  /** Código ISO del país: "AR", "BR" o "MX". Por defecto: "AR". */
  pais_codigo?: string;
}
