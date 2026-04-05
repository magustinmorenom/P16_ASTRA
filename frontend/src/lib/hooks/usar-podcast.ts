"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { clienteApi } from "@/lib/api/cliente";
import type { PodcastEpisodio, TipoPodcast } from "@/lib/tipos";

/** Obtiene los episodios de podcast existentes (día/semana/mes actuales). */
export function usarPodcastHoy(refetchRapido = false) {
  return useQuery({
    queryKey: ["podcast", "hoy"],
    queryFn: () => clienteApi.get<PodcastEpisodio[]>("/podcast/hoy"),
    refetchInterval: (query) => {
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
  });
}

/** Obtiene el historial de episodios recientes. */
export function usarPodcastHistorial() {
  return useQuery({
    queryKey: ["podcast", "historial"],
    queryFn: () => clienteApi.get<PodcastEpisodio[]>("/podcast/historial"),
  });
}

/** Genera un episodio de podcast on-demand. */
export function usarGenerarPodcast() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (tipo: TipoPodcast) =>
      clienteApi.post<PodcastEpisodio>(`/podcast/generar?tipo=${tipo}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["podcast"] });
    },
  });
}
