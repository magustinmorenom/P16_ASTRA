/**
 * Store de autenticacion (Zustand).
 *
 * Almacena el usuario actual y expone acciones para
 * cargar, actualizar y cerrar la sesion.
 *
 * Los tokens viven en localStorage; el store solo guarda
 * la representacion del usuario obtenida desde /auth/me.
 */

import { create } from "zustand";

import { clienteApi } from "@/lib/api/cliente";
import type { UsuarioConSuscripcion } from "@/lib/tipos";

interface EstadoAuth {
  /** Usuario autenticado o null si no hay sesion. */
  usuario: UsuarioConSuscripcion | null;
  /** Indica si se esta cargando la informacion del usuario. */
  cargando: boolean;
  /** Bandera derivada: true cuando hay un usuario cargado. */
  autenticado: boolean;

  /** Establece (o limpia) el usuario en el store. */
  setUsuario: (usuario: UsuarioConSuscripcion | null) => void;
  /** Consulta /auth/me para hidratar el estado. */
  cargarUsuario: () => Promise<void>;
  /** Cierra la sesion: limpia tokens y estado. */
  cerrarSesion: () => void;
}

export const useStoreAuth = create<EstadoAuth>((set) => ({
  usuario: null,
  cargando: true,
  autenticado: false,

  setUsuario: (usuario) =>
    set({ usuario, autenticado: !!usuario }),

  cargarUsuario: async () => {
    try {
      set({ cargando: true });

      const token =
        typeof window !== "undefined"
          ? localStorage.getItem("token_acceso")
          : null;

      if (!token) {
        set({ cargando: false, usuario: null, autenticado: false });
        return;
      }

      const usuario = await clienteApi.get<UsuarioConSuscripcion>("/auth/me");
      set({ usuario, autenticado: true, cargando: false });
    } catch {
      set({ usuario: null, autenticado: false, cargando: false });
    }
  },

  cerrarSesion: () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("token_acceso");
      localStorage.removeItem("token_refresco");
    }
    set({ usuario: null, autenticado: false });
  },
}));
