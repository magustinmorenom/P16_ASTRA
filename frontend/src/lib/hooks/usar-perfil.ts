"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
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
