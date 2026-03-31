"use client";

import { useState } from "react";
import { Icono } from "@/componentes/ui/icono";
import { IconoSigno } from "@/componentes/ui/icono-astral";
import { ETIQUETA_CARTA } from "@/componentes/carta-natal/estilos";
import {
  ARQUETIPO_PLANETA,
  BADGE_ASPECTO,
  COLORES_ELEMENTO,
  COLORES_MODALIDAD,
  COLORES_PLANETA,
  DIGNIDAD_BADGE,
  ELEMENTO_SIGNO,
  MODALIDAD_SIGNO,
  NARRATIVA_ASPECTO,
  REGENTE_SIGNO,
  ROMANO,
  SIMBOLOS_ASPECTO,
  TEMA_CASA,
  calcularDistribucion,
  interpretarAspecto,
  interpretarCasa,
  interpretarPlaneta,
  interpretarTriada,
  normalizarClave,
} from "@/lib/utilidades/interpretaciones-natal";
import type { Aspecto, CartaNatal, Casa, Planeta } from "@/lib/tipos";

type ElementoEnergetico = "Fuego" | "Tierra" | "Aire" | "Agua";
type ModalidadEnergetica = "Cardinal" | "Fijo" | "Mutable";

export type SeleccionEnergiaContextual =
  | { tipo: "energia"; categoria: "pulso" }
  | { tipo: "energia"; categoria: "elementos" }
  | { tipo: "energia"; categoria: "modalidades" }
  | { tipo: "energia"; categoria: "elemento"; nombre: ElementoEnergetico }
  | { tipo: "energia"; categoria: "modalidad"; nombre: ModalidadEnergetica };

export type SeleccionContextual =
  | { tipo: "default" }
  | { tipo: "planeta"; planeta: Planeta }
  | { tipo: "aspecto"; aspecto: Aspecto }
  | { tipo: "casa"; casa: Casa }
  | { tipo: "triada"; subtipo: "sol" | "luna" | "ascendente" }
  | SeleccionEnergiaContextual;

interface PanelContextualProps {
  seleccion: SeleccionContextual;
  datos: CartaNatal;
  onCerrar: () => void;
  modo?: "movil" | "escritorio";
}

const TARJETA_PANEL =
  "rounded-[18px] border border-white/10 bg-white/[0.08] p-4 backdrop-blur-xl";

const TARJETA_PANEL_SUAVE =
  "rounded-[18px] border border-white/10 bg-white/[0.05] p-3.5";

const GRILLA_PANEL_METRICAS =
  "grid gap-3 [grid-template-columns:repeat(auto-fit,minmax(112px,1fr))]";

const ORDEN_ELEMENTOS: ElementoEnergetico[] = ["Fuego", "Tierra", "Aire", "Agua"];
const ORDEN_MODALIDADES: ModalidadEnergetica[] = ["Cardinal", "Fijo", "Mutable"];

const CLAVES_ELEMENTO: Record<
  ElementoEnergetico,
  {
    queEs: string;
    aporta: string;
    cuidar: string;
    palabras: string[];
  }
> = {
  Fuego: {
    queEs: "El fuego habla de impulso, deseo, coraje y necesidad de ir al frente.",
    aporta: "Te vuelve más rápida para entusiasmarte, exponerte y abrir camino.",
    cuidar: "Si se acelera demasiado, puede llevarte a reaccionar antes de medir el contexto.",
    palabras: ["impulso", "coraje", "expresión"],
  },
  Tierra: {
    queEs: "La tierra ordena, concreta y baja la experiencia a algo útil y sostenible.",
    aporta: "Te da capacidad de materializar, cuidar ritmos y construir con constancia.",
    cuidar: "Cuando escasea, sostener procesos o aterrizar ideas puede requerir más intención.",
    palabras: ["realidad", "cuerpo", "sostén"],
  },
  Aire: {
    queEs: "El aire procesa a través de ideas, vínculos, lenguaje y perspectiva.",
    aporta: "Te ayuda a leer matices, conectar puntos y tomar distancia mental.",
    cuidar: "Si domina sin anclaje, puede llevarte a pensar mucho antes de sentir o decidir.",
    palabras: ["ideas", "vínculo", "lectura"],
  },
  Agua: {
    queEs: "El agua registra clima emocional, intuición, memoria y necesidad de resonancia.",
    aporta: "Te vuelve más sensible a los ambientes, a los gestos y a lo que no se dice.",
    cuidar: "Si queda baja, puede costarte habitar lo emocional sin pasar enseguida a la acción o al análisis.",
    palabras: ["sensibilidad", "intuición", "memoria"],
  },
};

const CLAVES_MODALIDAD: Record<
  ModalidadEnergetica,
  {
    queEs: string;
    aporta: string;
    cuidar: string;
    palabras: string[];
  }
> = {
  Cardinal: {
    queEs: "Lo cardinal abre, inicia y empuja movimiento. Marca cómo entrás en acción.",
    aporta: "Te vuelve más proclive a arrancar, proponer y mover lo que todavía está quieto.",
    cuidar: "Cuando domina, empezar te sale natural, pero sostener después puede pedir apoyo consciente.",
    palabras: ["inicia", "abre", "empuja"],
  },
  Fijo: {
    queEs: "Lo fijo sostiene, profundiza y afirma. Mantiene dirección una vez que algo empezó.",
    aporta: "Te da permanencia, foco y fidelidad a lo que considerás valioso.",
    cuidar: "Si escasea, mantener el rumbo o tolerar procesos largos puede costarte más.",
    palabras: ["sostiene", "profundiza", "afirma"],
  },
  Mutable: {
    queEs: "Lo mutable adapta, mezcla y reajusta. Lee el contexto y modifica la forma.",
    aporta: "Te ayuda a flexibilizar, responder a cambios y encontrar variantes.",
    cuidar: "Si aparece poco, flexibilizar sobre la marcha o cambiar de estrategia puede demandar más energía.",
    palabras: ["adapta", "mezcla", "responde"],
  },
};

function formatearListaNatural(items: string[]) {
  if (items.length === 0) return "sin focos planetarios claros";
  if (items.length === 1) return items[0];
  if (items.length === 2) return `${items[0]} y ${items[1]}`;
  return `${items.slice(0, -1).join(", ")} y ${items[items.length - 1]}`;
}

