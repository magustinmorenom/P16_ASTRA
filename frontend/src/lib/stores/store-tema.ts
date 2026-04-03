"use client";

import { create } from "zustand";

export type PreferenciaTema = "claro" | "oscuro" | "automatico";
export type EsquemaTema = "claro" | "oscuro";

const CLAVE_STORAGE = "astra_tema_preferencia";
const MEDIA_QUERY_OSCURO = "(prefers-color-scheme: dark)";

function obtenerEsquemaSistema(): EsquemaTema {
  if (typeof window === "undefined") return "claro";
  return window.matchMedia(MEDIA_QUERY_OSCURO).matches ? "oscuro" : "claro";
}

function resolverEsquema(preferencia: PreferenciaTema): EsquemaTema {
  if (preferencia === "claro") return "claro";
  if (preferencia === "oscuro") return "oscuro";
  return obtenerEsquemaSistema();
}

function aplicarTemaEnDocumento(esquema: EsquemaTema) {
  if (typeof document === "undefined") return;

  document.documentElement.dataset.tema = esquema;
  document.documentElement.style.colorScheme =
    esquema === "oscuro" ? "dark" : "light";
}

function leerPreferenciaGuardada(): PreferenciaTema {
  if (typeof window === "undefined") return "automatico";

  const guardado = window.localStorage.getItem(CLAVE_STORAGE);
  return guardado === "claro" || guardado === "oscuro" || guardado === "automatico"
    ? guardado
    : "automatico";
}

interface EstadoTema {
  preferencia: PreferenciaTema;
  esquemaActivo: EsquemaTema;
  cargado: boolean;
  inicializarTema: () => void;
  setPreferencia: (preferencia: PreferenciaTema) => void;
  sincronizarSistema: () => void;
}

export const useStoreTema = create<EstadoTema>((set, get) => ({
  preferencia: "automatico",
  esquemaActivo: "claro",
  cargado: false,

  inicializarTema: () => {
    const preferencia = leerPreferenciaGuardada();
    const esquemaActivo = resolverEsquema(preferencia);

    aplicarTemaEnDocumento(esquemaActivo);
    set({ preferencia, esquemaActivo, cargado: true });
  },

  setPreferencia: (preferencia) => {
    const esquemaActivo = resolverEsquema(preferencia);

    if (typeof window !== "undefined") {
      window.localStorage.setItem(CLAVE_STORAGE, preferencia);
    }

    aplicarTemaEnDocumento(esquemaActivo);
    set({ preferencia, esquemaActivo });
  },

  sincronizarSistema: () => {
    if (get().preferencia !== "automatico") return;

    const esquemaActivo = obtenerEsquemaSistema();
    aplicarTemaEnDocumento(esquemaActivo);
    set({ esquemaActivo });
  },
}));

