import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderConProveedores } from "../utilidades";

// Mocks de Next.js
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
  usePathname: () => "/perfil",
}));

vi.mock("next/link", () => ({
  default: ({ children, href, ...rest }: { children: React.ReactNode; href: string; [key: string]: unknown }) => (
    <a href={href} {...rest}>{children}</a>
  ),
}));

// Mock HeaderMobile
vi.mock("@/componentes/layouts/header-mobile", () => ({
  default: ({ titulo }: { titulo: string }) => <div data-testid="header-mobile">{titulo}</div>,
}));

// Estado mock del perfil
const PERFIL_MOCK = {
  id: "uuid-perfil-1",
  nombre: "Lucía García",
  fecha_nacimiento: "1990-01-15",
  hora_nacimiento: "14:30:00",
  ciudad_nacimiento: "Buenos Aires",
  pais_nacimiento: "Argentina",
  latitud: -34.6037,
  longitud: -58.3816,
  zona_horaria: "America/Argentina/Buenos_Aires",
};

// Hooks mock
const mockActualizarMutateAsync = vi.fn();
let mockActualizarPending = false;

const mockCartaNatalMutateAsync = vi.fn();
const mockDisenoHumanoMutateAsync = vi.fn();
const mockNumerologiaMutateAsync = vi.fn();
const mockRetornoSolarMutateAsync = vi.fn();
const mockCancelarMutate = vi.fn();

let mockPerfilData: typeof PERFIL_MOCK | null = PERFIL_MOCK;
let mockPerfilLoading = false;
let mockSuscripcionData: { estado: string; plan_slug: string } | null = null;

vi.mock("@/lib/hooks", () => ({
  usarCambiarContrasena: () => ({
    mutate: vi.fn(),
    isPending: false,
    error: null,
  }),
  usarMiPerfil: () => ({
    data: mockPerfilData,
    isLoading: mockPerfilLoading,
  }),
  usarActualizarPerfil: () => ({
    mutateAsync: mockActualizarMutateAsync,
    isPending: mockActualizarPending,
  }),
  usarCartaNatal: () => ({
    mutateAsync: mockCartaNatalMutateAsync,
  }),
  usarDisenoHumano: () => ({
    mutateAsync: mockDisenoHumanoMutateAsync,
  }),
  usarNumerologia: () => ({
    mutateAsync: mockNumerologiaMutateAsync,
  }),
  usarRetornoSolar: () => ({
    mutateAsync: mockRetornoSolarMutateAsync,
  }),
  usarCancelarSuscripcion: () => ({
    mutate: mockCancelarMutate,
    isPending: false,
  }),
  usarMiSuscripcion: () => ({
    data: mockSuscripcionData,
  }),
}));

const mockCerrarSesion = vi.fn();

vi.mock("@/lib/stores/store-auth", () => ({
  useStoreAuth: Object.assign(
    () => ({
      usuario: {
        id: "uuid-user-1",
        nombre: "Lucía García",
        email: "lucia@test.com",
        proveedor_auth: "local",
        activo: true,
        verificado: true,
        plan_nombre: "Gratis",
        plan_slug: "gratis",
        suscripcion_estado: null,
        creado_en: "2024-01-01T00:00:00Z",
        ultimo_acceso: "2024-06-15T12:00:00Z",
      },
    }),
    {
      getState: () => ({ cerrarSesion: mockCerrarSesion }),
    },
  ),
}));

import PaginaPerfil from "@/app/(app)/perfil/page";

