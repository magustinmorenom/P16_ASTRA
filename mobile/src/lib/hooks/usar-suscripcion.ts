import { useMutation, useQuery } from "@tanstack/react-query";
import { clienteApi } from "@/lib/api/cliente";
import type {
  Plan,
  Suscripcion,
  Pago,
  RespuestaCheckout,
  PaisDisponible,
  PaisDetectado,
  EstadoVerificacion,
  Factura,
} from "@/lib/tipos";

export function usarPlanes() {
  return useQuery({
    queryKey: ["planes"],
    queryFn: () => clienteApi.get<Plan[]>("/suscripcion/planes"),
  });
}

export function usarMiSuscripcion() {
  return useQuery({
    queryKey: ["mi-suscripcion"],
    queryFn: () => clienteApi.get<Suscripcion>("/suscripcion/mi-suscripcion"),
  });
}

interface ParamsSuscribirse {
  plan_id: string;
  pais_codigo: string;
}

export function usarSuscribirse() {
  return useMutation({
    mutationFn: (datos: ParamsSuscribirse) =>
      clienteApi.post<RespuestaCheckout>("/suscripcion/suscribirse", datos),
  });
}

export function usarCancelarSuscripcion() {
  return useMutation({
    mutationFn: () => clienteApi.post("/suscripcion/cancelar"),
  });
}

export function usarPagos() {
  return useQuery({
    queryKey: ["pagos"],
    queryFn: () => clienteApi.get<Pago[]>("/suscripcion/pagos"),
  });
}

export function usarPaises() {
  return useQuery({
    queryKey: ["paises"],
    queryFn: () => clienteApi.get<PaisDisponible[]>("/suscripcion/paises"),
  });
}

export function usarDetectarPais() {
  return useQuery({
    queryKey: ["detectar-pais"],
    queryFn: () => clienteApi.get<PaisDetectado>("/suscripcion/detectar-pais"),
    staleTime: 1000 * 60 * 30,
  });
}

export function usarVerificarEstado(habilitado: boolean) {
  return useQuery({
    queryKey: ["verificar-estado"],
    queryFn: () =>
      clienteApi.get<EstadoVerificacion>("/suscripcion/verificar-estado"),
    enabled: habilitado,
    refetchInterval: habilitado ? 3000 : false,
  });
}

export function usarFacturas() {
  return useQuery({
    queryKey: ["facturas"],
    queryFn: () => clienteApi.get<Factura[]>("/suscripcion/facturas"),
  });
}

export interface RespuestaSincronizar {
  sincronizados: number;
  estado_actualizado: boolean;
  errores?: string[];
}

export function usarSincronizarPagos() {
  return useMutation({
    mutationFn: () =>
      clienteApi.post<RespuestaSincronizar>("/suscripcion/sincronizar-pagos"),
  });
}
