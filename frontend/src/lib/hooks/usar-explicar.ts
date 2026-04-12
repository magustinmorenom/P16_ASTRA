"use client";

/**
 * Hook que dispara el endpoint POST /chat/explicar y sincroniza el resultado
 * con el store-explicar.
 */

import { useMutation } from "@tanstack/react-query";

import { clienteApi } from "@/lib/api/cliente";
import { useStoreExplicar } from "@/lib/stores/store-explicar";
import type { ExplicarResponse } from "@/lib/tipos";

interface ExplicarInput {
  texto: string;
  contextoSeccion: string;
  contextoExtendido?: string;
}

export function usarExplicar() {
  const empezarCarga = useStoreExplicar((s) => s.empezarCarga);
  const setRespuesta = useStoreExplicar((s) => s.setRespuesta);
  const setError = useStoreExplicar((s) => s.setError);

  return useMutation({
    mutationFn: (input: ExplicarInput) =>
      clienteApi.post<ExplicarResponse>("/chat/explicar", {
        texto: input.texto,
        contexto_seccion: input.contextoSeccion,
        contexto_extendido: input.contextoExtendido,
      }),
    onMutate: () => {
      empezarCarga();
    },
    onSuccess: (resp) => {
      setRespuesta(resp.respuesta, resp.desde_cache, resp.mensajes_restantes);
    },
    onError: () => {
      setError();
    },
  });
}
