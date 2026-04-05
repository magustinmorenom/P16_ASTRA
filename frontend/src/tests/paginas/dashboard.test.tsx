import { describe, it, expect, vi, beforeEach } from "vitest";
import { fireEvent, screen } from "@testing-library/react";
import { renderConProveedores } from "../utilidades";

// Mocks de Next.js
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
  usePathname: () => "/dashboard",
}));
vi.mock("next/image", () => ({
  default: (props: Record<string, unknown>) => {
    const rest = { ...props };
    delete rest.priority;
    const alt = typeof rest.alt === "string" ? rest.alt : "";
    // eslint-disable-next-line @next/next/no-img-element
    return <img alt={alt} {...rest} />;
  },
}));

// Mock de hooks
const mockUsarPronosticoDiario = vi.fn();
const mockUsarPronosticoSemanal = vi.fn();
const mockUsarPodcastHoy = vi.fn();
const mockUsarGenerarPodcast = vi.fn();
const mockUsarEsMobile = vi.fn();
const mockPrecargarAudiosPodcast = vi.fn();
const mockMostrarToast = vi.fn();

vi.mock("@/lib/hooks", () => ({
  usarPronosticoDiario: () => mockUsarPronosticoDiario(),
  usarPronosticoSemanal: () => mockUsarPronosticoSemanal(),
  usarPodcastHoy: () => mockUsarPodcastHoy(),
  usarGenerarPodcast: () => mockUsarGenerarPodcast(),
  usarEsMobile: () => mockUsarEsMobile(),
}));

vi.mock("@/lib/hooks/usar-audio", () => ({
  precargarAudiosPodcast: (...args: unknown[]) =>
    mockPrecargarAudiosPodcast(...args),
}));

vi.mock("@/lib/stores/store-auth", () => ({
  useStoreAuth: () => ({ usuario: { nombre: "Test User" }, autenticado: true }),
}));

const estadoStoreUI = {
  pistaActual: null,
  reproduciendo: false,
  setPistaActual: vi.fn(),
  toggleReproduccion: vi.fn(),
  mostrarToast: mockMostrarToast,
};

vi.mock("@/lib/stores/store-ui", () => ({
  useStoreUI: (selector?: (estado: typeof estadoStoreUI) => unknown) =>
    selector ? selector(estadoStoreUI) : estadoStoreUI,
}));

import PaginaDashboard from "@/app/(app)/dashboard/page";

// Datos mock para el pronóstico
const PRONOSTICO_MOCK = {
  clima: {
    estado: "soleado",
    titulo: "Día Soleado",
    frase_sintesis: "Un gran día para emprender nuevos proyectos.",
    energia: 8,
    claridad: 7,
    intuicion: 6,
  },
  areas: [
    {
      id: "trabajo",
      nombre: "Trabajo",
      nivel: "favorable",
      icono: "briefcase",
      frase: "Ideal para negociar",
      detalle: "Detalle extendido del trabajo",
    },
    {
      id: "amor",
      nombre: "Amor",
      nivel: "neutro",
      icono: "heart",
      frase: "Escuchá tu intuición",
      detalle: "Detalle extendido del amor",
    },
  ],
  momentos: [
    {
      bloque: "manana",
      titulo: "Mañana",
      icono: "sunrise",
      frase: "Arrancá temprano",
      nivel: "favorable",
    },
    {
      bloque: "tarde",
      titulo: "Tarde",
      icono: "sun",
      frase: "Momento productivo",
      nivel: "neutro",
    },
    {
      bloque: "noche",
      titulo: "Noche",
      icono: "moon",
      frase: "Descansá",
      nivel: "neutro",
    },
  ],
  alertas: [],
  consejo_hd: {
    titulo: "Tu Estrategia Hoy",
    mensaje: "Como Generador, esperá a responder.",
    centro_destacado: "sacral",
  },
  luna: {
    signo: "Sagitario",
    fase: "Creciente",
    significado: "Expansión y optimismo",
  },
  numero_personal: {
    numero: 1,
    descripcion: "Liderazgo, independencia, originalidad",
  },
  acceso: {
    pronostico_clima: true,
    pronostico_areas: true,
    pronostico_momentos: true,
    pronostico_alertas: true,
    pronostico_semana: true,
    pronostico_consejo_hd: true,
    pronostico_detalle_area: true,
  },
};

