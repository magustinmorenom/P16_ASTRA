import { describe, it, expect, vi, beforeEach } from "vitest";
import { fireEvent, screen } from "@testing-library/react";
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

vi.mock("@/lib/hooks/usar-es-mobile", () => ({
  usarEsMobile: () => false,
}));

vi.mock("react-resizable-panels", () => ({
  Panel: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Group: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Separator: ({ children, className }: { children?: React.ReactNode; className?: string }) => (
    <div className={className}>{children}</div>
  ),
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
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("muestra datos de numerología desde DB", () => {
    mockUsarMisCalculos.mockReturnValue({
      data: { natal: null, diseno_humano: null, numerologia: NUMEROLOGIA_MOCK, retorno_solar: null },
      isLoading: false,
    });

    renderConProveedores(<PaginaNumerologia />);

    expect(
      screen.getAllByText(/Test, tu carta abre un sendero 7 y una misión 22\./).length,
    ).toBeGreaterThan(0);
    expect(screen.getAllByText("Seleccioná un número").length).toBeGreaterThan(0);
    expect(screen.getAllByText("7").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("22").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("Núcleo").length).toBeGreaterThanOrEqual(1);
  });

  it("muestra banner de números maestros cuando corresponde", () => {
    mockUsarMisCalculos.mockReturnValue({
      data: { natal: null, diseno_humano: null, numerologia: NUMEROLOGIA_MOCK, retorno_solar: null },
      isLoading: false,
    });

    renderConProveedores(<PaginaNumerologia />);

    expect(screen.getAllByText(/Maestros 22/).length).toBeGreaterThan(0);
  });

  it("tolera cartas guardadas sin etapas ni arrays auxiliares", () => {
    const numerologiaIncompleta = {
      ...NUMEROLOGIA_MOCK,
      meses_personales: undefined,
      etapas_de_la_vida: undefined,
      numeros_maestros_presentes: undefined,
    } as unknown as typeof NUMEROLOGIA_MOCK;

    mockUsarMisCalculos.mockReturnValue({
      data: { natal: null, diseno_humano: null, numerologia: numerologiaIncompleta, retorno_solar: null },
      isLoading: false,
    });

    renderConProveedores(<PaginaNumerologia />);

    expect(
      screen.getAllByText(/Test, tu carta abre un sendero 7 y una misión 22\./).length,
    ).toBeGreaterThan(0);
    expect(screen.getAllByText(/Etapas no disponibles/).length).toBeGreaterThan(0);
    expect(screen.queryByText(/Maestros 22/)).not.toBeInTheDocument();
  });

  it("muestra formulario cuando no hay datos", () => {
    mockUsarMisCalculos.mockReturnValue({
      data: { natal: null, diseno_humano: null, numerologia: null, retorno_solar: null },
      isLoading: false,
    });

    renderConProveedores(<PaginaNumerologia />);

    expect(
      screen.getByText(/Una lectura compacta de tu estructura y tu ritmo/),
    ).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Nombre completo")).toBeInTheDocument();
  });

  it("muestra loading mientras carga", () => {
    mockUsarMisCalculos.mockReturnValue({
      data: undefined,
      isLoading: true,
    });

    const { container } = renderConProveedores(<PaginaNumerologia />);

    expect(container.querySelectorAll('[aria-hidden="true"]').length).toBeGreaterThan(0);
    expect(screen.queryByPlaceholderText("Nombre completo")).not.toBeInTheDocument();
  });

  it("mantiene la consola compacta cuando ya hay datos", () => {
    mockUsarMisCalculos.mockReturnValue({
      data: { natal: null, diseno_humano: null, numerologia: NUMEROLOGIA_MOCK, retorno_solar: null },
      isLoading: false,
    });

    renderConProveedores(<PaginaNumerologia />);

    expect(screen.queryByPlaceholderText("Nombre completo")).not.toBeInTheDocument();
    expect(screen.getAllByText("Seleccioná un número").length).toBeGreaterThan(0);
  });

  it("no duplica la cabecera del detalle en el panel lateral", () => {
    mockUsarMisCalculos.mockReturnValue({
      data: { natal: null, diseno_humano: null, numerologia: NUMEROLOGIA_MOCK, retorno_solar: null },
      isLoading: false,
    });

    renderConProveedores(<PaginaNumerologia />);

    fireEvent.click(screen.getAllByRole("button", { name: /Sendero Natal/i })[0]);

    expect(screen.getAllByText("Sendero Natal")).toHaveLength(2);
    expect(
      screen.getAllByText("La ruta central que abrís con tu fecha de nacimiento."),
    ).toHaveLength(2);
  });
});
