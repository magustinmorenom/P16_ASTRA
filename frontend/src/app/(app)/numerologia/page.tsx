"use client";

import { useState, type FormEvent } from "react";
import {
  Panel,
  Group as PanelGroup,
  Separator as PanelResizeHandle,
} from "react-resizable-panels";

import HeaderMobile from "@/componentes/layouts/header-mobile";
import { Boton } from "@/componentes/ui/boton";
import { Badge } from "@/componentes/ui/badge";
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
    categoria: "Capítulo 1 · Núcleo",
    icono: "carrera",
    queEs:
      "Es la línea base de tu carta. Se obtiene desde tu fecha de nacimiento y muestra la dirección que más orden te da, las lecciones que se repiten y la forma en la que creces con más sentido.",
    formula:
      "Se calcula reduciendo día, mes y año de nacimiento por separado, y después sumando esos tres valores hasta obtener un dígito o un número maestro.",
  },
  expresion: {
    titulo: "Destino / Misión",
    subtitulo: "Cómo tu identidad se organiza para hacer algo concreto en el mundo.",
    categoria: "Capítulo 1 · Misión",
    icono: "libro",
    queEs:
      "Surge de tu nombre completo y describe la forma en que tus talentos se combinan para construir una obra, una contribución o un estilo de impacto.",
    formula:
      "Se obtiene sumando el valor numérico de todas las letras del nombre completo según el sistema elegido y reduciendo el resultado.",
  },
  impulso_del_alma: {
    titulo: "Esencia",
    subtitulo: "Lo que te mueve por dentro cuando nadie te está mirando.",
    categoria: "Capítulo 1 · Interior",
    icono: "emocion",
    queEs:
      "Se relaciona con tu deseo profundo. Muestra qué necesitás sentir para estar alineado y desde qué motivación íntima tomás decisiones más honestas.",
    formula:
      "Se calcula usando únicamente las vocales de tu nombre completo y reduciendo el total según el sistema pitagórico o caldeo.",
  },
  personalidad: {
    titulo: "Imagen",
    subtitulo: "La impresión inicial y el modo en que tu energía entra en relación.",
    categoria: "Capítulo 1 · Vínculo",
    icono: "personal",
    queEs:
      "Describe la envoltura visible de tu energía: la primera lectura que los demás hacen de vos, tu estilo de presencia y la forma en que abrís vínculo.",
    formula:
      "Se obtiene sumando únicamente las consonantes del nombre completo y reduciendo el valor final.",
  },
  numero_nacimiento: {
    titulo: "Día de Nacimiento",
    subtitulo: "Tu talento inmediato, el tono que traés de fábrica.",
    categoria: "Capítulo 1 · Don",
    icono: "suerte",
    queEs:
      "Se lee desde el día del mes en que naciste. Funciona como un talento visible y recurrente, algo que suele aparecer rápido cuando entrás en acción.",
    formula:
      "Se calcula reduciendo el día de nacimiento a un dígito o conservando un número maestro cuando corresponde.",
  },
  anio_personal: {
    titulo: "Año Personal",
    subtitulo: "La atmósfera grande que ordena este ciclo anual.",
    categoria: "Capítulo 2 · Ritmo actual",
    icono: "horoscopo",
    queEs:
      "Marca el tono general del período anual vigente. No te dice cada detalle, pero sí en qué tipo de experiencia estás parado y qué conviene priorizar.",
    formula:
      "Se suma el día y mes de nacimiento con la vibración numerológica del año actual, reduciendo el resultado.",
  },
  mes_personal: {
    titulo: "Mes Personal",
    subtitulo: "El clima del tramo actual dentro de tu año personal.",
    categoria: "Capítulo 2 · Ritmo actual",
    icono: "horoscopo",
    queEs:
      "Refina el año personal y muestra qué tema toma protagonismo durante este mes. Sirve para afinar decisiones, prioridades y expectativas.",
    formula:
      "Se calcula sumando el número del año personal con el número del mes calendario actual y reduciendo el resultado.",
  },
  dia_personal: {
    titulo: "Día Personal",
    subtitulo: "La vibración puntual con la que amanecés hoy.",
    categoria: "Capítulo 2 · Ritmo actual",
    icono: "bola-cristal",
    queEs:
      "Es la lectura más concreta del momento. Te ayuda a entender qué energía está más activa hoy y qué decisiones pueden fluir mejor.",
    formula:
      "Se obtiene sumando el mes personal con el día calendario actual y reduciendo el total.",
  },
};

