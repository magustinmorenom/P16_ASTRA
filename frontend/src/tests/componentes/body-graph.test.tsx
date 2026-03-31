import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import BodyGraph from "@/componentes/visualizaciones/body-graph";

const DATOS_HD = {
  tipo: "Generador",
  autoridad: "Sacral",
  perfil: "2/4",
  definicion: "Simple",
  cruz_encarnacion: {
    puertas: [34, 20, 10, 57],
    sol_consciente: 34,
    tierra_consciente: 20,
    sol_inconsciente: 10,
    tierra_inconsciente: 57,
  },
  centros: {
    sacral: "definido",
    garganta: "definido",
    cabeza: "abierto",
  },
  canales: [
    {
      puertas: [34, 20] as [number, number],
      nombre: "Carisma",
      centros: ["Sacral", "Garganta"] as [string, string],
    },
  ],
  activaciones_conscientes: [],
  activaciones_inconscientes: [],
  puertas_conscientes: [34, 20],
  puertas_inconscientes: [10, 57],
  dia_juliano_consciente: 0,
  dia_juliano_inconsciente: 0,
};

describe("BodyGraph", () => {
  it("renderiza canales definidos sin errores de runtime", () => {
    expect(() =>
      render(
        <BodyGraph
          datos={DATOS_HD}
          canalSeleccionado="34-20"
        />,
      ),
    ).not.toThrow();

    expect(screen.getByText("Garganta")).toBeInTheDocument();
    expect(screen.getByText("Sacral")).toBeInTheDocument();
  });
});
