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

    expect(screen.getByText("Carta Numerologica de Test")).toBeInTheDocument();
    expect(screen.getByText("7")).toBeInTheDocument();
    expect(screen.getByText("22")).toBeInTheDocument();
    expect(screen.getByText("El buscador")).toBeInTheDocument();
  });

  it("muestra badge de número maestro cuando corresponde", () => {
    mockUsarMisCalculos.mockReturnValue({
      data: { natal: null, diseno_humano: null, numerologia: NUMEROLOGIA_MOCK, retorno_solar: null },
      isLoading: false,
    });

    renderConProveedores(<PaginaNumerologia />);

    expect(screen.getByText("Numeros Maestros presentes")).toBeInTheDocument();
  });

  it("muestra formulario cuando no hay datos", () => {
    mockUsarMisCalculos.mockReturnValue({
      data: { natal: null, diseno_humano: null, numerologia: null, retorno_solar: null },
      isLoading: false,
    });

    renderConProveedores(<PaginaNumerologia />);

    expect(screen.getByText("Calcula tu carta numerologica completa con camino de vida, expresion, impulso del alma y mas.")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Nombre completo")).toBeInTheDocument();
  });

  it("muestra loading mientras carga", () => {
    mockUsarMisCalculos.mockReturnValue({
      data: undefined,
      isLoading: true,
    });

    renderConProveedores(<PaginaNumerologia />);

    expect(screen.getByText("Cargando tu carta numerologica...")).toBeInTheDocument();
  });

  it("botón 'Nuevo calculo' muestra formulario", async () => {
    mockUsarMisCalculos.mockReturnValue({
      data: { natal: null, diseno_humano: null, numerologia: NUMEROLOGIA_MOCK, retorno_solar: null },
      isLoading: false,
    });

    renderConProveedores(<PaginaNumerologia />);

    await user.click(screen.getByText("Nuevo calculo"));

    expect(screen.getByPlaceholderText("Nombre completo")).toBeInTheDocument();
  });
});
