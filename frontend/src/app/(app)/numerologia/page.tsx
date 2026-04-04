"use client";

import { useState, useEffect, useRef, type FormEvent } from "react";
import HeaderMobile from "@/componentes/layouts/header-mobile";
import { RailLateral } from "@/componentes/layouts/rail-lateral";
import { Boton } from "@/componentes/ui/boton";
import { Esqueleto } from "@/componentes/ui/esqueleto";
import { Icono } from "@/componentes/ui/icono";
import {
  IconoAstral,
  type NombreIconoAstral,
} from "@/componentes/ui/icono-astral";
import { Input } from "@/componentes/ui/input";
import { PanelContextualNumerologia, type DetalleNumerologia } from "@/componentes/numerologia/panel-contextual-numerologia";
import { usarNumerologia, usarMisCalculos } from "@/lib/hooks";
import { usarEsMobile } from "@/lib/hooks/usar-es-mobile";
import type {
  DatosNumerologia,
  EtapaVida,
  MesPersonalItem,
  Numerologia,
  NumeroRespuesta,
} from "@/lib/tipos";
import { cn } from "@/lib/utilidades/cn";

const NUMEROS_MAESTROS = [11, 22, 33];
const NUMERO_VACIO_DEFAULT: NumeroRespuesta = { numero: 0, descripcion: "—" };

type ClaveNumero =
  | "camino_de_vida"
  | "expresion"
  | "impulso_del_alma"
  | "personalidad"
  | "numero_nacimiento"
  | "anio_personal"
  | "mes_personal"
  | "dia_personal";

interface MetaNumero {
  titulo: string;
  subtitulo: string;
  categoria: string;
  icono: NombreIconoAstral;
  queEs: string;
  formula: string;
}

const META_NUMERO: Record<ClaveNumero, MetaNumero> = {
  camino_de_vida: {
    titulo: "Sendero Natal",
    subtitulo: "La ruta central que abrís con tu fecha de nacimiento.",
    categoria: "Núcleo",
    icono: "carrera",
    queEs:
      "Es la línea base de tu carta. Se obtiene desde tu fecha de nacimiento y muestra la dirección que más orden te da, las lecciones que se repiten y la forma en la que creces con más sentido.",
    formula:
      "Se calcula reduciendo día, mes y año de nacimiento por separado, y después sumando esos tres valores hasta obtener un dígito o un número maestro.",
  },
  expresion: {
    titulo: "Destino / Misión",
    subtitulo: "Cómo tu identidad se organiza para hacer algo concreto en el mundo.",
    categoria: "Misión",
    icono: "libro",
    queEs:
      "Surge de tu nombre completo y describe la forma en que tus talentos se combinan para construir una obra, una contribución o un estilo de impacto.",
    formula:
      "Se obtiene sumando el valor numérico de todas las letras del nombre completo según el sistema elegido y reduciendo el resultado.",
  },
  impulso_del_alma: {
    titulo: "Esencia",
    subtitulo: "Lo que te mueve por dentro cuando nadie te está mirando.",
    categoria: "Interior",
    icono: "emocion",
    queEs:
      "Se relaciona con tu deseo profundo. Muestra qué necesitás sentir para estar alineado y desde qué motivación íntima tomás decisiones más honestas.",
    formula:
      "Se calcula usando únicamente las vocales de tu nombre completo y reduciendo el total según el sistema pitagórico o caldeo.",
  },
  personalidad: {
    titulo: "Imagen",
    subtitulo: "La impresión inicial y el modo en que tu energía entra en relación.",
    categoria: "Vínculo",
    icono: "personal",
    queEs:
      "Describe la envoltura visible de tu energía: la primera lectura que los demás hacen de vos, tu estilo de presencia y la forma en que abrís vínculo.",
    formula:
      "Se obtiene sumando únicamente las consonantes del nombre completo y reduciendo el valor final.",
  },
  numero_nacimiento: {
    titulo: "Día de Nacimiento",
    subtitulo: "Tu talento inmediato, el tono que traés de fábrica.",
    categoria: "Don",
    icono: "suerte",
    queEs:
      "Se lee desde el día del mes en que naciste. Funciona como un talento visible y recurrente, algo que suele aparecer rápido cuando entrás en acción.",
    formula:
      "Se calcula reduciendo el día de nacimiento a un dígito o conservando un número maestro cuando corresponde.",
  },
  anio_personal: {
    titulo: "Año Personal",
    subtitulo: "La atmósfera grande que ordena este ciclo anual.",
    categoria: "Ritmo actual",
    icono: "horoscopo",
    queEs:
      "Marca el tono general del período anual vigente. No te dice cada detalle, pero sí en qué tipo de experiencia estás parado y qué conviene priorizar.",
    formula:
      "Se suma el día y mes de nacimiento con la vibración numerológica del año actual, reduciendo el resultado.",
  },
  mes_personal: {
    titulo: "Mes Personal",
    subtitulo: "El clima del tramo actual dentro de tu año personal.",
    categoria: "Ritmo actual",
    icono: "horoscopo",
    queEs:
      "Refina el año personal y muestra qué tema toma protagonismo durante este mes. Sirve para afinar decisiones, prioridades y expectativas.",
    formula:
      "Se calcula sumando el número del año personal con el número del mes calendario actual y reduciendo el resultado.",
  },
  dia_personal: {
    titulo: "Día Personal",
    subtitulo: "La vibración puntual con la que amanecés hoy.",
    categoria: "Ritmo actual",
    icono: "bola-cristal",
    queEs:
      "Es la lectura más concreta del momento. Te ayuda a entender qué energía está más activa hoy y qué decisiones pueden fluir mejor.",
    formula:
      "Se obtiene sumando el mes personal con el día calendario actual y reduciendo el total.",
  },
};

