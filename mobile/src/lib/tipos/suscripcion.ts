export interface PrecioPais {
  precio_local: number;
  moneda: string;
}

export interface Plan {
  id: string;
  nombre: string;
  slug: string;
  descripcion: string | null;
  precio_usd_centavos: number;
  intervalo: string;
  limite_perfiles: number;
  limite_calculos_dia: number;
  features: string[];
  precio_local: number | null;
  moneda_local: string | null;
  precios_por_pais?: Record<string, PrecioPais>;
}

export interface PrecioPlan {
  id: string;
  plan_id: string;
  pais_codigo: string;
  precio_local_centavos: number;
  tipo_cambio: number;
}

export interface Suscripcion {
  id: string;
  plan_id: string;
  plan_nombre?: string | null;
  plan_slug?: string | null;
  pais_codigo: string;
  estado: string;
  mp_preapproval_id?: string | null;
  fecha_inicio: string | null;
  fecha_fin?: string | null;
  creado_en?: string | null;
  cancelacion_programada?: boolean;
}

export interface Pago {
  id: string;
  estado: string;
  monto_centavos: number;
  moneda: string;
  metodo_pago?: string | null;
  detalle_estado?: string | null;
  fecha_pago?: string | null;
  creado_en?: string | null;
  factura_id?: string | null;
  numero_factura?: string | null;
}

export interface RespuestaCheckout {
  init_point: string;
  suscripcion_id: string;
  mp_preapproval_id?: string | null;
}

export interface EsquemaSuscribirse {
  plan_id: string;
  pais_codigo?: string;
}

export interface PaisDisponible {
  pais_codigo: string;
  pais_nombre: string;
  moneda: string;
  tipo_cambio_usd: number;
}

export interface PaisDetectado {
  pais_codigo: string;
  pais_nombre: string;
  moneda: string;
}

export interface Factura {
  id: string;
  numero_factura: string;
  estado: string;
  monto_centavos: number;
  moneda: string;
  concepto: string;
  pais_codigo: string;
  email_cliente?: string | null;
  nombre_cliente?: string | null;
  periodo_inicio?: string | null;
  periodo_fin?: string | null;
  creado_en?: string | null;
}

export interface EstadoVerificacion {
  estado: string;
  es_premium: boolean;
  plan_slug: string | null;
  plan_nombre: string | null;
}
