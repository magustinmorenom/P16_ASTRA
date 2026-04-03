import { useMutation } from "@tanstack/react-query";
import * as SecureStore from "expo-secure-store";
import { clienteApi } from "@/lib/api/cliente";
import { useStoreAuth } from "@/lib/stores/store-auth";
import type {
  EsquemaConfirmarReset,
  EsquemaEliminarCuenta,
  EsquemaRegistro,
  EsquemaLogin,
  EsquemaSolicitarReset,
  EsquemaVerificarOtp,
  RespuestaRegistroLogin,
  RespuestaTokenReset,
} from "@/lib/tipos";

export function usarLogin() {
  const { cargarUsuario } = useStoreAuth();

  return useMutation({
    mutationFn: async (datos: EsquemaLogin) => {
      const resp = await clienteApi.post<RespuestaRegistroLogin>(
        "/auth/login",
        datos
      );
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
      const resp = await clienteApi.post<RespuestaRegistroLogin>(
        "/auth/registrar",
        datos
      );
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
    mutationFn: () => clienteApi.get<{ url: string }>("/auth/google/url"),
  });
}

export function usarSolicitarReset() {
  return useMutation({
    mutationFn: (datos: EsquemaSolicitarReset) =>
      clienteApi.post("/auth/solicitar-reset", datos),
  });
}

export function usarVerificarOtp() {
  return useMutation({
    mutationFn: (datos: EsquemaVerificarOtp) =>
      clienteApi.post<RespuestaTokenReset>("/auth/verificar-otp", datos),
  });
}

export function usarConfirmarReset() {
  return useMutation({
    mutationFn: (datos: EsquemaConfirmarReset) =>
      clienteApi.post("/auth/confirmar-reset", datos),
  });
}

export function usarEliminarCuenta() {
  return useMutation({
    mutationFn: (datos: EsquemaEliminarCuenta) =>
      clienteApi.post("/auth/eliminar-cuenta", datos),
  });
}
