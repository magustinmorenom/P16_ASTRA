import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { clienteApi } from "@/lib/api/cliente";
import type { DatosNacimiento, Perfil } from "@/lib/tipos";

export function usarCrearPerfil() {
  return useMutation({
    mutationFn: async (datos: DatosNacimiento) => {
      const { data } = await clienteApi.post<{ datos: Perfil }>("/profile", datos);
      return data.datos;
    },
  });
}

export function usarMiPerfil() {
  return useQuery({
    queryKey: ["perfil", "me"],
    queryFn: async () => {
      const { data } = await clienteApi.get<{ datos: Perfil | null }>("/profile/me");
      return data.datos;
    },
    staleTime: 5 * 60 * 1000,
  });
}

export interface DatosActualizarPerfil {
  nombre?: string;
  fecha_nacimiento?: string;
  hora_nacimiento?: string;
  ciudad_nacimiento?: string;
  pais_nacimiento?: string;
}

interface RespuestaActualizarPerfil extends Perfil {
  datos_nacimiento_cambiaron: boolean;
}

export function usarActualizarPerfil() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (datos: DatosActualizarPerfil) => {
      const { data } = await clienteApi.put<{ datos: RespuestaActualizarPerfil }>(
        "/profile/me",
        datos
      );
      return data.datos;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["perfil", "me"] });
    },
  });
}
