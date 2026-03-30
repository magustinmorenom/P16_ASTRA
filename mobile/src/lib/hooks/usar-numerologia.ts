import { useMutation } from "@tanstack/react-query";
import { clienteApi } from "@/lib/api/cliente";
import type { DatosNumerologia, Numerologia } from "@/lib/tipos";

interface OpcionesNumerologia {
  datos: DatosNumerologia;
  perfilId?: string;
}

export function usarNumerologia() {
  return useMutation({
    mutationFn: async ({ datos, perfilId }: OpcionesNumerologia) => {
      const query = perfilId ? `?perfil_id=${perfilId}` : "";
      const { data } = await clienteApi.post<{ datos: Numerologia }>(
        `/numerology${query}`,
        datos
      );
      return data.datos;
    },
  });
}