const NOMBRES_MES_CORTO = [
  "", "Ene", "Feb", "Mar", "Abr", "May", "Jun",
  "Jul", "Ago", "Sep", "Oct", "Nov", "Dic",
];
const FONDO_NUMEROLOGIA =
  "relative min-h-full lg:h-full lg:min-h-0 lg:overflow-hidden";
const SUPERFICIE_HERO_NUMEROLOGIA =
  "tema-superficie-panel relative overflow-hidden rounded-[24px]";
const SUPERFICIE_PANEL_NUMEROLOGIA =
  "tema-superficie-panel rounded-[24px]";
const ESTILO_FONDO_NUMEROLOGIA = {
  background: "var(--shell-fondo)",
} as const;
const ESTILO_PANEL_NUMEROLOGIA = {
  borderColor: "var(--shell-borde)",
  background: "var(--shell-superficie)",
} as const;
const ESTILO_PANEL_NUMEROLOGIA_SUAVE = {
  borderColor: "var(--shell-borde)",
  background: "var(--shell-superficie-suave)",
} as const;
const ESTILO_BADGE_VIOLETA = {
  borderColor: "var(--shell-badge-violeta-borde)",
  background: "var(--shell-badge-violeta-fondo)",
  color: "var(--shell-badge-violeta-texto)",
} as const;

function FondoNumerologia() {
  return (
    <>
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(circle_at_top_left, var(--shell-glow-1), transparent 28%), radial-gradient(circle_at_top_right, var(--shell-glow-2), transparent 24%)",
        }}
      />
      <div
        className="pointer-events-none absolute right-[-120px] top-24 h-72 w-72 rounded-full blur-3xl"
        style={{ background: "var(--shell-glow-2)" }}
      />
      <div
        className="pointer-events-none absolute left-10 top-[640px] h-64 w-64 rounded-full blur-3xl"
        style={{ background: "var(--shell-glow-1)" }}
      />
    </>
  );
}

function calcularEdad(fechaNacimiento: string): number {
  const hoy = new Date();
  const nacimiento = new Date(fechaNacimiento);
  let edad = hoy.getFullYear() - nacimiento.getFullYear();
  const mesDiff = hoy.getMonth() - nacimiento.getMonth();
  if (mesDiff < 0 || (mesDiff === 0 && hoy.getDate() < nacimiento.getDate())) {
    edad--;
  }
  return edad;
}

/** Reducción pitagórica preservando maestros 11, 22, 33. */
function reducir(n: number): number {
  while (n > 9 && n !== 11 && n !== 22 && n !== 33) {
    n = String(n).split("").reduce((s, d) => s + Number(d), 0);
  }
  return n;
}

const DESC_NUMERO: Record<number, string> = {
  1: "Liderazgo, independencia, inicio",
  2: "Cooperación, diplomacia, equilibrio",
  3: "Expresión, creatividad, comunicación",
  4: "Estructura, disciplina, construcción",
  5: "Libertad, aventura, cambio",
  6: "Responsabilidad, armonía, servicio",
  7: "Análisis, espiritualidad, introspección",
  8: "Poder, abundancia, logro material",
  9: "Humanitarismo, compasión, culminación",
  11: "Intuición elevada, inspiración, canal",
  22: "Constructor maestro, visión, materialización",
  33: "Maestro sanador, compasión universal, guía",
};

/** Recalcula año, mes y día personal en tiempo real. */
function recalcularRitmo(fechaNacStr: string) {
  const nac = new Date(fechaNacStr + "T12:00:00");
  const hoy = new Date();

  const dia = reducir(nac.getDate());
  const mes = reducir(nac.getMonth() + 1);
  const anioDigitos = String(hoy.getFullYear()).split("").reduce((s, d) => s + Number(d), 0);
  const anioPersonal = reducir(dia + mes + reducir(anioDigitos));
  const mesPersonal = reducir(anioPersonal + (hoy.getMonth() + 1));
  const diaPersonal = reducir(mesPersonal + hoy.getDate());

  return {
    anio: { numero: anioPersonal, descripcion: DESC_NUMERO[anioPersonal] ?? "" },
    mes: { numero: mesPersonal, descripcion: DESC_NUMERO[mesPersonal] ?? "" },
    dia: { numero: diaPersonal, descripcion: DESC_NUMERO[diaPersonal] ?? "" },
  };
}

function obtenerPrimerNombre(nombre: string) {
  return nombre.trim().split(/\s+/)[0] ?? nombre;
}

function crearDetalleNumero(
  clave: ClaveNumero,
  dato: NumeroRespuesta,
  datos: Numerologia,
): DetalleNumerologia {
  const meta = META_NUMERO[clave];

  return {
    categoria: meta.categoria,
    clave,
    titulo: meta.titulo,
    subtitulo: meta.subtitulo,
    numero: dato.numero,
    descripcion: dato.descripcion,
    descripcion_larga: dato.descripcion_larga,
    queEs: meta.queEs,
    significadoPersonal: construirSignificadoPersonal(clave, dato, datos),
    formula: meta.formula,
    esMaestro: NUMEROS_MAESTROS.includes(dato.numero),
    icono: meta.icono,
  };
}