function formatearDistribucion(
  registro: Record<string, number>,
  orden: string[],
) {
  return orden.map((nombre) => `${registro[nombre] ?? 0} en ${nombre}`).join(", ");
}

function obtenerNombresConValor(
  registro: Record<string, number>,
  modo: "max" | "min",
) {
  const valores = Object.values(registro);
  const objetivo = valores.length > 0
    ? modo === "max"
      ? Math.max(...valores)
      : Math.min(...valores)
    : 0;

  return Object.entries(registro)
    .filter(([, valor]) => valor === objetivo)
    .map(([nombre]) => nombre);
}

function obtenerNivelPresencia(cantidad: number, total: number) {
  const ratio = total > 0 ? cantidad / total : 0;

  if (ratio >= 0.38) return "muy marcada";
  if (ratio >= 0.25) return "clara";
  if (ratio >= 0.15) return "presente";
  return "puntual";
}

function obtenerPlanetasPorElemento(
  datos: CartaNatal,
  nombre: ElementoEnergetico,
) {
  return datos.planetas
    .filter((planeta) => ELEMENTO_SIGNO[planeta.signo] === nombre)
    .map((planeta) => planeta.nombre);
}

function obtenerPlanetasPorModalidad(
  datos: CartaNatal,
  nombre: ModalidadEnergetica,
) {
  return datos.planetas
    .filter((planeta) => MODALIDAD_SIGNO[planeta.signo] === nombre)
    .map((planeta) => planeta.nombre);
}

function SeccionPanel({
  titulo,
  contenido,
}: {
  titulo: string;
  contenido: string;
}) {
  return (
    <div className={TARJETA_PANEL}>
      <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-violet-200/72">
        {titulo}
      </p>
      <p className="mt-2 text-[13px] leading-relaxed text-violet-50/88">
        {contenido}
      </p>
    </div>
  );
}

function CabeceraPanel({
  etiqueta,
  titulo,
  subtitulo,
  onCerrar,
  mostrarCerrar = true,
}: {
  etiqueta: string;
  titulo: string;
  subtitulo: string;
  onCerrar: () => void;
  mostrarCerrar?: boolean;
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div>
        <p className={`${ETIQUETA_CARTA} text-violet-200/72`}>{etiqueta}</p>
        <h3 className="mt-2 text-[18px] font-semibold tracking-tight text-white">
          {titulo}
        </h3>
        <p className="mt-2 text-[12px] leading-relaxed text-violet-100/66">
          {subtitulo}
        </p>
      </div>

      {mostrarCerrar && (
        <button
          type="button"
          onClick={onCerrar}
          className="rounded-full border border-white/10 bg-white/[0.08] p-2 text-violet-100/75 transition-colors hover:bg-white/[0.14] hover:text-white"
        >
          <Icono nombre="x" tamaño={18} />
        </button>
      )}
    </div>
  );
}

function obtenerResumenAspecto(aspecto: Aspecto) {
  const clave = normalizarClave(aspecto.tipo);
  const badge = BADGE_ASPECTO[clave];

  if (!badge) {
    return `Este aspecto conecta ${aspecto.planeta1} y ${aspecto.planeta2} de forma significativa.`;
  }

  return `La ${badge.label.toLowerCase()} conecta ${aspecto.planeta1} y ${aspecto.planeta2} y describe cómo interactúan esas dos funciones dentro de tu carta.`;
}

function obtenerObservacionPlaneta(planeta: Planeta, datos: CartaNatal) {
  const aspectosRelacionados = datos.aspectos.filter(
    (aspecto) =>
      aspecto.planeta1 === planeta.nombre || aspecto.planeta2 === planeta.nombre,
  );
  const temaCasa = TEMA_CASA[planeta.casa] || "esta área de vida";

  return `${planeta.nombre} descarga su energía sobre ${temaCasa}. ${
    planeta.retrogrado
      ? "Al estar retrógrado, primero pide revisión interna antes de mostrarse hacia afuera."
      : "Tiende a expresarse con mayor disponibilidad en el mundo externo."
  } ${
    aspectosRelacionados.length > 0
      ? `Además no opera solo: se enlaza con ${aspectosRelacionados.length} aspecto${aspectosRelacionados.length === 1 ? "" : "s"} que matizan su expresión.`
      : "Su expresión aparece más limpia y directa dentro del conjunto de la carta."
  }`;
}

function obtenerObservacionAspecto(aspecto: Aspecto) {
  const precision =
    aspecto.orbe < 2
      ? "Se siente con mucha fuerza porque el orbe es muy estrecho."
      : aspecto.orbe < 5
        ? "Tiene una presencia clara y consistente en la experiencia."
        : "Opera de forma más sutil, pero sigue coloreando tu manera de vivir esas dos energías.";

  const movimiento = aspecto.aplicativo
    ? "Al ser aplicativo, esta dinámica tiende a intensificarse cuando una situación la activa."
    : "Al ser separativo, suele sentirse como un patrón ya conocido que aprendiste a reconocer.";

  return `${precision} ${movimiento}`;
}

function obtenerObservacionCasa(casa: Casa, planetasEnCasa: string[]) {
  const regente = REGENTE_SIGNO[casa.signo] || casa.signo;

  return `Con ${casa.signo} en la cúspide, ${regente} marca el tono de esta casa. ${
    planetasEnCasa.length > 0
      ? `Como además están presentes ${planetasEnCasa.join(", ")}, este territorio toma más protagonismo en tu historia.`
      : "Aunque no tenga planetas adentro, sigue activa a través de la posición de su regente en la carta."
  }`;
}

function obtenerDefinicionTriada(subtipo: "sol" | "luna" | "ascendente") {
  if (subtipo === "sol") {
    return "El Sol representa tu identidad esencial, la dirección que querés sostener y la cualidad central con la que buscás irradiar.";
  }

  if (subtipo === "luna") {
    return "La Luna muestra tu manera de sentir, procesar y buscar seguridad emocional. Es la capa más íntima y reactiva de la carta.";
  }

  return "El Ascendente es la puerta de entrada a tu carta. Habla de tu presencia, tu tono inicial y la forma en que empezás a relacionarte con el mundo.";
}

