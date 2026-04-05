import { useMutation } from "@tanstack/react-query";
import { clienteApi } from "@/lib/api/cliente";
import type { DatosNacimiento, RetornoSolar } from "@/lib/tipos";

interface ParamsRetornoSolar {
  datosNacimiento: DatosNacimiento;
  anio: number;
  perfilId?: string;
}

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
