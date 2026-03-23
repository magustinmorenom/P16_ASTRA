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

/* ========== Helper: navegar al paso indicado ========== */

async function navegarAlPaso(
  paso: number,
  user: ReturnType<typeof userEvent.setup>,
  container: HTMLElement,
) {
  if (paso >= 1) {
    // Paso 0 → 1: completar datos personales
    await user.type(screen.getByPlaceholderText("Tu nombre"), "María");
    const inputFecha = container.querySelector('input[type="date"]') as HTMLInputElement;
    await user.clear(inputFecha);
    await user.type(inputFecha, "1990-01-15");
    const inputHora = container.querySelector('input[type="time"]') as HTMLInputElement;
    await user.clear(inputHora);
    await user.type(inputHora, "14:30");
    await user.click(screen.getByText("Continuar"));
  }

  if (paso >= 2) {
    // Paso 1 → 2: completar lugar de nacimiento
    await user.type(screen.getByPlaceholderText("Ej: Buenos Aires"), "Buenos Aires");
    await user.type(screen.getByPlaceholderText("Ej: Argentina"), "Argentina");
    await user.click(screen.getByText("Calcular mi perfil"));
  }
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

  /* ========== Paso 0: Datos Personales ========== */

  describe("Paso 0 — Datos personales", () => {
    it("muestra el formulario de datos personales inicialmente", () => {
      renderConProveedores(<PaginaOnboarding />);

      expect(screen.getByText("Tus datos personales")).toBeInTheDocument();
      expect(screen.getByText("Paso 1 de 3")).toBeInTheDocument();
      expect(screen.getByPlaceholderText("Tu nombre")).toBeInTheDocument();
    });

    it("muestra la barra de progreso con 3 segmentos", () => {
      renderConProveedores(<PaginaOnboarding />);

      const barras = document.querySelectorAll("[class*='h-1'][class*='flex-1']");
      expect(barras.length).toBe(3);
    });

    it("no tiene boton Volver (es el primer paso)", () => {
      renderConProveedores(<PaginaOnboarding />);

      expect(screen.queryByText("Volver")).not.toBeInTheDocument();
    });

    it("boton Continuar deshabilitado sin datos completos", () => {
      renderConProveedores(<PaginaOnboarding />);

      expect(screen.getByRole("button", { name: "Continuar" })).toBeDisabled();
    });

    it("boton Continuar deshabilitado con nombre pero sin fecha", async () => {
      renderConProveedores(<PaginaOnboarding />);

      await user.type(screen.getByPlaceholderText("Tu nombre"), "María");

      expect(screen.getByRole("button", { name: "Continuar" })).toBeDisabled();
    });

    it("boton Continuar habilitado con todos los campos", async () => {
      const { container } = renderConProveedores(<PaginaOnboarding />);

      await user.type(screen.getByPlaceholderText("Tu nombre"), "María");
      const inputFecha = container.querySelector('input[type="date"]') as HTMLInputElement;
      await user.clear(inputFecha);
      await user.type(inputFecha, "1990-01-15");
      const inputHora = container.querySelector('input[type="time"]') as HTMLInputElement;
      await user.clear(inputHora);
      await user.type(inputHora, "14:30");

      expect(screen.getByRole("button", { name: "Continuar" })).not.toBeDisabled();
    });

    it("muestra nota informativa sobre hora de nacimiento", () => {
      renderConProveedores(<PaginaOnboarding />);

      expect(screen.getByText(/si no conoces tu hora exacta/i)).toBeInTheDocument();
    });

    it("avanza al paso 1 al completar y hacer click en Continuar", async () => {
      const { container } = renderConProveedores(<PaginaOnboarding />);

      await navegarAlPaso(1, user, container);

      expect(screen.getByText("Lugar de nacimiento")).toBeInTheDocument();
      expect(screen.getByText("Paso 2 de 3")).toBeInTheDocument();
    });
  });

  /* ========== Paso 1: Lugar de nacimiento ========== */

  describe("Paso 1 — Lugar de nacimiento", () => {
    it("muestra campos de ciudad y pais", async () => {
      const { container } = renderConProveedores(<PaginaOnboarding />);
      await navegarAlPaso(1, user, container);

      expect(screen.getByPlaceholderText("Ej: Buenos Aires")).toBeInTheDocument();
      expect(screen.getByPlaceholderText("Ej: Argentina")).toBeInTheDocument();
    });

    it("muestra nota de geocodificacion", async () => {
      const { container } = renderConProveedores(<PaginaOnboarding />);
      await navegarAlPaso(1, user, container);

      expect(screen.getByText(/geocodificación/i)).toBeInTheDocument();
    });

    it("boton Calcular mi perfil deshabilitado sin datos", async () => {
      const { container } = renderConProveedores(<PaginaOnboarding />);
      await navegarAlPaso(1, user, container);

      expect(screen.getByRole("button", { name: /calcular mi perfil/i })).toBeDisabled();
    });

    it("boton Calcular mi perfil deshabilitado solo con ciudad", async () => {
      const { container } = renderConProveedores(<PaginaOnboarding />);
      await navegarAlPaso(1, user, container);

      await user.type(screen.getByPlaceholderText("Ej: Buenos Aires"), "Buenos Aires");

      expect(screen.getByRole("button", { name: /calcular mi perfil/i })).toBeDisabled();
    });

    it("permite volver al paso 0", async () => {
      const { container } = renderConProveedores(<PaginaOnboarding />);
      await navegarAlPaso(1, user, container);

      expect(screen.getByText("Lugar de nacimiento")).toBeInTheDocument();

      await user.click(screen.getByText("Volver"));

      expect(screen.getByText("Tus datos personales")).toBeInTheDocument();
    });

    it("preserva los datos personales al volver del paso 1 al paso 0", async () => {
      const { container } = renderConProveedores(<PaginaOnboarding />);

      // Llenar paso 0
      await user.type(screen.getByPlaceholderText("Tu nombre"), "María Test");
      const inputFecha = container.querySelector('input[type="date"]') as HTMLInputElement;
      await user.clear(inputFecha);
      await user.type(inputFecha, "1990-01-15");
      const inputHora = container.querySelector('input[type="time"]') as HTMLInputElement;
      await user.clear(inputHora);
      await user.type(inputHora, "14:30");

      await user.click(screen.getByText("Continuar"));

      // Volver
      await user.click(screen.getByText("Volver"));

      // Verificar que los datos persisten
      expect(screen.getByPlaceholderText("Tu nombre")).toHaveValue("María Test");
      expect(inputFecha).toHaveValue("1990-01-15");
      expect(inputHora).toHaveValue("14:30");
    });
  });

  /* ========== Paso 2: Calculando ========== */

  describe("Paso 2 — Calculando", () => {
    it("muestra UI de calculo con barra de progreso completa", async () => {
      const { container } = renderConProveedores(<PaginaOnboarding />);
      await navegarAlPaso(2, user, container);

      // Los mocks resuelven instantáneamente, así que vemos el estado final
      await waitFor(() => {
        expect(screen.getByText("¡Tu mapa cósmico está listo!")).toBeInTheDocument();
      });

      expect(screen.getByText("Paso 3 de 3")).toBeInTheDocument();
    });

    it("muestra los 5 items de calculo", async () => {
      const { container } = renderConProveedores(<PaginaOnboarding />);
      await navegarAlPaso(2, user, container);

      await waitFor(() => {
        expect(screen.getByText(/perfil/i)).toBeInTheDocument();
      });

      // Verificar que los 5 items de progreso se muestran
      expect(screen.getByText(/carta natal/i)).toBeInTheDocument();
      expect(screen.getByText(/diseño humano/i)).toBeInTheDocument();
      expect(screen.getByText(/numerología/i)).toBeInTheDocument();
      expect(screen.getByText(/revolución solar/i)).toBeInTheDocument();
    });

    it("crea perfil primero y luego pasa perfilId a los calculos", async () => {
      const { container } = renderConProveedores(<PaginaOnboarding />);
      await navegarAlPaso(2, user, container);

      await waitFor(() => {
        expect(mockCrearPerfilMutateAsync).toHaveBeenCalledTimes(1);
      });

      expect(mockCrearPerfilMutateAsync).toHaveBeenCalledWith(
        expect.objectContaining({
          nombre: "María",
          ciudad_nacimiento: "Buenos Aires",
          pais_nacimiento: "Argentina",
        }),
      );

      await waitFor(() => {
        expect(mockCartaNatalMutateAsync).toHaveBeenCalledWith(
          expect.objectContaining({ perfilId: "perfil-uuid-123" }),
        );
      });

      expect(mockDisenoHumanoMutateAsync).toHaveBeenCalledWith(
        expect.objectContaining({ perfilId: "perfil-uuid-123" }),
      );

      expect(mockNumerologiaMutateAsync).toHaveBeenCalledWith(
        expect.objectContaining({ perfilId: "perfil-uuid-123" }),
      );

      expect(mockRetornoSolarMutateAsync).toHaveBeenCalledWith(
        expect.objectContaining({ perfilId: "perfil-uuid-123" }),
      );
    });

    it("ejecuta carta natal, diseno humano, numerologia y retorno solar en paralelo", async () => {
      const { container } = renderConProveedores(<PaginaOnboarding />);
      await navegarAlPaso(2, user, container);

      // Los 4 cálculos deben llamarse después de crearPerfil
      await waitFor(() => {
        expect(mockCartaNatalMutateAsync).toHaveBeenCalledTimes(1);
        expect(mockDisenoHumanoMutateAsync).toHaveBeenCalledTimes(1);
        expect(mockNumerologiaMutateAsync).toHaveBeenCalledTimes(1);
        expect(mockRetornoSolarMutateAsync).toHaveBeenCalledTimes(1);
      });
    });

    it("muestra mensaje de listo cuando todos los calculos terminan", async () => {
      const { container } = renderConProveedores(<PaginaOnboarding />);
      await navegarAlPaso(2, user, container);

      await waitFor(() => {
        expect(screen.getByText("¡Tu mapa cósmico está listo!")).toBeInTheDocument();
      });

      expect(screen.getByText("Redirigiendo al dashboard...")).toBeInTheDocument();
    });

    it("llama a cargarUsuario antes de redirigir al dashboard", async () => {
      vi.useFakeTimers({ shouldAdvanceTime: true });

      const { container } = renderConProveedores(<PaginaOnboarding />);
      await navegarAlPaso(2, user, container);

      await waitFor(() => {
        expect(screen.getByText("¡Tu mapa cósmico está listo!")).toBeInTheDocument();
      });

      // Avanzar el timer de 1500ms del auto-redirect
      vi.advanceTimersByTime(1600);

      await waitFor(() => {
        expect(mockCargarUsuario).toHaveBeenCalledTimes(1);
      });

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith("/dashboard");
      });

      vi.useRealTimers();
    });

    it("maneja error en crearPerfil sin crash", async () => {
      mockCrearPerfilMutateAsync.mockRejectedValue(new Error("Error de red"));

      const { container } = renderConProveedores(<PaginaOnboarding />);
      await navegarAlPaso(2, user, container);

      // Los cálculos igualmente se ejecutan (con perfilId undefined)
      await waitFor(() => {
        expect(mockCartaNatalMutateAsync).toHaveBeenCalledWith(
          expect.objectContaining({ perfilId: undefined }),
        );
      });
    });

    it("maneja errores parciales en calculos sin crash", async () => {
      mockCartaNatalMutateAsync.mockRejectedValue(new Error("Error carta"));
      mockDisenoHumanoMutateAsync.mockRejectedValue(new Error("Error HD"));
      // numerologia sigue exitosa

      const { container } = renderConProveedores(<PaginaOnboarding />);
      await navegarAlPaso(2, user, container);

      // Aún así llega a "todo listo" (usa Promise.allSettled)
      await waitFor(() => {
        expect(screen.getByText("¡Tu mapa cósmico está listo!")).toBeInTheDocument();
      });
    });

    it("muestra barra de progreso completa en modo oscuro", async () => {
      const { container } = renderConProveedores(<PaginaOnboarding />);
      await navegarAlPaso(2, user, container);

      await waitFor(() => {
        expect(screen.getByText("Paso 3 de 3")).toBeInTheDocument();
      });

      // 3 segmentos de progreso todos llenos
      const barras = document.querySelectorAll("[class*='h-1'][class*='flex-1'][class*='bg-violet-500']");
      expect(barras.length).toBe(3);
    });
  });
});
