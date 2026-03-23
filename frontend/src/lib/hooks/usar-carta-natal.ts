"use client";

import { useMutation } from "@tanstack/react-query";
import { clienteApi } from "@/lib/api/cliente";
import type { DatosNacimiento } from "@/lib/tipos";
import type { CartaNatal } from "@/lib/tipos";

interface OpcionesCartaNatal {
  datos: DatosNacimiento;
  perfilId?: string;
}

/**
 * Hook para calcular la carta natal.
 * Envia los datos de nacimiento y devuelve la carta natal completa
 * (planetas, casas Placidus, aspectos, dignidades).
 * Si se proporciona perfilId, el cálculo se vincula al perfil en DB.
 */
export function usarCartaNatal() {
  return useMutation({
    mutationFn: ({ datos, perfilId }: OpcionesCartaNatal) => {
      const query = perfilId ? `?perfil_id=${perfilId}` : "";
      return clienteApi.post<CartaNatal>(`/natal${query}`, datos);
    },
  });
}