describe("PaginaPerfil — Datos de Nacimiento", () => {
  const user = userEvent.setup();

  beforeEach(() => {
    vi.clearAllMocks();
    mockPerfilData = PERFIL_MOCK;
    mockPerfilLoading = false;
    mockActualizarPending = false;
    mockSuscripcionData = null;
    mockActualizarMutateAsync.mockResolvedValue({
      ...PERFIL_MOCK,
      datos_nacimiento_cambiaron: false,
    });
    mockCartaNatalMutateAsync.mockResolvedValue({});
    mockDisenoHumanoMutateAsync.mockResolvedValue({});
    mockNumerologiaMutateAsync.mockResolvedValue({});
    mockRetornoSolarMutateAsync.mockResolvedValue({});
  });

  it("muestra la seccion de datos de nacimiento en modo lectura", () => {
    renderConProveedores(<PaginaPerfil />);

    expect(screen.getByText("Datos de Nacimiento")).toBeInTheDocument();
    // "Lucía García" aparece múltiples veces (header + info usuario + datos nacimiento)
    expect(screen.getAllByText("Lucía García").length).toBeGreaterThanOrEqual(2);
    // Estos valores solo aparecen en la sección de datos de nacimiento
    expect(screen.getByText("14:30")).toBeInTheDocument();
    expect(screen.getByText("America/Argentina/Buenos_Aires")).toBeInTheDocument();
  });

  it("muestra boton Editar cuando hay perfil", () => {
    renderConProveedores(<PaginaPerfil />);

    expect(screen.getByRole("button", { name: /editar/i })).toBeInTheDocument();
  });

  it("muestra mensaje cuando no hay perfil", () => {
    mockPerfilData = null;
    renderConProveedores(<PaginaPerfil />);

    expect(screen.getByText(/no tienes datos de nacimiento/i)).toBeInTheDocument();
  });

  it("muestra mensaje de carga mientras carga perfil", () => {
    mockPerfilLoading = true;
    renderConProveedores(<PaginaPerfil />);

    expect(screen.getByText("Cargando datos...")).toBeInTheDocument();
  });

  it("entra en modo edicion al hacer click en Editar", async () => {
    renderConProveedores(<PaginaPerfil />);

    await user.click(screen.getByRole("button", { name: /editar/i }));

    // Debe mostrar inputs con valores pre-populados
    expect(screen.getByDisplayValue("Lucía García")).toBeInTheDocument();
    expect(screen.getByDisplayValue("1990-01-15")).toBeInTheDocument();
    expect(screen.getByDisplayValue("14:30")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Buenos Aires")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Argentina")).toBeInTheDocument();

    // Debe mostrar botones Guardar y Cancelar
    expect(screen.getByRole("button", { name: /guardar/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /cancelar/i })).toBeInTheDocument();
  });

  it("vuelve a modo lectura al hacer click en Cancelar", async () => {
    renderConProveedores(<PaginaPerfil />);

    await user.click(screen.getByRole("button", { name: /editar/i }));
    await user.click(screen.getByRole("button", { name: /cancelar/i }));

    // Debe volver a modo lectura con el boton Editar
    expect(screen.getByRole("button", { name: /editar/i })).toBeInTheDocument();
  });

  it("llama a actualizarPerfil.mutateAsync al guardar sin cambio de nacimiento", async () => {
    mockActualizarMutateAsync.mockResolvedValue({
      ...PERFIL_MOCK,
      nombre: "Nombre Editado",
      datos_nacimiento_cambiaron: false,
    });

    renderConProveedores(<PaginaPerfil />);

    await user.click(screen.getByRole("button", { name: /editar/i }));

    const inputNombre = screen.getByDisplayValue("Lucía García");
    await user.clear(inputNombre);
    await user.type(inputNombre, "Nombre Editado");

    await user.click(screen.getByRole("button", { name: /guardar/i }));

    await waitFor(() => {
      expect(mockActualizarMutateAsync).toHaveBeenCalledWith({
        nombre: "Nombre Editado",
        fecha_nacimiento: "1990-01-15",
        hora_nacimiento: "14:30",
        ciudad_nacimiento: "Buenos Aires",
        pais_nacimiento: "Argentina",
      });
    });

    // No debe recalcular cartas
    expect(mockCartaNatalMutateAsync).not.toHaveBeenCalled();
    expect(mockDisenoHumanoMutateAsync).not.toHaveBeenCalled();
    expect(mockNumerologiaMutateAsync).not.toHaveBeenCalled();
    expect(mockRetornoSolarMutateAsync).not.toHaveBeenCalled();
  });

  it("recalcula las 4 cartas cuando datos de nacimiento cambiaron", async () => {
    mockActualizarMutateAsync.mockResolvedValue({
      ...PERFIL_MOCK,
      ciudad_nacimiento: "Córdoba",
      datos_nacimiento_cambiaron: true,
    });

    renderConProveedores(<PaginaPerfil />);

    await user.click(screen.getByRole("button", { name: /editar/i }));

    const inputCiudad = screen.getByDisplayValue("Buenos Aires");
    await user.clear(inputCiudad);
    await user.type(inputCiudad, "Córdoba");

    await user.click(screen.getByRole("button", { name: /guardar/i }));

    await waitFor(() => {
      expect(mockCartaNatalMutateAsync).toHaveBeenCalled();
      expect(mockDisenoHumanoMutateAsync).toHaveBeenCalled();
      expect(mockNumerologiaMutateAsync).toHaveBeenCalled();
      expect(mockRetornoSolarMutateAsync).toHaveBeenCalled();
    });
  });

  it("muestra validacion si el nombre esta vacio", async () => {
    renderConProveedores(<PaginaPerfil />);

    await user.click(screen.getByRole("button", { name: /editar/i }));

    const inputNombre = screen.getByDisplayValue("Lucía García");
    await user.clear(inputNombre);

    await user.click(screen.getByRole("button", { name: /guardar/i }));

    expect(screen.getByText("El nombre es obligatorio.")).toBeInTheDocument();
    expect(mockActualizarMutateAsync).not.toHaveBeenCalled();
  });

  it("muestra mensaje de error cuando la actualizacion falla", async () => {
    mockActualizarMutateAsync.mockRejectedValue(new Error("Error del servidor"));

    renderConProveedores(<PaginaPerfil />);

    await user.click(screen.getByRole("button", { name: /editar/i }));
    await user.click(screen.getByRole("button", { name: /guardar/i }));

    await waitFor(() => {
      expect(
        screen.getByText("No se pudieron actualizar los datos. Intenta nuevamente.")
      ).toBeInTheDocument();
    });
  });

  it("muestra seccion Configuracion con acordeon de contrasena", () => {
    renderConProveedores(<PaginaPerfil />);

    expect(screen.getByText("Configuracion")).toBeInTheDocument();
    expect(screen.getByText("Cambiar contrasena")).toBeInTheDocument();
    expect(screen.getByText("Cerrar sesion")).toBeInTheDocument();
  });

  it("llama a cerrarSesion al hacer click en Cerrar sesion", async () => {
    renderConProveedores(<PaginaPerfil />);

    await user.click(screen.getByText("Cerrar sesion"));

    expect(mockCerrarSesion).toHaveBeenCalled();
  });
});
