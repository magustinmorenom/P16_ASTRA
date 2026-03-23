import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderConProveedores } from "../utilidades";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

const mockUsarMisCalculos = vi.fn();

vi.mock("@/lib/hooks", () => ({
  usarNumerologia: () => ({
    mutate: vi.fn(),
    mutateAsync: vi.fn(),
    isPending: false,
    isError: false,
    error: null,
  }),
  usarMisCalculos: () => mockUsarMisCalculos(),
}));

import PaginaNumerologia from "@/app/(app)/numerologia/page";

const NUMEROLOGIA_MOCK = {
  nombre: "Test",
  fecha_nacimiento: "1990-01-15",
  sistema: "pitagorico" as const,
  camino_de_vida: { numero: 7, descripcion: "El buscador" },
  expresion: { numero: 22, descripcion: "Maestro constructor" },
  impulso_del_alma: { numero: 3, descripcion: "Expresión creativa" },
  personalidad: { numero: 4, descripcion: "Practicidad" },
  numero_nacimiento: { numero: 6, descripcion: "Responsabilidad" },
  anio_personal: { numero: 9, descripcion: "Cierre de ciclo" },
  mes_personal: { numero: 3, descripcion: "Expresión creativa" },
  dia_personal: { numero: 7, descripcion: "Introspección" },
  etapas_de_la_vida: [
    { numero: 8, descripcion: "Logro material", edad_inicio: 0, edad_fin: 29 },
    { numero: 5, descripcion: "Libertad", edad_inicio: 29, edad_fin: 38 },
    { numero: 4, descripcion: "Estabilidad", edad_inicio: 38, edad_fin: 47 },
    { numero: 1, descripcion: "Liderazgo", edad_inicio: 47, edad_fin: null },
  ],
  numeros_maestros_presentes: [22],
};

describe("PaginaNumerologia", () => {
  const user = userEvent.setup();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("muestra datos de numerología desde DB", () => {
    mockUsarMisCalculos.mockReturnValue({
      data: { natal: null, diseno_humano: null, numerologia: NUMEROLOGIA_MOCK, retorno_solar: null },
      isLoading: false,
    });

    renderConProveedores(<PaginaNumerologia />);

    // Hero card muestra nombre
    expect(screen.getByText(/Carta Numerológica de Test/)).toBeInTheDocument();
    // Números aparecen en chips y grid
    expect(screen.getAllByText("7").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("22").length).toBeGreaterThanOrEqual(1);
    // Descripción del número seleccionado por defecto (Camino de Vida) en panel derecho
    expect(screen.getByText("El buscador")).toBeInTheDocument();
  });

  it("muestra banner de números maestros cuando corresponde", () => {
    mockUsarMisCalculos.mockReturnValue({
      data: { natal: null, diseno_humano: null, numerologia: NUMEROLOGIA_MOCK, retorno_solar: null },
      isLoading: false,
    });

    renderConProveedores(<PaginaNumerologia />);

    expect(screen.getByText(/Números Maestros/)).toBeInTheDocument();
  });

  it("muestra formulario cuando no hay datos", () => {
    mockUsarMisCalculos.mockReturnValue({
      data: { natal: null, diseno_humano: null, numerologia: null, retorno_solar: null },
      isLoading: false,
    });

    renderConProveedores(<PaginaNumerologia />);

    expect(screen.getByText(/Calculá tu carta numerológica/)).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Nombre completo")).toBeInTheDocument();
  });

  it("muestra loading mientras carga", () => {
    mockUsarMisCalculos.mockReturnValue({
      data: undefined,
      isLoading: true,
    });

    renderConProveedores(<PaginaNumerologia />);

    expect(screen.getByText(/Cargando tu carta numerológica/)).toBeInTheDocument();
  });

  it("botón 'Nuevo cálculo' muestra formulario", async () => {
    mockUsarMisCalculos.mockReturnValue({
      data: { natal: null, diseno_humano: null, numerologia: NUMEROLOGIA_MOCK, retorno_solar: null },
      isLoading: false,
    });

    renderConProveedores(<PaginaNumerologia />);

    await user.click(screen.getByText("Nuevo cálculo"));

    expect(screen.getByPlaceholderText("Nombre completo")).toBeInTheDocument();
  });
});
