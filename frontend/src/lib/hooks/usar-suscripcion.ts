"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import { clienteApi } from "@/lib/api/cliente";
import type {
  Plan,
  Suscripcion,
  Pago,
  RespuestaCheckout,
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
