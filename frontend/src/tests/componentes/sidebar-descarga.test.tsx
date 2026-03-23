import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderConProveedores } from "../utilidades";

// Guardar referencia original ANTES de cualquier spy
const createElementOriginal = document.createElement.bind(document);

// ── Mocks ────────────────────────────────────────────────────

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
  usePathname: () => "/dashboard",
}));
vi.mock("next/image", () => ({
  default: (props: Record<string, unknown>) => {
    const { priority, fill, ...rest } = props;
    return <img {...rest} />;
  },
}));

const mockUsarMiPerfil = vi.fn();
const mockUsarMisCalculos = vi.fn();

vi.mock("@/lib/hooks", () => ({
  usarMiPerfil: () => mockUsarMiPerfil(),
  usarMisCalculos: () => mockUsarMisCalculos(),
}));

vi.mock("@/lib/stores/store-auth", () => ({
  useStoreAuth: () => ({ usuario: { nombre: "Test User" } }),
}));

vi.mock("@/lib/stores/store-ui", () => ({
  useStoreUI: () => ({ sidebarAbierto: false, cerrarSidebar: vi.fn() }),
}));

const mockGenerarMarkdown = vi.fn(() => "# Markdown de prueba");
vi.mock("@/lib/utilidades/generar-markdown-perfil", () => ({
  generarMarkdownPerfil: (...args: unknown[]) => mockGenerarMarkdown(...args),
}));

import SidebarNavegacion from "@/componentes/layouts/sidebar-navegacion";

// ── Datos ────────────────────────────────────────────────────

const PERFIL = {
  id: "abc-123",
  nombre: "Lucía García",
  fecha_nacimiento: "1990-01-15",
  hora_nacimiento: "14:30:00",
  ciudad_nacimiento: "Buenos Aires",
  pais_nacimiento: "Argentina",
  latitud: -34.6037,
  longitud: -58.3816,
  zona_horaria: "America/Argentina/Buenos_Aires",
};

const CALCULOS = {
  natal: {
    planetas: [
      { nombre: "Sol", signo: "Capricornio", grado_en_signo: 24.82 },
      { nombre: "Luna", signo: "Escorpio", grado_en_signo: 10.55 },
    ],
    ascendente: { signo: "Géminis", grado_en_signo: 12.34 },
  },
  diseno_humano: { tipo: "Generador", perfil: "3/5" },
  numerologia: {
    camino_de_vida: { numero: 8 },
  },
};

// ── Tests ────────────────────────────────────────────────────

