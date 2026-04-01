import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { act, screen } from "@testing-library/react";

import { SemanaV2 } from "@/componentes/dashboard-v2/semana-v2";
import { renderConProveedores } from "../utilidades";

const mockUsarPronosticoSemanaSiguiente = vi.fn();

vi.mock("@/lib/hooks/usar-pronostico", () => ({
  usarPronosticoSemanaSiguiente: (...args: unknown[]) =>
    mockUsarPronosticoSemanaSiguiente(...args),
}));

const SEMANA_MOCK = [
  {
    fecha: "2026-03-30",
    clima_estado: "neutro",
    energia: 6,
    frase_corta: "Día de cierre emocional.",
    numero_personal: 3,
  },
  {
    fecha: "2026-03-31",
    clima_estado: "favorable",
    energia: 7,
    frase_corta: "Energía de inicio.",
    numero_personal: 4,
  },
  {
    fecha: "2026-04-01",
    clima_estado: "favorable",
    energia: 8,
    frase_corta: "Poder material en ascenso.",
    numero_personal: 5,
  },
  {
    fecha: "2026-04-02",
    clima_estado: "neutro",
    energia: 6,
    frase_corta: "Culminación. Soltá lo que no sirve.",
    numero_personal: 6,
  },
];

describe("SemanaV2", () => {
  let ultimoFrame: FrameRequestCallback | null = null;

  beforeEach(() => {
    vi.useFakeTimers();
    ultimoFrame = null;
    mockUsarPronosticoSemanaSiguiente.mockReturnValue({
      data: undefined,
      isLoading: false,
    });

    vi.stubGlobal(
      "requestAnimationFrame",
      vi.fn((callback: FrameRequestCallback) => {
        ultimoFrame = callback;
        return 1;
      }),
    );
    vi.stubGlobal("cancelAnimationFrame", vi.fn());
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it("abre el carrusel hacia la derecha desde miércoles en adelante", async () => {
    vi.setSystemTime(new Date("2026-04-01T12:00:00-03:00"));

    renderConProveedores(
      <SemanaV2
        semana={SEMANA_MOCK}
        onGenerarPodcastSemana={vi.fn()}
        generandoPodcast={false}
      />,
    );

    const carrusel = screen.getByTestId("carrusel-semana");
    Object.defineProperty(carrusel, "scrollWidth", {
      configurable: true,
      value: 960,
    });
    Object.defineProperty(carrusel, "clientWidth", {
      configurable: true,
      value: 320,
    });

    expect(ultimoFrame).not.toBeNull();
    act(() => {
      ultimoFrame?.(0);
    });

    expect(carrusel.scrollLeft).toBe(640);
  });

  it("mantiene el carrusel al inicio si hoy es lunes", async () => {
    vi.setSystemTime(new Date("2026-03-30T12:00:00-03:00"));

    renderConProveedores(
      <SemanaV2
        semana={SEMANA_MOCK}
        onGenerarPodcastSemana={vi.fn()}
        generandoPodcast={false}
      />,
    );

    const carrusel = screen.getByTestId("carrusel-semana");
    Object.defineProperty(carrusel, "scrollWidth", {
      configurable: true,
      value: 960,
    });
    Object.defineProperty(carrusel, "clientWidth", {
      configurable: true,
      value: 320,
    });

    carrusel.scrollLeft = 120;
    expect(ultimoFrame).not.toBeNull();
    act(() => {
      ultimoFrame?.(0);
    });

    expect(carrusel.scrollLeft).toBe(0);
  });
});
