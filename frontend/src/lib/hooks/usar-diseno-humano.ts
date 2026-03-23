"use client";

import { useMutation } from "@tanstack/react-query";
import { clienteApi } from "@/lib/api/cliente";
import type { DatosNacimiento } from "@/lib/tipos";
import type { DisenoHumano } from "@/lib/tipos";

interface OpcionesDisenoHumano {
  datos: DatosNacimiento;
  perfilId?: string;
}

/**
 * Hook para calcular el Diseno Humano (Body Graph).
 * Envia los datos de nacimiento y devuelve el perfil HD completo
 * (tipo, autoridad, perfil, cruz de encarnacion, canales, puertas).
 * Si se proporciona perfilId, el cálculo se vincula al perfil en DB.
 */
export function usarDisenoHumano() {
  return useMutation({
    mutationFn: ({ datos, perfilId }: OpcionesDisenoHumano) => {
      const query = perfilId ? `?perfil_id=${perfilId}` : "";
      return clienteApi.post<DisenoHumano>(`/human-design${query}`, datos);
    },
  });
}
