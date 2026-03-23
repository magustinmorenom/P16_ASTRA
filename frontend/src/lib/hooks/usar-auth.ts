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
