import { describe, it, expect } from "vitest";
import { generarMarkdownPerfil } from "@/lib/utilidades/generar-markdown-perfil";
import type { Perfil, CalculosPerfil } from "@/lib/tipos";

// ── Datos de prueba ──────────────────────────────────────────

const PERFIL_TEST: Perfil = {
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

const CALCULOS_COMPLETOS: CalculosPerfil = {
  natal: {
    nombre: "Lucía García",
    fecha_nacimiento: "1990-01-15",
    hora_nacimiento: "14:30:00",
    ciudad: "Buenos Aires",
    pais: "Argentina",
    latitud: -34.6037,
    longitud: -58.3816,
    zona_horaria: "America/Argentina/Buenos_Aires",
    dia_juliano: 2447908.1042,
    sistema_casas: "Placidus",
    ascendente: { signo: "Géminis", grado_en_signo: 12.34, longitud: 72.34 },
    medio_cielo: { signo: "Acuario", grado_en_signo: 5.67, longitud: 305.67 },
    planetas: [
      {
        nombre: "Sol",
        signo: "Capricornio",
        grado_en_signo: 24.82,
        longitud: 294.82,
        latitud: 0.0,
        casa: 8,
        retrogrado: false,
        velocidad: 1.019,
        dignidad: null,
      },
      {
        nombre: "Luna",
        signo: "Escorpio",
        grado_en_signo: 10.55,
        longitud: 220.55,
        latitud: -3.2,
        casa: 6,
        retrogrado: false,
        velocidad: 13.1,
        dignidad: "caída",
      },
      {
        nombre: "Mercurio",
        signo: "Capricornio",
        grado_en_signo: 8.11,
        longitud: 278.11,
        latitud: -1.5,
        casa: 7,
        retrogrado: true,
        velocidad: -0.5,
        dignidad: null,
      },
    ],
    casas: [
      { numero: 1, signo: "Géminis", grado: 72.34, grado_en_signo: 12.34 },
      { numero: 2, signo: "Cáncer", grado: 95.1, grado_en_signo: 5.1 },
    ],
    aspectos: [
      {
        planeta1: "Sol",
        planeta2: "Luna",
        tipo: "Sextil",
        angulo_exacto: 74.27,
        orbe: 5.73,
        aplicativo: true,
      },
      {
        planeta1: "Sol",
        planeta2: "Mercurio",
        tipo: "Conjunción",
        angulo_exacto: 16.71,
        orbe: 3.29,
        aplicativo: false,
      },
    ],
  },
  diseno_humano: {
    tipo: "Generador Manifestante",
    autoridad: "Sacral",
    perfil: "3/5",
    definicion: "Simple",
    cruz_encarnacion: {
      puertas: [10, 15, 18, 17],
      sol_consciente: 10,
      tierra_consciente: 15,
      sol_inconsciente: 18,
      tierra_inconsciente: 17,
    },
    centros: {
      cabeza: "abierto",
      ajna: "abierto",
      garganta: "definido",
      sacral: "definido",
    },
    canales: [
      { puertas: [34, 20], nombre: "Carisma", centros: ["Sacral", "Garganta"] },
    ],
    activaciones_conscientes: [
      { planeta: "Sol", longitud: 294.82, puerta: 10, linea: 3, color: 1 },
    ],
    activaciones_inconscientes: [
      { planeta: "Sol", longitud: 206.82, puerta: 18, linea: 2, color: 4 },
    ],
    puertas_conscientes: [10, 48],
    puertas_inconscientes: [18, 56],
    dia_juliano_consciente: 2447908.1042,
    dia_juliano_inconsciente: 2447819.5,
  },
  numerologia: {
    nombre: "Lucía García",
    fecha_nacimiento: "1990-01-15",
    sistema: "pitagórico",
    camino_de_vida: { numero: 8, descripcion: "Poder y logro material." },
    expresion: { numero: 5, descripcion: "Libertad y cambio." },
    impulso_del_alma: { numero: 3, descripcion: "Creatividad." },
    personalidad: { numero: 2, descripcion: "Diplomacia." },
    numero_nacimiento: { numero: 6, descripcion: "Hogar." },
    anio_personal: { numero: 1, descripcion: "Nuevos comienzos." },
    mes_personal: { numero: 5, descripcion: "Libertad y cambio." },
    dia_personal: { numero: 3, descripcion: "Creatividad." },
    etapas_de_la_vida: [
      { numero: 7, descripcion: "Introspección.", edad_inicio: 0, edad_fin: 28 },
      { numero: 6, descripcion: "Hogar.", edad_inicio: 28, edad_fin: 37 },
      { numero: 4, descripcion: "Estabilidad.", edad_inicio: 37, edad_fin: 46 },
      { numero: 2, descripcion: "Diplomacia.", edad_inicio: 46, edad_fin: null },
    ],
    numeros_maestros_presentes: [11],
  },
  retorno_solar: null,
};

const CALCULOS_VACIOS: CalculosPerfil = {
  natal: null,
  diseno_humano: null,
  numerologia: null,
  retorno_solar: null,
};

// ── Tests ────────────────────────────────────────────────────

describe("generarMarkdownPerfil", () => {
  it("genera markdown con header y nombre del perfil", () => {
    const md = generarMarkdownPerfil(PERFIL_TEST, CALCULOS_COMPLETOS);

    expect(md).toContain("# Perfil Cósmico — Lucía García");
    expect(md).toContain("1990-01-15");
    expect(md).toContain("Buenos Aires, Argentina");
  });

  it("incluye sección de Carta Astral con tablas de planetas", () => {
    const md = generarMarkdownPerfil(PERFIL_TEST, CALCULOS_COMPLETOS);

    expect(md).toContain("## Carta Astral");
    expect(md).toContain("**Ascendente:** Géminis 12.3°");
    expect(md).toContain("**Medio Cielo:** Acuario 5.7°");
    expect(md).toContain("| Sol | Capricornio |");
    expect(md).toContain("| Luna | Escorpio |");
  });

  it("marca planetas retrógrados con R en la tabla", () => {
    const md = generarMarkdownPerfil(PERFIL_TEST, CALCULOS_COMPLETOS);

    // Mercurio retrógrado
    expect(md).toContain("| Mercurio | Capricornio | 8.11° | 7 | R |");
    // Sol NO retrógrado
    expect(md).toMatch(/\| Sol \| Capricornio \| 24\.82° \| 8 \| {2}\|/);
  });

  it("incluye tabla de casas", () => {
    const md = generarMarkdownPerfil(PERFIL_TEST, CALCULOS_COMPLETOS);

    expect(md).toContain("### Casas");
    expect(md).toContain("| 1 | Géminis |");
    expect(md).toContain("| 2 | Cáncer |");
  });

  it("incluye tabla de aspectos con tipo aplicativo/separativo", () => {
    const md = generarMarkdownPerfil(PERFIL_TEST, CALCULOS_COMPLETOS);

    expect(md).toContain("### Aspectos");
    expect(md).toContain("| Sol | Sextil | Luna |");
    expect(md).toContain("| Aplicativo |");
    expect(md).toContain("| Separativo |");
  });

  it("incluye sección de Diseño Humano", () => {
    const md = generarMarkdownPerfil(PERFIL_TEST, CALCULOS_COMPLETOS);

    expect(md).toContain("## Diseño Humano");
    expect(md).toContain("**Tipo:** Generador Manifestante");
    expect(md).toContain("**Autoridad:** Sacral");
    expect(md).toContain("**Perfil:** 3/5");
    expect(md).toContain("**Definición:** Simple");
  });

  it("incluye cruz de encarnación", () => {
    const md = generarMarkdownPerfil(PERFIL_TEST, CALCULOS_COMPLETOS);

    expect(md).toContain("**Cruz de Encarnación:** 10 / 15 / 18 / 17");
  });

  it("incluye tabla de centros HD", () => {
    const md = generarMarkdownPerfil(PERFIL_TEST, CALCULOS_COMPLETOS);

    expect(md).toContain("### Centros");
    expect(md).toContain("| Cabeza | Abierto |");
    expect(md).toContain("| Garganta | Definido |");
  });

  it("incluye tabla de canales HD", () => {
    const md = generarMarkdownPerfil(PERFIL_TEST, CALCULOS_COMPLETOS);

    expect(md).toContain("### Canales");
    expect(md).toContain("| 34-20 | Carisma | Sacral ↔ Garganta |");
  });

  it("incluye activaciones conscientes e inconscientes", () => {
    const md = generarMarkdownPerfil(PERFIL_TEST, CALCULOS_COMPLETOS);

    expect(md).toContain("### Activaciones Conscientes (Personalidad)");
    expect(md).toContain("| Sol | 10 | 3 |");
    expect(md).toContain("### Activaciones Inconscientes (Diseño)");
    expect(md).toContain("| Sol | 18 | 2 |");
  });

  it("incluye sección de Numerología con tabla", () => {
    const md = generarMarkdownPerfil(PERFIL_TEST, CALCULOS_COMPLETOS);

    expect(md).toContain("## Numerología");
    expect(md).toContain("**Sistema:** Pitagórico");
    expect(md).toContain("| Camino de Vida | 8 |");
    expect(md).toContain("| Expresión | 5 |");
    expect(md).toContain("| Impulso del Alma | 3 |");
  });

  it("incluye números maestros presentes", () => {
    const md = generarMarkdownPerfil(PERFIL_TEST, CALCULOS_COMPLETOS);

    expect(md).toContain("**Números Maestros presentes:** 11");
  });

  it("incluye footer con marca ASTRA", () => {
    const md = generarMarkdownPerfil(PERFIL_TEST, CALCULOS_COMPLETOS);

    expect(md).toContain("_Generado por ASTRA · CosmicEngine_");
  });

  it("muestra 'Datos no disponibles' cuando no hay cálculos", () => {
    const md = generarMarkdownPerfil(PERFIL_TEST, CALCULOS_VACIOS);

    expect(md).toContain("## Carta Astral");
    expect(md).toContain("_Datos no disponibles._");
    expect(md).toContain("## Diseño Humano");
    expect(md).toContain("## Numerología");
  });

  it("funciona con perfil null", () => {
    const md = generarMarkdownPerfil(null, CALCULOS_VACIOS);

    expect(md).toContain("# Perfil Cósmico — Usuario");
    expect(md).not.toContain("**Nacimiento:**");
  });

  it("funciona con calculos null", () => {
    const md = generarMarkdownPerfil(PERFIL_TEST, null);

    expect(md).toContain("# Perfil Cósmico — Lucía García");
    expect(md).toContain("_Datos no disponibles._");
  });

  it("funciona con ambos null", () => {
    const md = generarMarkdownPerfil(null, null);

    expect(md).toContain("# Perfil Cósmico — Usuario");
    expect(md).toContain("## Carta Astral");
    expect(md).toContain("## Diseño Humano");
    expect(md).toContain("## Numerología");
  });

  it("omite secciones HD parciales si están vacías", () => {
    const hdSinCanales: CalculosPerfil = {
      ...CALCULOS_VACIOS,
      diseno_humano: {
        ...CALCULOS_COMPLETOS.diseno_humano!,
        canales: [],
        activaciones_conscientes: [],
        activaciones_inconscientes: [],
      },
    };
    const md = generarMarkdownPerfil(PERFIL_TEST, hdSinCanales);

    expect(md).toContain("**Tipo:** Generador Manifestante");
    expect(md).not.toContain("### Canales");
    expect(md).not.toContain("### Activaciones Conscientes");
    expect(md).not.toContain("### Activaciones Inconscientes");
  });

  it("no incluye números maestros si la lista está vacía", () => {
    const numSinMaestros: CalculosPerfil = {
      ...CALCULOS_VACIOS,
      numerologia: {
        ...CALCULOS_COMPLETOS.numerologia!,
        numeros_maestros_presentes: [],
      },
    };
    const md = generarMarkdownPerfil(PERFIL_TEST, numSinMaestros);

    expect(md).not.toContain("Números Maestros presentes");
  });
});