function crearDetalleMes(
  item: MesPersonalItem,
  datos: Numerologia,
): DetalleNumerologia {
  return {
    categoria: "Ritmo actual",
    clave: `mes:${item.mes}`,
    titulo: `Mes Personal — ${item.nombre_mes}`,
    subtitulo: `Lectura mensual dentro de tu año personal ${(datos.anio_personal ?? NUMERO_VACIO_DEFAULT).numero}.`,
    numero: item.numero,
    descripcion: item.descripcion,
    queEs:
      "El mes personal muestra cuál es el tema más activo dentro del período anual que estás atravesando. Sirve para entender foco, timing y tono emocional.",
    significadoPersonal:
      `En ${item.nombre_mes}, tu carta vibra en ${item.numero}. ${item.descripcion}. Leelo como el tema dominante del mes dentro de tu año personal ${(datos.anio_personal ?? NUMERO_VACIO_DEFAULT).numero}.`,
    formula:
      "Se toma el número del año personal y se le suma el número del mes calendario. Después se reduce el resultado.",
    esMaestro: NUMEROS_MAESTROS.includes(item.numero),
    icono: "horoscopo",
    extra:
      item.mes === new Date().getMonth() + 1
        ? "Este es tu mes activo ahora mismo."
        : "Usalo como referencia para planificar el tono de ese mes dentro del año.",
  };
}

function crearDetalleEtapa(
  etapa: EtapaVida,
  indice: number,
  edadActual: number,
): DetalleNumerologia {
  const activa =
    edadActual >= etapa.edad_inicio &&
    (etapa.edad_fin === null || edadActual < etapa.edad_fin);
  const pasada = etapa.edad_fin !== null && edadActual >= etapa.edad_fin;

  return {
    categoria: "Etapas de vida",
    clave: `etapa:${indice}`,
    titulo: etapa.nombre || `Pináculo ${indice + 1}`,
    subtitulo: `De ${etapa.edad_inicio} a ${etapa.edad_fin ?? "∞"} años.`,
    numero: etapa.numero,
    descripcion: etapa.descripcion,
    descripcion_larga: etapa.descripcion_larga,
    queEs:
      "Las etapas de vida muestran grandes ciclos de aprendizaje. Cada una organiza un período amplio y cambia el tipo de experiencias que se vuelven más insistentes.",
    significadoPersonal:
      activa
        ? `Hoy estás viviendo la vibración ${etapa.numero}. ${etapa.descripcion}. Este es el número que más ordena tu momento vital actual.`
        : pasada
          ? `Esta etapa estuvo regida por el número ${etapa.numero}. ${etapa.descripcion}. Conviene leerla como un aprendizaje ya transitado que todavía deja marca.`
          : `Más adelante vas a entrar en una etapa ${etapa.numero}. ${etapa.descripcion}. Es un tramo que todavía se está preparando en tu recorrido.`,
    formula:
      "Las etapas se calculan combinando mes, día y año de nacimiento en cuatro pináculos sucesivos, cada uno con su rango de edad.",
    esMaestro: NUMEROS_MAESTROS.includes(etapa.numero),
    icono: "libro",
    extra: activa
      ? `Ésta es tu etapa activa con ${edadActual} años.`
      : pasada
        ? "Esta etapa ya quedó atrás."
        : `Esta etapa empieza a los ${etapa.edad_inicio} años.`,
  };
}

function construirSignificadoPersonal(
  clave: ClaveNumero,
  dato: NumeroRespuesta,
  datos: Numerologia,
) {
  switch (clave) {
    case "camino_de_vida":
      return `En tu carta, el sendero natal está vibrando en ${dato.numero}. ${dato.descripcion_larga || dato.descripcion} Esta es la ruta que más sentido te devuelve cuando sentís dispersión o exceso de ruido.`;
    case "expresion":
      return `Tu misión visible se organiza con el número ${dato.numero}. ${dato.descripcion_larga || dato.descripcion} Esto habla de cómo conviene ordenar tus talentos para producir impacto real.`;
    case "impulso_del_alma":
      return `Tu esencia íntima vibra en ${dato.numero}. ${dato.descripcion_larga || dato.descripcion} Cuando esa necesidad interna no está atendida, el resto de la carta se siente más forzado.`;
    case "personalidad":
      return `La primera impresión que tu energía deja en otros está teñida por el número ${dato.numero}. ${dato.descripcion_larga || dato.descripcion} Esta es la puerta por la que tu presencia entra en el vínculo.`;
    case "numero_nacimiento":
      return `Tu don inmediato aparece con el número ${dato.numero}. ${dato.descripcion_larga || dato.descripcion} Es un talento que suele activarse rápido, incluso cuando todavía no tenés todo claro.`;
    case "anio_personal":
      return `Tu año actual se mueve con el número ${dato.numero}. ${dato.descripcion_larga || dato.descripcion} Leé el resto de tus decisiones grandes desde este clima general.`;
    case "mes_personal":
      return `El mes actual toma la vibración ${dato.numero}. ${dato.descripcion_larga || dato.descripcion} Esto afina el foco del año y muestra qué conviene priorizar en este tramo.`;
    case "dia_personal":
      return `${obtenerPrimerNombre(datos.nombre)}, hoy tu carta late en ${dato.numero}. ${dato.descripcion_larga || dato.descripcion} Úsalo como brújula breve para decidir tono, timing y energía del día.`;
    default:
      return dato.descripcion_larga || dato.descripcion;
  }
}

function construirTituloHero(datos: Numerologia) {
  return `${obtenerPrimerNombre(datos.nombre)}, tu carta abre un sendero ${datos.camino_de_vida.numero} y una misión ${datos.expresion.numero}.`;
}

