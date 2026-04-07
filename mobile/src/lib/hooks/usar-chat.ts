import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { clienteApi } from "@/lib/api/cliente";
import type {
  CambiarConversacionRespuesta,
  ConversacionResumen,
  HistorialChat,
  NuevaConversacion,
  RespuestaChat,
} from "@/lib/tipos";

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
      queryClient.invalidateQueries({ queryKey: ["chat", "conversaciones"] });
    },
  });
}

export function usarNuevaConversacion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => clienteApi.post<NuevaConversacion>("/chat/nueva"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["chat", "historial"] });
      queryClient.invalidateQueries({ queryKey: ["chat", "conversaciones"] });
    },
  });
}

export function usarConversaciones(habilitado = true) {
  return useQuery({
    queryKey: ["chat", "conversaciones"],
    queryFn: () =>
      clienteApi.get<ConversacionResumen[]>("/chat/conversaciones"),
    enabled: habilitado,
  });
}

export function usarCambiarConversacion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (conversacionId: string) =>
      clienteApi.post<CambiarConversacionRespuesta>(
        `/chat/cambiar/${conversacionId}`
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["chat", "historial"] });
      queryClient.invalidateQueries({ queryKey: ["chat", "conversaciones"] });
    },
  });
}

export function usarRenombrarConversacion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, titulo }: { id: string; titulo: string }) =>
      clienteApi.put<{ id: string; titulo: string }>(
        `/chat/${id}/renombrar`,
        { titulo }
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["chat", "conversaciones"] });
    },
  });
}

export function usarAnclarConversacion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) =>
      clienteApi.post<{ id: string; anclada: boolean }>(`/chat/${id}/anclar`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["chat", "conversaciones"] });
    },
  });
}

export function usarArchivarConversacion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) =>
      clienteApi.post<{ id: string; archivada: boolean }>(
        `/chat/${id}/archivar`
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["chat", "conversaciones"] });
    },
  });
}

export function usarEliminarConversacion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) =>
      clienteApi.delete<{ eliminada: boolean }>(`/chat/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["chat", "conversaciones"] });
      queryClient.invalidateQueries({ queryKey: ["chat", "historial"] });
    },
  });
}
