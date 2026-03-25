"use client";

import { useMutation } from "@tanstack/react-query";
import { clienteApi } from "@/lib/api/cliente";
import { useStoreAuth } from "@/lib/stores/store-auth";
import type {
  EsquemaRegistro,
  EsquemaLogin,
  RespuestaRegistroLogin,
} from "@/lib/tipos";

/**
 * Hook para iniciar sesión.
 * El cliente API auto-desenvuelve `datos`, así que recibimos
 * RespuestaRegistroLogin directamente (usuario + tokens).
 */
export function usarLogin() {
  const { cargarUsuario } = useStoreAuth();

  return useMutation({
    mutationFn: async (datos: EsquemaLogin) => {
      const resp = await clienteApi.post<RespuestaRegistroLogin>(
        "/auth/login",
        datos,
      );
      localStorage.setItem("token_acceso", resp.token_acceso);
      localStorage.setItem("token_refresco", resp.token_refresco);
      await cargarUsuario();
      return resp;
    },
  });
}

/**
 * Hook para registrar un nuevo usuario.
 * Almacena tokens y carga el usuario.
 */
export function usarRegistro() {
  const { cargarUsuario } = useStoreAuth();

  return useMutation({
    mutationFn: async (datos: EsquemaRegistro) => {
      const resp = await clienteApi.post<RespuestaRegistroLogin>(
        "/auth/registrar",
        datos,
      );
      localStorage.setItem("token_acceso", resp.token_acceso);
      localStorage.setItem("token_refresco", resp.token_refresco);
      await cargarUsuario();
      return resp;
    },
  });
}

/**
 * Hook para cerrar sesión.
 * Si el POST falla, limpia tokens locales de todas formas.
 */
export function usarLogout() {
  const { cerrarSesion } = useStoreAuth();

  return useMutation({
    mutationFn: async () => {
      try {
        const tokenRefresco = localStorage.getItem("token_refresco");
        if (tokenRefresco) {
          await clienteApi.post("/auth/logout", {
            token_refresco: tokenRefresco,
          });
        }
      } finally {
        cerrarSesion();
      }
    },
  });
}

/** Hook para cambiar contraseña. */
export function usarCambiarContrasena() {
  return useMutation({
    mutationFn: (datos: {
      contrasena_actual: string;
      contrasena_nueva: string;
    }) => clienteApi.post("/auth/cambiar-contrasena", datos),
  });
}

/** Hook para obtener la URL de Google OAuth. */
export function usarGoogleAuthUrl() {
  return useMutation({
    mutationFn: () =>
      clienteApi.get<{ url: string }>("/auth/google/url"),
  });
}

/** Hook para solicitar reset de contraseña. */
export function usarSolicitarReset() {
  return useMutation({
    mutationFn: (datos: { email: string }) =>
      clienteApi.post("/auth/solicitar-reset", datos),
  });
}

/** Hook para confirmar reset de contraseña con token. */
export function usarConfirmarReset() {
  return useMutation({
    mutationFn: (datos: { token: string; contrasena_nueva: string }) =>
      clienteApi.post("/auth/confirmar-reset", datos),
  });
}

/** Hook para eliminar la cuenta del usuario. */
export function usarEliminarCuenta() {
  return useMutation({
    mutationFn: (datos: {
      contrasena?: string;
      token_refresco: string;
    }) => clienteApi.post("/auth/eliminar-cuenta", datos),
  });
}
