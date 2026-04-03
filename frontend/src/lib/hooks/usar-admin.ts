"use client";

import { useQuery } from "@tanstack/react-query";
import { clienteApi } from "@/lib/api/cliente";
import type {
  MetricasAdmin,
  UsuarioDetalleAdmin,
  SuscripcionAdmin,
  CostoServicio,
  TopConsumidor,
  EstadoSistema,
  RespuestaPaginada,
  UsuarioAdmin,
} from "@/lib/tipos/admin";

export function usarMetricasAdmin() {
  return useQuery<MetricasAdmin>({
    queryKey: ["admin", "metricas"],
    queryFn: () => clienteApi.get("/admin/metricas"),
    refetchInterval: 60_000,
  });
}

export function usarUsuariosAdmin(params: {
  pagina?: number;
  busqueda?: string;
  activo?: boolean | null;
}) {
  const query = new URLSearchParams();
  if (params.pagina) query.set("pagina", String(params.pagina));
  if (params.busqueda) query.set("busqueda", params.busqueda);
  if (params.activo !== undefined && params.activo !== null)
    query.set("activo", String(params.activo));

  return useQuery<RespuestaPaginada<UsuarioAdmin>>({
    queryKey: ["admin", "usuarios", params],
    queryFn: () => clienteApi.get(`/admin/usuarios?${query.toString()}`),
  });
}

export function usarUsuarioDetalleAdmin(id: string) {
  return useQuery<UsuarioDetalleAdmin>({
    queryKey: ["admin", "usuario", id],
    queryFn: () => clienteApi.get(`/admin/usuarios/${id}`),
    enabled: !!id,
  });
}

export function usarSuscripcionesAdmin(params: {
  pagina?: number;
  estado?: string;
  pais_codigo?: string;
}) {
  const query = new URLSearchParams();
  if (params.pagina) query.set("pagina", String(params.pagina));
  if (params.estado) query.set("estado", params.estado);
  if (params.pais_codigo) query.set("pais_codigo", params.pais_codigo);

  return useQuery<RespuestaPaginada<SuscripcionAdmin>>({
    queryKey: ["admin", "suscripciones", params],
    queryFn: () => clienteApi.get(`/admin/suscripciones?${query.toString()}`),
  });
}

export function usarCostosPorServicio() {
  return useQuery<CostoServicio[]>({
    queryKey: ["admin", "costos", "por-servicio"],
    queryFn: () => clienteApi.get("/admin/costos/por-servicio"),
  });
}

export function usarTopConsumidores() {
  return useQuery<TopConsumidor[]>({
    queryKey: ["admin", "costos", "top-consumidores"],
    queryFn: () => clienteApi.get("/admin/costos/top-consumidores"),
  });
}

export function usarSistemaAdmin() {
  return useQuery<EstadoSistema>({
    queryKey: ["admin", "sistema"],
    queryFn: () => clienteApi.get("/admin/sistema"),
    refetchInterval: 30_000,
  });
}
