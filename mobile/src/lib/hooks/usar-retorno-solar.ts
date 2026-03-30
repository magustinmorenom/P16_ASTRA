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
    mutationFn: async ({ datosNacimiento, anio, perfilId }: ParamsRetornoSolar) => {
      const query = perfilId ? `?perfil_id=${perfilId}` : "";
      const { data } = await clienteApi.post<{ datos: RetornoSolar }>(
        `/solar-return/${anio}${query}`,
        datosNacimiento
      );
      return data.datos;
    },
  });
}
