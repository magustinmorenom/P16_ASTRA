"use client";

import { useMutation } from "@tanstack/react-query";
import { clienteApi } from "@/lib/api/cliente";
import type { DatosNumerologia } from "@/lib/tipos";
import type { Numerologia } from "@/lib/tipos";

interface OpcionesNumerologia {
  datos: DatosNumerologia;
  perfilId?: string;
}

/**
 * Hook para calcular la carta numerologica.
 * Soporta sistema Pitagorico (por defecto) y Caldeo como alternativa.
 * Los numeros maestros (11, 22, 33) no se reducen.
 * Si se proporciona perfilId, el cálculo se vincula al perfil en DB.
 */
export function usarNumerologia() {
  return useMutation({
    mutationFn: ({ datos, perfilId }: OpcionesNumerologia) => {
      const query = perfilId ? `?perfil_id=${perfilId}` : "";
      return clienteApi.post<Numerologia>(`/numerology${query}`, datos);
    },
  });
}
