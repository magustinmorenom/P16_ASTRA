import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderConProveedores } from "../utilidades";

// Mocks
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

const mockUsarMisCalculos = vi.fn();
const mockMutateAsync = vi.fn();
const mockMutate = vi.fn();

vi.mock("@/lib/hooks", () => ({
  usarCartaNatal: () => ({
    mutate: mockMutate,
    mutateAsync: mockMutateAsync,
    isPending: false,
    isError: false,
    error: null,
  }),
  usarMisCalculos: () => mockUsarMisCalculos(),
}));

vi.mock("@/lib/utilidades/formatear-grado", () => ({
  formatearGrado: (...args: [number]) => `${args[0]}°`,
  obtenerSignoDesdeGrado: () => "Aries",
  SIGNOS: ["Aries", "Tauro", "Géminis", "Cáncer", "Leo", "Virgo", "Libra", "Escorpio", "Sagitario", "Capricornio", "Acuario", "Piscis"],
}));

vi.mock("@/componentes/visualizaciones/rueda-zodiacal", () => ({
  default: () => <div data-testid="rueda-zodiacal">RuedaZodiacal</div>,
}));

vi.mock("@/componentes/compuestos/formulario-nacimiento", () => ({
  FormularioNacimiento: ({ onSubmit, cargando }: { onSubmit: (d: unknown) => void; cargando: boolean }) => (
    <form data-testid="formulario-nacimiento" onSubmit={(e) => { e.preventDefault(); onSubmit({}); }}>
      <button type="submit" disabled={cargando}>Calcular</button>
    </form>
  ),
}));

vi.mock("react-resizable-panels", () => ({
  Panel: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Group: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Separator: ({ children, className }: { children?: React.ReactNode; className?: string }) => (
    <div className={className}>{children}</div>
  ),
}));

import PaginaCartaNatal from "@/app/(app)/carta-natal/page";

const CARTA_NATAL_MOCK = {
  nombre: "Test",
  fecha_nacimiento: "1990-01-15",
  hora_nacimiento: "14:30",
  ciudad: "Buenos Aires",
  pais: "Argentina",
  planetas: [
    { nombre: "Sol", signo: "Capricornio", grado_en_signo: 25.3, casa: 4, retrogrado: false, dignidad: null },
    { nombre: "Luna", signo: "Aries", grado_en_signo: 12.1, casa: 7, retrogrado: false, dignidad: "Exaltación" },
  ],
  casas: [
    { numero: 1, signo: "Virgo", grado: 170.5, grado_en_signo: 20.5 },
  ],
  aspectos: [
    { planeta1: "Sol", planeta2: "Luna", tipo: "Cuadratura", angulo_exacto: 90, orbe: 1.2, aplicativo: true },
  ],
  ascendente: { signo: "Virgo", longitud: 170.5, grado_en_signo: 20.5 },
  medio_cielo: { signo: "Géminis", longitud: 80.3, grado_en_signo: 20.3 },
};

describe("PaginaCartaNatal", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("muestra resultados directamente desde DB sin formulario", () => {
    mockUsarMisCalculos.mockReturnValue({
      data: { natal: CARTA_NATAL_MOCK, diseno_humano: null, numerologia: null, retorno_solar: null },
      isLoading: false,
    });

    renderConProveedores(<PaginaCartaNatal />);

    expect(screen.getAllByText("Carta Astral").length).toBeGreaterThanOrEqual(1);
    expect(
      screen.getAllByRole("button", { name: /ver rueda natal/i }).length,
    ).toBeGreaterThanOrEqual(1);
    // Sol y Luna aparecen múltiples veces (planeta + aspecto), verificamos que existan
    expect(screen.getAllByText("Sol").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("Luna").length).toBeGreaterThanOrEqual(1);
    expect(screen.queryByTestId("formulario-nacimiento")).not.toBeInTheDocument();
  });

  it("abre la rueda en un modal bajo demanda", async () => {
    mockUsarMisCalculos.mockReturnValue({
      data: { natal: CARTA_NATAL_MOCK, diseno_humano: null, numerologia: null, retorno_solar: null },
      isLoading: false,
    });

    const user = userEvent.setup();
    renderConProveedores(<PaginaCartaNatal />);

    const [botonVerRueda] = screen.getAllByRole("button", { name: /ver rueda natal/i });
    await user.click(botonVerRueda);

    expect(screen.getByText("Mapa completo de la carta")).toBeInTheDocument();
    expect(screen.getByTestId("rueda-zodiacal")).toBeInTheDocument();
  });

  it("muestra formulario cuando no hay datos persistidos", () => {
    mockUsarMisCalculos.mockReturnValue({
      data: { natal: null, diseno_humano: null, numerologia: null, retorno_solar: null },
      isLoading: false,
    });

    renderConProveedores(<PaginaCartaNatal />);

    expect(screen.getByTestId("formulario-nacimiento")).toBeInTheDocument();
  });

  it("muestra esqueleto mientras carga", () => {
    mockUsarMisCalculos.mockReturnValue({
      data: undefined,
      isLoading: true,
    });

    renderConProveedores(<PaginaCartaNatal />);

    expect(screen.getByText("Cargando tu carta natal...")).toBeInTheDocument();
  });

});
