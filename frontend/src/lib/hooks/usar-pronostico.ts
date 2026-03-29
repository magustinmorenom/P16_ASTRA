"use client";

import { useQuery } from "@tanstack/react-query";
import { clienteApi } from "@/lib/api/cliente";
import type { PronosticoDiarioDTO, PronosticoSemanalDTO } from "@/lib/tipos";

/** Obtiene el pronóstico cósmico del día (o de una fecha específica). */
export function usarPronosticoDiario(fecha?: string) {
  const hoy = new Date().toISOString().split("T")[0];
  const fechaQuery = fecha ?? hoy;

  return useQuery({
    queryKey: ["pronostico", "diario", fechaQuery],
    queryFn: () =>
      clienteApi.get<PronosticoDiarioDTO>(
        `/pronostico/diario?fecha=${fechaQuery}`
      ),
    staleTime: 30 * 60 * 1000, // 30 min
    refetchOnWindowFocus: false,
  });
}

/** Obtiene el pronóstico semanal resumido. */
export function usarPronosticoSemanal() {
  return useQuery({
    queryKey: ["pronostico", "semanal"],
    queryFn: () =>
      clienteApi.get<PronosticoSemanalDTO>("/pronostico/semanal"),
    staleTime: 60 * 60 * 1000, // 1h
    refetchOnWindowFocus: false,
  });
}
