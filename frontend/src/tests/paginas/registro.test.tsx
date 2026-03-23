import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderConProveedores } from "../utilidades";

// Mocks de Next.js
const mockPush = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush, replace: vi.fn() }),
  usePathname: () => "/registro",
}));

// Mock de hooks
const mockRegistroMutate = vi.fn();
const mockGoogleMutate = vi.fn();
let mockRegistroError: Error | null = null;
let mockRegistroPending = false;

vi.mock("@/lib/hooks", () => ({
  usarRegistro: () => ({
    mutate: mockRegistroMutate,
    isPending: mockRegistroPending,
    error: mockRegistroError,
  }),
  usarGoogleAuthUrl: () => ({
    mutate: mockGoogleMutate,
    isPending: false,
    error: null,
  }),
}));

import PaginaRegistro from "@/app/(auth)/registro/page";

describe("PaginaRegistro", () => {
  const user = userEvent.setup();

  beforeEach(() => {
    vi.clearAllMocks();
    mockRegistroError = null;
    mockRegistroPending = false;
    mockRegistroMutate.mockImplementation((_data, options) => {
      options?.onSuccess?.();
    });
  });

  it("renderiza el formulario con todos los campos", () => {
    renderConProveedores(<PaginaRegistro />);

    expect(screen.getByText("Crea tu cuenta")).toBeInTheDocument();
    expect(screen.getByText("Comienza tu viaje cosmico")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Tu nombre completo")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("tu@correo.com")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Minimo 8 caracteres")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Repite tu contrasena")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /crear cuenta/i })).toBeInTheDocument();
  });

  it("muestra enlace a login", () => {
    renderConProveedores(<PaginaRegistro />);

    const enlace = screen.getByRole("link", { name: /iniciar sesion/i });
    expect(enlace).toBeInTheDocument();
    expect(enlace).toHaveAttribute("href", "/login");
  });

  it("muestra boton de Google", () => {
    renderConProveedores(<PaginaRegistro />);

    expect(screen.getByRole("button", { name: /continuar con google/i })).toBeInTheDocument();
  });

  it("muestra error si la contrasena tiene menos de 8 caracteres", async () => {
    // No llamar onSuccess para este caso
    mockRegistroMutate.mockImplementation(() => {});

    renderConProveedores(<PaginaRegistro />);

    await user.type(screen.getByPlaceholderText("Tu nombre completo"), "María");
    await user.type(screen.getByPlaceholderText("tu@correo.com"), "maria@test.com");
    await user.type(screen.getByPlaceholderText("Minimo 8 caracteres"), "1234567");
    await user.type(screen.getByPlaceholderText("Repite tu contrasena"), "1234567");

    await user.click(screen.getByRole("button", { name: /crear cuenta/i }));

    expect(screen.getByText("La contrasena debe tener al menos 8 caracteres.")).toBeInTheDocument();
    expect(mockRegistroMutate).not.toHaveBeenCalled();
  });

  it("muestra error si las contrasenas no coinciden", async () => {
    mockRegistroMutate.mockImplementation(() => {});

    renderConProveedores(<PaginaRegistro />);

    await user.type(screen.getByPlaceholderText("Tu nombre completo"), "María");
    await user.type(screen.getByPlaceholderText("tu@correo.com"), "maria@test.com");
    await user.type(screen.getByPlaceholderText("Minimo 8 caracteres"), "12345678");
    await user.type(screen.getByPlaceholderText("Repite tu contrasena"), "87654321");

    await user.click(screen.getByRole("button", { name: /crear cuenta/i }));

    expect(screen.getByText("Las contrasenas no coinciden.")).toBeInTheDocument();
    expect(mockRegistroMutate).not.toHaveBeenCalled();
  });

  it("llama a registro.mutate con datos correctos al enviar formulario valido", async () => {
    renderConProveedores(<PaginaRegistro />);

    await user.type(screen.getByPlaceholderText("Tu nombre completo"), "María Test");
    await user.type(screen.getByPlaceholderText("tu@correo.com"), "maria@test.com");
    await user.type(screen.getByPlaceholderText("Minimo 8 caracteres"), "password123");
    await user.type(screen.getByPlaceholderText("Repite tu contrasena"), "password123");

    await user.click(screen.getByRole("button", { name: /crear cuenta/i }));

    expect(mockRegistroMutate).toHaveBeenCalledWith(
      { email: "maria@test.com", nombre: "María Test", contrasena: "password123" },
      expect.objectContaining({ onSuccess: expect.any(Function) }),
    );
  });

  it("redirige a /onboarding al registrarse exitosamente", async () => {
    renderConProveedores(<PaginaRegistro />);

    await user.type(screen.getByPlaceholderText("Tu nombre completo"), "María");
    await user.type(screen.getByPlaceholderText("tu@correo.com"), "maria@test.com");
    await user.type(screen.getByPlaceholderText("Minimo 8 caracteres"), "password123");
    await user.type(screen.getByPlaceholderText("Repite tu contrasena"), "password123");

    await user.click(screen.getByRole("button", { name: /crear cuenta/i }));

    expect(mockPush).toHaveBeenCalledWith("/onboarding");
  });

  it("toggle de visibilidad de contrasena funciona", async () => {
    renderConProveedores(<PaginaRegistro />);

    const inputContrasena = screen.getByPlaceholderText("Minimo 8 caracteres");
    expect(inputContrasena).toHaveAttribute("type", "password");

    const botonToggle = screen.getByRole("button", { name: /mostrar contrasena/i });
    await user.click(botonToggle);

    expect(inputContrasena).toHaveAttribute("type", "text");
  });

  it("limpia error de validacion al modificar contrasena", async () => {
    mockRegistroMutate.mockImplementation(() => {});

    renderConProveedores(<PaginaRegistro />);

    await user.type(screen.getByPlaceholderText("Tu nombre completo"), "María");
    await user.type(screen.getByPlaceholderText("tu@correo.com"), "maria@test.com");
    await user.type(screen.getByPlaceholderText("Minimo 8 caracteres"), "short");
    await user.type(screen.getByPlaceholderText("Repite tu contrasena"), "short");

    await user.click(screen.getByRole("button", { name: /crear cuenta/i }));
    expect(screen.getByText("La contrasena debe tener al menos 8 caracteres.")).toBeInTheDocument();

    // Al escribir en contrasena, el error se limpia
    await user.type(screen.getByPlaceholderText("Minimo 8 caracteres"), "x");
    expect(screen.queryByText("La contrasena debe tener al menos 8 caracteres.")).not.toBeInTheDocument();
  });

  it("llama a googleAuth.mutate al hacer click en boton Google", async () => {
    renderConProveedores(<PaginaRegistro />);

    await user.click(screen.getByRole("button", { name: /continuar con google/i }));

    expect(mockGoogleMutate).toHaveBeenCalled();
  });
});
