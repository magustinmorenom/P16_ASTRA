import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { clienteApi } from "@/lib/api/cliente";
import type { DatosNacimiento, Perfil } from "@/lib/tipos";

export function usarCrearPerfil() {
  return useMutation({
    mutationFn: (datos: DatosNacimiento) => clienteApi.post<Perfil>("/profile", datos),
  });
}

export function usarMiPerfil() {
  return useQuery({
    queryKey: ["perfil", "me"],
    queryFn: () => clienteApi.get<Perfil | null>("/profile/me"),
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
    mutationFn: (datos: DatosActualizarPerfil) =>
      clienteApi.put<RespuestaActualizarPerfil>("/profile/me", datos),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["perfil", "me"] });
    },
  });
}

export function usarObtenerPerfil(id: string | undefined) {
  return useQuery({
    queryKey: ["perfil", id],
    queryFn: () => clienteApi.get<Perfil>(`/profile/${id}`),
    enabled: !!id,
  });
}
