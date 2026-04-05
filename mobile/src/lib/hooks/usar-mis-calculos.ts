import { useQuery } from "@tanstack/react-query";
import { clienteApi } from "@/lib/api/cliente";
import type { CalculosPerfil } from "@/lib/tipos";

export function usarMisCalculos() {
  return useQuery({
    queryKey: ["calculos", "me"],
    queryFn: () => clienteApi.get<CalculosPerfil>("/profile/me/calculos"),
    staleTime: 10 * 60 * 1000,
  });
}
