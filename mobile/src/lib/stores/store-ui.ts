import { create } from "zustand";
import type { SegmentoLetra } from "@/lib/tipos/podcast";

export interface PistaReproduccion {
  id: string;
  titulo: string;
  subtitulo: string;
  tipo: "podcast" | "lectura";
  duracionSegundos: number;
  icono: string;
  gradiente: string;
  url?: string;
  segmentos?: SegmentoLetra[];
}

interface EstadoUI {
  pasoOnboarding: number;

  pistaActual: PistaReproduccion | null;
  reproduciendo: boolean;
  progresoSegundos: number;
  volumen: number;
  silenciado: boolean;
  segmentoActual: number;
  miniReproductorExpandido: boolean;

  setPasoOnboarding: (paso: number) => void;

  setPistaActual: (pista: PistaReproduccion | null) => void;
  toggleReproduccion: () => void;
  setProgreso: (segundos: number) => void;
  setVolumen: (volumen: number) => void;
  toggleSilencio: () => void;
  setSegmentoActual: (idx: number) => void;
  toggleMiniReproductor: () => void;
}

export const useStoreUI = create<EstadoUI>((set) => ({
  pasoOnboarding: 0,

  pistaActual: null,
  reproduciendo: false,
  progresoSegundos: 0,
  volumen: 70,
  silenciado: false,
  segmentoActual: 0,
  miniReproductorExpandido: false,

  setPasoOnboarding: (paso) => set({ pasoOnboarding: paso }),

  setPistaActual: (pista) =>
    set({
      pistaActual: pista,
      progresoSegundos: 0,
      reproduciendo: !!pista,
      segmentoActual: 0,
    }),
  toggleReproduccion: () =>
    set((estado) => ({ reproduciendo: !estado.reproduciendo })),
  setProgreso: (segundos) => set({ progresoSegundos: segundos }),
  setVolumen: (volumen) => set({ volumen }),
  toggleSilencio: () =>
    set((estado) => ({ silenciado: !estado.silenciado })),
  setSegmentoActual: (idx) => set({ segmentoActual: idx }),
  toggleMiniReproductor: () =>
    set((estado) => ({
      miniReproductorExpandido: !estado.miniReproductorExpandido,
    })),
}));