describe("SidebarNavegacion — Botón Descargar Perfil", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
  });

  it("muestra el botón 'Descargar Perfil' cuando hay cálculos", () => {
    mockUsarMiPerfil.mockReturnValue({ data: PERFIL, isLoading: false });
    mockUsarMisCalculos.mockReturnValue({ data: CALCULOS, isLoading: false });

    renderConProveedores(<SidebarNavegacion />);

    const boton = screen.getByRole("button", { name: /Descargar Perfil/i });
    expect(boton).toBeInTheDocument();
    expect(boton).not.toBeDisabled();
  });

  it("deshabilita el botón cuando no hay cálculos", () => {
    mockUsarMiPerfil.mockReturnValue({ data: PERFIL, isLoading: false });
    mockUsarMisCalculos.mockReturnValue({
      data: { natal: null, diseno_humano: null, numerologia: null },
      isLoading: false,
    });

    renderConProveedores(<SidebarNavegacion />);

    const boton = screen.getByRole("button", { name: /Descargar Perfil/i });
    expect(boton).toBeDisabled();
  });

  it("deshabilita el botón mientras carga", () => {
    mockUsarMiPerfil.mockReturnValue({ data: null, isLoading: true });
    mockUsarMisCalculos.mockReturnValue({ data: undefined, isLoading: true });

    renderConProveedores(<SidebarNavegacion />);

    const boton = screen.getByRole("button", { name: /Descargar Perfil/i });
    expect(boton).toBeDisabled();
  });

  it("abre el modal al hacer click en el botón", async () => {
    const user = userEvent.setup();
    mockUsarMiPerfil.mockReturnValue({ data: PERFIL, isLoading: false });
    mockUsarMisCalculos.mockReturnValue({ data: CALCULOS, isLoading: false });

    renderConProveedores(<SidebarNavegacion />);

    const boton = screen.getByRole("button", { name: /Descargar Perfil/i });
    await user.click(boton);

    expect(screen.getByText("Elige el formato de descarga")).toBeInTheDocument();
    expect(screen.getByText("PDF")).toBeInTheDocument();
    expect(screen.getByText("Markdown")).toBeInTheDocument();
    expect(screen.getByText("Con estilo ASTRA")).toBeInTheDocument();
    expect(screen.getByText("Texto editable")).toBeInTheDocument();
  });

  it("cierra el modal al hacer click en X", async () => {
    const user = userEvent.setup();
    mockUsarMiPerfil.mockReturnValue({ data: PERFIL, isLoading: false });
    mockUsarMisCalculos.mockReturnValue({ data: CALCULOS, isLoading: false });

    renderConProveedores(<SidebarNavegacion />);

    // Abrir modal
    await user.click(screen.getByRole("button", { name: /Descargar Perfil/i }));
    expect(screen.getByText("Elige el formato de descarga")).toBeInTheDocument();

    // Buscar y clickear el botón X (cerrar) dentro del modal
    // El modal tiene un botón con el ícono X justo después del título
    const botonesModal = screen.getAllByRole("button");
    const botonCerrar = botonesModal.find(
      (b) => b.querySelector("svg") && b.closest("[class*='absolute']")
    );
    if (botonCerrar) {
      await user.click(botonCerrar);
    }

    await waitFor(() => {
      expect(screen.queryByText("Elige el formato de descarga")).not.toBeInTheDocument();
    });
  });

  it("descarga Markdown al hacer click en botón Markdown", async () => {
    const user = userEvent.setup();
    mockUsarMiPerfil.mockReturnValue({ data: PERFIL, isLoading: false });
    mockUsarMisCalculos.mockReturnValue({ data: CALCULOS, isLoading: false });

    // Mock de URL.createObjectURL y revokeObjectURL
    const mockUrl = "blob:http://test/fake-url";
    global.URL.createObjectURL = vi.fn(() => mockUrl);
    global.URL.revokeObjectURL = vi.fn();

    // Mock del <a> creado programáticamente — instalar DESPUÉS del render
    const clickMock = vi.fn();

    renderConProveedores(<SidebarNavegacion />);

    // Ahora mockear createElement (después de que React haya montado el DOM)
    vi.spyOn(document, "createElement").mockImplementation((tag: string) => {
      if (tag === "a") {
        return {
          href: "",
          download: "",
          click: clickMock,
          remove: vi.fn(),
        } as unknown as HTMLAnchorElement;
      }
      return createElementOriginal(tag);
    });
    vi.spyOn(document.body, "appendChild").mockImplementation(((node: Node) => node) as any);

    // Abrir modal
    await user.click(screen.getByRole("button", { name: /Descargar Perfil/i }));

    // Click en Markdown
    await user.click(screen.getByText("Markdown"));

    // Verificar que se llamó generarMarkdownPerfil
    expect(mockGenerarMarkdown).toHaveBeenCalledWith(PERFIL, CALCULOS);
    // Verificar que se creó un blob URL
    expect(global.URL.createObjectURL).toHaveBeenCalled();
    // Verificar click programático
    expect(clickMock).toHaveBeenCalled();
  });

  it("intenta descargar PDF con fetch al hacer click en botón PDF", async () => {
    const user = userEvent.setup();
    mockUsarMiPerfil.mockReturnValue({ data: PERFIL, isLoading: false });
    mockUsarMisCalculos.mockReturnValue({ data: CALCULOS, isLoading: false });

    // Mock de localStorage para el token
    localStorage.setItem("token_acceso", "fake-jwt-token");

    // Mock de fetch
    const mockBlob = new Blob(["%PDF-fake"], { type: "application/pdf" });
    const fetchMock = vi.fn(() =>
      Promise.resolve({
        ok: true,
        blob: () => Promise.resolve(mockBlob),
      } as Response)
    );
    global.fetch = fetchMock;

    // Mock de URL
    global.URL.createObjectURL = vi.fn(() => "blob:http://test/fake-pdf");
    global.URL.revokeObjectURL = vi.fn();

    const clickMock = vi.fn();

    renderConProveedores(<SidebarNavegacion />);

    // Mockear createElement DESPUÉS del render
    vi.spyOn(document, "createElement").mockImplementation((tag: string) => {
      if (tag === "a") {
        return {
          href: "",
          download: "",
          click: clickMock,
          remove: vi.fn(),
        } as unknown as HTMLAnchorElement;
      }
      return createElementOriginal(tag);
    });
    vi.spyOn(document.body, "appendChild").mockImplementation(((node: Node) => node) as any);

    // Abrir modal
    await user.click(screen.getByRole("button", { name: /Descargar Perfil/i }));

    // Click en PDF
    await user.click(screen.getByText("PDF"));

    // Verificar que se llamó fetch con auth header
    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith("/api/v1/profile/me/pdf", {
        headers: { Authorization: "Bearer fake-jwt-token" },
      });
    });

    // Verificar click programático para descarga
    await waitFor(() => {
      expect(clickMock).toHaveBeenCalled();
    });
  });

  it("muestra los enlaces de navegación correctos", () => {
    mockUsarMiPerfil.mockReturnValue({ data: PERFIL, isLoading: false });
    mockUsarMisCalculos.mockReturnValue({ data: CALCULOS, isLoading: false });

    renderConProveedores(<SidebarNavegacion />);

    expect(screen.getByText("Inicio")).toBeInTheDocument();
    // Varios textos aparecen tanto en nav como en mini-cards
    expect(screen.getAllByText("Carta Astral").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("Diseño Humano").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("Numerología").length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText("Retorno Solar")).toBeInTheDocument();
  });
});
