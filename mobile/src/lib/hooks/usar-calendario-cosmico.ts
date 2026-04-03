import { useQuery } from "@tanstack/react-query";
import { clienteApi } from "@/lib/api/cliente";
import type { TransitosDia, CalendarioRango } from "@/lib/tipos";

export function usarTransitosDia(fecha: string | null) {
  return useQuery({
    queryKey: ["calendario-cosmico", "dia", fecha],
    queryFn: () =>
      clienteApi.get<TransitosDia>(`/calendario-cosmico/dia?fecha=${fecha}`),
    enabled: !!fecha,
    staleTime: 5 * 60_000,
  });
}

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