const CAPITULOS = [
  { id: "capitulo-nucleo", etiqueta: "Núcleo y misión" },
  { id: "capitulo-ritmo", etiqueta: "Ritmo actual" },
  { id: "capitulo-etapas", etiqueta: "Etapas de vida" },
];

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

function obtenerPrimerNombre(nombre: string) {
  return nombre.trim().split(/\s+/)[0] ?? nombre;
}

function resumirDescripcion(texto: string) {
  if (!texto) return "—";
  const [primera] = texto.split(". ");
  return primera.endsWith(".") ? primera : `${primera}.`;
}

function navegarA(id: string) {
  document.getElementById(id)?.scrollIntoView({
    behavior: "smooth",
    block: "start",
  });
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
    categoria: "Capítulo 2 · Ritmo actual",
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
    categoria: "Capítulo 3 · Etapas de vida",
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
          : `Más adelante vas a entrar en una etapa ${etapa.numero}. ${etapa.descripcion}. Es un capítulo que todavía se está preparando en tu recorrido.`,
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

function obtenerEtapaActiva(
  etapas: EtapaVida[] | undefined,
  edadActual: number,
) {
  const etapasSeguras = Array.isArray(etapas) ? etapas : [];
  return etapasSeguras.find((etapa) =>
    edadActual >= etapa.edad_inicio &&
    (etapa.edad_fin === null || edadActual < etapa.edad_fin),
  );
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

function TarjetaNumero({
  dato,
  meta,
  onClick,
  seleccionada,
  destacada = false,
}: {
  dato: NumeroRespuesta;
  meta: MetaNumero;
  onClick: () => void;
  seleccionada: boolean;
  destacada?: boolean;
}) {
  const maestro = NUMEROS_MAESTROS.includes(dato.numero);

  return (
    <button
      onClick={onClick}
      className={cn(
        "group rounded-[28px] border text-left transition-all duration-200",
        destacada ? "p-6" : "p-5",
        seleccionada
          ? "border-[#B388FF]/36 bg-[#7C4DFF]/12 shadow-[0_18px_40px_rgba(124,77,255,0.18)]"
          : "border-white/[0.08] bg-[linear-gradient(180deg,rgba(255,255,255,0.08),rgba(255,255,255,0.03))] hover:border-white/16 hover:bg-white/[0.06]",
      )}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/46">
            {meta.categoria}
          </p>
          <h3 className={cn(
            "mt-3 font-semibold tracking-[-0.02em] text-white",
            destacada ? "text-2xl" : "text-lg",
          )}>
            {meta.titulo}
          </h3>
          <p className="mt-2 max-w-sm text-[14px] leading-6 text-white/60">
            {meta.subtitulo}
          </p>
        </div>
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[#7C4DFF]/12 text-[#D9C2FF]">
          <IconoAstral nombre={meta.icono} tamaño={24} className="text-current" />
        </div>
      </div>

      <div className="mt-6 flex items-end justify-between gap-4">
        <div>
          <p className={cn(
            "font-semibold tracking-[-0.04em] leading-none",
            destacada ? "text-[64px]" : "text-[46px]",
            maestro ? "text-[#F0D68A]" : "text-[#D9C2FF]",
          )}>
            {dato.numero}
          </p>
          <p className="mt-3 text-[14px] leading-6 text-white/74">
            {resumirDescripcion(dato.descripcion_larga || dato.descripcion)}
          </p>
        </div>
        <div className="flex items-center gap-2 self-end text-[12px] font-medium text-white/42 transition-colors group-hover:text-white/72">
          <span>Abrir lectura</span>
          <Icono nombre="caretDerecha" tamaño={14} />
        </div>
      </div>

      {maestro && (
        <Badge variante="advertencia" className="mt-4">
          Número Maestro
        </Badge>
      )}
    </button>
  );
}

function TarjetaCiclo({
  titulo,
  etiqueta,
  dato,
  onClick,
  seleccionada,
  destacada = false,
}: {
  titulo: string;
  etiqueta: string;
  dato: NumeroRespuesta;
  onClick: () => void;
  seleccionada: boolean;
  destacada?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "rounded-[28px] border p-5 text-left transition-all duration-200",
        seleccionada
          ? "border-[#B388FF]/36 bg-[#7C4DFF]/12 shadow-[0_18px_40px_rgba(124,77,255,0.18)]"
          : "border-white/[0.08] bg-[linear-gradient(180deg,rgba(255,255,255,0.08),rgba(255,255,255,0.03))] hover:border-white/16 hover:bg-white/[0.06]",
      )}
    >
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/46">
        {etiqueta}
      </p>
      <h3 className="mt-3 text-lg font-semibold tracking-[-0.02em] text-white">
        {titulo}
      </h3>
      <p className={cn(
        "mt-4 font-semibold tracking-[-0.04em] text-[#D9C2FF] leading-none",
        destacada ? "text-[64px]" : "text-[42px]",
      )}>
        {dato.numero}
      </p>
      <p className="mt-3 text-[14px] leading-6 text-white/66">
        {dato.descripcion}
      </p>
      <div className="mt-5 flex items-center gap-2 text-[12px] font-medium text-white/42">
        <span>Ver lectura</span>
        <Icono nombre="caretDerecha" tamaño={14} />
      </div>
    </button>
  );
}

function TarjetaMes({
  item,
  activa,
  seleccionada,
  onClick,
}: {
  item: MesPersonalItem;
  activa: boolean;
  seleccionada: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "rounded-2xl border px-2 py-3 text-center transition-all duration-200",
        seleccionada
          ? "border-[#B388FF]/36 bg-[#7C4DFF]/12 shadow-[0_10px_20px_rgba(124,77,255,0.14)]"
          : activa
            ? "border-[#B388FF]/24 bg-white/[0.08]"
            : "border-white/[0.08] bg-white/[0.04] hover:border-white/16 hover:bg-white/[0.06]",
      )}
    >
      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-white/46">
        {item.nombre_mes.slice(0, 3)}
      </p>
      <p className={cn(
        "mt-1 text-2xl font-semibold tracking-[-0.03em]",
        activa ? "text-[#D9C2FF]" : "text-white/82",
      )}>
        {item.numero}
      </p>
      {activa && <div className="mx-auto mt-2 h-1.5 w-1.5 rounded-full bg-[#B388FF]" />}
    </button>
  );
}

