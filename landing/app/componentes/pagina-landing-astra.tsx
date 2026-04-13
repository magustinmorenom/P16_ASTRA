"use client";

import type { ReactNode } from "react";
import Image from "next/image";
import { motion, useReducedMotion } from "motion/react";
import {
  Bot,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  Clock3,
  HeartPulse,
  Layers3,
  MonitorSmartphone,
  PauseCircle,
  ShieldCheck,
  Sparkles,
  TimerReset,
} from "lucide-react";
import { IconoAstral } from "./icono-astral";
import { DiagramaOrbital } from "./orbita-hero";

const enlaces = [
  { etiqueta: "Cómo funciona", href: "#como-funciona" },
  { etiqueta: "Herramientas", href: "#herramientas" },
  { etiqueta: "Decisiones", href: "#decisiones" },
  { etiqueta: "FAQ", href: "#faq" },
];

const modulos = [
  {
    titulo: "Carta astrológica",
    texto:
      "Sol, Luna, Ascendente, planetas, casas y aspectos integrados en una lectura clara sobre identidad, desafíos y recursos.",
    icono: <IconoAstral nombre="astrologia" className="text-[#B388FF]" />,
  },
  {
    titulo: "Numerología",
    texto:
      "Números principales, camino de vida, expresión, impulso interno y ciclos personales para entender mejor tu etapa actual.",
    icono: <IconoAstral nombre="numerologia" className="text-[#B388FF]" />,
  },
  {
    titulo: "Diseño Humano",
    texto:
      "Tipo energético, autoridad, perfil, centros y forma natural de decidir para moverte con más coherencia.",
    icono: <IconoAstral nombre="personal" className="text-[#B388FF]" />,
  },
  {
    titulo: "Tránsitos en tiempo real",
    texto:
      "Lectura del movimiento planetario actual y de cómo dialoga con tu mapa personal día a día.",
    icono: <Clock3 aria-hidden="true" className="h-6 w-6 text-[#B388FF]" />,
  },
  {
    titulo: "Calendario de momentos",
    texto:
      "Ventanas útiles para iniciar, conversar, ordenar ideas, descansar, invertir energía o cerrar etapas.",
    icono: <CalendarDays aria-hidden="true" className="h-6 w-6 text-[#B388FF]" />,
  },
  {
    titulo: "Podcast personalizado",
    texto:
      "Una lectura en audio para acompañar tu rutina con energía del día, tránsitos activos y acciones sugeridas.",
    icono: <IconoAstral nombre="libro" className="text-[#B388FF]" />,
  },
  {
    titulo: "Chat con agente IA",
    texto:
      "Preguntas sobre decisiones, vínculos, trabajo, fechas favorables o procesos internos desde tu información.",
    icono: <Bot aria-hidden="true" className="h-6 w-6 text-[#B388FF]" />,
  },
  {
    titulo: "Perfil FODA personal",
    texto:
      "Fortalezas, oportunidades, debilidades y amenazas organizadas como marco práctico de autoconocimiento.",
    icono: <IconoAstral nombre="carrera" className="text-[#B388FF]" />,
  },
];

const foda = [
  {
    titulo: "Fortalezas",
    texto: "Recursos internos disponibles: sensibilidad, intuición, claridad, perseverancia, creatividad y liderazgo.",
    tono: "text-emerald-200",
  },
  {
    titulo: "Oportunidades",
    texto: "Ventanas donde tu energía puede abrir caminos en proyectos, decisiones, vínculos y aprendizajes.",
    tono: "text-[#D4A234]",
  },
  {
    titulo: "Debilidades",
    texto: "Zonas de cuidado: exigencia, postergación, miedo, confusión o pérdida de foco.",
    tono: "text-[#B388FF]",
  },
  {
    titulo: "Amenazas",
    texto: "Tensiones que conviene observar para pausar, resguardar tu energía y no forzar procesos.",
    tono: "text-rose-200",
  },
];

