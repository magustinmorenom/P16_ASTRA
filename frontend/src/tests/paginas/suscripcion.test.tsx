import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen } from "@testing-library/react";
import { renderConProveedores } from "../utilidades";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

const mockUsarPlanes = vi.fn();
const mockUsarMiSuscripcion = vi.fn();
const mockUsarSuscribirse = vi.fn();
const mockUsarCancelarSuscripcion = vi.fn();
const mockUsarPagos = vi.fn();
const mockUsarDetectarPais = vi.fn();
const mockUsarSincronizarPagos = vi.fn();
const mockUsarFacturas = vi.fn();
const mockUsarVerificarEstado = vi.fn();
const mockUsarEstadoVinculacion = vi.fn();
const mockUsarGenerarCodigo = vi.fn();
const mockUsarDesvincular = vi.fn();

vi.mock("@/lib/hooks", () => ({
  usarPlanes: () => mockUsarPlanes(),
  usarMiSuscripcion: () => mockUsarMiSuscripcion(),
  usarSuscribirse: () => mockUsarSuscribirse(),
  usarCancelarSuscripcion: () => mockUsarCancelarSuscripcion(),
  usarPagos: () => mockUsarPagos(),
  usarDetectarPais: () => mockUsarDetectarPais(),
  usarSincronizarPagos: () => mockUsarSincronizarPagos(),
  usarFacturas: () => mockUsarFacturas(),
  usarVerificarEstado: () => mockUsarVerificarEstado(),
  usarEstadoVinculacion: () => mockUsarEstadoVinculacion(),
  usarGenerarCodigo: () => mockUsarGenerarCodigo(),
  usarDesvincular: () => mockUsarDesvincular(),
}));

import PaginaSuscripcion from "@/app/(app)/suscripcion/page";

const PLAN_GRATIS = {
  id: "plan-gratis",
  nombre: "Gratis",
  slug: "gratis",
  descripcion: "Plan gratuito",
  precio_usd_centavos: 0,
  intervalo: "forever",
  limite_perfiles: 3,
  limite_calculos_dia: 5,
  features: ["natal_basico", "numerologia_basica"],
  activo: true,
  orden: 0,
};

const PLAN_PREMIUM = {
  id: "plan-premium",
  nombre: "Premium",
  slug: "premium",
  descripcion: "Plan premium",
  precio_usd_centavos: 900,
  intervalo: "months",
  limite_perfiles: -1,
  limite_calculos_dia: -1,
  features: ["natal", "diseno_humano", "numerologia", "retorno_solar", "transitos", "exportar_pdf"],
  activo: true,
  orden: 1,
};

const PLAN_MAX = {
  id: "plan-max",
  nombre: "Max",
  slug: "max",
  descripcion: "Capa máxima",
  precio_usd_centavos: 0,
  intervalo: "months",
  limite_perfiles: -1,
  limite_calculos_dia: -1,
  features: ["todo_premium", "prioridad_maxima"],
  activo: true,
  orden: 2,
};

const SUSCRIPCION_GRATIS = {
  id: "sus-1",
  plan: PLAN_GRATIS,
  plan_nombre: "Gratis",
  plan_slug: "gratis",
  estado: "activa",
  pais_codigo: "AR",
  fecha_inicio: "2026-03-23",
  fecha_fin: null,
  creado_en: "2026-03-23T10:00:00",
};

describe("PaginaSuscripcion", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUsarDetectarPais.mockReturnValue({
      data: { pais_codigo: "AR", pais_nombre: "Argentina" },
      isLoading: false,
    });
    mockUsarSuscribirse.mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
    });
    mockUsarCancelarSuscripcion.mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
    });
    mockUsarPagos.mockReturnValue({
      data: [],
      isLoading: false,
    });
    mockUsarSincronizarPagos.mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: false,
    });
    mockUsarFacturas.mockReturnValue({
      data: [],
      isLoading: false,
    });
    mockUsarVerificarEstado.mockReturnValue({
      data: null,
      isLoading: false,
    });
    mockUsarEstadoVinculacion.mockReturnValue({
      data: null,
      isLoading: false,
    });
    mockUsarGenerarCodigo.mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: false,
    });
    mockUsarDesvincular.mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: false,
    });
  });

  it("muestra los tres planes visibles", () => {
    mockUsarPlanes.mockReturnValue({
      data: [PLAN_GRATIS, PLAN_PREMIUM, PLAN_MAX],
      isLoading: false,
    });
    mockUsarMiSuscripcion.mockReturnValue({
      data: SUSCRIPCION_GRATIS,
      isLoading: false,
    });

    renderConProveedores(<PaginaSuscripcion />);

    expect(screen.getAllByText("Free").length).toBeGreaterThan(0);
    expect(screen.getByText("Premium")).toBeInTheDocument();
    expect(screen.getByText("Max")).toBeInTheDocument();
  });

  it("marca el plan actual como activo", () => {
    mockUsarPlanes.mockReturnValue({
      data: [PLAN_GRATIS, PLAN_PREMIUM, PLAN_MAX],
      isLoading: false,
    });
    mockUsarMiSuscripcion.mockReturnValue({
      data: SUSCRIPCION_GRATIS,
      isLoading: false,
    });

    renderConProveedores(<PaginaSuscripcion />);

    expect(screen.getByText("Plan actual")).toBeInTheDocument();
  });

  it("muestra botón Actualizar a Premium", () => {
    mockUsarPlanes.mockReturnValue({
      data: [PLAN_GRATIS, PLAN_PREMIUM, PLAN_MAX],
      isLoading: false,
    });
    mockUsarMiSuscripcion.mockReturnValue({
      data: SUSCRIPCION_GRATIS,
      isLoading: false,
    });

    renderConProveedores(<PaginaSuscripcion />);

    expect(screen.getByText(/Actualizar a Premium/)).toBeInTheDocument();
  });

  it("muestra features del plan premium", () => {
    mockUsarPlanes.mockReturnValue({
      data: [PLAN_GRATIS, PLAN_PREMIUM, PLAN_MAX],
      isLoading: false,
    });
    mockUsarMiSuscripcion.mockReturnValue({
      data: SUSCRIPCION_GRATIS,
      isLoading: false,
    });

    renderConProveedores(<PaginaSuscripcion />);

    expect(screen.getByText("natal")).toBeInTheDocument();
    expect(screen.getByText("diseno_humano")).toBeInTheDocument();
  });

  it("muestra info de suscripción actual", () => {
    mockUsarPlanes.mockReturnValue({
      data: [PLAN_GRATIS, PLAN_PREMIUM, PLAN_MAX],
      isLoading: false,
    });
    mockUsarMiSuscripcion.mockReturnValue({
      data: SUSCRIPCION_GRATIS,
      isLoading: false,
    });

    renderConProveedores(<PaginaSuscripcion />);

    expect(screen.getByText("Tu plan y tus cobros")).toBeInTheDocument();
    expect(screen.getAllByText(/Activa/).length).toBeGreaterThan(0);
  });
});
