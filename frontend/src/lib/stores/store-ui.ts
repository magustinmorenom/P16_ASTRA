/**
 * Store de estado de la interfaz de usuario (Zustand).
 *
 * Controla elementos globales de la UI como el panel lateral
 * activo, el paso de onboarding, el estado del menu movil
 * y el reproductor cosmico.
 */

import { create } from "zustand";
import type { NombreIcono } from "@/componentes/ui/icono";
import type { SegmentoLetra } from "@/lib/tipos/podcast";

/** Paneles disponibles en la interfaz principal. */
type PanelActivo = "info" | "chat";

/** Variantes de toast disponibles. */
export type VarianteToast = "exito" | "error" | "advertencia" | "info";

/** Item de notificación toast. */
export interface ToastItem {
  id: string;
  variante: VarianteToast;
  mensaje: string;
  duracionMs: number;
}

/** Pista que se puede reproducir en el player inferior. */
export interface PistaReproduccion {
  id: string;
  titulo: string;
  subtitulo: string;
  tipo: "podcast" | "lectura";
  duracionSegundos: number;
  icono: NombreIcono;
  gradiente: string;
  url?: string;
  segmentos?: SegmentoLetra[];
}

interface EstadoUI {
  /** Panel lateral actualmente visible. */
  panelActivo: PanelActivo;
  /** Paso actual del flujo de onboarding (0 = no iniciado). */
  pasoOnboarding: number;
  /** Indica si el menu movil esta abierto. */
  menuAbierto: boolean;
  /** Indica si el sidebar esta abierto en mobile. */
  sidebarAbierto: boolean;

  /** Pista actualmente cargada en el reproductor. */
  pistaActual: PistaReproduccion | null;
  /** Indica si esta reproduciendo. */
  reproduciendo: boolean;
  /** Progreso actual en segundos. */
  progresoSegundos: number;
  /** Volumen 0-100. */
  volumen: number;
  /** Indica si el volumen esta silenciado. */
  silenciado: boolean;
  /** Indice del segmento de lyrics activo. */
  segmentoActual: number;
  /** Indica si el mini reproductor mobile esta expandido a full-screen. */
  miniReproductorExpandido: boolean;

  /** Cambia el panel lateral activo. */
  setPanelActivo: (panel: PanelActivo) => void;
  /** Establece el paso actual del onboarding. */
  setPasoOnboarding: (paso: number) => void;
  /** Alterna la visibilidad del menu movil. */
  toggleMenu: () => void;
  /** Alterna la visibilidad del sidebar en mobile. */
  toggleSidebar: () => void;
  /** Cierra el sidebar. */
  cerrarSidebar: () => void;

  /** Establece la pista actual del reproductor. */
  setPistaActual: (pista: PistaReproduccion | null) => void;
  /** Alterna reproduccion/pausa. */
  toggleReproduccion: () => void;
  /** Establece el progreso en segundos. */
  setProgreso: (segundos: number) => void;
  /** Establece el volumen (0-100). */
  setVolumen: (volumen: number) => void;
  /** Alterna silencio. */
  toggleSilencio: () => void;
  /** Establece el segmento de lyrics activo. */
  setSegmentoActual: (idx: number) => void;
  /** Alterna el mini reproductor expandido/colapsado en mobile. */
  toggleMiniReproductor: () => void;

  /** Lista de toasts activos. */
  toasts: ToastItem[];
  /** Muestra un nuevo toast. */
  mostrarToast: (variante: VarianteToast, mensaje: string, duracionMs?: number) => void;
  /** Cierra un toast por ID. */
  cerrarToast: (id: string) => void;
}

export const useStoreUI = create<EstadoUI>((set) => ({
  panelActivo: "info",
  pasoOnboarding: 0,
  menuAbierto: false,
  sidebarAbierto: false,

  pistaActual: null,
  reproduciendo: false,
  progresoSegundos: 0,
  volumen: 70,
  silenciado: false,
  segmentoActual: 0,
  miniReproductorExpandido: false,

  setPanelActivo: (panel) => set({ panelActivo: panel }),
  setPasoOnboarding: (paso) => set({ pasoOnboarding: paso }),
  toggleMenu: () => set((estado) => ({ menuAbierto: !estado.menuAbierto })),
  toggleSidebar: () =>
    set((estado) => ({ sidebarAbierto: !estado.sidebarAbierto })),
  cerrarSidebar: () => set({ sidebarAbierto: false }),

  setPistaActual: (pista) =>
    set({ pistaActual: pista, progresoSegundos: 0, reproduciendo: !!pista, segmentoActual: 0 }),
  toggleReproduccion: () =>
    set((estado) => ({ reproduciendo: !estado.reproduciendo })),
  setProgreso: (segundos) => set({ progresoSegundos: segundos }),
  setVolumen: (volumen) => set({ volumen }),
  toggleSilencio: () =>
    set((estado) => ({ silenciado: !estado.silenciado })),
  setSegmentoActual: (idx) => set({ segmentoActual: idx }),
  toggleMiniReproductor: () =>
    set((estado) => ({ miniReproductorExpandido: !estado.miniReproductorExpandido })),

  toasts: [],
  mostrarToast: (variante, mensaje, duracionMs = 4000) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    set((estado) => ({
      toasts: [...estado.toasts, { id, variante, mensaje, duracionMs }],
    }));
  },
  cerrarToast: (id) =>
    set((estado) => ({
      toasts: estado.toasts.filter((t) => t.id !== id),
    })),
}));
