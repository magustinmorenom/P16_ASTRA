"use client";

import { useQuery } from "@tanstack/react-query";
import { clienteApi } from "@/lib/api/cliente";
import type { Transitos } from "@/lib/tipos";

/** Intervalo de refresco: 10 minutos en milisegundos */
const INTERVALO_REFRESCO = 600_000;

/**
 * Hook para obtener las posiciones planetarias actuales (transitos).
 * Se refresca automaticamente cada 10 minutos.
 */
export function usarTransitos() {
  return useQuery({
    queryKey: ["transitos"],
    queryFn: () => clienteApi.get<Transitos>("/transits"),
    refetchInterval: INTERVALO_REFRESCO,
  });
}
