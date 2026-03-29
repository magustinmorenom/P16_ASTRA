import { useQuery } from "@tanstack/react-query";
import { clienteApi } from "@/lib/api/cliente";
import type { ResultadoGeo } from "@/lib/tipos";

export function usarBuscarCiudad(consulta: string) {
  return useQuery({
    queryKey: ["geo", "buscar", consulta.trim()],
    queryFn: async () => {
      const { data } = await clienteApi.get<{ datos: ResultadoGeo[] }>(
        "/geo/buscar",
        { params: { q: consulta.trim(), limite: 8 } }
      );
      return data.datos;
    },
    enabled: consulta.trim().length >= 3,
    staleTime: 5 * 60 * 1000,
    placeholderData: (prev) => prev,
  });
}
