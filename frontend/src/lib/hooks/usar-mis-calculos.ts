"use client";

import { useQuery } from "@tanstack/react-query";
import { clienteApi } from "@/lib/api/cliente";
import type { CalculosPerfil } from "@/lib/tipos";

/**
 * Hook para obtener los cálculos persistidos del usuario autenticado.
 * Trae los resultados desde la DB (GET /profile/me/calculos) sin recalcular.
 */
export function usarMisCalculos() {
  return useQuery({
    queryKey: ["calculos", "me"],
    queryFn: () => clienteApi.get<CalculosPerfil>("/profile/me/calculos"),
    staleTime: 10 * 60 * 1000, // 10 minutos
  });
}
