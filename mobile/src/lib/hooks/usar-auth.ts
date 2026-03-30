import { useMutation } from "@tanstack/react-query";
import * as SecureStore from "expo-secure-store";
import { clienteApi } from "@/lib/api/cliente";
import { useStoreAuth } from "@/lib/stores/store-auth";
import type {
  EsquemaRegistro,
  EsquemaLogin,
  RespuestaRegistroLogin,
} from "@/lib/tipos";

export function usarLogin() {
  const { cargarUsuario } = useStoreAuth();

  return useMutation({
    mutationFn: async (datos: EsquemaLogin) => {
      const { data } = await clienteApi.post<{ datos: RespuestaRegistroLogin }>(
        "/auth/login",
        datos
      );
      const resp = data.datos;
      await SecureStore.setItemAsync("access_token", resp.token_acceso);
      await SecureStore.setItemAsync("refresh_token", resp.token_refresco);
      await cargarUsuario();
      return resp;
    },
  });
}

export function usarRegistro() {
  const { cargarUsuario } = useStoreAuth();

  return useMutation({
    mutationFn: async (datos: EsquemaRegistro) => {
      const { data } = await clienteApi.post<{ datos: RespuestaRegistroLogin }>(
        "/auth/registrar",
        datos
      );
      const resp = data.datos;
      await SecureStore.setItemAsync("access_token", resp.token_acceso);
      await SecureStore.setItemAsync("refresh_token", resp.token_refresco);
      await cargarUsuario();
      return resp;
    },
  });
}

export function usarLogout() {
  const { cerrarSesion } = useStoreAuth();

  return useMutation({
    mutationFn: async () => {
      try {
        const tokenRefresco = await SecureStore.getItemAsync("refresh_token");
        if (tokenRefresco) {
          await clienteApi.post("/auth/logout", {
            token_refresco: tokenRefresco,
          });
        }
      } finally {
        await cerrarSesion();
      }
    },
  });
}

export function usarCambiarContrasena() {
  return useMutation({
    mutationFn: (datos: { contrasena_actual: string; contrasena_nueva: string }) =>
      clienteApi.post("/auth/cambiar-contrasena", datos),
  });
}

export function usarGoogleAuthUrl() {
  return useMutation({
    mutationFn: async () => {
      const { data } = await clienteApi.get<{ datos: { url: string } }>(
        "/auth/google/url"
      );
      return data.datos;
    },
  });
}