function obtenerLecturaPulso(datos: CartaNatal) {
  const dist = calcularDistribucion(datos.planetas);
  const totalElementos = Object.values(dist.elementos).reduce((acc, valor) => acc + valor, 0);
  const totalModalidades = Object.values(dist.modalidades).reduce((acc, valor) => acc + valor, 0);
  const [elementoDominante, cantidadElemento] = Object.entries(dist.elementos).sort(
    (a, b) => b[1] - a[1],
  )[0] as [ElementoEnergetico, number];
  const [modalidadDominante, cantidadModalidad] = Object.entries(dist.modalidades).sort(
    (a, b) => b[1] - a[1],
  )[0] as [ModalidadEnergetica, number];
  const elementoInfo = CLAVES_ELEMENTO[elementoDominante];
  const modalidadInfo = CLAVES_MODALIDAD[modalidadDominante];

  return {
    queEs:
      "El pulso dominante junta tu elemento más repetido con la modalidad que más veces aparece. Te dice con qué combustible reaccionás y de qué manera lo ponés en marcha.",
    enTuCarta: `En vos se combina ${elementoDominante} con ${modalidadDominante}. Eso mezcla ${elementoInfo.palabras.join(", ")} con una entrada de movimiento que ${modalidadInfo.palabras.join(", ")}. En números, tenés ${cantidadElemento} planetas en ${elementoDominante} y ${cantidadModalidad} en ${modalidadDominante}.`,
    observar: `${elementoInfo.aporta} ${modalidadInfo.aporta} Juntas, estas dos capas explican por qué muchas veces primero te encendés y después necesitás decidir cómo sostener ese impulso.`,
    metricas: [
      {
        etiqueta: "Elemento base",
        valor: elementoDominante,
        detalle: `${cantidadElemento}/${totalElementos} planetas`,
        color: COLORES_ELEMENTO[elementoDominante],
      },
      {
        etiqueta: "Modo de activación",
        valor: modalidadDominante,
        detalle: `${cantidadModalidad}/${totalModalidades} planetas`,
        color: COLORES_MODALIDAD[modalidadDominante],
      },
    ],
  };
}

function obtenerLecturaElementos(datos: CartaNatal) {
  const dist = calcularDistribucion(datos.planetas);
  const dominantes = obtenerNombresConValor(dist.elementos, "max");
  const minimos = obtenerNombresConValor(dist.elementos, "min");
  const detalle = formatearDistribucion(dist.elementos, ORDEN_ELEMENTOS);
  const nombreDominante = dominantes[0] as ElementoEnergetico;

  return {
    queEs:
      "Los elementos muestran desde qué registro vivís la experiencia: impulso, cuerpo, mente o emoción. No hablan de bueno o malo, sino de por dónde te resulta más natural empezar.",
    enTuCarta: `Tu base se reparte así: ${detalle}. ${dominantes.length > 1 ? `${formatearListaNatural(dominantes)} comparten el peso más alto.` : `${nombreDominante} es el registro más disponible en tu carta.`} Eso hace que tu primera reacción tienda a parecerse a ese elemento antes que a los demás.`,
    observar: `Lo menos cargado hoy es ${formatearListaNatural(minimos)}. Ahí suele aparecer la sensación de "esto me sale menos automático", así que conviene acompañarlo con más conciencia cuando haga falta regular ritmo, emoción o perspectiva.`,
    metricas: ORDEN_ELEMENTOS.map((nombre) => ({
      etiqueta: nombre,
      valor: `${dist.elementos[nombre]}`,
      detalle: CLAVES_ELEMENTO[nombre].palabras.join(" · "),
      color: COLORES_ELEMENTO[nombre],
    })),
  };
}

function obtenerLecturaModalidades(datos: CartaNatal) {
  const dist = calcularDistribucion(datos.planetas);
  const dominantes = obtenerNombresConValor(dist.modalidades, "max");
  const minimos = obtenerNombresConValor(dist.modalidades, "min");
  const detalle = formatearDistribucion(dist.modalidades, ORDEN_MODALIDADES);
  const nombreDominante = dominantes[0] as ModalidadEnergetica;

  return {
    queEs:
      "Las modalidades describen cómo entra tu energía en acción: si abre, sostiene o adapta. Son la mecánica con la que te movés, más allá de cuál sea el tema.",
    enTuCarta: `Tu patrón modal queda así: ${detalle}. ${dominantes.length > 1 ? `${formatearListaNatural(dominantes)} aparecen con el mismo peso.` : `${nombreDominante} es la forma de movimiento más repetida en tu carta.`} Por eso suele sentirse más natural iniciar, sostener o flexibilizar según esa lógica dominante.`,
    observar: `La modalidad menos cargada es ${formatearListaNatural(minimos)}. Ahí podés notar que necesitás más intención para no reaccionar siempre del mismo modo frente a cambios, procesos largos o arranques nuevos.`,
    metricas: ORDEN_MODALIDADES.map((nombre) => ({
      etiqueta: nombre,
      valor: `${dist.modalidades[nombre]}`,
      detalle: CLAVES_MODALIDAD[nombre].palabras.join(" · "),
      color: COLORES_MODALIDAD[nombre],
    })),
  };
}

function obtenerLecturaElemento(
  nombre: ElementoEnergetico,
  datos: CartaNatal,
) {
  const dist = calcularDistribucion(datos.planetas);
  const total = Object.values(dist.elementos).reduce((acc, valor) => acc + valor, 0);
  const cantidad = dist.elementos[nombre];
  const planetas = obtenerPlanetasPorElemento(datos, nombre);
  const dominantes = obtenerNombresConValor(dist.elementos, "max");
  const info = CLAVES_ELEMENTO[nombre];
  const nivel = obtenerNivelPresencia(cantidad, total);

  return {
    queEs: info.queEs,
    enTuCarta: `En tu carta aparece ${cantidad} vez${cantidad === 1 ? "" : "es"}: ${formatearListaNatural(planetas)}. Su presencia es ${nivel}${dominantes.includes(nombre) ? " y además forma parte de tu eje dominante" : ""}, así que esta energía influye en cómo reaccionás cuando algo te importa de verdad.`,
    observar: `${info.aporta} ${info.cuidar} En tu caso, se activa especialmente a través de ${formatearListaNatural(planetas)}.`,
    metricas: [
      {
        etiqueta: "Peso en tu carta",
        valor: `${cantidad}/${total}`,
        detalle: nivel,
        color: COLORES_ELEMENTO[nombre],
      },
      {
        etiqueta: "Planetas que lo activan",
        valor: `${planetas.length}`,
        detalle: formatearListaNatural(planetas),
        color: COLORES_ELEMENTO[nombre],
      },
    ],
  };
}

