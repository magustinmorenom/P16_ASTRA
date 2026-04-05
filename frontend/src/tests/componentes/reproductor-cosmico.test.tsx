import { describe, it, expect, vi } from "vitest";
import { render } from "@testing-library/react";

const mockUsarAudio = vi.fn();

vi.mock("@/lib/hooks/usar-audio", () => ({
  usarAudio: () => mockUsarAudio(),
}));

import ReproductorCosmico from "@/componentes/layouts/reproductor-cosmico";

const AUDIO_BASE = {
  audioRef: { current: null },
  audioUrl: "blob:podcast",
  tieneAudio: true,
  cargandoAudio: false,
  pistaActual: {
    id: "ep-1",
    titulo: "Cómo influyen hoy los tránsitos en vos",
    subtitulo: "Podcast del día",
    tipo: "podcast" as const,
    duracionSegundos: 180,
    icono: "sol" as const,
    gradiente: "from-[#7C4DFF] to-[#B388FF]",
  },
  reproduciendo: true,
  progresoSegundos: 9,
  volumen: 70,
  silenciado: false,
  porcentaje: 5,
  toggleReproduccion: vi.fn(),
  setVolumen: vi.fn(),
  toggleSilencio: vi.fn(),
  manejarSeek: vi.fn(),
  manejarCerrar: vi.fn(),
  handleTimeUpdate: vi.fn(),
  handleEnded: vi.fn(),
};

describe("ReproductorCosmico", () => {
  it("muestra pausa cuando el audio ya está listo aunque el estado de carga siga activo", () => {
    mockUsarAudio.mockReturnValue({
      ...AUDIO_BASE,
      cargandoAudio: true,
      tieneAudio: true,
    });

    const { container } = render(<ReproductorCosmico />);

    expect(container.querySelector(".animate-spin")).toBeNull();
  });

  it("muestra spinner solo mientras todavía no existe audio reproducible", () => {
    mockUsarAudio.mockReturnValue({
      ...AUDIO_BASE,
      cargandoAudio: true,
      tieneAudio: false,
      audioUrl: null,
    });

    const { container } = render(<ReproductorCosmico />);

    expect(container.querySelector(".animate-spin")).not.toBeNull();
  });
});
