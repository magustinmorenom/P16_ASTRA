"use client";

import { useQuery } from "@tanstack/react-query";
import { clienteApi } from "@/lib/api/cliente";

export interface PerlasDiariasDTO {
  perlas: string[];
  fuente: "haiku" | "curado";
  tono: "voseo" | "neutro";
}

/**
 * Obtiene las perlas del día para el usuario autenticado.
 * Cache local: 6h. El backend cachea hasta medianoche ARG.
 */
export function usarPerlasDiarias() {
  const hoy = new Date().toISOString().split("T")[0];

  return useQuery({
    queryKey: ["perlas", "diaria", hoy],
    queryFn: () =>
      clienteApi.get<PerlasDiariasDTO>(`/perlas/diaria?fecha=${hoy}`),
    staleTime: 6 * 60 * 60 * 1000,
    refetchOnWindowFocus: false,
    retry: 1,
  });
}