function obtenerLecturaModalidad(
  nombre: ModalidadEnergetica,
  datos: CartaNatal,
) {
  const dist = calcularDistribucion(datos.planetas);
  const total = Object.values(dist.modalidades).reduce((acc, valor) => acc + valor, 0);
  const cantidad = dist.modalidades[nombre];
  const planetas = obtenerPlanetasPorModalidad(datos, nombre);
  const dominantes = obtenerNombresConValor(dist.modalidades, "max");
  const info = CLAVES_MODALIDAD[nombre];
  const nivel = obtenerNivelPresencia(cantidad, total);

  return {
    queEs: info.queEs,
    enTuCarta: `En vos esta modalidad aparece ${cantidad} vez${cantidad === 1 ? "" : "es"}: ${formatearListaNatural(planetas)}. Su presencia es ${nivel}${dominantes.includes(nombre) ? " y marca tu manera más espontánea de entrar en movimiento" : ""}.`,
    observar: `${info.aporta} ${info.cuidar} Cuando esta modalidad se activa en tu carta, suele hacerlo a través de ${formatearListaNatural(planetas)}.`,
    metricas: [
      {
        etiqueta: "Peso en tu carta",
        valor: `${cantidad}/${total}`,
        detalle: nivel,
        color: COLORES_MODALIDAD[nombre],
      },
      {
        etiqueta: "Planetas que la expresan",
        valor: `${planetas.length}`,
        detalle: formatearListaNatural(planetas),
        color: COLORES_MODALIDAD[nombre],
      },
    ],
  };
}

export function obtenerClavePanelContextual(seleccion: SeleccionContextual) {
  if (seleccion.tipo === "default") return "default";
  if (seleccion.tipo === "planeta") return `planeta:${seleccion.planeta.nombre}`;
  if (seleccion.tipo === "aspecto") {
    return `aspecto:${seleccion.aspecto.planeta1}:${seleccion.aspecto.planeta2}:${normalizarClave(seleccion.aspecto.tipo)}`;
  }
  if (seleccion.tipo === "casa") return `casa:${seleccion.casa.numero}`;
  if (seleccion.tipo === "triada") return `triada:${seleccion.subtipo}`;
  if (seleccion.categoria === "pulso") return "energia:pulso";
  if (seleccion.categoria === "elementos") return "energia:elementos";
  if (seleccion.categoria === "modalidades") return "energia:modalidades";
  return `energia:${seleccion.categoria}:${seleccion.nombre}`;
}

export function obtenerMetaPanelContextual(
  seleccion: SeleccionContextual,
  datos: CartaNatal,
) {
  if (seleccion.tipo === "energia") {
    const dist = calcularDistribucion(datos.planetas);

    if (seleccion.categoria === "pulso") {
      const [elementoDominante] = Object.entries(dist.elementos).sort((a, b) => b[1] - a[1])[0];
      const [modalidadDominante] = Object.entries(dist.modalidades).sort((a, b) => b[1] - a[1])[0];
      return {
        etiqueta: "Distribución energética",
        titulo: "Pulso dominante",
        subtitulo: `${elementoDominante} + ${modalidadDominante} como combinación base de tu carta.`,
      };
    }

    if (seleccion.categoria === "elementos") {
      return {
        etiqueta: "Distribución energética",
        titulo: "Elementos",
        subtitulo: "Cómo circula tu energía base entre fuego, tierra, aire y agua.",
      };
    }

    if (seleccion.categoria === "modalidades") {
      return {
        etiqueta: "Distribución energética",
        titulo: "Modalidades",
        subtitulo: "Cómo iniciás, sostenés o flexibilizás el movimiento en tu carta.",
      };
    }

    if (seleccion.categoria === "elemento") {
      return {
        etiqueta: "Elemento",
        titulo: seleccion.nombre,
        subtitulo: `${dist.elementos[seleccion.nombre]} planetas activan este registro en tu carta.`,
      };
    }

    return {
      etiqueta: "Modalidad",
      titulo: seleccion.nombre,
      subtitulo: `${dist.modalidades[seleccion.nombre]} planetas repiten esta forma de movimiento.`,
    };
  }

  if (seleccion.tipo === "planeta") {
    return {
      etiqueta: "Planeta",
      titulo: `${seleccion.planeta.nombre} en ${seleccion.planeta.signo}`,
      subtitulo: `Casa ${ROMANO[seleccion.planeta.casa]} · ${seleccion.planeta.grado_en_signo.toFixed(1)}°`,
    };
  }

  if (seleccion.tipo === "aspecto") {
    const clave = normalizarClave(seleccion.aspecto.tipo);
    const badge = BADGE_ASPECTO[clave];
    return {
      etiqueta: "Aspecto",
      titulo: `${seleccion.aspecto.planeta1} · ${badge?.label || seleccion.aspecto.tipo} · ${seleccion.aspecto.planeta2}`,
      subtitulo: `${seleccion.aspecto.aplicativo ? "Aplicativo" : "Separativo"} · Orbe ${seleccion.aspecto.orbe.toFixed(1)}°`,
    };
  }

  if (seleccion.tipo === "casa") {
    const regente = REGENTE_SIGNO[seleccion.casa.signo] || seleccion.casa.signo;
    return {
      etiqueta: "Casa",
      titulo: `Casa ${ROMANO[seleccion.casa.numero]} en ${seleccion.casa.signo}`,
      subtitulo: `${seleccion.casa.grado_en_signo.toFixed(1)}° · Regente ${regente}`,
    };
  }

  if (seleccion.tipo === "triada") {
    const sol = datos.planetas.find((planeta) => planeta.nombre === "Sol");
    const luna = datos.planetas.find((planeta) => planeta.nombre === "Luna");

    if (seleccion.subtipo === "sol" && sol) {
      return {
        etiqueta: "Tríada principal",
        titulo: `Sol en ${sol.signo}`,
        subtitulo: "Identidad, dirección y tono vital de tu lectura.",
      };
    }

    if (seleccion.subtipo === "luna" && luna) {
      return {
        etiqueta: "Tríada principal",
        titulo: `Luna en ${luna.signo}`,
        subtitulo: "Tu mundo emocional y la forma en que procesás lo vivido.",
      };
    }

    return {
      etiqueta: "Tríada principal",
      titulo: `Ascendente en ${datos.ascendente.signo}`,
      subtitulo: "La puerta de entrada de tu carta y tu presencia inicial.",
    };
  }

  return {
    etiqueta: "Lectura contextual",
    titulo: "Carta Astral",
    subtitulo: "Elegí un punto de tu carta para ampliar qué es y qué significa para vos.",
  };
}

