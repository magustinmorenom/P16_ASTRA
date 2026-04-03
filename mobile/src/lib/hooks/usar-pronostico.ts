import { useQuery } from "@tanstack/react-query";
import { clienteApi } from "@/lib/api/cliente";
import type { PronosticoDiarioDTO, PronosticoSemanalDTO } from "@/lib/tipos";

export function usarPronosticoDiario(fecha?: string) {
  const hoy = new Date().toISOString().split("T")[0];
  const fechaQuery = fecha ?? hoy;

  return useQuery({
    queryKey: ["pronostico", "diario", fechaQuery],
    queryFn: () =>
      clienteApi.get<PronosticoDiarioDTO>(`/pronostico/diario?fecha=${fechaQuery}`),
    staleTime: 30 * 60 * 1000,
  });
}

export function usarPronosticoSemanal(fechaInicio?: string) {
  const params = fechaInicio ? `?fecha_inicio=${fechaInicio}` : "";

  return useQuery({
    queryKey: ["pronostico", "semanal", fechaInicio ?? "actual"],
    queryFn: () =>
      clienteApi.get<PronosticoSemanalDTO>(`/pronostico/semanal${params}`),
    staleTime: 60 * 60 * 1000,
    enabled: fechaInicio !== null,
  });
}
