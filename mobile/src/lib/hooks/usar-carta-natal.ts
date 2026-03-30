import { useMutation } from "@tanstack/react-query";
import { clienteApi } from "@/lib/api/cliente";
import type { DatosNacimiento, CartaNatal } from "@/lib/tipos";

interface OpcionesCartaNatal {
  datos: DatosNacimiento;
  perfilId?: string;
}

export function usarCartaNatal() {
  return useMutation({
    mutationFn: async ({ datos, perfilId }: OpcionesCartaNatal) => {
      const query = perfilId ? `?perfil_id=${perfilId}` : "";
      const { data } = await clienteApi.post<{ datos: CartaNatal }>(
        `/natal${query}`,
        datos
      );
      return data.datos;
    },
  });
}
