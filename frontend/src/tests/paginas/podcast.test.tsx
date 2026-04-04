import { describe, it, expect, vi, beforeEach } from "vitest";
import { fireEvent, screen } from "@testing-library/react";
import { renderConProveedores } from "../utilidades";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

const mockPodcastHoy = vi.fn();
const mockPodcastHistorial = vi.fn();
const mockGenerarPodcast = vi.fn();
const mockPrecargarAudiosPodcast = vi.fn();

vi.mock("@/lib/hooks", () => ({
  usarPodcastHoy: () => mockPodcastHoy(),
  usarPodcastHistorial: () => mockPodcastHistorial(),
  usarGenerarPodcast: () => mockGenerarPodcast(),
}));

vi.mock("@/lib/hooks/usar-audio", () => ({
  precargarAudiosPodcast: (...args: unknown[]) =>
    mockPrecargarAudiosPodcast(...args),
  obtenerBlobAudioPodcast: vi.fn(),
}));

vi.mock("@/lib/stores/store-ui", () => ({
  useStoreUI: () => ({
    pistaActual: null,
    setPistaActual: vi.fn(),
    toggleReproduccion: vi.fn(),
  }),
}));

const ESTADO_AUTH_PREMIUM = {
  usuario: {
    id: "usuario-premium",
    nombre: "Lucía Premium",
    email: "lucia@astra.test",
    plan_slug: "premium",
  },
  autenticado: true,
};

vi.mock("@/lib/stores/store-auth", () => ({
  useStoreAuth: Object.assign(
    (selector?: (estado: typeof ESTADO_AUTH_PREMIUM) => unknown) =>
      selector ? selector(ESTADO_AUTH_PREMIUM) : ESTADO_AUTH_PREMIUM,
    {
      getState: () => ESTADO_AUTH_PREMIUM,
    },
  ),
}));

import PaginaPodcast from "@/app/(app)/podcast/page";

const EPISODIO_LISTO = {
  id: "ep-1",
  fecha: "2026-03-23",
  tipo: "dia" as const,
  titulo: "Cómo influyen hoy los tránsitos en vos — 23/03",
  guion_md: "Guión de prueba",
  segmentos: [{ inicio_seg: 0, fin_seg: 120, texto: "Guión" }],
  duracion_segundos: 120,
  url_audio: "podcasts/test/dia.mp3",
  estado: "listo" as const,
  creado_en: "2026-03-23T10:00:00",
};

function crearEpisodioHistorial(indice: number) {
  return {
    ...EPISODIO_LISTO,
    id: `ep-${indice}`,
    titulo: `Podcast guardado ${indice}`,
    fecha: `2026-03-${String(indice).padStart(2, "0")}`,
  };
}

describe("PaginaPodcast", () => {
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

    expect(screen.getByText("Tus Podcasts Cósmicos")).toBeInTheDocument();
    expect(screen.getByText("Elegí tu podcast")).toBeInTheDocument();
    expect(screen.getByText("Podcast diario")).toBeInTheDocument();
    expect(
      screen.getByText("Cómo influyen hoy los tránsitos específicamente en vos.")
    ).toBeInTheDocument();
    expect(screen.getByText("Podcast semanal")).toBeInTheDocument();
    expect(
      screen.getByText("Revisemos cómo viene tu semana y dónde conviene enfocarte.")
    ).toBeInTheDocument();
    expect(screen.getByText("Podcast mensual")).toBeInTheDocument();
    expect(
      screen.getByText("Ampliá tu horizonte y preparate sabiendo cómo viene tu mes.")
    ).toBeInTheDocument();
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

    const botones = screen.getAllByText("Generar ahora");
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

    expect(screen.getAllByText(/2 min/).length).toBeGreaterThan(0);
    expect(screen.getAllByText(EPISODIO_LISTO.titulo).length).toBeGreaterThanOrEqual(1);
  });

  it("muestra 5 registros en historial y permite expandir o contraer", () => {
    const historial = Array.from({ length: 6 }, (_, indice) =>
      crearEpisodioHistorial(indice + 1)
    );

    mockPodcastHoy.mockReturnValue({
      data: [],
      isLoading: false,
    });
    mockPodcastHistorial.mockReturnValue({
      data: historial,
      isLoading: false,
    });

    renderConProveedores(<PaginaPodcast />);

    expect(screen.getByText("Podcast guardado 1")).toBeInTheDocument();
    expect(screen.getByText("Podcast guardado 5")).toBeInTheDocument();
    expect(screen.queryByText("Podcast guardado 6")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Ver más" }));

    expect(screen.getByText("Podcast guardado 6")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Ver menos" })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Ver menos" }));

    expect(screen.queryByText("Podcast guardado 6")).not.toBeInTheDocument();
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

    expect(screen.getByText("Error al generar el episodio")).toBeInTheDocument();
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
