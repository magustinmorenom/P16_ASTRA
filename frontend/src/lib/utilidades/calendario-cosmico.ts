import type { PlanetaCalendario, TransitosDia } from "@/lib/tipos";

export type ImpactoCalendario = "favorable" | "neutral" | "precaucion";

export interface RitmoPersonalCalendario {
  anio: number;
  mes: number;
  dia: number;
  descripcionAnio: string;
  descripcionMes: string;
  descripcionDia: string;
}

export interface EventoClaveCalendario {
  id: string;
  titulo: string;
  descripcion: string;
  impacto: ImpactoCalendario;
  etiquetaCorta: string;
}

const DESCRIPCIONES_NUMERO: Record<number, string> = {
  1: "inicio, foco y liderazgo",
  2: "alianzas, escucha y equilibrio",
  3: "expresión, comunicación y creatividad",
  4: "estructura, método y orden",
  5: "cambio, movimiento y apertura",
  6: "vínculos, hogar y responsabilidad",
  7: "introspección, estudio y observación",
  8: "logro, finanzas y autoridad",
  9: "cierres, síntesis y desapego",
  11: "intuición, visión y sensibilidad alta",
  22: "construcción grande, estrategia y legado",
  33: "servicio, cuidado y guía",
};

const IMPACTO_ASPECTO: Record<string, ImpactoCalendario> = {
  Trígono: "favorable",
  Sextil: "favorable",
  Cuadratura: "precaucion",
  Oposición: "precaucion",
  Conjunción: "neutral",
};

function reducirNumero(valor: number): number {
  let acumulado = valor;
  while (acumulado > 9 && acumulado !== 11 && acumulado !== 22 && acumulado !== 33) {
    acumulado = String(acumulado)
      .split("")
      .reduce((suma, digito) => suma + Number(digito), 0);
  }
  return acumulado;
}

export function formatearFechaISOlocal(fecha: Date): string {
  const anio = fecha.getFullYear();
  const mes = String(fecha.getMonth() + 1).padStart(2, "0");
  const dia = String(fecha.getDate()).padStart(2, "0");
  return `${anio}-${mes}-${dia}`;
}

export function calcularRitmoPersonal(
  fechaNacimiento: string | null | undefined,
  fechaObjetivo: Date,
): RitmoPersonalCalendario | null {
  if (!fechaNacimiento) return null;

  const [anioTexto, mesTexto, diaTexto] = fechaNacimiento.split("-");
  const diaNacimiento = Number(diaTexto);
  const mesNacimiento = Number(mesTexto);
  const anioObjetivo = fechaObjetivo.getFullYear();
  const mesObjetivo = fechaObjetivo.getMonth() + 1;
  const diaObjetivo = fechaObjetivo.getDate();

  if (!diaNacimiento || !mesNacimiento || !anioTexto) return null;

  const anioPersonal = reducirNumero(
    reducirNumero(diaNacimiento) +
      reducirNumero(mesNacimiento) +
      reducirNumero(
        String(anioObjetivo)
          .split("")
          .reduce((suma, digito) => suma + Number(digito), 0),
      ),
  );
  const mesPersonal = reducirNumero(anioPersonal + mesObjetivo);
  const diaPersonal = reducirNumero(mesPersonal + diaObjetivo);

  return {
    anio: anioPersonal,
    mes: mesPersonal,
    dia: diaPersonal,
    descripcionAnio: DESCRIPCIONES_NUMERO[anioPersonal] ?? "ciclo activo del año",
    descripcionMes: DESCRIPCIONES_NUMERO[mesPersonal] ?? "tono activo del mes",
    descripcionDia: DESCRIPCIONES_NUMERO[diaPersonal] ?? "vibración activa del día",
  };
}

export function describirFaseLunar(fase: string): string {
  switch (fase) {
    case "Luna Nueva":
      return "Apertura de ciclo. Conviene sembrar intención y ordenar prioridades.";
    case "Luna Llena":
      return "Pico de visibilidad y descarga emocional. Sirve más para revelar y cerrar que para forzar inicios.";
    case "Cuarto Creciente":
      return "Tramo de empuje y corrección. Lo importante es sostener dirección.";
    case "Cuarto Menguante":
      return "Momento de ajuste fino, descanso y depuración de exceso.";
    case "Creciente":
    case "Gibosa Creciente":
      return "La energía viene subiendo. Buen momento para avanzar con criterio.";
    case "Gibosa Menguante":
    case "Menguante":
      return "La energía pide síntesis y descarga. Mejor cerrar que abrir demasiados frentes.";
    default:
      return "La fase lunar marca el pulso emocional y el tono del día.";
  }
}

