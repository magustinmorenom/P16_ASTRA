import { describe, expect, it } from "vitest";
import {
  mapearPlanetas,
  mapearCuspides,
  nombreEspanolAIngles,
  nombreInglesAEspanol,
} from "@/componentes/visualizaciones/mapeador-astrochart";
import type { Planeta, Casa } from "@/lib/tipos";

// ── Fixtures ──

const planetasMock: Planeta[] = [
  { nombre: "Sol", longitud: 294.82, latitud: 0, signo: "Capricornio", grado_en_signo: 24.82, casa: 4, retrogrado: false, velocidad: 1.02, dignidad: null },
  { nombre: "Luna", longitud: 45.93, latitud: -3.2, signo: "Tauro", grado_en_signo: 15.93, casa: 8, retrogrado: false, velocidad: 13.5, dignidad: "exaltacion" },
  { nombre: "Mercurio", longitud: 289.1, latitud: 1.1, signo: "Capricornio", grado_en_signo: 19.1, casa: 4, retrogrado: true, velocidad: -0.5, dignidad: null },
  { nombre: "Venus", longitud: 310.5, latitud: 0.3, signo: "Acuario", grado_en_signo: 10.5, casa: 5, retrogrado: false, velocidad: 1.2, dignidad: null },
  { nombre: "Marte", longitud: 217.97, latitud: -0.8, signo: "Escorpio", grado_en_signo: 7.97, casa: 2, retrogrado: false, velocidad: 0.65, dignidad: "domicilio" },
  { nombre: "Júpiter", longitud: 173.07, latitud: 0.1, signo: "Virgo", grado_en_signo: 23.07, casa: 12, retrogrado: false, velocidad: 0.12, dignidad: null },
  { nombre: "Saturno", longitud: 252.92, latitud: 0.5, signo: "Sagitario", grado_en_signo: 12.92, casa: 3, retrogrado: false, velocidad: 0.05, dignidad: null },
  { nombre: "Urano", longitud: 16.79, latitud: -0.3, signo: "Aries", grado_en_signo: 16.79, casa: 7, retrogrado: false, velocidad: 0.02, dignidad: null },
  { nombre: "Neptuno", longitud: 338.02, latitud: 0.6, signo: "Piscis", grado_en_signo: 8.02, casa: 6, retrogrado: false, velocidad: 0.01, dignidad: null },
  { nombre: "Plutón", longitud: 285.65, latitud: 3.1, signo: "Capricornio", grado_en_signo: 15.65, casa: 4, retrogrado: true, velocidad: -0.01, dignidad: null },
  { nombre: "Nodo Norte", longitud: 83.26, latitud: 0, signo: "Géminis", grado_en_signo: 23.26, casa: 9, retrogrado: false, velocidad: -0.05, dignidad: null },
];

const casasMock: Casa[] = [
  { numero: 1, signo: "Virgo", grado: 170.5, grado_en_signo: 20.5 },
  { numero: 2, signo: "Libra", grado: 198.3, grado_en_signo: 18.3 },
  { numero: 3, signo: "Escorpio", grado: 230.1, grado_en_signo: 20.1 },
  { numero: 4, signo: "Sagitario", grado: 265.0, grado_en_signo: 25.0 },
  { numero: 5, signo: "Capricornio", grado: 295.8, grado_en_signo: 25.8 },
  { numero: 6, signo: "Acuario", grado: 322.1, grado_en_signo: 22.1 },
  { numero: 7, signo: "Piscis", grado: 350.5, grado_en_signo: 20.5 },
  { numero: 8, signo: "Aries", grado: 18.3, grado_en_signo: 18.3 },
  { numero: 9, signo: "Tauro", grado: 50.1, grado_en_signo: 20.1 },
  { numero: 10, signo: "Géminis", grado: 85.0, grado_en_signo: 25.0 },
  { numero: 11, signo: "Cáncer", grado: 115.8, grado_en_signo: 25.8 },
  { numero: 12, signo: "Leo", grado: 142.1, grado_en_signo: 22.1 },
];

// ── Tests ──

describe("mapearPlanetas", () => {
  it("mapea 11 planetas con nombres en inglés", () => {
    const resultado = mapearPlanetas(planetasMock);
    expect(Object.keys(resultado)).toHaveLength(11);
    expect(resultado["Sun"]).toBeDefined();
    expect(resultado["Moon"]).toBeDefined();
    expect(resultado["Mercury"]).toBeDefined();
    expect(resultado["Jupiter"]).toBeDefined();
    expect(resultado["Pluto"]).toBeDefined();
    expect(resultado["NNode"]).toBeDefined();
  });

  it("preserva longitudes exactas", () => {
    const resultado = mapearPlanetas(planetasMock);
    expect(resultado["Sun"]![0]).toBe(294.82);
    expect(resultado["Moon"]![0]).toBe(45.93);
  });

  it("pasa velocidad como segundo elemento", () => {
    const resultado = mapearPlanetas(planetasMock);
    expect(resultado["Sun"]![1]).toBe(1.02);
    expect(resultado["Mercury"]![1]).toBe(-0.5); // retrógrado
  });

  it("maneja velocidad negativa para retrógrados", () => {
    const resultado = mapearPlanetas(planetasMock);
    expect(resultado["Mercury"]![1]).toBeLessThan(0);
    expect(resultado["Pluto"]![1]).toBeLessThan(0);
  });
});

describe("mapearCuspides", () => {
  it("retorna array de 12 cúspides", () => {
    const resultado = mapearCuspides(casasMock);
    expect(resultado).toHaveLength(12);
  });

  it("ordena por número de casa", () => {
    // Pasar desordenadas
    const desordenadas = [...casasMock].reverse();
    const resultado = mapearCuspides(desordenadas);
    expect(resultado[0]).toBe(170.5); // Casa 1
    expect(resultado[3]).toBe(265.0); // Casa 4
    expect(resultado[9]).toBe(85.0);  // Casa 10
  });

  it("preserva grados exactos", () => {
    const resultado = mapearCuspides(casasMock);
    expect(resultado[0]).toBe(170.5);
    expect(resultado[11]).toBe(142.1);
  });
});

describe("nombreEspanolAIngles", () => {
  it("convierte nombres con acentos", () => {
    expect(nombreEspanolAIngles("Júpiter")).toBe("Jupiter");
    expect(nombreEspanolAIngles("Plutón")).toBe("Pluto");
    expect(nombreEspanolAIngles("Neptuno")).toBe("Neptune");
  });

  it("maneja nombres compuestos", () => {
    expect(nombreEspanolAIngles("Nodo Norte")).toBe("NNode");
  });

  it("es case-insensitive", () => {
    expect(nombreEspanolAIngles("SOL")).toBe("Sun");
    expect(nombreEspanolAIngles("luna")).toBe("Moon");
  });
});

describe("nombreInglesAEspanol", () => {
  it("convierte nombres de vuelta con acentos", () => {
    expect(nombreInglesAEspanol("Jupiter")).toBe("Júpiter");
    expect(nombreInglesAEspanol("Pluto")).toBe("Plutón");
  });

  it("maneja round-trip para todos los planetas", () => {
    for (const p of planetasMock) {
      const ingles = nombreEspanolAIngles(p.nombre);
      const vuelta = nombreInglesAEspanol(ingles);
      expect(vuelta).toBe(p.nombre);
    }
  });

  it("retorna el mismo string si no encuentra mapeo", () => {
    expect(nombreInglesAEspanol("Desconocido")).toBe("Desconocido");
  });
});
