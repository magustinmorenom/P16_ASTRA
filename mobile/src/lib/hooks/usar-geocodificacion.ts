import { useQuery } from "@tanstack/react-query";
import { clienteApi } from "@/lib/api/cliente";
import type { ResultadoGeo } from "@/lib/tipos";

export function usarBuscarCiudad(consulta: string) {
  return useQuery({
    queryKey: ["geo", "buscar", consulta.trim()],
    queryFn: () =>
      clienteApi.get<ResultadoGeo[]>(
        `/geo/buscar?q=${encodeURIComponent(consulta.trim())}&limite=8`
      ),
    enabled: consulta.trim().length >= 3,
    staleTime: 5 * 60 * 1000,
    placeholderData: (prev) => prev,
  });
}
