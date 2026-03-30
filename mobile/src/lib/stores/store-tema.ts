import { create } from "zustand";
import { Appearance, type ColorSchemeName } from "react-native";
import * as SecureStore from "expo-secure-store";
import {
  ColoresClaro,
  ColoresOscuro,
  type TokensColor,
} from "@/constants/colores";

export type PreferenciaTema = "claro" | "oscuro" | "automatico";

function resolverEsquema(preferencia: PreferenciaTema): "light" | "dark" {
  if (preferencia === "claro") return "light";
  if (preferencia === "oscuro") return "dark";
  return Appearance.getColorScheme() === "light" ? "light" : "dark";
}

function coloresParaEsquema(esquema: "light" | "dark"): TokensColor {
  return esquema === "dark" ? ColoresOscuro : ColoresClaro;
}

const CLAVE_STORAGE = "astra_tema_preferencia";

interface EstadoTema {
  preferencia: PreferenciaTema;
  esquemaActivo: "light" | "dark";
  colores: TokensColor;
  cargado: boolean;

  setPreferencia: (pref: PreferenciaTema) => void;
  cargarPreferencia: () => Promise<void>;
  sincronizarSistema: (esquemaSistema: ColorSchemeName) => void;
}

export const useStoreTema = create<EstadoTema>((set, get) => ({
  preferencia: "automatico",
  esquemaActivo: Appearance.getColorScheme() === "light" ? "light" : "dark",
  colores:
    Appearance.getColorScheme() === "light" ? ColoresClaro : ColoresOscuro,
  cargado: false,

  setPreferencia: (pref) => {
    const esquema = resolverEsquema(pref);
    set({
      preferencia: pref,
      esquemaActivo: esquema,
      colores: coloresParaEsquema(esquema),
    });
    SecureStore.setItemAsync(CLAVE_STORAGE, pref).catch(() => {});
  },

  cargarPreferencia: async () => {
    try {
      const guardado = await SecureStore.getItemAsync(CLAVE_STORAGE);
      if (
        guardado === "claro" ||
        guardado === "oscuro" ||
        guardado === "automatico"
      ) {
        const esquema = resolverEsquema(guardado);
        set({
          preferencia: guardado,
          esquemaActivo: esquema,
          colores: coloresParaEsquema(esquema),
          cargado: true,
        });
      } else {
        set({ cargado: true });
      }
    } catch {
      set({ cargado: true });
    }
  },

  sincronizarSistema: (esquemaSistema) => {
    const { preferencia } = get();
    if (preferencia !== "automatico") return;
    const esquema = esquemaSistema === "light" ? "light" : "dark";
    set({
      esquemaActivo: esquema,
      colores: coloresParaEsquema(esquema),
    });
  },
}));
