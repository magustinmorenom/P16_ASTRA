"use client";

import { useQuery } from "@tanstack/react-query";
import { clienteApi } from "@/lib/api/cliente";
import type { TransitosDia, CalendarioRango } from "@/lib/tipos";

/**
 * Hook para obtener los tránsitos planetarios de un día específico.
 * Se habilita solo cuando fecha no es null.
 */
export function usarTransitosDia(fecha: string | null) {
  return useQuery({
    queryKey: ["calendario-cosmico", "dia", fecha],
    queryFn: () => clienteApi.get<TransitosDia>(`/calendario-cosmico/dia?fecha=${fecha}`),
    enabled: !!fecha,
    staleTime: 5 * 60_000,
  });
}

/**
 * Hook para obtener los tránsitos de un rango de fechas.
 * Se habilita solo cuando ambas fechas están presentes.
 */
export function usarTransitosRango(inicio: string | null, fin: string | null) {
  return useQuery({
    queryKey: ["calendario-cosmico", "rango", inicio, fin],
    queryFn: () =>
      clienteApi.get<CalendarioRango>(
        `/calendario-cosmico/rango?fecha_inicio=${inicio}&fecha_fin=${fin}`
      ),
    enabled: !!inicio && !!fin,
    staleTime: 5 * 60_000,
  });
}
