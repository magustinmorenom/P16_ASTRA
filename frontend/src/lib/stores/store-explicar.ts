/**
 * Store del feature "Explicame mejor".
 *
 * Maneja el ciclo: selección detectada → menú contextual → loading → respuesta.
 * Es un store de UI efímero — no persiste nada.
 */

import { create } from "zustand";
import type { SeleccionActiva } from "@/lib/tipos";

export type FaseExplicar =
  | "cerrado"
  | "menu" // menú contextual visible
  | "cargando" // tooltip pidiendo a Haiku
  | "listo" // tooltip mostrando respuesta
  | "error";

interface EstadoExplicar {
  seleccion: SeleccionActiva | null;
  fase: FaseExplicar;
  respuesta: string | null;
  desdeCache: boolean;
  mensajesRestantes: number | null;

  /** Activa el menú contextual con la selección capturada. */
  abrirMenu: (sel: SeleccionActiva) => void;
  /** Cierra todo (menú + tooltip), limpia respuesta y selección. */
  cerrar: () => void;
  /** Marca el inicio de una mutation a /chat/explicar. */
  empezarCarga: () => void;
  /** Setea la respuesta exitosa. */
  setRespuesta: (
    texto: string,
    desdeCache: boolean,
    restantes: number | null,
  ) => void;
  /** Marca error en la mutation. */
  setError: () => void;
}

export const useStoreExplicar = create<EstadoExplicar>((set) => ({
  seleccion: null,
  fase: "cerrado",
  respuesta: null,
  desdeCache: false,
  mensajesRestantes: null,

  abrirMenu: (sel) =>
    set({
      seleccion: sel,
      fase: "menu",
      respuesta: null,
      desdeCache: false,
    }),

  cerrar: () =>
    set({
      seleccion: null,
      fase: "cerrado",
      respuesta: null,
      desdeCache: false,
      mensajesRestantes: null,
    }),

  empezarCarga: () =>
    set({
      fase: "cargando",
      respuesta: null,
    }),

  setRespuesta: (texto, desdeCache, restantes) =>
    set({
      fase: "listo",
      respuesta: texto,
      desdeCache,
      mensajesRestantes: restantes,
    }),

  setError: () =>
    set({
      fase: "error",
    }),
}));