function TarjetaEtapa({
  etapa,
  indice,
  seleccionada,
  activa,
  edadActual,
  onClick,
}: {
  etapa: EtapaVida;
  indice: number;
  seleccionada: boolean;
  activa: boolean;
  edadActual: number;
  onClick: () => void;
}) {
  const maestro = NUMEROS_MAESTROS.includes(etapa.numero);
  const pasada = etapa.edad_fin !== null && edadActual >= etapa.edad_fin;

  return (
    <button
      onClick={onClick}
      className={cn(
        "rounded-[28px] border p-5 text-left transition-all duration-200",
        seleccionada
          ? "border-[#B388FF]/36 bg-[#7C4DFF]/12 shadow-[0_18px_40px_rgba(124,77,255,0.18)]"
          : "border-white/[0.08] bg-[linear-gradient(180deg,rgba(255,255,255,0.08),rgba(255,255,255,0.03))] hover:border-white/16 hover:bg-white/[0.06]",
        pasada && "opacity-55",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/46">
            Capítulo {indice + 1}
          </p>
          <h3 className="mt-3 text-lg font-semibold tracking-[-0.02em] text-white">
            {etapa.nombre || `Pináculo ${indice + 1}`}
          </h3>
        </div>
        <div className="flex gap-2">
          {activa && <Badge variante="info">Ahora</Badge>}
          {maestro && <Badge variante="advertencia">Maestro</Badge>}
        </div>
      </div>

      <div className="mt-5 flex items-end justify-between gap-4">
        <div>
          <p className={cn(
            "text-[56px] font-semibold tracking-[-0.04em] leading-none",
            maestro ? "text-[#F0D68A]" : "text-[#D9C2FF]",
          )}>
            {etapa.numero}
          </p>
          <p className="mt-3 text-[13px] text-white/56">
            {etapa.edad_inicio} a {etapa.edad_fin ?? "∞"} años
          </p>
        </div>
        <div className="text-right">
          <p className="text-[13px] leading-6 text-white/62">
            {resumirDescripcion(etapa.descripcion_larga || etapa.descripcion)}
          </p>
        </div>
      </div>
    </button>
  );
}

export default function PaginaNumerologia() {
  const mutacion = usarNumerologia();
  const { data: calculos, isLoading: cargandoCalculos } = usarMisCalculos();
  const esMobile = usarEsMobile();

  const [datosManual, setDatosManual] = useState<Numerologia | null>(null);
  const [modoManual, setModoManual] = useState(false);
  const [detalle, setDetalle] = useState<DetalleNumerologia | null>(null);
  const [detalleMovilAbierto, setDetalleMovilAbierto] = useState(false);

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

  if (cargandoCalculos && !modoManual) {
    return (
      <>
        <HeaderMobile titulo="Numerología" mostrarAtras />
        <section className="relative flex-1 overflow-y-auto scroll-sutil bg-[#16011b]">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-72 bg-[radial-gradient(circle_at_top_left,rgba(124,77,255,0.24),transparent_44%)]" />
          <div className="relative mx-auto max-w-6xl px-5 py-8 lg:px-7">
            <div className="grid gap-5 lg:grid-cols-[minmax(0,1.2fr)_420px]">
              <Esqueleto className="h-[280px] rounded-[32px] bg-white/[0.06]" />
              <Esqueleto className="h-[280px] rounded-[32px] bg-white/[0.06]" />
            </div>
            <div className="mt-8 space-y-6">
              <Esqueleto className="h-[220px] rounded-[32px] bg-white/[0.06]" />
              <Esqueleto className="h-[300px] rounded-[32px] bg-white/[0.06]" />
              <Esqueleto className="h-[260px] rounded-[32px] bg-white/[0.06]" />
            </div>
          </div>
        </section>
      </>
    );
  }

  if (!datos || modoManual) {
    return (
      <>
        <HeaderMobile titulo="Numerología" mostrarAtras />
        <section className="relative flex-1 overflow-y-auto scroll-sutil bg-[#16011b]">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-80 bg-[radial-gradient(circle_at_top_left,rgba(124,77,255,0.24),transparent_44%)]" />
          <div className="pointer-events-none absolute right-[-120px] top-24 h-72 w-72 rounded-full bg-[#B388FF]/10 blur-3xl" />

          <div className="relative mx-auto max-w-6xl px-5 py-8 lg:px-7">
            <div className="grid gap-6 lg:grid-cols-[minmax(0,1.15fr)_420px]">
              <section className="rounded-[32px] border border-white/[0.08] bg-[radial-gradient(circle_at_top_left,rgba(179,136,255,0.2),transparent_32%),linear-gradient(135deg,rgba(45,27,105,0.96),rgba(22,1,27,0.98))] px-6 py-7 shadow-[0_24px_70px_rgba(8,2,22,0.38)] sm:px-8 sm:py-8">
                <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.08] px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-white/72">
                  <IconoAstral nombre="numerologia" tamaño={14} className="text-current" />
                  Lectura numerológica
                </span>

                <div className="mt-5 flex items-start gap-4">
                  <div className="hidden h-16 w-16 shrink-0 items-center justify-center rounded-[24px] bg-gradient-to-br from-[#7C4DFF] via-[#9C6DFF] to-[#D4A234] shadow-[0_18px_40px_rgba(34,12,72,0.45)] sm:flex">
                    <IconoAstral nombre="numerologia" tamaño={30} className="text-white" />
                  </div>
                  <div>
                    <h1 className="text-3xl font-semibold tracking-[-0.03em] text-white sm:text-4xl">
                      Numerología por capítulos, no por bloques sueltos
                    </h1>
                    <p className="mt-3 max-w-xl text-base leading-7 text-white/68 sm:text-lg">
                      La experiencia se organiza como una mesa de lectura: núcleo y misión, ritmo actual y etapas de vida, con interpretación breve y específica en un panel contextual.
                    </p>
                  </div>
                </div>

                <div className="mt-6 grid gap-3 sm:grid-cols-3">
                  <div className="rounded-2xl border border-white/10 bg-white/[0.08] px-4 py-4">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/46">
                      Capítulo 1
                    </p>
                    <p className="mt-2 text-lg font-semibold text-white">
                      Núcleo y misión
                    </p>
                    <p className="mt-1 text-sm leading-6 text-white/58">
                      Sendero natal, esencia, imagen, destino y don de nacimiento.
                    </p>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-white/[0.08] px-4 py-4">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/46">
                      Capítulo 2
                    </p>
                    <p className="mt-2 text-lg font-semibold text-white">
                      Ritmo actual
                    </p>
                    <p className="mt-1 text-sm leading-6 text-white/58">
                      Día, mes y año personal como consola de timing.
                    </p>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-white/[0.08] px-4 py-4">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/46">
                      Capítulo 3
                    </p>
                    <p className="mt-2 text-lg font-semibold text-white">
                      Etapas
                    </p>
                    <p className="mt-1 text-sm leading-6 text-white/58">
                      Tus grandes pináculos y la lectura del tramo actual.
                    </p>
                  </div>
                </div>
              </section>

              <section className="rounded-[32px] border border-white/[0.08] bg-[linear-gradient(180deg,rgba(255,255,255,0.08),rgba(255,255,255,0.03))] p-6 shadow-[0_18px_40px_rgba(8,3,20,0.22)] backdrop-blur-xl">
                <div className="mb-5">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/46">
                    Tu cálculo
                  </p>
                  <h2 className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-white">
                    Abrí tu carta completa
                  </h2>
                  <p className="mt-2 text-[14px] leading-6 text-white/62">
                    Calculá tu sendero natal, misión, esencia, imagen, ritmo actual y etapas de vida en una sola lectura.
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
                    <label className="text-[13px] font-medium text-white/50">
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
                              ? "border-[#7C4DFF] bg-[#7C4DFF]/15 text-[#D9C2FF]"
                              : "border-white/10 bg-white/[0.04] text-white/56 hover:border-white/20",
                          )}
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
                  <div className="mt-4 rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3">
                    <p className="text-[14px] text-red-300">
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

  const datosActuales = normalizarNumerologia(datos);
  const etapasDeVida: EtapaVida[] = Array.isArray(datosActuales.etapas_de_la_vida)
    ? datosActuales.etapas_de_la_vida
    : [];
  const edadActual = calcularEdad(datosActuales.fecha_nacimiento);
  const mesActual = new Date().getMonth() + 1;
  const etapaActiva = obtenerEtapaActiva(etapasDeVida, edadActual);
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
  const anioPersonal = datosActuales.anio_personal ?? NUMERO_VACIO_DEFAULT;
  const mesPersonal = datosActuales.mes_personal ?? NUMERO_VACIO_DEFAULT;
  const diaPersonal = datosActuales.dia_personal ?? NUMERO_VACIO_DEFAULT;

  function seleccionarDetalle(nuevoDetalle: DetalleNumerologia) {
    setDetalle(nuevoDetalle);
    if (esMobile) {
      setDetalleMovilAbierto(true);
    }
  }

  function abrirNumero(clave: ClaveNumero, dato: NumeroRespuesta) {
    seleccionarDetalle(crearDetalleNumero(clave, dato, datosActuales));
  }

  function abrirMes(item: MesPersonalItem) {
    seleccionarDetalle(crearDetalleMes(item, datosActuales));
  }

  function abrirEtapa(etapa: EtapaVida, indice: number) {
    seleccionarDetalle(crearDetalleEtapa(etapa, indice, edadActual));
  }

  function cerrarDetalleMovil() {
    setDetalleMovilAbierto(false);
  }

  const contenidoPrincipal = (
    <div className="relative min-h-full overflow-hidden bg-[#16011b]">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-80 bg-[radial-gradient(circle_at_top_left,rgba(124,77,255,0.24),transparent_44%)]" />
      <div className="pointer-events-none absolute right-[-120px] top-24 h-72 w-72 rounded-full bg-[#B388FF]/10 blur-3xl" />
      <div className="pointer-events-none absolute left-10 top-[640px] h-64 w-64 rounded-full bg-[#7C4DFF]/10 blur-3xl" />

      <div className="relative mx-auto flex max-w-6xl flex-col gap-8 px-5 py-8 pb-24 lg:px-7 lg:pb-8">
        <section className="rounded-[32px] border border-white/[0.08] bg-[radial-gradient(circle_at_top_left,rgba(179,136,255,0.2),transparent_32%),linear-gradient(135deg,rgba(45,27,105,0.96),rgba(22,1,27,0.98))] px-6 py-7 shadow-[0_24px_70px_rgba(8,2,22,0.38)] sm:px-8 sm:py-8">
          <div className="pointer-events-none absolute hidden" />
          <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.08] px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-white/72">
            <IconoAstral nombre="numerologia" tamaño={14} className="text-current" />
            Carta numerológica
          </span>

          <div className="mt-5 flex items-start gap-4">
            <div className="hidden h-16 w-16 shrink-0 items-center justify-center rounded-[24px] bg-gradient-to-br from-[#7C4DFF] via-[#9C6DFF] to-[#D4A234] shadow-[0_18px_40px_rgba(34,12,72,0.45)] sm:flex">
              <IconoAstral nombre="numerologia" tamaño={30} className="text-white" />
            </div>
            <div className="max-w-3xl">
              <h1 className="text-3xl font-semibold tracking-[-0.03em] text-white sm:text-4xl">
                {construirTituloHero(datosActuales)}
              </h1>
              <p className="mt-3 text-base leading-7 text-white/68 sm:text-lg">
                Leé tu carta en capítulos: primero sendero, misión, esencia e imagen; después el ritmo actual y las etapas de vida. Toda la explicación técnica vive a la derecha y la interpretación baja a tu caso.
              </p>

              <div className="mt-5 flex flex-wrap gap-3">
                <Badge variante="info">{datosActuales.sistema === "pitagorico" ? "Sistema pitagórico" : "Sistema caldeo"}</Badge>
                {numerosMaestros.length > 0 && (
                  <Badge variante="advertencia">
                    Maestros: {numerosMaestros.join(", ")}
                  </Badge>
                )}
                <Badge className="bg-white/[0.08] text-white/78 border-white/10">
                  {datosActuales.fecha_nacimiento}
                </Badge>
              </div>

              <div className="mt-6 flex flex-wrap gap-3">
                <button
                  onClick={() => abrirNumero("camino_de_vida", senderoNatal)}
                  className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.08] px-4 py-2 text-sm font-medium text-white/82 transition-colors hover:bg-white/[0.14]"
                >
                  Leer sendero natal
                  <Icono nombre="caretDerecha" tamaño={14} />
                </button>
                <button
                  onClick={() => abrirNumero("dia_personal", diaPersonal)}
                  className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.08] px-4 py-2 text-sm font-medium text-white/82 transition-colors hover:bg-white/[0.14]"
                >
                  Ver tu día personal
                  <Icono nombre="caretDerecha" tamaño={14} />
                </button>
                {etapaActiva && (
                  <button
                    onClick={() => abrirEtapa(etapaActiva, etapasDeVida.findIndex((item) => item === etapaActiva))}
                    className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.08] px-4 py-2 text-sm font-medium text-white/82 transition-colors hover:bg-white/[0.14]"
                  >
                    Etapa actual
                    <Icono nombre="caretDerecha" tamaño={14} />
                  </button>
                )}
              </div>
            </div>
          </div>
        </section>

        <div className="flex flex-wrap gap-2">
          {CAPITULOS.map((capitulo) => (
            <button
              key={capitulo.id}
              onClick={() => navegarA(capitulo.id)}
              className="rounded-full border border-white/[0.08] bg-white/[0.04] px-4 py-2 text-sm font-medium text-white/70 transition-colors hover:bg-white/[0.08] hover:text-white"
            >
              {capitulo.etiqueta}
            </button>
          ))}
        </div>

        <section id="capitulo-nucleo" className="space-y-4">
          <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-white/46">
                Capítulo 1
              </p>
              <h2 className="mt-2 text-2xl font-semibold tracking-[-0.02em] text-white">
                Núcleo y misión
              </h2>
            </div>
            <p className="max-w-md text-sm leading-6 text-white/52">
              Esta capa reúne las piezas más parecidas a la estructura clásica del manual: sendero, misión, esencia, imagen y don de nacimiento.
            </p>
          </div>

          <div className="grid gap-4 xl:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)]">
            <TarjetaNumero
              dato={senderoNatal}
              meta={META_NUMERO.camino_de_vida}
              onClick={() => abrirNumero("camino_de_vida", senderoNatal)}
              seleccionada={detalleClave === "camino_de_vida"}
              destacada
            />
            <div className="grid gap-4 sm:grid-cols-2">
              <TarjetaNumero
                dato={destinoMision}
                meta={META_NUMERO.expresion}
                onClick={() => abrirNumero("expresion", destinoMision)}
                seleccionada={detalleClave === "expresion"}
              />
              <TarjetaNumero
                dato={esencia}
                meta={META_NUMERO.impulso_del_alma}
                onClick={() => abrirNumero("impulso_del_alma", esencia)}
                seleccionada={detalleClave === "impulso_del_alma"}
              />
              <TarjetaNumero
                dato={imagen}
                meta={META_NUMERO.personalidad}
                onClick={() => abrirNumero("personalidad", imagen)}
                seleccionada={detalleClave === "personalidad"}
              />
              <TarjetaNumero
                dato={nacimiento}
                meta={META_NUMERO.numero_nacimiento}
                onClick={() => abrirNumero("numero_nacimiento", nacimiento)}
                seleccionada={detalleClave === "numero_nacimiento"}
              />
            </div>
          </div>
        </section>

        <section id="capitulo-ritmo" className="space-y-4">
          <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-white/46">
                Capítulo 2
              </p>
              <h2 className="mt-2 text-2xl font-semibold tracking-[-0.02em] text-white">
                Ritmo actual
              </h2>
            </div>
            <p className="max-w-md text-sm leading-6 text-white/52">
              Acá se concentra el timing de tu carta: la vibración de hoy, el clima del mes y la atmósfera general del año.
            </p>
          </div>

          <div className="grid gap-4 xl:grid-cols-[minmax(0,1.25fr)_320px]">
            <TarjetaCiclo
              titulo={META_NUMERO.dia_personal.titulo}
              etiqueta={META_NUMERO.dia_personal.categoria}
              dato={diaPersonal}
              onClick={() => abrirNumero("dia_personal", diaPersonal)}
              seleccionada={detalleClave === "dia_personal"}
              destacada
            />
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-1">
              <TarjetaCiclo
                titulo={META_NUMERO.anio_personal.titulo}
                etiqueta={META_NUMERO.anio_personal.categoria}
                dato={anioPersonal}
                onClick={() => abrirNumero("anio_personal", anioPersonal)}
                seleccionada={detalleClave === "anio_personal"}
              />
              <TarjetaCiclo
                titulo={META_NUMERO.mes_personal.titulo}
                etiqueta={META_NUMERO.mes_personal.categoria}
                dato={mesPersonal}
                onClick={() => abrirNumero("mes_personal", mesPersonal)}
                seleccionada={detalleClave === "mes_personal"}
              />
            </div>
          </div>

          {mesesPersonales.length > 0 && (
            <div className="rounded-[30px] border border-white/[0.08] bg-white/[0.04] p-5 shadow-[0_18px_40px_rgba(8,3,20,0.22)] backdrop-blur-xl">
              <div className="mb-4 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/46">
                    Biblioteca del año
                  </p>
                  <h3 className="mt-2 text-xl font-semibold tracking-[-0.02em] text-white">
                    Tus 12 meses personales
                  </h3>
                </div>
                <p className="max-w-md text-sm leading-6 text-white/52">
                  Cada casilla abre la lectura breve del mes y cómo se integra con tu año personal {anioPersonal.numero}.
                </p>
              </div>

              <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 lg:grid-cols-6 xl:grid-cols-12">
                {mesesPersonales.map((item) => (
                  <TarjetaMes
                    key={item.mes}
                    item={item}
                    activa={item.mes === mesActual}
                    seleccionada={detalleClave === `mes:${item.mes}`}
                    onClick={() => abrirMes(item)}
                  />
                ))}
              </div>
            </div>
          )}
        </section>

        <section id="capitulo-etapas" className="space-y-4">
          <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-white/46">
                Capítulo 3
              </p>
              <h2 className="mt-2 text-2xl font-semibold tracking-[-0.02em] text-white">
                Etapas de vida
              </h2>
            </div>
            <p className="max-w-md text-sm leading-6 text-white/52">
              Tus pináculos muestran grandes capítulos. Hoy tenés {edadActual} años y {etapaActiva ? `estás dentro de ${etapaActiva.nombre}.` : "podés abrir cada etapa para leerla."}
            </p>
          </div>

          {etapasDeVida.length > 0 ? (
            <div className="grid gap-4 xl:grid-cols-2">
              {etapasDeVida.map((etapa, indice) => (
                <TarjetaEtapa
                  key={`${etapa.numero}-${indice}`}
                  etapa={etapa}
                  indice={indice}
                  edadActual={edadActual}
                  activa={
                    edadActual >= etapa.edad_inicio &&
                    (etapa.edad_fin === null || edadActual < etapa.edad_fin)
                  }
                  seleccionada={detalleClave === `etapa:${indice}`}
                  onClick={() => abrirEtapa(etapa, indice)}
                />
              ))}
            </div>
          ) : (
            <div className="rounded-[30px] border border-white/[0.08] bg-white/[0.04] p-5 shadow-[0_18px_40px_rgba(8,3,20,0.22)] backdrop-blur-xl">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/46">
                Etapas no disponibles
              </p>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-white/64">
                Esta carta guardada no trae los pináculos completos. Podés seguir
                leyendo núcleo y ritmo actual, o recalcular la numerología para
                regenerar las etapas de vida.
              </p>
            </div>
          )}
        </section>

        <button
          onClick={() => {
            setModoManual(true);
            setDatosManual(null);
            setDetalle(null);
            setDetalleMovilAbierto(false);
          }}
          className="inline-flex items-center gap-2 self-start rounded-full border border-white/[0.08] bg-white/[0.04] px-4 py-2 text-sm font-medium text-white/64 transition-colors hover:bg-white/[0.08] hover:text-white"
        >
          <Icono nombre="flechaIzquierda" tamaño={16} />
          Nuevo cálculo
        </button>
      </div>
    </div>
  );

  return (
    <>
      <HeaderMobile titulo="Numerología" mostrarAtras />

      {esMobile ? (
        <div className="flex-1 overflow-y-auto scroll-sutil">
          {contenidoPrincipal}
        </div>
      ) : (
        <div className="hidden h-full min-h-0 flex-1 lg:flex">
          <PanelGroup orientation="horizontal" id="numerologia-paneles">
            <Panel defaultSize={72} minSize={56}>
              <div className="h-full overflow-y-auto scroll-sutil">
                {contenidoPrincipal}
              </div>
            </Panel>

            <PanelResizeHandle className="flex w-1.5 cursor-col-resize items-center justify-center bg-white/[0.04] transition-colors hover:bg-[#7C4DFF]/24 group">
              <div className="h-8 w-0.5 rounded-full bg-white/18 transition-colors group-hover:bg-[#B388FF]" />
            </PanelResizeHandle>

            <Panel defaultSize={28} minSize={22} maxSize={40} collapsible>
              <aside className="h-full overflow-hidden border-l border-white/[0.08] bg-[linear-gradient(180deg,#1C0627_0%,#140019_100%)]">
                <PanelContextualNumerologia detalle={detalle} datos={datosActuales} />
              </aside>
            </Panel>
          </PanelGroup>
        </div>
      )}

      {esMobile && detalleMovilAbierto && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end lg:hidden">
          <button
            onClick={cerrarDetalleMovil}
            className="absolute inset-0 bg-black/45"
            aria-label="Cerrar detalle"
          />
          <div className="relative max-h-[82vh] overflow-y-auto rounded-t-[28px] border-t border-white/10 bg-[linear-gradient(180deg,#1C0627_0%,#140019_100%)] shadow-[0_-18px_40px_rgba(8,3,20,0.42)]">
            <div className="sticky top-0 z-10 flex justify-center rounded-t-[28px] bg-[linear-gradient(180deg,#1C0627_0%,#140019_100%)] pt-3 pb-2">
              <div className="h-1 w-10 rounded-full bg-white/18" />
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
    </>
  );
}
