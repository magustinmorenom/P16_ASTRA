"use client";

import { useQuery } from "@tanstack/react-query";
import { clienteApi } from "@/lib/api/cliente";
import type { PerfilEspiritual } from "@/lib/tipos/perfil-espiritual";

interface RespuestaPerfilEspiritual {
  estado?: "generando" | "listo";
  resumen?: string;
  foda?: PerfilEspiritual["foda"];
}

export function usarPerfilEspiritual() {
  return useQuery<PerfilEspiritual | null>({
    queryKey: ["perfil-espiritual"],
    queryFn: async () => {
      const resp = await clienteApi.get<RespuestaPerfilEspiritual>("/perfil-espiritual");
      if (resp.estado === "generando" || !resp.resumen || !resp.foda) {
        return null;
      }
      return {
        resumen: resp.resumen,
        foda: resp.foda,
      };
    },
    refetchInterval: (query) => {
      return query.state.data === null ? 3000 : false;
    },
    staleTime: Infinity,
    refetchOnWindowFocus: false,
    retry: false,
  });
}
