import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { clienteApi } from "@/lib/api/cliente";
import type { PodcastEpisodio, TipoPodcast } from "@/lib/tipos";

export function usarPodcastHoy(refetchRapido = false) {
  return useQuery({
    queryKey: ["podcast", "hoy"],
    queryFn: () => clienteApi.get<PodcastEpisodio[]>("/podcast/hoy"),
    refetchInterval: refetchRapido ? 5_000 : 60_000,
  });
}

export function usarPodcastEpisodio(id: string | null) {
  return useQuery({
    queryKey: ["podcast", "episodio", id],
    queryFn: () => clienteApi.get<PodcastEpisodio>(`/podcast/episodio/${id}`),
    enabled: !!id,
  });
}

export function usarPodcastHistorial() {
  return useQuery({
    queryKey: ["podcast", "historial"],
    queryFn: () => clienteApi.get<PodcastEpisodio[]>("/podcast/historial"),
  });
}

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
