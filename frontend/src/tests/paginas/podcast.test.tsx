import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderConProveedores } from "../utilidades";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

const mockPodcastHoy = vi.fn();
const mockPodcastHistorial = vi.fn();
const mockGenerarPodcast = vi.fn();

vi.mock("@/lib/hooks", () => ({
  usarPodcastHoy: () => mockPodcastHoy(),
  usarPodcastHistorial: () => mockPodcastHistorial(),
  usarGenerarPodcast: () => mockGenerarPodcast(),
}));

vi.mock("@/lib/stores/store-ui", () => ({
  useStoreUI: () => ({
    pistaActual: null,
    setPistaActual: vi.fn(),
    toggleReproduccion: vi.fn(),
  }),
}));

import PaginaPodcast from "@/app/(app)/podcast/page";

const EPISODIO_LISTO = {
  id: "ep-1",
  fecha: "2026-03-23",
  tipo: "dia" as const,
  titulo: "Momento Clave de tu Día — 23/03",
  guion_md: "Guión de prueba",
  segmentos: [{ inicio_seg: 0, fin_seg: 120, texto: "Guión" }],
  duracion_segundos: 120,
  url_audio: "podcasts/test/dia.mp3",
  estado: "listo" as const,
  creado_en: "2026-03-23T10:00:00",
};

describe("PaginaPodcast", () => {
  const user = userEvent.setup();

  beforeEach(() => {
    vi.clearAllMocks();
    mockGenerarPodcast.mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
      variables: null,
    });
  });

  it("muestra los 3 tipos de podcast (día, semana, mes)", () => {
    mockPodcastHoy.mockReturnValue({
      data: [],
      isLoading: false,
    });
    mockPodcastHistorial.mockReturnValue({
      data: [],
      isLoading: false,
    });

    renderConProveedores(<PaginaPodcast />);

    // Cada card muestra el desc como título y subtítulo
    expect(screen.getAllByText("Momento Clave de tu Día").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("Tu Semana Cósmica").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("Tu Mes Cósmico").length).toBeGreaterThanOrEqual(1);
  });

  it("muestra botones Generar cuando no hay episodios", () => {
    mockPodcastHoy.mockReturnValue({
      data: [],
      isLoading: false,
    });
    mockPodcastHistorial.mockReturnValue({
      data: [],
      isLoading: false,
    });

    renderConProveedores(<PaginaPodcast />);

    const botones = screen.getAllByText("Generar");
    expect(botones.length).toBe(3);
  });

  it("muestra esqueletos mientras carga", () => {
    mockPodcastHoy.mockReturnValue({
      data: undefined,
      isLoading: true,
    });
    mockPodcastHistorial.mockReturnValue({
      data: undefined,
      isLoading: true,
    });

    renderConProveedores(<PaginaPodcast />);

    expect(screen.getByText("Tus Podcasts Cósmicos")).toBeInTheDocument();
  });

  it("muestra episodio listo con duración y botón play", () => {
    mockPodcastHoy.mockReturnValue({
      data: [EPISODIO_LISTO],
      isLoading: false,
    });
    mockPodcastHistorial.mockReturnValue({
      data: [EPISODIO_LISTO],
      isLoading: false,
    });

    renderConProveedores(<PaginaPodcast />);

    expect(screen.getByText("2 min")).toBeInTheDocument();
    expect(screen.getAllByText(EPISODIO_LISTO.titulo).length).toBeGreaterThanOrEqual(1);
  });

  it("muestra estado de error con botón reintentar", () => {
    const epError = { ...EPISODIO_LISTO, estado: "error" as const };
    mockPodcastHoy.mockReturnValue({
      data: [epError],
      isLoading: false,
    });
    mockPodcastHistorial.mockReturnValue({
      data: [],
      isLoading: false,
    });

    renderConProveedores(<PaginaPodcast />);

    expect(screen.getByText("Error al generar")).toBeInTheDocument();
    expect(screen.getByText("Reintentar")).toBeInTheDocument();
  });

  it("muestra mensaje vacío en historial", () => {
    mockPodcastHoy.mockReturnValue({
      data: [],
      isLoading: false,
    });
    mockPodcastHistorial.mockReturnValue({
      data: [],
      isLoading: false,
    });

    renderConProveedores(<PaginaPodcast />);

    expect(screen.getByText("Aún no tenés episodios generados")).toBeInTheDocument();
  });

  it("muestra estado generando con spinner", () => {
    const epGenerando = {
      ...EPISODIO_LISTO,
      estado: "generando_guion" as const,
      url_audio: "",
      duracion_segundos: 0,
    };
    mockPodcastHoy.mockReturnValue({
      data: [epGenerando],
      isLoading: false,
    });
    mockPodcastHistorial.mockReturnValue({
      data: [],
      isLoading: false,
    });

    renderConProveedores(<PaginaPodcast />);

    expect(screen.getByText("Escribiendo guión...")).toBeInTheDocument();
  });
});
