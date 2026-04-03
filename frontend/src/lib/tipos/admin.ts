/** Tipos para el backoffice de administración. */

export interface MetricasAdmin {
  usuarios: {
    total: number;
    nuevos_7d: number;
    nuevos_30d: number;
    activos_hoy: number;
  };
  suscripciones: Record<string, number>;
  ingresos: {
    mes_actual: Record<string, number>;
    mes_anterior: Record<string, number>;
  };
  costos_api: {
    mes_actual: Record<string, number>;
    mes_anterior: Record<string, number>;
  };
  actividad: {
    conversaciones_oraculo_7d: number;
    podcasts_generados_7d: number;
  };
}

export interface UsuarioAdmin {
  id: string;
  email: string;
  nombre: string;
  activo: boolean;
  verificado: boolean;
  rol: string;
  proveedor_auth: string;
  creado_en: string | null;
  ultimo_acceso: string | null;
}

export interface UsuarioDetalleAdmin extends UsuarioAdmin {
  suscripcion_activa: {
    plan_nombre: string;
    plan_slug: string;
    estado: string;
    pais_codigo: string;
    fecha_inicio: string | null;
  } | null;
  pagos: {
    id: string;
    monto_centavos: number;
    moneda: string;
    estado: string;
    fecha_pago: string | null;
  }[];
  costos_api: {
    servicio: string;
    costo_usd_centavos: number;
    tokens_entrada: number;
    tokens_salida: number;
  }[];
  totales: {
    conversaciones: number;
    podcasts: number;
  };
}

export interface SuscripcionAdmin {
  id: string;
  usuario_email: string;
  usuario_nombre: string;
  plan_nombre: string;
  plan_slug: string;
  estado: string;
  pais_codigo: string;
  fecha_inicio: string | null;
  fecha_fin: string | null;
  creado_en: string | null;
}

export interface CostoServicio {
  servicio: string;
  cantidad: number;
  costo_usd_centavos: number;
  tokens_entrada: number;
  tokens_salida: number;
}

export interface TopConsumidor {
  usuario_id: string;
  email: string;
  nombre: string;
  costo_usd_centavos: number;
  cantidad_requests: number;
}

export interface EstadoSistema {
  version: string;
  ambiente: string;
  base_datos: { estado: string; version: string | null };
  redis: { estado: string; memoria_usada?: string; claves?: number };
  minio: { estado: string };
  efemerides: { ruta: string; archivos: number };
}

export interface RespuestaPaginada<T> {
  items: T[];
  total: number;
  pagina: number;
  por_pagina: number;
  total_paginas: number;
}
