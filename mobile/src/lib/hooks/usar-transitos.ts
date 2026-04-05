import { useQuery } from "@tanstack/react-query";
import { clienteApi } from "@/lib/api/cliente";
import type { Transitos } from "@/lib/tipos";

const INTERVALO_REFRESCO = 600_000;

export function usarTransitos() {
  return useQuery({
    queryKey: ["transitos"],
    queryFn: () => clienteApi.get<Transitos>("/transits"),
    refetchInterval: INTERVALO_REFRESCO,
  });
}
