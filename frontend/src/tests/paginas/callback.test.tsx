import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderConProveedores } from "../utilidades";

// vi.hoisted para que las variables estén disponibles en vi.mock factories
const { mockPush, mockSearchParamsGet, mockApiGet, mockCargarUsuario, mockStoreState } =
  vi.hoisted(() => {
    const state = {
      cargarUsuario: vi.fn().mockResolvedValue(undefined),
      usuario: null as { tiene_perfil?: boolean } | null,
    };
    return {
      mockPush: vi.fn(),
      mockSearchParamsGet: vi.fn(),
      mockApiGet: vi.fn(),
      mockCargarUsuario: state.cargarUsuario,
      mockStoreState: state,
    };
  });

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush, replace: vi.fn() }),
  useSearchParams: () => ({ get: mockSearchParamsGet }),
}));

vi.mock("@/lib/api/cliente", () => ({
  clienteApi: { get: mockApiGet },
}));

vi.mock("@/lib/stores/store-auth", () => ({
  useStoreAuth: Object.assign(
    () => ({ cargarUsuario: mockStoreState.cargarUsuario }),
    { getState: () => mockStoreState },
  ),
}));

import PaginaCallback from "@/app/(auth)/callback/page";

describe("PaginaCallback", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockStoreState.usuario = null;
    mockStoreState.cargarUsuario = vi.fn().mockResolvedValue(undefined);
    mockSearchParamsGet.mockReturnValue("test-code-123");
    mockApiGet.mockResolvedValue({
      token_acceso: "access-token",
      token_refresco: "refresh-token",
      tipo: "bearer",
      usuario: { id: "1", email: "test@test.com", nombre: "Test" },
    });
  });

  it("muestra spinner de carga mientras procesa", () => {
    mockApiGet.mockReturnValue(new Promise(() => {}));

    renderConProveedores(<PaginaCallback />);

    expect(screen.getByText("Conectando con Google...")).toBeInTheDocument();
    expect(screen.getByText(/espera un momento/i)).toBeInTheDocument();
  });

  it("muestra error si no hay code en los parametros", () => {
    mockSearchParamsGet.mockReturnValue(null);

    renderConProveedores(<PaginaCallback />);

    expect(screen.getByText("Error de autenticacion")).toBeInTheDocument();
    expect(
      screen.getByText("No se recibio el codigo de autorizacion de Google."),
    ).toBeInTheDocument();
  });

  it("muestra error y boton volver al login si la API falla", async () => {
    mockApiGet.mockRejectedValue(new Error("Token inválido"));

    renderConProveedores(<PaginaCallback />);

    await waitFor(() => {
      expect(screen.getByText("Error de autenticacion")).toBeInTheDocument();
    });

    expect(screen.getByText("Token inválido")).toBeInTheDocument();

    const botonVolver = screen.getByText("Volver al inicio de sesion");
    expect(botonVolver).toBeInTheDocument();

    const user = userEvent.setup();
    await user.click(botonVolver);

    expect(mockPush).toHaveBeenCalledWith("/login");
  });

  it("redirige a /dashboard si usuario tiene_perfil=true", async () => {
    mockStoreState.usuario = { tiene_perfil: true };

    renderConProveedores(<PaginaCallback />);

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith("/dashboard");
    });

    expect(mockStoreState.cargarUsuario).toHaveBeenCalledTimes(1);
  });

  it("redirige a /onboarding si usuario tiene_perfil=false", async () => {
    mockStoreState.usuario = { tiene_perfil: false };

    renderConProveedores(<PaginaCallback />);

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith("/onboarding");
    });
  });

  it("redirige a /onboarding si usuario es null (sin perfil)", async () => {
    mockStoreState.usuario = null;

    renderConProveedores(<PaginaCallback />);

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith("/onboarding");
    });
  });

  it("guarda tokens en localStorage al recibir respuesta exitosa", async () => {
    mockStoreState.usuario = { tiene_perfil: true };

    renderConProveedores(<PaginaCallback />);

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalled();
    });

    expect(localStorage.getItem("token_acceso")).toBe("access-token");
    expect(localStorage.getItem("token_refresco")).toBe("refresh-token");
  });

  it("llama a cargarUsuario despues de guardar tokens", async () => {
    mockStoreState.usuario = { tiene_perfil: true };

    renderConProveedores(<PaginaCallback />);

    await waitFor(() => {
      expect(mockStoreState.cargarUsuario).toHaveBeenCalledTimes(1);
    });
  });

  it("envia el code correctamente a la API de Google callback", async () => {
    mockSearchParamsGet.mockReturnValue("mi-codigo-oauth");
    mockStoreState.usuario = { tiene_perfil: true };

    renderConProveedores(<PaginaCallback />);

    await waitFor(() => {
      expect(mockApiGet).toHaveBeenCalledWith(
        "/auth/google/callback?code=mi-codigo-oauth",
      );
    });
  });
});