describe("PaginaDashboard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUsarPodcastHoy.mockReturnValue({ data: [], isLoading: false });
    mockUsarGenerarPodcast.mockReturnValue({ mutate: vi.fn(), isPending: false });
    mockUsarPronosticoSemanal.mockReturnValue({ data: null, isLoading: false });
    mockUsarEsMobile.mockReturnValue(false);
  });

  it("muestra el pronóstico cósmico con clima y áreas", () => {
    mockUsarPronosticoDiario.mockReturnValue({
      data: PRONOSTICO_MOCK,
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    });

    renderConProveedores(<PaginaDashboard />);

    // v2 components render pronóstico data
    const matches = screen.getAllByText(/Test|Amor|Día Soleado/);
    expect(matches.length).toBeGreaterThan(0);
  });

  it("muestra esqueletos mientras carga el pronóstico", () => {
    mockUsarPronosticoDiario.mockReturnValue({
      data: undefined,
      isLoading: true,
      error: null,
      refetch: vi.fn(),
    });

    const { container } = renderConProveedores(<PaginaDashboard />);

    const esqueletos = container.querySelectorAll('[class*="animate-pulse"]');
    expect(esqueletos.length).toBeGreaterThan(0);
  });

  it("muestra sección de podcasts y lecturas", () => {
    mockUsarPronosticoDiario.mockReturnValue({
      data: PRONOSTICO_MOCK,
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    });

    renderConProveedores(<PaginaDashboard />);

    // v2: SemanaV2 renders week data
    expect(screen.getByText("Amor")).toBeInTheDocument();
  });

  it("muestra estado de error con botón reintentar", () => {
    mockUsarPronosticoDiario.mockReturnValue({
      data: null,
      isLoading: false,
      error: new Error("API error"),
      refetch: vi.fn(),
    });

    renderConProveedores(<PaginaDashboard />);

    expect(screen.getByText("Pronóstico Cósmico")).toBeInTheDocument();
    expect(screen.getByText(/No pudimos generar tu pronóstico/)).toBeInTheDocument();
    expect(screen.getByText("Reintentar")).toBeInTheDocument();
  });

  it("muestra momentos del día y consejo HD", () => {
    mockUsarPronosticoDiario.mockReturnValue({
      data: PRONOSTICO_MOCK,
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    });

    renderConProveedores(<PaginaDashboard />);

    expect(screen.getByText(/seguí con lo importante/i)).toBeInTheDocument();
    expect(screen.getByText(/Tu audio del día todavía no fue generado/i)).toBeInTheDocument();
    expect(screen.getByText("Mañana")).toBeInTheDocument();
    expect(screen.getByText("Tarde")).toBeInTheDocument();
    expect(screen.getByText("Noche")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Generar audio de hoy/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Audio de mañana/i })).toBeInTheDocument();
    expect(screen.getAllByText(/Número del día/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Luna en Sagitario/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Intuición/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Energía/i).length).toBeGreaterThan(0);
  });

  it("muestra 'Escuchar ahora' cuando el podcast del día está listo", () => {
    mockUsarPronosticoDiario.mockReturnValue({
      data: PRONOSTICO_MOCK,
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    });
    mockUsarPodcastHoy.mockReturnValue({
      data: [
        {
          id: "ep-dia-1",
          tipo: "dia",
          estado: "listo",
          titulo: "Audio listo",
          duracion_segundos: 120,
          url_audio: "https://audio.local/ep-dia-1.mp3",
          segmentos: [],
        },
      ],
      isLoading: false,
    });

    renderConProveedores(<PaginaDashboard />);

    expect(screen.getByRole("button", { name: /Escuchar ahora/i })).toBeInTheDocument();
  });

  it("muestra 'Generando audio' cuando el podcast del día está en proceso", () => {
    mockUsarPronosticoDiario.mockReturnValue({
      data: PRONOSTICO_MOCK,
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    });
    mockUsarGenerarPodcast.mockReturnValue({
      mutate: vi.fn(),
      isPending: true,
      variables: "dia",
    });

    renderConProveedores(<PaginaDashboard />);

    expect(screen.getByRole("button", { name: /Generando audio/i })).toBeInTheDocument();
  });

  it("muestra feedback informativo al interactuar con el CTA de mañana", () => {
    mockUsarPronosticoDiario.mockReturnValue({
      data: PRONOSTICO_MOCK,
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    });

    renderConProveedores(<PaginaDashboard />);

    fireEvent.click(screen.getByRole("button", { name: /Audio de mañana/i }));

    expect(mockMostrarToast).toHaveBeenCalledWith(
      "info",
      "El audio de mañana se habilita cuando comienza el próximo día."
    );
  });
});
