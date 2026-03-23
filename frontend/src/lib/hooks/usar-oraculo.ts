"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { clienteApi } from "@/lib/api/cliente";
import type { CodigoVinculacion, EstadoVinculacion } from "@/lib/tipos";

/**
 * Hook para generar un código de vinculación Telegram.
 */
export function usarGenerarCodigo() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () =>
      clienteApi.post<CodigoVinculacion>("/oraculo/generar-codigo"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vinculacion-oraculo"] });
    },
  });
}

/**
 * Hook para obtener el estado de vinculación Telegram.
 */
export function usarEstadoVinculacion() {
  return useQuery({
    queryKey: ["vinculacion-oraculo"],
    queryFn: () =>
      clienteApi.get<EstadoVinculacion>("/oraculo/vinculacion"),
    staleTime: 1000 * 60 * 5, // 5 min
  });
}

/**
 * Hook para desvincular Telegram.
 */
export function usarDesvincular() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => clienteApi.delete("/oraculo/desvincular"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vinculacion-oraculo"] });
    },
  });
}
