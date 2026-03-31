import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderConProveedores } from "../utilidades";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

const mockUsarMisCalculos = vi.fn();

vi.mock("@/lib/hooks", () => ({
  usarDisenoHumano: () => ({
    mutate: vi.fn(),
    mutateAsync: vi.fn(),
    isPending: false,
    isError: false,
    error: null,
  }),
  usarMisCalculos: () => mockUsarMisCalculos(),
  usarMiPerfil: () => ({ data: { nombre: "Test" }, isLoading: false }),
}));

vi.mock("@/componentes/visualizaciones/body-graph", () => ({
  default: () => <div data-testid="body-graph">BodyGraph</div>,
}));

vi.mock("@/componentes/compuestos/formulario-nacimiento", () => ({
  FormularioNacimiento: ({ onSubmit, cargando }: { onSubmit: (d: unknown) => void; cargando: boolean }) => (
    <form data-testid="formulario-nacimiento" onSubmit={(e) => { e.preventDefault(); onSubmit({}); }}>
      <button type="submit" disabled={cargando}>Calcular</button>
    </form>
  ),
}));

import PaginaDisenoHumano from "@/app/(app)/diseno-humano/page";

const HD_MOCK = {
  tipo: "Generador",
  autoridad: "Sacral",
  perfil: "2/4",
  definicion: "Simple",
  cruz_encarnacion: {
    sol_consciente: 34,
    tierra_consciente: 20,
    sol_inconsciente: 5,
    tierra_inconsciente: 35,
  },
  centros: { sacral: "definido", cabeza: "abierto" },
  canales: [],
  activaciones_conscientes: [],
  activaciones_inconscientes: [],
};

describe("PaginaDisenoHumano", () => {
  const user = userEvent.setup();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("muestra datos desde DB sin formulario", () => {
    mockUsarMisCalculos.mockReturnValue({
      data: { natal: null, diseno_humano: HD_MOCK, numerologia: null, retorno_solar: null },
      isLoading: false,
    });

    renderConProveedores(<PaginaDisenoHumano />);

    // Hero card muestra nombre
    expect(screen.getByText(/Diseño Humano de Test/)).toBeInTheDocument();
    // El tipo puede aparecer en más de un bloque del layout premium
    expect(screen.getAllByText("Generador").length).toBeGreaterThanOrEqual(1);
    // "Sacral" aparece como autoridad y como nombre de centro
    expect(screen.getAllByText("Sacral").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("2/4").length).toBeGreaterThanOrEqual(1);
    expect(screen.queryByTestId("formulario-nacimiento")).not.toBeInTheDocument();
  });

  it("muestra formulario si no hay datos persistidos", () => {
    mockUsarMisCalculos.mockReturnValue({
      data: { natal: null, diseno_humano: null, numerologia: null, retorno_solar: null },
      isLoading: false,
    });

    renderConProveedores(<PaginaDisenoHumano />);

    expect(screen.getByTestId("formulario-nacimiento")).toBeInTheDocument();
  });

  it("muestra loading mientras carga", () => {
    mockUsarMisCalculos.mockReturnValue({
      data: undefined,
      isLoading: true,
    });

    renderConProveedores(<PaginaDisenoHumano />);

    expect(screen.getByText(/Cargando tu Diseño Humano/)).toBeInTheDocument();
  });

  it("botón 'Nuevo cálculo' cambia a formulario", async () => {
    mockUsarMisCalculos.mockReturnValue({
      data: { natal: null, diseno_humano: HD_MOCK, numerologia: null, retorno_solar: null },
      isLoading: false,
    });

    renderConProveedores(<PaginaDisenoHumano />);

    await user.click(screen.getByText("Nuevo cálculo"));

    expect(screen.getByTestId("formulario-nacimiento")).toBeInTheDocument();
  });
});
