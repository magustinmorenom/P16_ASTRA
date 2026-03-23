"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { clienteApi } from "@/lib/api/cliente";
import type { DatosNacimiento } from "@/lib/tipos";
import type { Perfil } from "@/lib/tipos";

/**
 * Hook para crear un nuevo perfil.
 * Envia los datos de nacimiento y almacena el perfil en el backend.
 */
export function usarCrearPerfil() {
  return useMutation({
    mutationFn: (datos: DatosNacimiento) =>
      clienteApi.post<Perfil>("/profile", datos),
  });
}

/**
 * Hook para obtener el perfil del usuario autenticado.
 * Devuelve null si el usuario no tiene perfil (no hizo onboarding).
 * Se usa para auto-cargar datos en las paginas de calculo.
 */
export function usarMiPerfil() {
  return useQuery({
    queryKey: ["perfil", "me"],
    queryFn: () => clienteApi.get<Perfil | null>("/profile/me"),
    staleTime: 5 * 60 * 1000, // 5 minutos
  });
}

/** Datos opcionales para actualizar el perfil. */
export interface DatosActualizarPerfil {
  nombre?: string;
  fecha_nacimiento?: string;
  hora_nacimiento?: string;
  ciudad_nacimiento?: string;
  pais_nacimiento?: string;
}

/** Respuesta del PUT /profile/me. */
interface RespuestaActualizarPerfil extends Perfil {
  datos_nacimiento_cambiaron: boolean;
}

/**
 * Hook para actualizar el perfil del usuario autenticado.
 * Invalida la query de perfil al tener exito.
 */
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

/**
 * Hook para obtener un perfil por su ID.
 * Solo ejecuta la consulta cuando se proporciona un ID valido.
 */
export function usarObtenerPerfil(id: string | undefined) {
  return useQuery({
    queryKey: ["perfil", id],
    queryFn: () => clienteApi.get<Perfil>(`/profile/${id}`),
    enabled: !!id,
  });
}