const momentos = [
  "Iniciar un proyecto o dar un paso visible.",
  "Tener una conversación importante.",
  "Ordenar dinero, compras o inversiones.",
  "Bajar exigencia y cuidar tu energía.",
  "Estudiar, escribir, publicar o comunicar.",
  "Cerrar una etapa y recuperar foco.",
];

const preguntas = [
  {
    pregunta: "Qué es ASTRA?",
    respuesta:
      "ASTRA es una herramienta de autoconocimiento con un agente IA que integra astrología, numerología, Diseño Humano y tránsitos planetarios en tiempo real para ayudarte a comprender tu energía y tomar decisiones con mayor claridad.",
  },
  {
    pregunta: "Qué necesito para empezar?",
    respuesta:
      "Necesitás tu fecha, hora y lugar de nacimiento. Con esos datos, ASTRA construye tu mapa personal y conecta los distintos sistemas de lectura.",
  },
  {
    pregunta: "Tengo que saber astrología o Diseño Humano?",
    respuesta:
      "No. ASTRA traduce información compleja en una experiencia clara, ordenada y aplicable para tu vida diaria.",
  },
  {
    pregunta: "ASTRA predice el futuro?",
    respuesta:
      "No trabaja desde certezas absolutas. Muestra tendencias, ciclos, momentos favorables, tensiones y recursos disponibles para que puedas decidir con más conciencia.",
  },
  {
    pregunta: "Está disponible en celular?",
    respuesta:
      "Sí. ASTRA contempla plataforma web y aplicación móvil: la web permite profundizar y la app acompaña la consulta diaria.",
  },
  {
    pregunta: "Reemplaza terapia o asesoramiento profesional?",
    respuesta:
      "No. ASTRA es una herramienta de autoconocimiento y reflexión. No reemplaza acompañamiento profesional en salud, legales, finanzas ni decisiones críticas.",
  },
];

