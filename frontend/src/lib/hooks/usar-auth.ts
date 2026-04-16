"use client";

import { useMutation } from "@tanstack/react-query";
import { clienteApi } from "@/lib/api/cliente";
import { useStoreAuth } from "@/lib/stores/store-auth";
import type {
  EsquemaRegistro,
  EsquemaLogin,
  RespuestaRegistro,
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
  return useMutation({
    mutationFn: async (datos: EsquemaRegistro) => {
      return await clienteApi.post<RespuestaRegistro>(
        "/auth/registrar",
        datos,
      );
    },
  });
}

/**
 * Hook para verificar cuenta con código OTP.
 * Almacena tokens y carga el usuario.
 */
export function usarVerificarCuenta() {
  const { cargarUsuario } = useStoreAuth();

  return useMutation({
    mutationFn: async (datos: { email: string; codigo: string }) => {
      const resp = await clienteApi.post<RespuestaRegistroLogin>(
        "/auth/verificar-cuenta",
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
 * Hook para reenviar código de verificación.
 */
export function usarReenviarVerificacion() {
  return useMutation({
    mutationFn: (datos: { email: string }) =>
      clienteApi.post("/auth/reenviar-verificacion", datos),
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

/** Hook para verificar código OTP. */
export function usarVerificarOTP() {
  return useMutation({
    mutationFn: (datos: { email: string; codigo: string }) =>
      clienteApi.post<{ token: string }>("/auth/verificar-otp", datos),
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