function descripcionRetrogradoInicio(planeta: string): string {
  switch (planeta) {
    case "Mercurio":
      return "Revisá mensajes, contratos, agendas y traslados antes de confirmar.";
    case "Venus":
      return "Conviene observar vínculos, deseo y valor antes de fijar decisiones.";
    case "Marte":
      return "Bajá la impulsividad y corregí estrategia antes de empujar.";
    default:
      return "La energía de este planeta entra en revisión y pide menos automatismo.";
  }
}

function descripcionRetrogradoFin(planeta: string): string {
  switch (planeta) {
    case "Mercurio":
      return "La comunicación recupera claridad y se destraban ajustes recientes.";
    case "Venus":
      return "Empieza a ordenarse lo vincular y lo afectivo con más nitidez.";
    case "Marte":
      return "Vuelve tracción para ejecutar, decidir y mover lo trabado.";
    default:
      return "La energía de este planeta vuelve a fluir de manera más directa.";
  }
}

export function obtenerEventosClave(dia: TransitosDia | null | undefined): EventoClaveCalendario[] {
  if (!dia) return [];

  const eventos = dia.eventos;
  const items: EventoClaveCalendario[] = [];

  if (eventos.fases) {
    items.push({
      id: `fase-${eventos.fases}`,
      titulo: eventos.fases,
      descripcion: describirFaseLunar(eventos.fases),
      impacto: eventos.fases === "Luna Nueva" ? "favorable" : "precaucion",
      etiquetaCorta: eventos.fases,
    });
  }

  eventos.retrogrados_inicio.forEach((planeta) => {
    items.push({
      id: `retro-inicio-${planeta}`,
      titulo: `${planeta} inicia retrogradación`,
      descripcion: descripcionRetrogradoInicio(planeta),
      impacto: "precaucion",
      etiquetaCorta: `${planeta} R`,
    });
  });

  eventos.retrogrados_fin.forEach((planeta) => {
    items.push({
      id: `retro-fin-${planeta}`,
      titulo: `${planeta} retoma movimiento directo`,
      descripcion: descripcionRetrogradoFin(planeta),
      impacto: "favorable",
      etiquetaCorta: `${planeta} directo`,
    });
  });

  eventos.cambios_signo.forEach((cambio) => {
    items.push({
      id: `signo-${cambio.planeta}-${cambio.a}`,
      titulo: `${cambio.planeta} entra en ${cambio.a}`,
      descripcion: `${cambio.planeta} cambia de ${cambio.de} a ${cambio.a}. El tono del día se reacomoda alrededor de ese ingreso.`,
      impacto: "neutral",
      etiquetaCorta: `${cambio.planeta} → ${cambio.a}`,
    });
  });

  eventos.aspectos_exactos.slice(0, 3).forEach((aspecto, indice) => {
    const impacto = IMPACTO_ASPECTO[aspecto.tipo] ?? "neutral";
    items.push({
      id: `aspecto-${indice}-${aspecto.planeta_a}-${aspecto.planeta_b}`,
      titulo: `${aspecto.planeta_a} ${aspecto.tipo.toLowerCase()} ${aspecto.planeta_b}`,
      descripcion: `Aspecto exacto del día entre ${aspecto.planeta_a} y ${aspecto.planeta_b}. Marca un punto de máxima intensidad para ese cruce.`,
      impacto,
      etiquetaCorta: `${aspecto.planeta_a} · ${aspecto.tipo}`,
    });
  });

  return items;
}

export function obtenerRetrogradosActivos(planetas: PlanetaCalendario[]): string[] {
  return planetas.filter((planeta) => planeta.retrogrado).map((planeta) => planeta.nombre);
}

export function obtenerPlanetasClave(dia: TransitosDia | null | undefined): PlanetaCalendario[] {
  if (!dia) return [];

  const nombresPrioritarios = new Set(["Sol", "Luna", "Mercurio", "Venus", "Marte"]);
  const destacados = dia.planetas.filter(
    (planeta) => nombresPrioritarios.has(planeta.nombre) || planeta.retrogrado,
  );

  return destacados.slice(0, 5);
}
