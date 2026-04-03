import { create } from "zustand";
import * as SecureStore from "expo-secure-store";
import { clienteApi } from "@/lib/api/cliente";
import type { UsuarioConSuscripcion } from "@/lib/tipos";

interface EstadoAuth {
  usuario: UsuarioConSuscripcion | null;
  cargando: boolean;
  autenticado: boolean;

  setUsuario: (usuario: UsuarioConSuscripcion | null) => void;
  cargarUsuario: () => Promise<void>;
  cerrarSesion: () => Promise<void>;
}

export const useStoreAuth = create<EstadoAuth>((set) => ({
  usuario: null,
  cargando: true,
  autenticado: false,

  setUsuario: (usuario) => set({ usuario, autenticado: !!usuario }),

  cargarUsuario: async () => {
    try {
      set({ cargando: true });
      const token = await SecureStore.getItemAsync("access_token");

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

  cerrarSesion: async () => {
    await SecureStore.deleteItemAsync("access_token");
    await SecureStore.deleteItemAsync("refresh_token");
    set({ usuario: null, autenticado: false, cargando: false });
    // Limpiar reproductor al cerrar sesión
    const { useStoreUI } = require("@/lib/stores/store-ui");
    useStoreUI.setState({
      pistaActual: null,
      reproduciendo: false,
      progresoSegundos: 0,
      segmentoActual: 0,
    });
  },
}));
