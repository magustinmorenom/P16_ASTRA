import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { fireEvent, screen } from "@testing-library/react";
import { eachDayOfInterval, format } from "date-fns";

import { renderConProveedores } from "../utilidades";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), back: vi.fn() }),
}));

const mockUsarMiPerfil = vi.fn();
const mockUsarTransitosRango = vi.fn();

vi.mock("@/lib/hooks", () => ({
  usarMiPerfil: () => mockUsarMiPerfil(),
  usarTransitosRango: (...args: unknown[]) => mockUsarTransitosRango(...args),
}));

import PaginaCalendarioCosmico from "@/app/(app)/calendario-cosmico/page";

function crearDia(fecha: string) {
  const esHoy = fecha === "2026-04-03";
  const esManana = fecha === "2026-04-04";

  return {
    fecha,
    fecha_utc: `${fecha}T12:00:00+00:00`,
    dia_juliano: 2461000,
    fase_lunar: esHoy ? "Luna Nueva" : esManana ? "Creciente" : "Gibosa Creciente",
    estado: esHoy ? "presente" : fecha > "2026-04-03" ? "futuro" : "pasado",
    planetas: [
      {
        nombre: "Sol",
        longitud: 13,
        latitud: 0,
        signo: "Aries",
        grado_en_signo: 13,
        retrogrado: false,
        velocidad: 1,
      },
      {
        nombre: "Luna",
        longitud: 105,
        latitud: 0,
        signo: esHoy ? "Géminis" : "Cáncer",
        grado_en_signo: 15,
        retrogrado: false,
        velocidad: 12,
      },
      {
        nombre: "Mercurio",
        longitud: 8,
        latitud: 0,
        signo: "Aries",
        grado_en_signo: 8,
        retrogrado: esHoy,
        velocidad: esHoy ? -0.2 : 0.6,
      },
    ],
    aspectos: [],
    eventos: {
      cambios_signo: esManana ? [{ planeta: "Venus", de: "Piscis", a: "Aries" }] : [],
      retrogrados_inicio: esHoy ? ["Mercurio"] : [],
      retrogrados_fin: [],
      aspectos_exactos: [],
      fases: esHoy ? "Luna Nueva" : null,
    },
  };
}

function crearRango(inicio: string, fin: string) {
  return {
    fecha_inicio: inicio,
    fecha_fin: fin,
    dias: eachDayOfInterval({
      start: new Date(`${inicio}T12:00:00`),
      end: new Date(`${fin}T12:00:00`),
    }).map((fecha) => crearDia(format(fecha, "yyyy-MM-dd"))),
  };
}

describe("PaginaCalendarioCosmico", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-04-03T12:00:00-03:00"));
    vi.clearAllMocks();

    mockUsarMiPerfil.mockReturnValue({
      data: {
        id: "perfil-1",
        nombre: "Lucía García",
        fecha_nacimiento: "1990-01-15",
        hora_nacimiento: "14:30:00",
        ciudad_nacimiento: "Córdoba",
        pais_nacimiento: "Argentina",
        latitud: -31.4167,
        longitud: -64.1833,
        zona_horaria: "America/Argentina/Cordoba",
      },
      isLoading: false,
    });

    mockUsarTransitosRango.mockImplementation((inicio: string, fin: string) => ({
      data: crearRango(inicio, fin),
      isLoading: false,
      isError: false,
      error: null,
      refetch: vi.fn(),
    }));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("renderiza la vista mensual real con año y día personal", () => {
    renderConProveedores(<PaginaCalendarioCosmico />);

    expect(
      screen.getByText(/Calendario mensual compacto, fijo en hoy y en la semana actual/i),
    ).toBeInTheDocument();
    expect(screen.getByText("Año personal 8")).toBeInTheDocument();
    expect(screen.getByText("Hoy vibra en 6")).toBeInTheDocument();
    expect(screen.getByText("Mercurio inicia retrogradación")).toBeInTheDocument();
  });

  it("permite avanzar a la ventana del próximo mes", () => {
    renderConProveedores(<PaginaCalendarioCosmico />);

    fireEvent.click(screen.getByRole("button", { name: "Próximo mes" }));

    expect(screen.getByText(/mayo 2026/i)).toBeInTheDocument();
  });

  it("actualiza el detalle cuando el usuario selecciona otro día", () => {
    renderConProveedores(<PaginaCalendarioCosmico />);

    const manana = screen.getAllByRole("button").find((boton) =>
      boton.textContent?.includes("Venus → Aries"),
    );

    expect(manana).toBeDefined();
    if (manana) {
      fireEvent.click(manana);
    }

    expect(screen.getByText(/Venus entra en Aries/i)).toBeInTheDocument();
  });
});