function SeccionAnimada({
  id,
  className,
  children,
}: {
  id?: string;
  className?: string;
  children: ReactNode;
}) {
  const reducirMovimiento = useReducedMotion();

  if (reducirMovimiento) {
    return (
      <section id={id} className={className}>
        {children}
      </section>
    );
  }

  return (
    <motion.section
      id={id}
      className={className}
      initial={{ opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ duration: 0.75, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.section>
  );
}

function EncabezadoSeccion({
  etiqueta,
  titulo,
  texto,
}: {
  etiqueta: string;
  titulo: string;
  texto: string;
}) {
  return (
    <div className="mx-auto mb-8 max-w-3xl text-center md:mb-12">
      <p className="mb-3 text-xs font-semibold uppercase tracking-[0.28em] text-[#B388FF]">
        {etiqueta}
      </p>
      <h2 className="font-display text-xl leading-tight text-white md:text-4xl">
        {titulo}
      </h2>
      <p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-[color:var(--texto-suave)] md:text-lg">
        {texto}
      </p>
    </div>
  );
}

function BotonCTA({
  href,
  children,
  variante = "primario",
}: {
  href: string;
  children: ReactNode;
  variante?: "primario" | "secundario";
}) {
  return (
    <a
      href={href}
      className={`focus-visible-ring inline-flex min-h-12 items-center justify-center rounded-full px-5 text-sm font-semibold transition duration-300 ${
        variante === "primario"
          ? "boton-primario text-white hover:translate-y-[-1px]"
          : "boton-secundario text-white hover:bg-white/[0.1]"
      }`}
    >
      {children}
      <ChevronRight aria-hidden="true" className="ml-2 h-4 w-4" />
    </a>
  );
}

function Navegacion() {
  return (
    <header className="sticky top-0 z-50 border-b border-white/[0.08] bg-[#12071f]/80 backdrop-blur-2xl">
      <nav className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <a href="#inicio" className="focus-visible-ring flex items-center gap-3 rounded-full">
          <Image
            src="/img/isotipo-blanco.png"
            alt=""
            width={34}
            height={36}
            priority
            className="h-9 w-auto"
          />
          <Image
            src="/img/logo-astra-blanco.png"
            alt="ASTRA"
            width={114}
            height={27}
            priority
            className="h-6 w-auto"
          />
        </a>

        <div className="hidden items-center gap-7 text-sm text-[color:var(--texto-suave)] lg:flex">
          {enlaces.map((enlace) => (
            <a
              key={enlace.href}
              href={enlace.href}
              className="focus-visible-ring rounded-full transition hover:text-white"
            >
              {enlace.etiqueta}
            </a>
          ))}
        </div>

        <a
          href="#crear-mapa"
          className="focus-visible-ring inline-flex min-h-11 items-center justify-center rounded-full border border-white/[0.12] bg-white/[0.08] px-4 text-sm font-semibold text-white transition hover:bg-white/[0.14]"
        >
          Crear mi mapa
        </a>
      </nav>
    </header>
  );
}

function Hero() {
  const reducirMovimiento = useReducedMotion();

  return (
    <section
      id="inicio"
      className="relative mx-auto grid min-h-[calc(100svh-4rem)] w-full max-w-7xl items-center gap-10 px-4 pb-16 pt-10 sm:px-6 md:pb-24 lg:grid-cols-[0.95fr_1.05fr] lg:px-8 lg:pt-16"
    >
      <motion.div
        initial={reducirMovimiento ? false : { opacity: 0, y: 22 }}
        animate={reducirMovimiento ? undefined : { opacity: 1, y: 0 }}
        transition={{ duration: 0.75, ease: [0.22, 1, 0.36, 1] }}
        className="relative z-10 text-center lg:text-left"
      >
        <div className="mx-auto mb-5 inline-flex items-center gap-2 rounded-full border border-white/[0.12] bg-white/[0.07] px-3 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-[#B388FF] lg:mx-0">
          <Sparkles aria-hidden="true" className="h-4 w-4" />
          Autoconocimiento con IA
        </div>
        <h1 className="texto-gradiente font-display text-3xl leading-[1.08] tracking-[-0.03em] sm:text-4xl md:text-5xl lg:text-6xl">
          Conocé tu energía, tus ciclos y tus mejores momentos para avanzar.
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-base leading-8 text-[color:var(--texto-suave)] sm:text-lg lg:mx-0">
          ASTRA conecta tu carta astrológica, numerología, Diseño Humano y
          tránsitos planetarios en tiempo real para ayudarte a tomar decisiones
          con más claridad.
        </p>
        <p className="mx-auto mt-4 max-w-xl text-sm leading-7 text-[color:var(--texto-muted)] sm:text-base lg:mx-0">
          Descubrí fortalezas, oportunidades, debilidades y amenazas. Consultá
          cuándo avanzar, cuándo pausar y qué recursos tenés disponibles para
          vivir con más armonía.
        </p>
        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row lg:justify-start">
          <BotonCTA href="#crear-mapa">Crear mi mapa personal</BotonCTA>
          <BotonCTA href="#como-funciona" variante="secundario">
            Ver cómo funciona
          </BotonCTA>
        </div>
        <p className="mt-4 text-xs leading-6 text-[color:var(--texto-muted)]">
          Ingresás tus datos de nacimiento y ASTRA empieza a conectar tu
          información personal en una lectura integrada.
        </p>
      </motion.div>

      <DiagramaOrbital />
    </section>
  );
}

function LecturaIntegrada() {
  const pilares = [
    {
      titulo: "Todo conectado",
      texto:
        "No recibís datos sueltos. El agente IA cruza tu mapa personal con el momento actual.",
      icono: <Layers3 aria-hidden="true" className="h-6 w-6" />,
    },
    {
      titulo: "Aplicado a tu día",
      texto:
        "Energía disponible, áreas movilizadas, acciones sugeridas y señales para ordenar prioridades.",
      icono: <TimerReset aria-hidden="true" className="h-6 w-6" />,
    },
    {
      titulo: "Sin certezas absolutas",
      texto:
        "ASTRA muestra tendencias y recursos para que elijas con más conciencia, no para decidir por vos.",
      icono: <ShieldCheck aria-hidden="true" className="h-6 w-6" />,
    },
  ];

  return (
    <SeccionAnimada className="mx-auto w-full max-w-7xl px-4 py-12 sm:px-6 md:py-20 lg:px-8">
      <div className="grid gap-4 md:grid-cols-3">
        {pilares.map((pilar) => (
          <article key={pilar.titulo} className="superficie-suave rounded-[2rem] p-5 md:p-7">
            <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#7C4DFF]/18 text-[#B388FF]">
              {pilar.icono}
            </div>
            <h2 className="font-display text-xl text-white">{pilar.titulo}</h2>
            <p className="mt-3 text-sm leading-7 text-[color:var(--texto-suave)]">
              {pilar.texto}
            </p>
          </article>
        ))}
      </div>
    </SeccionAnimada>
  );
}

function ComoFunciona() {
  const pasos = [
    {
      titulo: "Cargás tus datos",
      texto:
        "Fecha, hora y lugar de nacimiento para calcular carta astrológica, numerología y Diseño Humano con precisión.",
    },
    {
      titulo: "ASTRA construye tu mapa",
      texto:
        "Organiza posiciones, ciclos, números principales, tipo energético, autoridad y patrones de decisión.",
    },
    {
      titulo: "El agente IA conecta",
      texto:
        "Cruza tu información con tránsitos planetarios actuales y traduce los cruces en lectura práctica.",
    },
    {
      titulo: "Recibís recursos diarios",
      texto:
        "Consultás energía del día, mejores momentos, alertas, calendario, podcast y preguntas específicas.",
    },
  ];

  return (
    <SeccionAnimada
      id="como-funciona"
      className="mx-auto w-full max-w-7xl px-4 py-14 sm:px-6 md:py-24 lg:px-8"
    >
      <EncabezadoSeccion
        etiqueta="Cómo funciona"
        titulo="No es solo saber quién sos. Es saber cómo acompañarte."
        texto="ASTRA transforma sistemas complejos de autoconocimiento en información clara, conectada y accionable para tu vida cotidiana."
      />
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {pasos.map((paso, indice) => (
          <article key={paso.titulo} className="superficie rounded-[2rem] p-5 md:p-6">
            <div className="mb-6 flex h-11 w-11 items-center justify-center rounded-full border border-white/[0.12] bg-white/[0.07] text-sm font-semibold text-[#B388FF]">
              {String(indice + 1).padStart(2, "0")}
            </div>
            <h3 className="font-display text-xl leading-tight text-white">{paso.titulo}</h3>
            <p className="mt-3 text-sm leading-7 text-[color:var(--texto-suave)]">
              {paso.texto}
            </p>
          </article>
        ))}
      </div>
    </SeccionAnimada>
  );
}

function Herramientas() {
  return (
    <SeccionAnimada
      id="herramientas"
      className="mx-auto w-full max-w-7xl px-4 py-14 sm:px-6 md:py-24 lg:px-8"
    >
      <EncabezadoSeccion
        etiqueta="Herramientas"
        titulo="Tu mapa personal convertido en recursos concretos."
        texto="Cada módulo suma una capa de lectura: identidad, ciclos, energía, timing, decisiones, audio y conversación con contexto."
      />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {modulos.map((modulo) => (
          <article key={modulo.titulo} className="superficie-suave rounded-[1.7rem] p-5">
            <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-white/[0.08]">
              {modulo.icono}
            </div>
            <h3 className="text-lg font-semibold text-white">{modulo.titulo}</h3>
            <p className="mt-3 text-sm leading-7 text-[color:var(--texto-suave)]">
              {modulo.texto}
            </p>
          </article>
        ))}
      </div>
    </SeccionAnimada>
  );
}

function FodaPersonal() {
  return (
    <SeccionAnimada className="mx-auto w-full max-w-7xl px-4 py-14 sm:px-6 md:py-24 lg:px-8">
      <div className="grid gap-8 lg:grid-cols-[0.82fr_1.18fr] lg:items-center">
        <div>
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.28em] text-[#B388FF]">
            FODA personal
          </p>
          <h2 className="font-display text-xl leading-tight text-white md:text-4xl">
            Fortalezas, oportunidades, debilidades y amenazas de tu mapa.
          </h2>
          <p className="mt-5 text-base leading-8 text-[color:var(--texto-suave)]">
            ASTRA organiza tu información como un marco de autoconocimiento:
            qué tenés a favor, qué podés desarrollar, qué necesita atención y
            qué patrones conviene observar.
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          {foda.map((item) => (
            <article key={item.titulo} className="superficie rounded-[2rem] p-5">
              <CheckCircle2 aria-hidden="true" className={`mb-5 h-6 w-6 ${item.tono}`} />
              <h3 className="text-xl font-semibold text-white">{item.titulo}</h3>
              <p className="mt-3 text-sm leading-7 text-[color:var(--texto-suave)]">
                {item.texto}
              </p>
            </article>
          ))}
        </div>
      </div>
    </SeccionAnimada>
  );
}

function Decisiones() {
  return (
    <SeccionAnimada
      id="decisiones"
      className="mx-auto w-full max-w-7xl px-4 py-14 sm:px-6 md:py-24 lg:px-8"
    >
      <div className="superficie overflow-hidden rounded-[2.2rem] p-5 md:p-8 lg:p-10">
        <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
          <div>
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.28em] text-[#B388FF]">
              Decisiones y mejores momentos
            </p>
            <h2 className="font-display text-xl leading-tight text-white md:text-4xl">
              Consultá antes de avanzar, pausar o resguardar tu energía.
            </h2>
            <p className="mt-5 text-base leading-8 text-[color:var(--texto-suave)]">
              No se trata de esperar condiciones perfectas. Se trata de
              entender el clima de tu propia energía para elegir con más
              conciencia cuándo avanzar, ajustar o proteger tu paz.
            </p>
            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <BotonCTA href="#crear-mapa">Ver mis mejores momentos</BotonCTA>
              <BotonCTA href="#herramientas" variante="secundario">
                Explorar herramientas
              </BotonCTA>
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {momentos.map((momento) => (
              <div
                key={momento}
                className="flex items-start gap-3 rounded-2xl border border-white/[0.08] bg-white/[0.055] p-4"
              >
                <PauseCircle aria-hidden="true" className="mt-1 h-5 w-5 shrink-0 text-[#B388FF]" />
                <p className="text-sm leading-6 text-[color:var(--texto-suave)]">{momento}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </SeccionAnimada>
  );
}

function WebApp() {
  const items = [
    {
      titulo: "Web para profundizar",
      texto:
        "Explorá carta astrológica, numerología, Diseño Humano, perfil personal, visualizaciones y lecturas extensas desde una experiencia amplia.",
      icono: <MonitorSmartphone aria-hidden="true" className="h-6 w-6 text-[#B388FF]" />,
    },
    {
      titulo: "App para acompañarte",
      texto:
        "Consultá tu energía antes de una reunión, escuchá tu audio diario, revisá tu calendario o escribile al agente IA desde el celular.",
      icono: <HeartPulse aria-hidden="true" className="h-6 w-6 text-[#B388FF]" />,
    },
  ];

  return (
    <SeccionAnimada className="mx-auto w-full max-w-7xl px-4 py-14 sm:px-6 md:py-24 lg:px-8">
      <EncabezadoSeccion
        etiqueta="Web y aplicación móvil"
        titulo="Web para profundizar. App para acompañarte."
        texto="ASTRA está pensada para explorar tu mapa en detalle y para consultar tu momento actual cuando necesitás claridad."
      />
      <div className="grid gap-4 md:grid-cols-2">
        {items.map((item) => (
          <article key={item.titulo} className="superficie rounded-[2rem] p-6 md:p-8">
            <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-2xl bg-white/[0.08]">
              {item.icono}
            </div>
            <h3 className="font-display text-2xl text-white">{item.titulo}</h3>
            <p className="mt-4 text-base leading-8 text-[color:var(--texto-suave)]">
              {item.texto}
            </p>
          </article>
        ))}
      </div>
    </SeccionAnimada>
  );
}

function FAQ() {
  return (
    <SeccionAnimada
      id="faq"
      className="mx-auto w-full max-w-4xl px-4 py-14 sm:px-6 md:py-24 lg:px-8"
    >
      <EncabezadoSeccion
        etiqueta="Preguntas frecuentes"
        titulo="Lo esencial antes de empezar."
        texto="Respuestas claras para entender qué hace ASTRA, cómo se usa y cuál es su alcance."
      />
      <div className="space-y-3">
        {preguntas.map((item) => (
          <details
            key={item.pregunta}
            className="group rounded-3xl border border-white/[0.09] bg-white/[0.055] p-5 backdrop-blur-xl"
          >
            <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-4 text-left text-base font-semibold text-white">
              {item.pregunta}
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/[0.08] text-[#B388FF] transition group-open:rotate-90">
                <ChevronRight aria-hidden="true" className="h-4 w-4" />
              </span>
            </summary>
            <p className="mt-4 text-sm leading-7 text-[color:var(--texto-suave)]">
              {item.respuesta}
            </p>
          </details>
        ))}
      </div>
    </SeccionAnimada>
  );
}

function Cierre() {
  return (
    <section id="crear-mapa" className="mx-auto w-full max-w-7xl px-4 pb-28 pt-14 sm:px-6 md:pb-16 md:pt-24 lg:px-8">
      <div className="superficie relative overflow-hidden rounded-[2.4rem] px-5 py-12 text-center md:px-10 md:py-16">
        <div className="absolute left-1/2 top-0 h-48 w-72 -translate-x-1/2 rounded-full bg-[#7C4DFF]/22 blur-3xl" />
        <div className="relative mx-auto max-w-3xl">
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.28em] text-[#B388FF]">
            Crear mi mapa personal
          </p>
          <h2 className="font-display text-xl leading-tight text-white md:text-4xl">
            Conocerte también es una forma de avanzar.
          </h2>
          <p className="mx-auto mt-5 max-w-2xl text-base leading-8 text-[color:var(--texto-suave)]">
            ASTRA reúne tu carta astrológica, numerología, Diseño Humano,
            tránsitos planetarios y un agente IA en una sola herramienta de
            autoconocimiento para comprender tu energía y cuidar tus decisiones.
          </p>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <BotonCTA href="#inicio">Volver al inicio</BotonCTA>
            <BotonCTA href="#herramientas" variante="secundario">
              Ver herramientas
            </BotonCTA>
          </div>
          <p className="mt-5 text-sm text-[color:var(--texto-muted)]">
            Disponible como plataforma web y aplicación móvil.
          </p>
        </div>
      </div>
    </section>
  );
}

function BarraMobile() {
  return (
    <div className="fixed inset-x-3 bottom-3 z-50 md:hidden">
      <a
        href="#crear-mapa"
        className="focus-visible-ring boton-primario flex min-h-12 items-center justify-center rounded-full px-5 text-sm font-semibold text-white shadow-2xl"
      >
        Crear mi mapa personal
      </a>
    </div>
  );
}

export function PaginaLandingAstra() {
  return (
    <main className="relative isolate min-h-screen overflow-hidden pb-16 text-white md:pb-0">
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute left-[-10rem] top-28 h-80 w-80 rounded-full bg-[#7C4DFF]/18 blur-3xl" />
        <div className="absolute right-[-12rem] top-[38rem] h-96 w-96 rounded-full bg-[#4A2D8C]/20 blur-3xl" />
        <div className="absolute bottom-0 left-1/2 h-80 w-[48rem] -translate-x-1/2 rounded-full bg-[#B388FF]/10 blur-3xl" />
      </div>
      <Navegacion />
      <Hero />
      <LecturaIntegrada />
      <ComoFunciona />
      <Herramientas />
      <FodaPersonal />
      <Decisiones />
      <WebApp />
      <FAQ />
      <Cierre />
      <BarraMobile />
    </main>
  );
}
