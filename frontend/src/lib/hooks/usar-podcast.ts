"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { clienteApi, ErrorAPI } from "@/lib/api/cliente";
import type { PodcastEpisodio, TipoPodcast } from "@/lib/tipos";
import { fechaHoyLocal } from "@/lib/utilidades/fecha-local";

/** No reintentar en errores 403 (falta de permisos/plan). */
function reintentarSiNoEs403(cantidadFallos: number, error: Error) {
  if (error instanceof ErrorAPI && error.codigo === 403) return false;
  return cantidadFallos < 2;
}

/** Obtiene los episodios de podcast existentes (día/semana/mes actuales). */
export function usarPodcastHoy(refetchRapido = false) {
  const hoy = fechaHoyLocal();
  return useQuery({
    queryKey: ["podcast", "hoy", hoy],
    queryFn: () => clienteApi.get<PodcastEpisodio[]>(`/podcast/hoy?fecha=${hoy}`),
    retry: reintentarSiNoEs403,
    refetchInterval: (query) => {
      // No seguir haciendo polling si el error es 403
      if (query.state.error instanceof ErrorAPI && query.state.error.codigo === 403) {
        return false;
      }

      const episodios = query.state.data as PodcastEpisodio[] | undefined;
      const hayEnProceso = (episodios ?? []).some(
        (episodio) =>
          episodio.estado === "generando_guion" ||
          episodio.estado === "generando_audio",
      );

      if (refetchRapido || hayEnProceso) {
        return 5_000;
      }

      return 60_000;
    },
  });
}

/** Obtiene el detalle de un episodio por ID. */
export function usarPodcastEpisodio(id: string | null) {
  return useQuery({
    queryKey: ["podcast", "episodio", id],
    queryFn: () => clienteApi.get<PodcastEpisodio>(`/podcast/episodio/${id}`),
    enabled: !!id,
    retry: reintentarSiNoEs403,
  });
}

/** Obtiene el historial de episodios recientes. */
export function usarPodcastHistorial() {
  return useQuery({
    queryKey: ["podcast", "historial"],
    queryFn: () => clienteApi.get<PodcastEpisodio[]>("/podcast/historial"),
    retry: reintentarSiNoEs403,
  });
}

/** Genera un episodio de podcast on-demand. */
export function usarGenerarPodcast() {
  const queryClient = useQueryClient();
  const hoy = fechaHoyLocal();
  return useMutation({
    mutationFn: (tipo: TipoPodcast) =>
      clienteApi.post<PodcastEpisodio>(`/podcast/generar?tipo=${tipo}&fecha=${hoy}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["podcast"] });
      // También invalidamos el pronóstico para que se recalcule basándose en este audio/lectura
      queryClient.invalidateQueries({ queryKey: ["pronostico"] });
    },
  });
}
