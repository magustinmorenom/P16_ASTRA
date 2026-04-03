import { useMutation } from "@tanstack/react-query";
import { clienteApi } from "@/lib/api/cliente";
import type { DatosNumerologia, Numerologia } from "@/lib/tipos";

interface OpcionesNumerologia {
  datos: DatosNumerologia;
  perfilId?: string;
}

export function usarNumerologia() {
  return useMutation({
    mutationFn: ({ datos, perfilId }: OpcionesNumerologia) => {
      const query = perfilId ? `?perfil_id=${perfilId}` : "";
      return clienteApi.post<Numerologia>(`/numerology${query}`, datos);
    },
  });
}