function normalizarNumerologia(datos: Numerologia): Numerologia {
  return {
    ...datos,
    camino_de_vida: datos.camino_de_vida ?? NUMERO_VACIO_DEFAULT,
    expresion: datos.expresion ?? NUMERO_VACIO_DEFAULT,
    impulso_del_alma: datos.impulso_del_alma ?? NUMERO_VACIO_DEFAULT,
    personalidad: datos.personalidad ?? NUMERO_VACIO_DEFAULT,
    numero_nacimiento: datos.numero_nacimiento ?? NUMERO_VACIO_DEFAULT,
    anio_personal: datos.anio_personal ?? NUMERO_VACIO_DEFAULT,
    mes_personal: datos.mes_personal ?? NUMERO_VACIO_DEFAULT,
    dia_personal: datos.dia_personal ?? NUMERO_VACIO_DEFAULT,
    meses_personales: Array.isArray(datos.meses_personales)
      ? datos.meses_personales
      : [],
    etapas_de_la_vida: Array.isArray(datos.etapas_de_la_vida)
      ? datos.etapas_de_la_vida
      : [],
    numeros_maestros_presentes: Array.isArray(datos.numeros_maestros_presentes)
      ? datos.numeros_maestros_presentes
      : [],
  };
}


export default function PaginaNumerologia() {
  const mutacion = usarNumerologia();
  const { data: calculos, isLoading: cargandoCalculos } = usarMisCalculos();
  const esMobile = usarEsMobile();

  const [datosManual, setDatosManual] = useState<Numerologia | null>(null);
  const [modoManual] = useState(false);
  const [detalle, setDetalle] = useState<DetalleNumerologia | null>(null);
  const [detalleMovilAbierto, setDetalleMovilAbierto] = useState(false);
  const [mesesExpandido, setMesesExpandido] = useState(false);

  const [nombre, setNombre] = useState("");
  const [fechaNacimiento, setFechaNacimiento] = useState("");
  const [sistema, setSistema] = useState<"pitagorico" | "caldeo">("pitagorico");

  const datosRaw =
    datosManual ?? (calculos?.numerologia as Numerologia | null) ?? null;
  const datos = datosRaw?.camino_de_vida?.numero !== undefined
    ? normalizarNumerologia(datosRaw)
    : null;

  function manejarEnvio(e: FormEvent) {
    e.preventDefault();
    const payload: DatosNumerologia = {
      nombre,
      fecha_nacimiento: fechaNacimiento,
      sistema,
    };

    mutacion.mutate(
      { datos: payload },
      {
        onSuccess: (resultado) => {
          setDatosManual(resultado);
          setDetalle(null);
          setDetalleMovilAbierto(false);
        },
      },
    );
  }

  const datosActuales = datos ? normalizarNumerologia(datos) : null;

  // Auto-recalcular si los datos persistidos no tienen etapas (versión vieja)
  const yaRecalculo = useRef(false);
  const datosIncompletos = Boolean(
    datosActuales && !datosActuales.etapas_de_la_vida?.length && !datosManual,
  );

  useEffect(() => {
    if (!datosActuales || !datosIncompletos || yaRecalculo.current || mutacion.isPending) {
      return;
    }

    yaRecalculo.current = true;
    mutacion.mutate(
      {
        datos: {
          nombre: datosActuales.nombre,
          fecha_nacimiento: datosActuales.fecha_nacimiento,
          sistema: (datosActuales.sistema as "pitagorico" | "caldeo") || "pitagorico",
        },
      },
      {
        onSuccess: (resultado) => {
          setDatosManual(resultado);
        },
      },
    );
  }, [datosActuales, datosIncompletos, mutacion]);

  if (cargandoCalculos && !modoManual) {
    return (
      <>
        <HeaderMobile titulo="Numerología" mostrarAtras />
        <section className={`${FONDO_NUMEROLOGIA} flex-1 overflow-y-auto scroll-sutil`} style={ESTILO_FONDO_NUMEROLOGIA}>
          <FondoNumerologia />
          <div className="relative mx-auto max-w-6xl px-5 py-8 lg:px-7">
            <div className="grid gap-5 lg:grid-cols-[minmax(0,1.2fr)_420px]">
              <Esqueleto className="h-[280px] rounded-[32px] bg-[var(--shell-superficie)]" />
              <Esqueleto className="h-[280px] rounded-[32px] bg-[var(--shell-superficie)]" />
            </div>
            <div className="mt-8 space-y-6">
              <Esqueleto className="h-[220px] rounded-[32px] bg-[var(--shell-superficie)]" />
              <Esqueleto className="h-[300px] rounded-[32px] bg-[var(--shell-superficie)]" />
              <Esqueleto className="h-[260px] rounded-[32px] bg-[var(--shell-superficie)]" />
            </div>
          </div>
        </section>
      </>
    );
  }

  if (!datosActuales || modoManual) {
    return (
      <>
        <HeaderMobile titulo="Numerología" mostrarAtras />
        <section className={`${FONDO_NUMEROLOGIA} flex-1 overflow-y-auto scroll-sutil`} style={ESTILO_FONDO_NUMEROLOGIA}>
          <FondoNumerologia />

          <div className="relative mx-auto max-w-6xl px-5 py-8 lg:px-7">
            <div className="grid gap-6 lg:grid-cols-[minmax(0,1.15fr)_420px]">
              <section className={`${SUPERFICIE_HERO_NUMEROLOGIA} px-6 py-6 sm:px-7 sm:py-7`}>
                <div
                  className="absolute -right-16 top-0 h-40 w-40 rounded-full blur-3xl"
                  style={{ background: "var(--shell-glow-2)" }}
                />
                <div
                  className="absolute -left-8 bottom-0 h-32 w-32 rounded-full blur-3xl"
                  style={{ background: "var(--shell-glow-1)" }}
                />

                <span
                  className="relative z-10 inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.18em]"
                  style={ESTILO_BADGE_VIOLETA}
                >
                  <IconoAstral nombre="numerologia" tamaño={14} className="text-current" />
                  Lectura numerológica
                </span>

                <div className="relative z-10 mt-5 flex items-start gap-4">
                  <div className="hidden h-14 w-14 shrink-0 items-center justify-center rounded-[20px] bg-gradient-to-br from-violet-500 to-violet-300 shadow-[var(--shell-sombra-fuerte)] sm:flex">
                    <IconoAstral nombre="numerologia" tamaño={30} className="text-white" />
                  </div>
                  <div>
                    <h1 className="text-[24px] font-semibold tracking-[-0.03em] text-[color:var(--shell-texto)] sm:text-[28px]">
                      Una lectura compacta de tu estructura y tu ritmo.
                    </h1>
                    <p className="mt-3 max-w-xl text-[14px] leading-6 text-[color:var(--shell-texto-secundario)]">
                      Calculá núcleo, ritmo y etapas en una sola lectura y abrí detalle solo donde realmente lo necesites.
                    </p>
                  </div>
                </div>
              </section>

              <section className={`${SUPERFICIE_PANEL_NUMEROLOGIA} p-6`}>
                <div className="mb-5">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[color:var(--color-acento)]">
                    Carta base
                  </p>
                  <h2 className="mt-2 text-[20px] font-semibold tracking-[-0.03em] text-[color:var(--shell-texto)]">
                    Calculá tu lectura
                  </h2>
                  <p className="mt-2 text-[14px] leading-6 text-[color:var(--shell-texto-secundario)]">
                    Nombre, fecha y sistema. El resto lo abre el panel contextual.
                  </p>
                </div>

                <form onSubmit={manejarEnvio} className="flex flex-col gap-4">
                  <Input
                    etiqueta="Nombre completo"
                    type="text"
                    placeholder="Nombre completo"
                    icono={<Icono nombre="usuario" tamaño={18} />}
                    value={nombre}
                    onChange={(e) => setNombre(e.target.value)}
                    required
                  />
                  <Input
                    etiqueta="Fecha de nacimiento"
                    type="date"
                    icono={<Icono nombre="calendario" tamaño={18} />}
                    value={fechaNacimiento}
                    onChange={(e) => setFechaNacimiento(e.target.value)}
                    required
                  />
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[13px] font-medium text-[color:var(--shell-texto-secundario)]">
                      Sistema de cálculo
                    </label>
                    <div className="flex gap-3">
                      {(["pitagorico", "caldeo"] as const).map((valor) => (
                        <button
                          key={valor}
                          type="button"
                          onClick={() => setSistema(valor)}
                          className={cn(
                            "flex-1 rounded-xl border px-4 py-2.5 text-sm font-medium transition-colors",
                            sistema === valor
                              ? "text-[color:var(--shell-badge-violeta-texto)]"
                              : "text-[color:var(--shell-texto-secundario)] hover:text-[color:var(--shell-texto)]",
                          )}
                          style={
                            sistema === valor
                              ? ESTILO_BADGE_VIOLETA
                              : ESTILO_PANEL_NUMEROLOGIA_SUAVE
                          }
                        >
                          {valor === "pitagorico" ? "Pitagórico" : "Caldeo"}
                        </button>
                      ))}
                    </div>
                  </div>

                  <Boton
                    type="submit"
                    variante="primario"
                    tamaño="lg"
                    cargando={mutacion.isPending}
                    icono={<IconoAstral nombre="numerologia" tamaño={20} className="text-current" />}
                    className="mt-2 w-full"
                  >
                    Calcular carta
                  </Boton>
                </form>

                {mutacion.isError && (
                  <div className="mt-4 rounded-2xl border border-error/20 bg-error/10 px-4 py-3">
                    <p className="text-[14px] text-error">
                      {mutacion.error?.message ?? "Error al calcular la numerología."}
                    </p>
                  </div>
                )}
              </section>
            </div>
          </div>
        </section>
      </>
    );
  }

  const etapasDeVida: EtapaVida[] = Array.isArray(datosActuales.etapas_de_la_vida)
    ? datosActuales.etapas_de_la_vida
    : [];
  const edadActual = calcularEdad(datosActuales.fecha_nacimiento);
  const mesActual = new Date().getMonth() + 1;
  const mesesPersonales: MesPersonalItem[] = Array.isArray(datosActuales.meses_personales)
    ? datosActuales.meses_personales
    : [];
  const numerosMaestros: number[] = Array.isArray(datosActuales.numeros_maestros_presentes)
    ? datosActuales.numeros_maestros_presentes
    : [];

  const detalleClave = detalle?.clave ?? null;

  const senderoNatal = datosActuales.camino_de_vida ?? NUMERO_VACIO_DEFAULT;
  const destinoMision = datosActuales.expresion ?? NUMERO_VACIO_DEFAULT;
  const esencia = datosActuales.impulso_del_alma ?? NUMERO_VACIO_DEFAULT;
  const imagen = datosActuales.personalidad ?? NUMERO_VACIO_DEFAULT;
  const nacimiento = datosActuales.numero_nacimiento ?? NUMERO_VACIO_DEFAULT;
  // Recalcular ritmo en tiempo real (los datos persistidos pueden estar desactualizados)
  const ritmoActual = recalcularRitmo(datosActuales.fecha_nacimiento);
  const anioPersonal: NumeroRespuesta = ritmoActual.anio.numero
    ? ritmoActual.anio
    : (datosActuales.anio_personal ?? NUMERO_VACIO_DEFAULT);
  const mesPersonal: NumeroRespuesta = ritmoActual.mes.numero
    ? ritmoActual.mes
    : (datosActuales.mes_personal ?? NUMERO_VACIO_DEFAULT);
  const diaPersonal: NumeroRespuesta = ritmoActual.dia.numero
    ? ritmoActual.dia
    : (datosActuales.dia_personal ?? NUMERO_VACIO_DEFAULT);

  function seleccionarDetalle(nuevoDetalle: DetalleNumerologia) {
    setDetalle(nuevoDetalle);
    if (esMobile) {
      setDetalleMovilAbierto(true);
    }
  }

  function abrirNumero(clave: ClaveNumero, dato: NumeroRespuesta) {
    seleccionarDetalle(crearDetalleNumero(clave, dato, datosActuales!));
  }

  function abrirMes(item: MesPersonalItem) {
    seleccionarDetalle(crearDetalleMes(item, datosActuales!));
  }

  function abrirEtapa(etapa: EtapaVida, indice: number) {
    seleccionarDetalle(crearDetalleEtapa(etapa, indice, edadActual));
  }

  function cerrarDetalleMovil() {
    setDetalleMovilAbierto(false);
  }

  const nucleoDatos: { clave: ClaveNumero; dato: NumeroRespuesta }[] = [
    { clave: "camino_de_vida", dato: senderoNatal },
    { clave: "expresion", dato: destinoMision },
    { clave: "impulso_del_alma", dato: esencia },
    { clave: "personalidad", dato: imagen },
    { clave: "numero_nacimiento", dato: nacimiento },
  ];

  const celdasRitmo: { clave: ClaveNumero; dato: NumeroRespuesta; etiqueta: string; destacada?: boolean }[] = [
    { clave: "dia_personal", dato: diaPersonal, etiqueta: "Día Personal", destacada: true },
    { clave: "mes_personal", dato: mesPersonal, etiqueta: "Mes Personal" },
    { clave: "anio_personal", dato: anioPersonal, etiqueta: "Año Personal" },
  ];

  const contenidoPrincipal = (
    <div className="relative min-h-full overflow-hidden" style={ESTILO_FONDO_NUMEROLOGIA}>
      <FondoNumerologia />

      <div className="relative mx-auto flex max-w-5xl flex-col gap-5 px-5 py-6 pb-24 lg:px-7 lg:pb-6">
        <section className={`${SUPERFICIE_HERO_NUMEROLOGIA} px-5 py-4 sm:px-6 sm:py-5`}>
          <div
            className="absolute -right-10 top-0 h-32 w-32 rounded-full blur-3xl"
            style={{ background: "var(--shell-glow-2)" }}
          />
          <div
            className="absolute left-0 top-12 h-20 w-20 rounded-full blur-3xl"
            style={{ background: "var(--shell-glow-1)" }}
          />

          <div className="relative z-10 flex items-start gap-3">
            <div className="hidden h-12 w-12 shrink-0 items-center justify-center rounded-[18px] bg-gradient-to-br from-violet-500 to-violet-300 shadow-[var(--shell-sombra-fuerte)] sm:flex">
              <IconoAstral nombre="numerologia" tamaño={24} className="text-white" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[color:var(--color-acento)]">
                Carta numerológica
              </p>
              <h1 className="mt-2 text-[22px] font-semibold tracking-[-0.04em] text-[color:var(--shell-texto)] sm:text-[24px]">
                {construirTituloHero(datosActuales)}
              </h1>
              <p className="mt-3 text-[12px] leading-5 text-[color:var(--shell-texto-secundario)]">
                {datosActuales.sistema === "pitagorico" ? "Sistema pitagórico" : "Sistema caldeo"}
                {numerosMaestros.length > 0 ? ` · Maestros ${numerosMaestros.join(", ")}` : ""}
              </p>
            </div>
          </div>

          <p className="relative z-10 mt-3 max-w-3xl text-[13px] leading-6 text-[color:var(--shell-texto-secundario)]">
            Tocá cualquier número para abrir su lectura completa en el panel derecho.
          </p>
        </section>

        {/* ── Núcleo ── */}
        <section>
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-[color:var(--shell-texto-tenue)]">
            Núcleo
          </p>
          <div className="overflow-hidden rounded-2xl border" style={ESTILO_PANEL_NUMEROLOGIA}>
            {nucleoDatos.map(({ clave, dato }, idx) => {
              const meta = META_NUMERO[clave];
              const maestro = NUMEROS_MAESTROS.includes(dato.numero);
              const seleccionado = detalleClave === clave;

              return (
                <button
                  key={clave}
                  onClick={() => abrirNumero(clave, dato)}
                  className={cn(
                    "group flex w-full items-center gap-3 border-l-2 px-4 py-3 text-left transition-all duration-200",
                    idx > 0 && "border-t",
                    !seleccionado && "border-l-transparent hover:bg-[var(--shell-superficie-suave)]",
                  )}
                  style={{
                    animationDelay: `${idx * 40}ms`,
                    ...(idx > 0 ? { borderTopColor: "var(--shell-borde)" } : {}),
                    ...(seleccionado
                      ? {
                          borderLeftColor: "var(--color-acento)",
                          background: "var(--shell-chip)",
                        }
                      : {}),
                  }}
                >
                  <span
                    className={cn(
                      "shrink-0 text-[28px] font-semibold leading-none tracking-[-0.04em]",
                      maestro ? "text-dorado-500" : "text-[color:var(--color-acento)]",
                    )}
                    style={{ minWidth: "2.2rem", textAlign: "center" }}
                  >
                    {dato.numero}
                  </span>

                  <span className="min-w-0 flex-1">
                    <span className="block text-[14px] font-semibold text-[color:var(--shell-texto)]">
                      {meta.titulo}
                    </span>
                    <span className="block text-[13px] leading-5 text-[color:var(--shell-texto-secundario)]">
                      {meta.subtitulo}
                    </span>
                  </span>

                  <Icono
                    nombre="caretDerecha"
                    tamaño={14}
                    className="shrink-0 text-[color:var(--shell-texto-tenue)] transition-colors group-hover:text-[color:var(--shell-texto)]"
                  />
                </button>
              );
            })}
          </div>
        </section>

        {/* ── Ritmo actual ── */}
        <section>
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-[color:var(--shell-texto-tenue)]">
            Ritmo actual
          </p>

          {/* 3-cell console */}
          <div className="overflow-hidden rounded-2xl border" style={ESTILO_PANEL_NUMEROLOGIA}>
            <div className="grid grid-cols-3 divide-x divide-[var(--shell-borde)]">
              {celdasRitmo.map(({ clave, dato, etiqueta, destacada }) => {
                const seleccionado = detalleClave === clave;

                return (
                  <button
                    key={clave}
                    onClick={() => abrirNumero(clave, dato)}
                    className={cn(
                      "group relative flex flex-col items-center gap-1.5 py-4 px-2 transition-all duration-200",
                      !seleccionado && "hover:bg-[var(--shell-superficie-suave)]",
                    )}
                    style={seleccionado ? { background: "var(--shell-chip)" } : undefined}
                  >
                    {destacada && (
                      <div
                        className="pointer-events-none absolute inset-0"
                        style={{
                          background:
                            "radial-gradient(circle_at_center, var(--shell-glow-1), transparent 70%)",
                        }}
                      />
                    )}
                    <span
                      className={cn(
                        "relative font-semibold tracking-[-0.04em] text-[color:var(--color-acento)] leading-none",
                        destacada ? "text-[36px]" : "text-[26px]",
                      )}
                    >
                      {dato.numero}
                    </span>
                    <span className="relative text-[12px] font-semibold text-[color:var(--shell-texto-secundario)]">
                      {etiqueta}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Expandable months bar */}
          {mesesPersonales.length > 0 && (
            <div className="mt-2 overflow-hidden rounded-2xl border" style={ESTILO_PANEL_NUMEROLOGIA}>
              <button
                onClick={() => setMesesExpandido((v) => !v)}
                className="flex w-full items-center justify-between px-4 py-2.5 text-[12px] font-medium text-[color:var(--shell-texto-secundario)] transition-colors hover:text-[color:var(--shell-texto)]"
              >
                <span>Ver 12 meses</span>
                <Icono
                  nombre={mesesExpandido ? "caretArriba" : "caretAbajo"}
                  tamaño={14}
                  className="text-current"
                />
              </button>

              {mesesExpandido && (
                <div className="border-t px-3 py-3" style={{ borderColor: "var(--shell-borde)" }}>
                  <div className="flex gap-1.5 overflow-x-auto scroll-sutil sm:grid sm:grid-cols-6 sm:overflow-x-visible lg:grid-cols-12">
                    {mesesPersonales.map((item) => {
                      const esActual = item.mes === mesActual;
                      const seleccionado = detalleClave === `mes:${item.mes}`;

                      return (
                        <button
                          key={item.mes}
                          onClick={() => abrirMes(item)}
                          className={cn(
                            "flex min-w-[52px] flex-col items-center rounded-xl border px-2 py-2 transition-all duration-150",
                            !seleccionado && !esActual && "hover:bg-[var(--shell-superficie-suave)]",
                          )}
                          style={
                            seleccionado
                              ? ESTILO_BADGE_VIOLETA
                              : esActual
                                ? ESTILO_PANEL_NUMEROLOGIA
                                : ESTILO_PANEL_NUMEROLOGIA_SUAVE
                          }
                        >
                          <span className="flex items-center gap-1 text-[11px] font-medium uppercase text-[color:var(--shell-texto-secundario)]">
                            {esActual && (
                              <span className="inline-block h-1.5 w-1.5 rounded-full bg-[color:var(--color-acento)]" />
                            )}
                            {NOMBRES_MES_CORTO[item.mes] || item.nombre_mes.slice(0, 3)}
                          </span>
                          <span
                            className={cn(
                              "mt-0.5 text-[16px] font-semibold leading-none",
                              esActual || seleccionado
                                ? "text-[color:var(--color-acento)]"
                                : "text-[color:var(--shell-texto)]",
                            )}
                          >
                            {item.numero}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </section>

        {/* ── Etapas ── */}
        <section>
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-[color:var(--shell-texto-tenue)]">
            Etapas
          </p>

          {etapasDeVida.length > 0 ? (
            <div className="overflow-x-auto scroll-sutil rounded-2xl border px-4 py-5 sm:px-6" style={ESTILO_PANEL_NUMEROLOGIA}>
              {/* Timeline line + nodes */}
              <div className="relative flex items-start justify-between" style={{ minWidth: `${Math.max(etapasDeVida.length * 100, 280)}px` }}>
                {/* Connecting line background */}
                <div
                  className="pointer-events-none absolute left-0 right-0 top-[18px] h-px"
                  style={{ background: "var(--shell-borde)" }}
                />

                {/* Active segment overlay */}
                {(() => {
                  const indiceActiva = etapasDeVida.findIndex(
                    (e) => edadActual >= e.edad_inicio && (e.edad_fin === null || edadActual < e.edad_fin),
                  );
                  if (indiceActiva < 0) return null;
                  const pct = (indiceActiva / Math.max(etapasDeVida.length - 1, 1)) * 100;
                  return (
                    <div
                      className="pointer-events-none absolute left-0 top-[18px] h-px"
                      style={{
                        background: "var(--shell-badge-violeta-borde)",
                        width: `${pct}%`,
                      }}
                    />
                  );
                })()}

                {etapasDeVida.map((etapa, indice) => {
                  const activa =
                    edadActual >= etapa.edad_inicio &&
                    (etapa.edad_fin === null || edadActual < etapa.edad_fin);
                  const pasada =
                    etapa.edad_fin !== null && edadActual >= etapa.edad_fin;
                  const maestro = NUMEROS_MAESTROS.includes(etapa.numero);
                  const seleccionado = detalleClave === `etapa:${indice}`;
                  const primerFrase = etapa.descripcion?.split(". ")[0] ?? "";

                  return (
                    <button
                      key={`${etapa.numero}-${indice}`}
                      onClick={() => abrirEtapa(etapa, indice)}
                      className={cn(
                        "group relative flex min-w-[110px] flex-1 flex-col items-center gap-1.5 px-2 transition-all duration-200",
                        pasada && !seleccionado && "opacity-50",
                      )}
                    >
                      {/* Node circle */}
                      <div
                        className={cn(
                          "relative z-10 flex h-10 w-10 items-center justify-center rounded-full border-2 text-[17px] font-semibold transition-all duration-200",
                          "group-hover:border-[color:var(--color-acento)]",
                        )}
                        style={{
                          borderColor: activa
                            ? "var(--shell-badge-violeta-borde)"
                            : maestro && !activa
                              ? "rgba(212, 162, 52, 0.35)"
                              : "var(--shell-borde)",
                          background: activa
                            ? "var(--shell-chip)"
                            : pasada
                              ? "var(--shell-superficie-suave)"
                              : "var(--shell-superficie)",
                          color: activa
                            ? "var(--shell-badge-violeta-texto)"
                            : pasada
                              ? "var(--shell-texto-tenue)"
                              : "var(--shell-texto-secundario)",
                          boxShadow: activa || seleccionado
                            ? "var(--shell-sombra-suave)"
                            : undefined,
                        }}
                      >
                        <span className={cn(maestro ? "text-dorado-500" : "")}>
                          {etapa.numero}
                        </span>
                      </div>

                      {/* "Ahora" chip */}
                      {activa && (
                        <span
                          className="rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.1em]"
                          style={ESTILO_BADGE_VIOLETA}
                        >
                          Ahora
                        </span>
                      )}

                      {/* Name */}
                      <span className="text-[12px] font-semibold text-[color:var(--shell-texto)]">
                        {etapa.nombre || `Pináculo ${indice + 1}`}
                      </span>

                      {/* Age range */}
                      <span className="text-[10px] text-[color:var(--shell-texto-tenue)]">
                        {etapa.edad_inicio}–{etapa.edad_fin ?? "∞"} años
                      </span>

                      {primerFrase ? (
                        <span className="mt-0.5 max-w-[130px] text-center text-[11px] leading-4 text-[color:var(--shell-texto-tenue)]">
                          {primerFrase}.
                        </span>
                      ) : null}
                    </button>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="rounded-2xl border px-4 py-4" style={ESTILO_PANEL_NUMEROLOGIA}>
              <p className="text-[13px] text-[color:var(--shell-texto-secundario)]">
                Etapas no disponibles. Recalculá la numerología para generar los pináculos.
              </p>
            </div>
          )}
        </section>

      </div>
    </div>
  );

  const etiquetaPanel = detalle?.categoria ?? "Numerología";
  const tituloPanel = detalle?.titulo ?? "Seleccioná un número";
  const subtituloPanel = detalle?.subtitulo;

  return (
    <div className={FONDO_NUMEROLOGIA} style={ESTILO_FONDO_NUMEROLOGIA}>
      <FondoNumerologia />
      <HeaderMobile titulo="Numerología" mostrarAtras />

      <div className="relative z-10 flex min-h-full flex-col lg:h-full lg:min-h-0 lg:flex-row lg:overflow-hidden">
        {/* Mobile — scroll simple */}
        <div className="lg:hidden flex-1 overflow-y-auto scroll-sutil">
          {contenidoPrincipal}
        </div>

        {/* Desktop — contenido + rail lateral fijo */}
        <div className="hidden lg:flex flex-1 min-h-0">
          <section className="min-w-0 flex-1 overflow-y-auto scroll-sutil-dark">
            {contenidoPrincipal}
          </section>

          <RailLateral
            etiqueta={etiquetaPanel}
            titulo={tituloPanel}
            subtitulo={subtituloPanel}
            onCerrar={detalle ? () => setDetalle(null) : undefined}
            cuerpoClassName="!p-0 overflow-hidden"
            claveContenido={detalleClave ?? "default"}
          >
            <div className="h-full min-h-0">
              <PanelContextualNumerologia detalle={detalle} datos={datosActuales} />
            </div>
          </RailLateral>
        </div>
      </div>

      {esMobile && detalleMovilAbierto && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end lg:hidden">
          <button
            onClick={cerrarDetalleMovil}
            className="absolute inset-0"
            style={{ background: "var(--shell-overlay-suave)" }}
            aria-label="Cerrar detalle"
          />
          <div className="tema-superficie-panel relative max-h-[82vh] overflow-y-auto rounded-t-[28px] border-t">
            <div
              className="sticky top-0 z-10 flex justify-center rounded-t-[28px] pt-3 pb-2"
              style={{ background: "var(--shell-superficie-fuerte)" }}
            >
              <div className="h-1 w-10 rounded-full" style={{ background: "var(--shell-borde-fuerte)" }} />
            </div>
            <PanelContextualNumerologia
              detalle={detalle}
              datos={datosActuales}
              onCerrar={cerrarDetalleMovil}
              modo="mobile"
            />
          </div>
        </div>
      )}
    </div>
  );
}
