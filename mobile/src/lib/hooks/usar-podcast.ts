import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { clienteApi } from "@/lib/api/cliente";
import type { PodcastEpisodio, TipoPodcast } from "@/lib/tipos";

export function usarPodcastHoy(refetchRapido = false) {
  return useQuery({
    queryKey: ["podcast", "hoy"],
    queryFn: async () => {
      const { data } = await clienteApi.get<{ datos: PodcastEpisodio[] }>(
        "/podcast/hoy"
      );
      return data.datos;
    },
    refetchInterval: refetchRapido ? 5_000 : 60_000,
  });
}

export function usarPodcastEpisodio(id: string | null) {
  return useQuery({
    queryKey: ["podcast", "episodio", id],
    queryFn: async () => {
      const { data } = await clienteApi.get<{ datos: PodcastEpisodio }>(
        `/podcast/episodio/${id}`
      );
      return data.datos;
    },
    enabled: !!id,
  });
}

export function usarPodcastHistorial() {
  return useQuery({
    queryKey: ["podcast", "historial"],
    queryFn: async () => {
      const { data } = await clienteApi.get<{ datos: PodcastEpisodio[] }>(
        "/podcast/historial"
      );
      return data.datos;
    },
  });
}

export function usarGenerarPodcast() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (tipo: TipoPodcast) => {
      const { data } = await clienteApi.post<{ datos: PodcastEpisodio }>(
        `/podcast/generar?tipo=${tipo}`
      );
      return data.datos;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["podcast"] });
    },
  });
}
