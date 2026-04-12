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

/**
 * Helper: matcher de texto que verifica que un elemento contenga
 * todos los términos en su textContent (útil cuando el contenido
 * está dividido en múltiples spans hermanos).
 */
function contieneTextos(...terminos: RegExp[]) {
  return (_contenido: string, elemento: Element | null) => {
    if (!elemento) return false;
    const texto = elemento.textContent ?? "";
    return terminos.every((regex) => regex.test(texto));
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

  it("renderiza la vista mensual compacta con ritmo personal integrado", () => {
    renderConProveedores(<PaginaCalendarioCosmico />);

    // Date stamp del header: el mes y el año viven en spans separados,
    // así que verificamos que algún ancestro común contenga ambos.
    expect(
      screen.getAllByText(contieneTextos(/abril/i, /2026/)).length,
    ).toBeGreaterThan(0);
    // El panel detalle del header muestra el día seleccionado por defecto (hoy)
    expect(screen.getByText(/Día personal 6 · Año 8/i)).toBeInTheDocument();
    expect(
      screen.getAllByText(contieneTextos(/hasta/i, /mayo/i)).length,
    ).toBeGreaterThan(0);
    // "Mercurio R" puede aparecer en la celda del día y en el panel detalle
    expect(screen.getAllByText("Mercurio R").length).toBeGreaterThan(0);
  });

  it("permite avanzar a la ventana del próximo mes", () => {
    renderConProveedores(<PaginaCalendarioCosmico />);

    fireEvent.click(screen.getByRole("button", { name: "Próximo mes" }));

    expect(
      screen.getAllByText(contieneTextos(/mayo/i, /2026/)).length,
    ).toBeGreaterThan(0);
  });

  it("actualiza el panel detalle del header al seleccionar un día", () => {
    renderConProveedores(<PaginaCalendarioCosmico />);

    const manana = screen.getAllByRole("button").find((boton) =>
      boton.textContent?.includes("Venus → Aries"),
    );

    expect(manana).toBeDefined();
    if (manana) {
      fireEvent.click(manana);
    }

    // Tras clickear el día siguiente (2026-04-04), el panel del header
    // debe mostrar su ritmo personal calculado.
    expect(screen.getByText(/Día personal 7 · Año 8/i)).toBeInTheDocument();
  });
});
