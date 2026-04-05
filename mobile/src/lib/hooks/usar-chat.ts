import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { clienteApi } from "@/lib/api/cliente";
import type { HistorialChat, NuevaConversacion, RespuestaChat } from "@/lib/tipos";

export function usarHistorialChat(habilitado = true) {
  return useQuery({
    queryKey: ["chat", "historial"],
    queryFn: () => clienteApi.get<HistorialChat>("/chat/historial"),
    enabled: habilitado,
    staleTime: Infinity,
  });
}

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

export function usarNuevaConversacion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => clienteApi.post<NuevaConversacion>("/chat/nueva"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["chat", "historial"] });
    },
  });
}