export function PanelContextual({
  seleccion,
  datos,
  onCerrar,
  modo = "movil",
}: PanelContextualProps) {
  const mostrarDatosTecnicos =
    seleccion.tipo === "planeta" ||
    seleccion.tipo === "aspecto" ||
    seleccion.tipo === "casa";
  const [seleccionTecnicaActiva, setSeleccionTecnicaActiva] = useState<string | null>(null);
  const claveSeleccionTecnica =
    seleccion.tipo === "planeta"
      ? `planeta:${seleccion.planeta.nombre}`
      : seleccion.tipo === "aspecto"
        ? `aspecto:${seleccion.aspecto.planeta1}:${seleccion.aspecto.planeta2}:${seleccion.aspecto.tipo}`
        : seleccion.tipo === "casa"
          ? `casa:${seleccion.casa.numero}`
          : null;
  const mostrarTecnico =
    claveSeleccionTecnica !== null && seleccionTecnicaActiva === claveSeleccionTecnica;

  return (
    <div className="flex h-full min-h-0 flex-col text-white">
      <div className="flex-1 overflow-y-auto scroll-sutil">
        {seleccion.tipo === "default" && <VistaDefault datos={datos} modo={modo} />}
        {seleccion.tipo === "planeta" && (
          <VistaPlaneta
            planeta={seleccion.planeta}
            datos={datos}
            onCerrar={onCerrar}
            modo={modo}
          />
        )}
        {seleccion.tipo === "aspecto" && (
          <VistaAspecto aspecto={seleccion.aspecto} onCerrar={onCerrar} modo={modo} />
        )}
        {seleccion.tipo === "casa" && (
          <VistaCasa
            casa={seleccion.casa}
            datos={datos}
            onCerrar={onCerrar}
            modo={modo}
          />
        )}
        {seleccion.tipo === "triada" && (
          <VistaTriada
            subtipo={seleccion.subtipo}
            datos={datos}
            onCerrar={onCerrar}
            modo={modo}
          />
        )}
        {seleccion.tipo === "energia" && (
          <VistaEnergia
            seleccion={seleccion}
            datos={datos}
            onCerrar={onCerrar}
            modo={modo}
          />
        )}
      </div>

      {mostrarDatosTecnicos && (
        <div className="border-t border-white/10 bg-[#140c27]/72 backdrop-blur-xl">
          <button
            type="button"
            onClick={() =>
              setSeleccionTecnicaActiva((actual) =>
                actual === claveSeleccionTecnica ? null : claveSeleccionTecnica,
              )
            }
            className="flex w-full items-center justify-between px-5 py-3 text-[10px] font-medium uppercase tracking-[0.16em] text-violet-100/66 transition-colors hover:bg-white/[0.04]"
          >
            <span>Datos técnicos</span>
            <Icono nombre={mostrarTecnico ? "caretUp" : "caretDown"} tamaño={14} />
          </button>

          {mostrarTecnico && (
            <div className="space-y-1 px-5 pb-4 text-[11px] text-violet-100/70">
              {seleccion.tipo === "planeta" && (
                <>
                  <p>Longitud eclíptica: {seleccion.planeta.longitud.toFixed(4)}°</p>
                  <p>Latitud: {seleccion.planeta.latitud.toFixed(4)}°</p>
                  <p>Velocidad: {seleccion.planeta.velocidad.toFixed(4)}°/día</p>
                </>
              )}
              {seleccion.tipo === "aspecto" && (
                <>
                  <p>Ángulo exacto: {seleccion.aspecto.angulo_exacto.toFixed(4)}°</p>
                  <p>Orbe: {seleccion.aspecto.orbe.toFixed(4)}°</p>
                </>
              )}
              {seleccion.tipo === "casa" && (
                <>
                  <p>Grado absoluto: {seleccion.casa.grado.toFixed(4)}°</p>
                  <p>Grado en signo: {seleccion.casa.grado_en_signo.toFixed(4)}°</p>
                </>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function VistaDefault({
  datos,
  modo,
}: {
  datos: CartaNatal;
  modo: "movil" | "escritorio";
}) {
  const dist = calcularDistribucion(datos.planetas);
  const elementoDominante = Object.entries(dist.elementos).sort(
    (a, b) => b[1] - a[1],
  )[0];
  const modalidadDominante = Object.entries(dist.modalidades).sort(
    (a, b) => b[1] - a[1],
  )[0];

  if (modo === "escritorio") {
    return (
      <div className="p-5">
        <p className="text-[13px] leading-6 text-violet-100/62">
          Elegí un punto de tu carta para ver primero qué representa y luego qué
          significa específicamente para vos.
        </p>

        <div className="mt-4 grid gap-3">
          <div className={TARJETA_PANEL}>
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-violet-200/70">
              Elemento dominante
            </p>
            <div className="mt-2 flex items-center gap-2">
              <div
                className="h-3 w-3 rounded-full"
                style={{ backgroundColor: COLORES_ELEMENTO[elementoDominante[0]] }}
              />
              <p className="text-sm font-semibold text-white">{elementoDominante[0]}</p>
            </div>
            <p className="mt-1 text-[12px] text-violet-100/60">
              {elementoDominante[1]} planetas sostienen este tono.
            </p>
          </div>

          <div className={TARJETA_PANEL}>
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-violet-200/70">
              Modalidad dominante
            </p>
            <p className="mt-2 text-sm font-semibold text-white">{modalidadDominante[0]}</p>
            <p className="mt-1 text-[12px] text-violet-100/60">
              {modalidadDominante[1]} planetas repiten este patrón.
            </p>
          </div>

          <div className={TARJETA_PANEL}>
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-violet-200/70">
              Qué podés abrir
            </p>
            <div className="mt-3 space-y-2">
              {[
                "Tríada para leer identidad, emoción y presencia.",
                "Planetas para entender cómo se expresa cada función.",
                "Aspectos y casas para ubicar vínculos y escenarios.",
              ].map((item) => (
                <div
                  key={item}
                  className="rounded-2xl border border-white/10 bg-white/[0.05] px-3.5 py-3"
                >
                  <p className="text-[12px] leading-relaxed text-violet-50/82">
                    {item}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-5 lg:p-6">
      <div className="flex h-full flex-col">
        <div className="rounded-[24px] border border-white/10 bg-white/[0.08] p-5 backdrop-blur-xl">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.08] text-[#B388FF]">
            <Icono nombre="destello" tamaño={22} peso="fill" />
          </div>

          <p className={`${ETIQUETA_CARTA} mt-4 text-violet-200/72`}>
            Guía de lectura
          </p>
          <h2 className="mt-2 text-[20px] font-semibold tracking-tight text-white">
            Abrí un punto de tu carta
          </h2>
          <p className="mt-3 text-[13px] leading-relaxed text-violet-100/68">
            Cada bloque técnico es clickeable. Primero ves qué representa ese dato
            en astrología y luego cómo se manifiesta específicamente en tu carta.
          </p>
        </div>

        <div className="mt-4 grid gap-3">
          <div className={TARJETA_PANEL}>
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-violet-200/70">
              Elemento dominante
            </p>
            <div className="mt-2 flex items-center gap-2">
              <div
                className="h-3 w-3 rounded-full"
                style={{ backgroundColor: COLORES_ELEMENTO[elementoDominante[0]] }}
              />
              <p className="text-sm font-semibold text-white">{elementoDominante[0]}</p>
            </div>
            <p className="mt-1 text-[12px] text-violet-100/62">
              {elementoDominante[1]} planetas sostienen este tono.
            </p>
          </div>

          <div className={TARJETA_PANEL}>
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-violet-200/70">
              Modalidad dominante
            </p>
            <p className="mt-2 text-sm font-semibold text-white">{modalidadDominante[0]}</p>
            <p className="mt-1 text-[12px] text-violet-100/62">
              {modalidadDominante[1]} planetas repiten este patrón.
            </p>
          </div>

          <div className={TARJETA_PANEL}>
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-violet-200/70">
              Qué podés abrir
            </p>
            <div className="mt-3 grid gap-2">
              {[
                "Rueda y tríada para leer el mapa general.",
                "Planetas y aspectos para ver dinámica interna.",
                "Casas para ubicar dónde se juega cada tema.",
              ].map((item) => (
                <div key={item} className={TARJETA_PANEL_SUAVE}>
                  <p className="text-[12px] leading-relaxed text-violet-50/84">
                    {item}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function VistaEnergia({
  seleccion,
  datos,
  onCerrar,
  modo,
}: {
  seleccion: SeleccionEnergiaContextual;
  datos: CartaNatal;
  onCerrar: () => void;
  modo: "movil" | "escritorio";
}) {
  const lectura =
    seleccion.categoria === "pulso"
      ? obtenerLecturaPulso(datos)
      : seleccion.categoria === "elementos"
        ? obtenerLecturaElementos(datos)
        : seleccion.categoria === "modalidades"
          ? obtenerLecturaModalidades(datos)
          : seleccion.categoria === "elemento"
            ? obtenerLecturaElemento(seleccion.nombre, datos)
            : obtenerLecturaModalidad(seleccion.nombre, datos);

  const meta = obtenerMetaPanelContextual(seleccion, datos);

  return (
    <div className={modo === "escritorio" ? "p-5" : "p-5 lg:p-6"}>
      {modo === "movil" ? (
        <CabeceraPanel
          etiqueta={meta.etiqueta}
          titulo={meta.titulo}
          subtitulo={meta.subtitulo}
          onCerrar={onCerrar}
        />
      ) : null}

      <div className={`${modo === "movil" ? "mt-4 " : ""}${GRILLA_PANEL_METRICAS}`}>
        {lectura.metricas.map((item) => (
          <div key={item.etiqueta} className={TARJETA_PANEL_SUAVE}>
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-violet-200/70">
              {item.etiqueta}
            </p>
            <div className="mt-2 flex items-center gap-2">
              <div
                className="h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: item.color }}
              />
              <p className="text-[13px] font-semibold text-white">{item.valor}</p>
            </div>
            <p className="mt-2 text-[12px] leading-relaxed text-violet-100/64">
              {item.detalle}
            </p>
          </div>
        ))}
      </div>

      <div className="mt-4 space-y-3">
        <SeccionPanel titulo="Qué es" contenido={lectura.queEs} />
        <SeccionPanel titulo="En tu carta" contenido={lectura.enTuCarta} />
        <SeccionPanel titulo="Qué observar" contenido={lectura.observar} />
      </div>
    </div>
  );
}

function VistaPlaneta({
  planeta,
  datos,
  onCerrar,
  modo,
}: {
  planeta: Planeta;
  datos: CartaNatal;
  onCerrar: () => void;
  modo: "movil" | "escritorio";
}) {
  const elemento = ELEMENTO_SIGNO[planeta.signo] || "—";
  const modalidad = MODALIDAD_SIGNO[planeta.signo] || "—";
  const regente = REGENTE_SIGNO[planeta.signo] || "—";
  const colorPlaneta = COLORES_PLANETA[planeta.nombre] || "#7C4DFF";
  const narrativa = interpretarPlaneta(
    planeta.nombre,
    planeta.signo,
    planeta.casa,
    planeta.dignidad,
    planeta.retrogrado,
  );
  const aspectosRelacionados = datos.aspectos.filter(
    (aspecto) =>
      aspecto.planeta1 === planeta.nombre || aspecto.planeta2 === planeta.nombre,
  );
  const dignidadClave = planeta.dignidad ? normalizarClave(planeta.dignidad) : null;
  const dignidad = dignidadClave ? DIGNIDAD_BADGE[dignidadClave] : null;
  const resumenGeneral =
    ARQUETIPO_PLANETA[planeta.nombre]
      ? `${planeta.nombre} representa ${ARQUETIPO_PLANETA[planeta.nombre]}.`
      : `${planeta.nombre} señala una función importante dentro de tu carta.`;

  return (
    <div className={modo === "escritorio" ? "p-5" : "p-5 lg:p-6"}>
      {modo === "movil" ? (
        <CabeceraPanel
          etiqueta="Planeta"
          titulo={`${planeta.nombre} en ${planeta.signo}`}
          subtitulo={`Casa ${ROMANO[planeta.casa]} · ${planeta.grado_en_signo.toFixed(1)}°`}
          onCerrar={onCerrar}
        />
      ) : null}

      <div className={`${modo === "movil" ? "mt-4 " : ""}flex items-center gap-3 rounded-[24px] border border-white/10 bg-white/[0.08] p-4`}>
        <div
          className="flex h-14 w-14 items-center justify-center rounded-2xl border"
          style={{
            backgroundColor: `${colorPlaneta}22`,
            borderColor: `${colorPlaneta}55`,
            color: colorPlaneta,
          }}
        >
          <IconoSigno signo={planeta.signo} tamaño={28} />
        </div>

        <div>
          <p className="text-sm font-semibold text-white">{planeta.signo}</p>
          <p className="mt-1 text-[12px] text-violet-100/62">
            {planeta.retrogrado ? "Movimiento retrógrado" : "Movimiento directo"}
          </p>
        </div>
      </div>

      <div className={`mt-4 ${GRILLA_PANEL_METRICAS}`}>
        {[
          { etiqueta: "Elemento", valor: elemento },
          { etiqueta: "Modalidad", valor: modalidad },
          { etiqueta: "Regente", valor: regente },
        ].map((item) => (
          <div key={item.etiqueta} className={TARJETA_PANEL_SUAVE}>
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-violet-200/70">
              {item.etiqueta}
            </p>
            <p className="mt-2 text-[13px] font-semibold text-white">{item.valor}</p>
          </div>
        ))}
      </div>

      {planeta.dignidad && (
        <div className="mt-4">
          <div className={TARJETA_PANEL}>
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-violet-200/70">
              Dignidad
            </p>
            <div className="mt-2">
              {dignidad ? (
                <span
                  className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-medium ${dignidad.bg} ${dignidad.text}`}
                >
                  {planeta.dignidad}
                </span>
              ) : (
                <span className="text-sm text-white">{planeta.dignidad}</span>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="mt-4 space-y-3">
        <SeccionPanel titulo="Qué es" contenido={resumenGeneral} />
        <SeccionPanel titulo="En tu carta" contenido={narrativa} />
        <SeccionPanel
          titulo="Qué observar"
          contenido={obtenerObservacionPlaneta(planeta, datos)}
        />
      </div>

      {aspectosRelacionados.length > 0 && (
        <div className="mt-4">
          <div className={TARJETA_PANEL}>
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-violet-200/70">
              Aspectos vinculados
            </p>
            <div className="mt-3 grid gap-2">
              {aspectosRelacionados.map((aspecto, idx) => {
                const clave = normalizarClave(aspecto.tipo);
                const badge = BADGE_ASPECTO[clave];
                const simbolo = SIMBOLOS_ASPECTO[clave] || "·";
                const otroPlaneta =
                  aspecto.planeta1 === planeta.nombre
                    ? aspecto.planeta2
                    : aspecto.planeta1;

                return (
                  <div
                    key={`${aspecto.planeta1}-${aspecto.planeta2}-${idx}`}
                    className={TARJETA_PANEL_SUAVE}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-[12px] font-medium text-white">
                        {simbolo} {otroPlaneta}
                      </p>
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] text-violet-100/62">
                          {aspecto.orbe.toFixed(1)}°
                        </span>
                        {badge && (
                          <span
                            className={`rounded-full px-2 py-1 text-[10px] font-medium ${badge.bg} ${badge.text}`}
                          >
                            {badge.label}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function VistaAspecto({
  aspecto,
  onCerrar,
  modo,
}: {
  aspecto: Aspecto;
  onCerrar: () => void;
  modo: "movil" | "escritorio";
}) {
  const clave = normalizarClave(aspecto.tipo);
  const badge = BADGE_ASPECTO[clave];
  const narrativa = interpretarAspecto(
    aspecto.planeta1,
    aspecto.planeta2,
    aspecto.tipo,
    aspecto.orbe,
    aspecto.aplicativo,
  );

  return (
    <div className={modo === "escritorio" ? "p-5" : "p-5 lg:p-6"}>
      {modo === "movil" ? (
        <CabeceraPanel
          etiqueta="Aspecto"
          titulo={`${aspecto.planeta1} · ${badge?.label || aspecto.tipo} · ${aspecto.planeta2}`}
          subtitulo={`${aspecto.aplicativo ? "Aplicativo" : "Separativo"} · Orbe ${aspecto.orbe.toFixed(1)}°`}
          onCerrar={onCerrar}
        />
      ) : null}

      <div className={`${modo === "movil" ? "mt-4 " : ""}${GRILLA_PANEL_METRICAS}`}>
        {[
          { etiqueta: "Planeta 1", valor: aspecto.planeta1 },
          { etiqueta: "Aspecto", valor: badge?.label || aspecto.tipo },
          { etiqueta: "Planeta 2", valor: aspecto.planeta2 },
        ].map((item) => (
          <div key={item.etiqueta} className={TARJETA_PANEL_SUAVE}>
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-violet-200/70">
              {item.etiqueta}
            </p>
            <p className="mt-2 text-[13px] font-semibold text-white">{item.valor}</p>
          </div>
        ))}
      </div>

      <div className="mt-4 space-y-3">
        <SeccionPanel titulo="Qué es" contenido={obtenerResumenAspecto(aspecto)} />
        <SeccionPanel titulo="En tu carta" contenido={narrativa} />
        <SeccionPanel
          titulo="Qué observar"
          contenido={obtenerObservacionAspecto(aspecto)}
        />
      </div>

      <div className="mt-4">
        <div className={TARJETA_PANEL}>
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-violet-200/70">
            Clave del vínculo
          </p>
          <p className="mt-2 text-[13px] leading-relaxed text-violet-50/88">
            {NARRATIVA_ASPECTO[clave] ||
              "Estas dos energías forman una dinámica relevante dentro de tu carta."}
          </p>
        </div>
      </div>
    </div>
  );
}

function VistaCasa({
  casa,
  datos,
  onCerrar,
  modo,
}: {
  casa: Casa;
  datos: CartaNatal;
  onCerrar: () => void;
  modo: "movil" | "escritorio";
}) {
  const planetasEnCasa = datos.planetas
    .filter((planeta) => planeta.casa === casa.numero)
    .map((planeta) => planeta.nombre);
  const regente = REGENTE_SIGNO[casa.signo] || casa.signo;
  const narrativa = interpretarCasa(casa.numero, casa.signo, planetasEnCasa);
  const resumenGeneral = `La Casa ${ROMANO[casa.numero]} abarca ${
    TEMA_CASA[casa.numero] || "un territorio importante de experiencia"
  }.`;

  return (
    <div className={modo === "escritorio" ? "p-5" : "p-5 lg:p-6"}>
      {modo === "movil" ? (
        <CabeceraPanel
          etiqueta="Casa"
          titulo={`Casa ${ROMANO[casa.numero]} en ${casa.signo}`}
          subtitulo={`${casa.grado_en_signo.toFixed(1)}° · Regente ${regente}`}
          onCerrar={onCerrar}
        />
      ) : null}

      <div className={`${modo === "movil" ? "mt-4 " : ""}flex items-center gap-3 rounded-[24px] border border-white/10 bg-white/[0.08] p-4`}>
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.08] text-[#B388FF]">
          <IconoSigno signo={casa.signo} tamaño={28} />
        </div>
        <div>
          <p className="text-sm font-semibold text-white">{casa.signo}</p>
          <p className="mt-1 text-[12px] text-violet-100/62">
            Cúspide de la Casa {ROMANO[casa.numero]}
          </p>
        </div>
      </div>

      <div className={`mt-4 ${GRILLA_PANEL_METRICAS}`}>
        {[
          { etiqueta: "Regente", valor: regente },
          { etiqueta: "Planetas", valor: String(planetasEnCasa.length) },
          { etiqueta: "Grado", valor: `${casa.grado_en_signo.toFixed(1)}°` },
        ].map((item) => (
          <div key={item.etiqueta} className={TARJETA_PANEL_SUAVE}>
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-violet-200/70">
              {item.etiqueta}
            </p>
            <p className="mt-2 text-[13px] font-semibold text-white">{item.valor}</p>
          </div>
        ))}
      </div>

      <div className="mt-4 space-y-3">
        <SeccionPanel titulo="Qué es" contenido={resumenGeneral} />
        <SeccionPanel titulo="En tu carta" contenido={narrativa} />
        <SeccionPanel
          titulo="Qué observar"
          contenido={obtenerObservacionCasa(casa, planetasEnCasa)}
        />
      </div>

      {planetasEnCasa.length > 0 && (
        <div className="mt-4">
          <div className={TARJETA_PANEL}>
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-violet-200/70">
              Planetas presentes
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {planetasEnCasa.map((nombre) => (
                <span
                  key={nombre}
                  className="rounded-full border border-white/10 bg-white/[0.08] px-3 py-1.5 text-[11px] font-medium text-white"
                >
                  {nombre}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function VistaTriada({
  subtipo,
  datos,
  onCerrar,
  modo,
}: {
  subtipo: "sol" | "luna" | "ascendente";
  datos: CartaNatal;
  onCerrar: () => void;
  modo: "movil" | "escritorio";
}) {
  const sol = datos.planetas.find((planeta) => planeta.nombre === "Sol")!;
  const luna = datos.planetas.find((planeta) => planeta.nombre === "Luna")!;
  const narrativa = interpretarTriada(
    sol.signo,
    sol.casa,
    luna.signo,
    luna.casa,
    datos.ascendente.signo,
  );

  const titulo =
    subtipo === "sol"
      ? `Sol en ${sol.signo}`
      : subtipo === "luna"
        ? `Luna en ${luna.signo}`
        : `Ascendente en ${datos.ascendente.signo}`;

  const detalle =
    subtipo === "sol"
      ? interpretarPlaneta("Sol", sol.signo, sol.casa, sol.dignidad, sol.retrogrado)
      : subtipo === "luna"
        ? interpretarPlaneta("Luna", luna.signo, luna.casa, luna.dignidad, luna.retrogrado)
        : `Tu Ascendente en ${datos.ascendente.signo} define la primera impresión que generás y el filtro inicial con el que entrás en la experiencia.`;

  return (
    <div className={modo === "escritorio" ? "p-5" : "p-5 lg:p-6"}>
      {modo === "movil" ? (
        <CabeceraPanel
          etiqueta="Tríada principal"
          titulo={titulo}
          subtitulo="La identidad, la emoción y la presencia son el eje más visible de tu carta."
          onCerrar={onCerrar}
        />
      ) : null}

      <div className={`${modo === "movil" ? "mt-4 " : ""}grid gap-3`}>
        <SeccionPanel titulo="Qué es" contenido={obtenerDefinicionTriada(subtipo)} />
        <SeccionPanel titulo="En tu carta" contenido={detalle} />
        <SeccionPanel
          titulo="Lectura integrada"
          contenido={narrativa}
        />
      </div>

      <div className={`mt-4 ${GRILLA_PANEL_METRICAS}`}>
        {[
          { etiqueta: "Sol", valor: sol.signo },
          { etiqueta: "Luna", valor: luna.signo },
          { etiqueta: "Ascendente", valor: datos.ascendente.signo },
        ].map((item) => (
          <div key={item.etiqueta} className={TARJETA_PANEL_SUAVE}>
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-violet-200/70">
              {item.etiqueta}
            </p>
            <p className="mt-2 text-[13px] font-semibold text-white">{item.valor}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
