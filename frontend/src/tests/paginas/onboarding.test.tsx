import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderConProveedores } from "../utilidades";

// Mocks de Next.js
const mockPush = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush, replace: vi.fn() }),
  usePathname: () => "/onboarding",
}));
vi.mock("next/image", () => ({
  default: (props: Record<string, unknown>) => {
    const { priority, ...rest } = props;
    return <img {...rest} />;
  },
}));

// Mock de hooks con control granular
const mockCrearPerfilMutateAsync = vi.fn();
const mockCartaNatalMutateAsync = vi.fn();
const mockDisenoHumanoMutateAsync = vi.fn();
const mockNumerologiaMutateAsync = vi.fn();
const mockRetornoSolarMutateAsync = vi.fn();

vi.mock("@/lib/hooks", () => ({
  usarCrearPerfil: () => ({
    mutateAsync: mockCrearPerfilMutateAsync,
    isPending: false,
    isError: false,
  }),
  usarCartaNatal: () => ({
    mutateAsync: mockCartaNatalMutateAsync,
    isPending: false,
    isError: false,
  }),
  usarDisenoHumano: () => ({
    mutateAsync: mockDisenoHumanoMutateAsync,
    isPending: false,
    isError: false,
  }),
  usarNumerologia: () => ({
    mutateAsync: mockNumerologiaMutateAsync,
    isPending: false,
    isError: false,
  }),
  usarRetornoSolar: () => ({
    mutateAsync: mockRetornoSolarMutateAsync,
    isPending: false,
    isError: false,
  }),
}));

// Mock del store de auth
const mockCargarUsuario = vi.fn().mockResolvedValue(undefined);
vi.mock("@/lib/stores/store-auth", () => ({
  useStoreAuth: () => ({
    cargarUsuario: mockCargarUsuario,
    usuario: null,
    autenticado: true,
    cargando: false,
  }),
}));

import PaginaOnboarding from "@/app/(onboarding)/onboarding/page";

/* ========== Helper: completar datos y avanzar ========== */

async function completarFormularioYCalcular(
  user: ReturnType<typeof userEvent.setup>,
  container: HTMLElement,
) {
  // Llenar nombre
  await user.type(screen.getByPlaceholderText("Tu nombre"), "María");

  // Llenar fecha
  const inputFecha = container.querySelector('input[type="date"]') as HTMLInputElement;
  await user.clear(inputFecha);
  await user.type(inputFecha, "1990-01-15");

  // Llenar hora
  const inputHora = container.querySelector('input[type="time"]') as HTMLInputElement;
  await user.clear(inputHora);
  await user.type(inputHora, "14:30");

  // Simular selección de lugar (el botón requiere lugarSeleccionado=true)
  // Como el autocomplete requiere fetch, simulamos llenando los datos internos
  // via el input de lugar — pero puedeAvanzar requiere lugarSeleccionado
  // Así que verificamos que el botón esté deshabilitado sin lugar
}

describe("PaginaOnboarding", () => {
  const user = userEvent.setup();

  beforeEach(() => {
    vi.clearAllMocks();
    mockCrearPerfilMutateAsync.mockResolvedValue({ id: "perfil-uuid-123" });
    mockCartaNatalMutateAsync.mockResolvedValue({ planetas: [] });
    mockDisenoHumanoMutateAsync.mockResolvedValue({ tipo: "Generador" });
    mockNumerologiaMutateAsync.mockResolvedValue({ camino_de_vida: { numero: 7 } });
    mockRetornoSolarMutateAsync.mockResolvedValue({ anio: 2026 });
  });

  /* ========== Paso 0: Datos de nacimiento (formulario único) ========== */

  describe("Paso 0 — Datos de nacimiento", () => {
    it("muestra el formulario de datos de nacimiento inicialmente", () => {
      renderConProveedores(<PaginaOnboarding />);

      expect(screen.getByText("Datos de nacimiento")).toBeInTheDocument();
      expect(screen.getByText("Paso 1 de 2")).toBeInTheDocument();
      expect(screen.getByPlaceholderText("Tu nombre")).toBeInTheDocument();
    });

    it("muestra la barra de progreso con 2 segmentos", () => {
      renderConProveedores(<PaginaOnboarding />);

      const barras = document.querySelectorAll("[class*='h-1'][class*='flex-1']");
      expect(barras.length).toBe(2);
    });

    it("boton Calcular deshabilitado sin datos completos", () => {
      renderConProveedores(<PaginaOnboarding />);

      expect(screen.getByRole("button", { name: /calcular mi perfil/i })).toBeDisabled();
    });

    it("boton Calcular deshabilitado con nombre pero sin fecha", async () => {
      renderConProveedores(<PaginaOnboarding />);

      await user.type(screen.getByPlaceholderText("Tu nombre"), "María");

      expect(screen.getByRole("button", { name: /calcular mi perfil/i })).toBeDisabled();
    });

    it("muestra campo de lugar de nacimiento con autocomplete", () => {
      renderConProveedores(<PaginaOnboarding />);

      expect(screen.getByPlaceholderText("Ej: Buenos Aires, Argentina")).toBeInTheDocument();
    });

    it("muestra nota informativa sobre hora de nacimiento", () => {
      renderConProveedores(<PaginaOnboarding />);

      expect(screen.getByText(/si no conocés tu hora exacta/i)).toBeInTheDocument();
    });

    it("tiene campos de fecha y hora de nacimiento", () => {
      const { container } = renderConProveedores(<PaginaOnboarding />);

      expect(container.querySelector('input[type="date"]')).toBeInTheDocument();
      expect(container.querySelector('input[type="time"]')).toBeInTheDocument();
    });
  });
});
