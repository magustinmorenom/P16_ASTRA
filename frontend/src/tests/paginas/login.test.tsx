import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderConProveedores } from "../utilidades";

// Mocks de Next.js
const mockPush = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush, replace: vi.fn() }),
  usePathname: () => "/login",
}));

// Mock de hooks
const mockLoginMutate = vi.fn();
const mockGoogleMutate = vi.fn();
let mockLoginError: Error | null = null;

vi.mock("@/lib/hooks", () => ({
  usarLogin: () => ({
    mutate: mockLoginMutate,
    isPending: false,
    error: mockLoginError,
  }),
  usarGoogleAuthUrl: () => ({
    mutate: mockGoogleMutate,
    isPending: false,
    error: null,
  }),
}));

// Mock de store-auth con getState estático (zustand)
let mockUsuarioState: { usuario: { tiene_perfil?: boolean } | null } = {
  usuario: null,
};

vi.mock("@/lib/stores/store-auth", () => ({
  useStoreAuth: Object.assign(() => ({}), {
    getState: () => mockUsuarioState,
  }),
}));

import PaginaLogin from "@/app/(auth)/login/page";

describe("PaginaLogin", () => {
  const user = userEvent.setup();

  beforeEach(() => {
    vi.clearAllMocks();
    mockLoginError = null;
    mockUsuarioState = { usuario: null };
    mockLoginMutate.mockImplementation((_data, options) => {
      options?.onSuccess?.();
    });
  });

  it("renderiza el formulario de login", () => {
    renderConProveedores(<PaginaLogin />);

    expect(screen.getByText("Bienvenido de vuelta")).toBeInTheDocument();
    expect(screen.getByText("Inicia sesion en tu cuenta")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("tu@correo.com")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Tu contrasena")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /iniciar sesion/i })).toBeInTheDocument();
  });

  it("muestra enlace a registro", () => {
    renderConProveedores(<PaginaLogin />);

    const enlace = screen.getByRole("link", { name: /crear cuenta/i });
    expect(enlace).toBeInTheDocument();
    expect(enlace).toHaveAttribute("href", "/registro");
  });

  it("muestra boton de Google", () => {
    renderConProveedores(<PaginaLogin />);

    expect(screen.getByRole("button", { name: /continuar con google/i })).toBeInTheDocument();
  });

  it("llama a login.mutate con email y contrasena correctos", async () => {
    renderConProveedores(<PaginaLogin />);

    await user.type(screen.getByPlaceholderText("tu@correo.com"), "maria@test.com");
    await user.type(screen.getByPlaceholderText("Tu contrasena"), "password123");
    await user.click(screen.getByRole("button", { name: /iniciar sesion/i }));

    expect(mockLoginMutate).toHaveBeenCalledWith(
      { email: "maria@test.com", contrasena: "password123" },
      expect.objectContaining({ onSuccess: expect.any(Function) }),
    );
  });

  it("redirige a /dashboard si usuario tiene_perfil=true", async () => {
    mockUsuarioState = { usuario: { tiene_perfil: true } };

    renderConProveedores(<PaginaLogin />);

    await user.type(screen.getByPlaceholderText("tu@correo.com"), "maria@test.com");
    await user.type(screen.getByPlaceholderText("Tu contrasena"), "password123");
    await user.click(screen.getByRole("button", { name: /iniciar sesion/i }));

    expect(mockPush).toHaveBeenCalledWith("/dashboard");
  });

  it("redirige a /onboarding si usuario tiene_perfil=false", async () => {
    mockUsuarioState = { usuario: { tiene_perfil: false } };

    renderConProveedores(<PaginaLogin />);

    await user.type(screen.getByPlaceholderText("tu@correo.com"), "maria@test.com");
    await user.type(screen.getByPlaceholderText("Tu contrasena"), "password123");
    await user.click(screen.getByRole("button", { name: /iniciar sesion/i }));

    expect(mockPush).toHaveBeenCalledWith("/onboarding");
  });

  it("redirige a /onboarding si usuario es null (sin perfil)", async () => {
    mockUsuarioState = { usuario: null };

    renderConProveedores(<PaginaLogin />);

    await user.type(screen.getByPlaceholderText("tu@correo.com"), "maria@test.com");
    await user.type(screen.getByPlaceholderText("Tu contrasena"), "password123");
    await user.click(screen.getByRole("button", { name: /iniciar sesion/i }));

    expect(mockPush).toHaveBeenCalledWith("/onboarding");
  });

  it("toggle de visibilidad de contrasena funciona", async () => {
    renderConProveedores(<PaginaLogin />);

    const inputContrasena = screen.getByPlaceholderText("Tu contrasena");
    expect(inputContrasena).toHaveAttribute("type", "password");

    const botonToggle = screen.getByRole("button", { name: /mostrar contrasena/i });
    await user.click(botonToggle);

    expect(inputContrasena).toHaveAttribute("type", "text");

    const botonOcultar = screen.getByRole("button", { name: /ocultar contrasena/i });
    await user.click(botonOcultar);

    expect(inputContrasena).toHaveAttribute("type", "password");
  });

  it("llama a googleAuth.mutate al hacer click en boton Google", async () => {
    renderConProveedores(<PaginaLogin />);

    await user.click(screen.getByRole("button", { name: /continuar con google/i }));

    expect(mockGoogleMutate).toHaveBeenCalled();
  });
});
