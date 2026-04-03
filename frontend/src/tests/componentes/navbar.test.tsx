import { describe, it, expect, vi, beforeEach } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";

const mockPush = vi.fn();
const mockMutatePodcast = vi.fn();
const mockToggleSidebarColapsado = vi.fn();
const mockSetPistaActual = vi.fn();
const mockToggleReproduccion = vi.fn();
const mockCerrarSesion = vi.fn();

const mockUsarMiPerfil = vi.fn();
const mockUsarPronosticoDiario = vi.fn();
const mockUsarPodcastHoy = vi.fn();
const mockUsarGenerarPodcast = vi.fn();

vi.mock("next/navigation", () => ({
  usePathname: () => "/dashboard",
  useRouter: () => ({ push: mockPush, replace: vi.fn() }),
}));

vi.mock("next/image", () => ({
  default: (props: Record<string, unknown>) => {
    const { priority, alt, ...rest } = props;
    void priority;
    // eslint-disable-next-line @next/next/no-img-element
    return <img alt={typeof alt === "string" ? alt : ""} {...rest} />;
  },
}));

vi.mock("@/lib/hooks", () => ({
  usarMiPerfil: () => mockUsarMiPerfil(),
  usarPronosticoDiario: () => mockUsarPronosticoDiario(),
  usarPodcastHoy: (...args: unknown[]) => mockUsarPodcastHoy(...args),
  usarGenerarPodcast: () => mockUsarGenerarPodcast(),
}));

vi.mock("@/lib/stores/store-auth", () => ({
  useStoreAuth: () => ({
    usuario: {
      nombre: "Manuel Agustin",
      email: "manuel@astra.app",
      plan_slug: "premium",
      plan_nombre: "Premium",
    },
    cerrarSesion: mockCerrarSesion,
  }),
}));

vi.mock("@/lib/stores/store-ui", () => ({
  useStoreUI: () => ({
    sidebarColapsado: false,
    toggleSidebarColapsado: mockToggleSidebarColapsado,
    pistaActual: null,
    reproduciendo: false,
    progresoSegundos: 0,
    setPistaActual: mockSetPistaActual,
    toggleReproduccion: mockToggleReproduccion,
  }),
}));

import Navbar from "@/componentes/layouts/navbar";

const PRONOSTICO_MOCK = {
  clima: {
    titulo: "Pulso claro para avanzar",
    frase_sintesis: "El día se ordena mejor si priorizás una sola cosa.",
    energia: 8,
    claridad: 7,
  },
  luna: {
    signo: "Cáncer",
  },
  alertas: [],
};

describe("Navbar", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mockUsarMiPerfil.mockReturnValue({
      data: { nombre: "Manuel Agustin" },
    });
    mockUsarPronosticoDiario.mockReturnValue({
      data: PRONOSTICO_MOCK,
    });
    mockUsarPodcastHoy.mockReturnValue({
      data: [
        {
          id: "pod-dia",
          tipo: "dia",
          titulo: "Cómo influyen hoy los tránsitos en vos",
          duracion_segundos: 180,
          url_audio: "/audio-dia.mp3",
          segmentos: [],
          estado: "listo",
        },
      ],
    });
    mockUsarGenerarPodcast.mockReturnValue({
      mutate: mockMutatePodcast,
      isPending: false,
      variables: undefined,
    });
  });

  it("abre el menú contextual con día, semana y mes y genera la semana si falta", () => {
    render(<Navbar />);

    fireEvent.click(screen.getByLabelText("Abrir menú de podcasts"));

    expect(screen.getByText("Podcast del día")).toBeInTheDocument();
    expect(screen.getByText("Podcast de la semana")).toBeInTheDocument();
    expect(screen.getByText("Podcast del mes")).toBeInTheDocument();

    fireEvent.click(screen.getByText("Podcast de la semana"));

    expect(mockMutatePodcast).toHaveBeenCalledWith("semana");
  });

  it("marca el botón del header como ocupado cuando hay un podcast en generación", () => {
    mockUsarPodcastHoy.mockReturnValue({
      data: [
        {
          id: "pod-semana",
          tipo: "semana",
          titulo: "Revisemos cómo viene tu semana",
          duracion_segundos: 0,
          url_audio: "",
          segmentos: [],
          estado: "generando_audio",
        },
      ],
    });

    render(<Navbar />);

    const boton = screen.getByLabelText("Abrir menú de podcasts");

    expect(boton).toHaveAttribute("aria-busy", "true");
    expect(boton).toHaveAttribute("data-podcast-generando", "true");
    expect(screen.getByText("Preparando audio")).toBeInTheDocument();
  });
});
