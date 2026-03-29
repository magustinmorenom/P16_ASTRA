import { useQuery } from "@tanstack/react-query";
import { clienteApi } from "@/lib/api/cliente";
import type { CalculosPerfil } from "@/lib/tipos";

export function usarMisCalculos() {
  return useQuery({
    queryKey: ["calculos", "me"],
    queryFn: async () => {
      const { data } = await clienteApi.get<{ datos: CalculosPerfil }>(
        "/profile/me/calculos"
      );
      return data.datos;
    },
    staleTime: 10 * 60 * 1000,
  });
}
