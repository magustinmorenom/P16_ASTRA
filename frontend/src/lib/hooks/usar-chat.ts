"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { clienteApi } from "@/lib/api/cliente";
import type { RespuestaChat, HistorialChat, NuevaConversacion } from "@/lib/tipos";

/**
 * Hook para obtener el historial del chat web activo.
 */
export function usarHistorialChat(habilitado = false) {
  return useQuery({
    queryKey: ["chat", "historial"],
    queryFn: () => clienteApi.get<HistorialChat>("/chat/historial"),
    enabled: habilitado,
    staleTime: Infinity,
  });
}

/**
 * Hook para enviar un mensaje al oráculo vía chat web.
 */
export function usarEnviarMensaje() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (mensaje: string) =>
      clienteApi.post<RespuestaChat>("/chat/mensaje", { mensaje }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["chat", "historial"] });
    },
  });
}

/**
 * Hook para iniciar una nueva conversación (archivar la actual).
 */
export function usarNuevaConversacion() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () =>
      clienteApi.post<NuevaConversacion>("/chat/nueva"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["chat", "historial"] });
    },
  });
}
