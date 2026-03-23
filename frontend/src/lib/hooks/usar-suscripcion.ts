"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import { clienteApi } from "@/lib/api/cliente";
import type {
  Plan,
  Suscripcion,
  Pago,
  RespuestaCheckout,
  PaisDisponible,
  PaisDetectado,
  Factura,
  EstadoVerificacion,
} from "@/lib/tipos";

/**
 * Hook para obtener la lista de planes disponibles.
 */
export function usarPlanes() {
  return useQuery({
    queryKey: ["planes"],
    queryFn: () => clienteApi.get<Plan[]>("/suscripcion/planes"),
  });
}

/**
 * Hook para obtener la suscripcion actual del usuario autenticado.
 */
export function usarMiSuscripcion() {
  return useQuery({
    queryKey: ["mi-suscripcion"],
    queryFn: () =>
      clienteApi.get<Suscripcion>("/suscripcion/mi-suscripcion"),
  });
}

/** Parametros para suscribirse a un plan */
interface ParamsSuscribirse {
  /** ID del plan al que se desea suscribir */
  plan_id: string;
  /** Codigo del pais (AR, BR, MX) para determinar moneda y credenciales */
  pais_codigo: string;
}

/**
 * Hook para suscribirse a un plan.
 * Devuelve la URL de checkout de MercadoPago para completar el pago.
 */
export function usarSuscribirse() {
  return useMutation({
    mutationFn: (datos: ParamsSuscribirse) =>
      clienteApi.post<RespuestaCheckout>(
        "/suscripcion/suscribirse",
        datos
      ),
  });
}

/**
 * Hook para cancelar la suscripcion activa del usuario.
 */
export function usarCancelarSuscripcion() {
  return useMutation({
    mutationFn: () => clienteApi.post("/suscripcion/cancelar"),
  });
}

/**
 * Hook para obtener el historial de pagos del usuario.
 */
export function usarPagos() {
  return useQuery({
    queryKey: ["pagos"],
    queryFn: () => clienteApi.get<Pago[]>("/suscripcion/pagos"),
  });
}

/**
 * Hook para obtener la lista de países disponibles con MP configurado.
 */
export function usarPaises() {
  return useQuery({
    queryKey: ["paises"],
    queryFn: () => clienteApi.get<PaisDisponible[]>("/suscripcion/paises"),
  });
}

/**
 * Hook para detectar el país del usuario automáticamente por IP.
 */
export function usarDetectarPais() {
  return useQuery({
    queryKey: ["detectar-pais"],
    queryFn: () => clienteApi.get<PaisDetectado>("/suscripcion/detectar-pais"),
    staleTime: 1000 * 60 * 30, // 30 min — la ubicación no cambia frecuentemente
  });
}

/**
 * Hook para verificar el estado de la suscripción (polling post-checkout).
 * @param habilitado - Si es true, hace polling cada 3 segundos.
 */
export function usarVerificarEstado(habilitado: boolean) {
  return useQuery({
    queryKey: ["verificar-estado"],
    queryFn: () =>
      clienteApi.get<EstadoVerificacion>("/suscripcion/verificar-estado"),
    enabled: habilitado,
    refetchInterval: habilitado ? 3000 : false,
  });
}

/**
 * Hook para obtener las facturas del usuario.
 */
export function usarFacturas() {
  return useQuery({
    queryKey: ["facturas"],
    queryFn: () => clienteApi.get<Factura[]>("/suscripcion/facturas"),
  });
}

/** Respuesta de sincronización de pagos. */
export interface RespuestaSincronizar {
  sincronizados: number;
  estado_actualizado: boolean;
  errores?: string[];
}

/**
 * Hook para sincronizar pagos desde MercadoPago.
 * Útil cuando los webhooks no llegan (desarrollo local).
 */
export function usarSincronizarPagos() {
  return useMutation({
    mutationFn: () =>
      clienteApi.post<RespuestaSincronizar>("/suscripcion/sincronizar-pagos"),
  });
}
