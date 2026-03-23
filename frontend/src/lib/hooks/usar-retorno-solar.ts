"use client";

import { useMutation } from "@tanstack/react-query";
import { clienteApi } from "@/lib/api/cliente";
import type { DatosNacimiento } from "@/lib/tipos";
import type { RetornoSolar } from "@/lib/tipos";

/** Parametros para el calculo de retorno solar */
interface ParamsRetornoSolar {
  /** Datos de nacimiento del sujeto */
  datosNacimiento: DatosNacimiento;
  /** Anio para el cual calcular la revolucion solar */
  anio: number;
  /** ID del perfil para vincular el calculo en DB */
  perfilId?: string;
}

/**
 * Hook para calcular la revolucion solar de un anio dado.
 * Determina el momento exacto en que el Sol retorna a su posicion natal
 * y genera la carta comparativa.
 * Si se proporciona perfilId, el calculo se vincula al perfil en DB.
 */
export function usarRetornoSolar() {
  return useMutation({
    mutationFn: ({ datosNacimiento, anio, perfilId }: ParamsRetornoSolar) => {
      const query = perfilId ? `?perfil_id=${perfilId}` : "";
      return clienteApi.post<RetornoSolar>(
        `/solar-return/${anio}${query}`,
        datosNacimiento
      );
    },
  });
}
