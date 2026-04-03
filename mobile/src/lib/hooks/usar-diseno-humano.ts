import { useMutation } from "@tanstack/react-query";
import { clienteApi } from "@/lib/api/cliente";
import type { DatosNacimiento, DisenoHumano } from "@/lib/tipos";

interface OpcionesDisenoHumano {
  datos: DatosNacimiento;
  perfilId?: string;
}

export function usarDisenoHumano() {
  return useMutation({
    mutationFn: ({ datos, perfilId }: OpcionesDisenoHumano) => {
      const query = perfilId ? `?perfil_id=${perfilId}` : "";
      return clienteApi.post<DisenoHumano>(`/human-design${query}`, datos);
    },
  });
}
