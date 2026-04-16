"use client";

import { useQuery } from "@tanstack/react-query";
import { clienteApi } from "@/lib/api/cliente";
import type { PronosticoDiarioDTO, PronosticoSemanalDTO } from "@/lib/tipos";
import { fechaHoyLocal } from "@/lib/utilidades/fecha-local";

/** Obtiene el pronóstico cósmico del día (o de una fecha específica). */
export function usarPronosticoDiario(fecha?: string) {
  const hoy = fechaHoyLocal();
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
export function usarPronosticoSemanal(fechaInicio?: string) {
  const params = fechaInicio ? `?fecha_inicio=${fechaInicio}` : "";
  return useQuery({
    queryKey: ["pronostico", "semanal", fechaInicio ?? "actual"],
    queryFn: () =>
      clienteApi.get<PronosticoSemanalDTO>(`/pronostico/semanal${params}`),
    staleTime: 60 * 60 * 1000, // 1h
    refetchOnWindowFocus: false,
    enabled: fechaInicio !== null, // siempre habilitado salvo que se pase null explícito
  });
}

/** Obtiene el pronóstico de la siguiente semana (solo cuando habilitado). */
export function usarPronosticoSemanaSiguiente(fechaInicio: string | undefined) {
  return useQuery({
    queryKey: ["pronostico", "semanal", fechaInicio],
    queryFn: () =>
      clienteApi.get<PronosticoSemanalDTO>(`/pronostico/semanal?fecha_inicio=${fechaInicio}`),
    staleTime: 60 * 60 * 1000,
    refetchOnWindowFocus: false,
    enabled: !!fechaInicio,
  });
}
