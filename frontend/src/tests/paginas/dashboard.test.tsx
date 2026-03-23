import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen } from "@testing-library/react";
import { renderConProveedores } from "../utilidades";

// Mocks de Next.js
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
  usePathname: () => "/dashboard",
}));
vi.mock("next/image", () => ({
  default: (props: Record<string, unknown>) => {
    const { priority, ...rest } = props;
    return <img {...rest} />;
  },
}));

// Mock de hooks — el dashboard actual solo usa usarTransitos
const mockUsarTransitos = vi.fn();

vi.mock("@/lib/hooks", () => ({
  usarTransitos: () => mockUsarTransitos(),
}));

vi.mock("@/lib/stores/store-auth", () => ({
  useStoreAuth: () => ({ usuario: { nombre: "Test User" } }),
}));

import PaginaDashboard from "@/app/(app)/dashboard/page";

describe("PaginaDashboard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("muestra tránsito lunar desde usarTransitos", () => {
    mockUsarTransitos.mockReturnValue({
      data: {
        planetas: [
          { nombre: "Luna", signo: "Aries", grado_en_signo: 15.5 },
          { nombre: "Sol", signo: "Piscis", grado_en_signo: 22.3 },
        ],
      },
      isLoading: false,
    });

    renderConProveedores(<PaginaDashboard />);

    expect(screen.getByText("Influencias Cósmicas de Hoy")).toBeInTheDocument();
    expect(screen.getByText(/Luna en Aries/)).toBeInTheDocument();
  });

  it("muestra esqueleto mientras carga tránsitos", () => {
    mockUsarTransitos.mockReturnValue({
      data: undefined,
      isLoading: true,
    });

    const { container } = renderConProveedores(<PaginaDashboard />);

    // El hero lunar muestra esqueleto de carga
    const esqueletos = container.querySelectorAll('[class*="animate-pulse"]');
    expect(esqueletos.length).toBeGreaterThan(0);
  });

  it("muestra sección de podcasts y lecturas", () => {
    mockUsarTransitos.mockReturnValue({
      data: {
        planetas: [
          { nombre: "Luna", signo: "Aries", grado_en_signo: 15.5 },
        ],
      },
      isLoading: false,
    });

    renderConProveedores(<PaginaDashboard />);

    expect(screen.getByText("Podcasts y Lecturas")).toBeInTheDocument();
    expect(screen.getByText("Momento Clave de tu Día")).toBeInTheDocument();
    expect(screen.getByText("Tu Semana Cósmica")).toBeInTheDocument();
    expect(screen.getByText("Tu Mes Cósmico")).toBeInTheDocument();
  });

  it("muestra tránsitos rápidos con datos de planetas", () => {
    mockUsarTransitos.mockReturnValue({
      data: {
        planetas: [
          { nombre: "Luna", signo: "Aries", grado_en_signo: 15.5 },
          { nombre: "Sol", signo: "Piscis", grado_en_signo: 22.3 },
        ],
      },
      isLoading: false,
    });

    renderConProveedores(<PaginaDashboard />);

    expect(screen.getByText("Tránsitos Rápidos")).toBeInTheDocument();
    // Los planetas aparecen en la lista de tránsitos rápidos
    expect(screen.getAllByText("Luna").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("Sol").length).toBeGreaterThanOrEqual(1);
  });
});
