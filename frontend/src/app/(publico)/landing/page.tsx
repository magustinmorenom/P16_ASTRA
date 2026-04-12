"use client";

import { useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, useInView } from "framer-motion";

/* ═══════════════════════════════════════════════════════════════
   ASTRA — Landing Page
   Estilo visual replicado de referencia Marketeam:
   - Hero con gradiente violeta/ciruela + orbital UI
   - Tipografía Instrument Serif para headlines
   - Glassmorphism, blur, glow sutil
   ═══════════════════════════════════════════════════════════════ */

// ---------------------------------------------------------------------------
// Motion config
// ---------------------------------------------------------------------------
const EASE_OUT_EXPO = [0.16, 1, 0.3, 1] as const;
const FADE_UP = {
  hidden: { opacity: 0, y: 32 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.7, ease: EASE_OUT_EXPO, delay: i * 0.08 },
  }),
};
const FADE_IN = {
  hidden: { opacity: 0 },
  visible: (i: number) => ({
    opacity: 1,
    transition: { duration: 0.6, ease: EASE_OUT_EXPO, delay: i * 0.06 },
  }),
};

function usarInView() {
  const ref = useRef(null);
  const enVista = useInView(ref, { once: true, margin: "-80px" });
  return { ref, enVista };
}

// ---------------------------------------------------------------------------
// Datos estáticos
// ---------------------------------------------------------------------------
const NAV_LINKS = [
  { label: "Funciones", href: "#funciones" },
  { label: "Cómo funciona", href: "#como-funciona" },
  { label: "Precios", href: "#precios" },
];

const TRUST_ITEMS = [
  { icon: "020-astrology.svg", label: "Carta Astral" },
  { icon: "016-horoscope.svg", label: "Diseño Humano" },
  { icon: "021-numerology.svg", label: "Numerología" },
  { icon: "028-crystal ball.svg", label: "Revolución Solar" },
  { icon: "024-career.svg", label: "Tránsitos" },
];

const FEATURES = [
  {
    titulo: "Carta Astral de Precisión Astronómica",
    descripcion:
      "Posiciones planetarias, casas Placidus, aspectos y dignidades calculados con Swiss Ephemeris — la misma fuente que usan los astrólogos profesionales.",
    icono: "020-astrology.svg",
    gradiente: "from-violet-500/20 to-violet-900/10",
  },
  {
    titulo: "Diseño Humano Completo",
    descripcion:
      "Tu tipo, autoridad, perfil, definición, canales y las 64 puertas. Calculados con la precisión de 88° solares eclípticos, no aproximaciones.",
    icono: "016-horoscope.svg",
    gradiente: "from-violet-600/20 to-violet-950/10",
  },
  {
    titulo: "Numerología Pitagórica y Caldea",
    descripcion:
      "Camino de vida, expresión, alma, personalidad y ciclos personales. Números maestros 11, 22 y 33 preservados sin reducir.",
    icono: "021-numerology.svg",
    gradiente: "from-violet-400/15 to-violet-800/10",
  },
  {
    titulo: "Pronóstico Diario con IA",
    descripcion:
      "Cada mañana, un podcast y lectura personalizados que integran tránsitos, numerología y tu carta natal para guiar tu día.",
    icono: "028-crystal ball.svg",
    gradiente: "from-violet-500/15 to-violet-900/10",
  },
];

const PASOS = [
  {
    numero: "01",
    titulo: "Creá tu perfil",
    descripcion: "Ingresá tu fecha, hora y lugar de nacimiento. En segundos calculamos todo.",
  },
  {
    numero: "02",
    titulo: "Recibí tu mapa cósmico",
    descripcion: "Carta astral, body graph y numerología integrados en un solo lugar.",
  },
  {
    numero: "03",
    titulo: "Viví con propósito",
    descripcion: "Pronóstico diario personalizado, podcast y chat con Astra, tu oráculo.",
  },
];

const TESTIMONIOS = [
  {
    nombre: "Valentina R.",
    rol: "Terapeuta holística",
    texto:
      "Nunca vi una plataforma que integre las tres disciplinas con tanta precisión. La carta natal coincide exactamente con Astro.com.",
    avatar: "VR",
  },
  {
    nombre: "Martín L.",
    rol: "Emprendedor",
    texto:
      "El podcast del día me organiza la mañana. Es como tener un astrólogo personal que te conoce de verdad.",
    avatar: "ML",
  },
  {
    nombre: "Camila S.",
    rol: "Diseñadora UX",
    texto:
      "Descubrí mi diseño humano acá y cambió cómo tomo decisiones. La interfaz es lo más lindo que vi en una app de astrología.",
    avatar: "CS",
  },
];

const PLAN_GRATIS = {
  nombre: "Gratis",
  precio: "$0",
  periodo: "para siempre",
  destacado: false,
  features: [
    "Carta natal completa",
    "Numerología básica",
    "Diseño Humano (tipo y autoridad)",
    "Tránsitos actuales",
  ],
};

const PLAN_PREMIUM = {
  nombre: "Premium",
  precio: "$9",
  periodo: "USD / mes",
  destacado: true,
  features: [
    "Todo lo del plan Gratis",
    "Podcast diario personalizado",
    "Chat con Astra (oráculo IA)",
    "Pronóstico diario completo",
    "Revolución Solar anual",
    "Descarga de perfil en PDF",
    "Diseño Humano completo (64 puertas)",
  ],
};

// ---------------------------------------------------------------------------
// Orbital items — SVG icons en las órbitas del hero
// ---------------------------------------------------------------------------
const ORBITAL_ITEMS = [
  { top: "8%", left: "30%", size: 44, delay: 0, icon: "004-aries.svg" },
  { top: "15%", left: "65%", size: 48, delay: 0.4, icon: "008-leo.svg" },
  { top: "35%", left: "12%", size: 42, delay: 0.8, icon: "028-crystal ball.svg" },
  { top: "60%", left: "8%", size: 46, delay: 1.2, icon: "009-virgo.svg" },
  { top: "75%", left: "30%", size: 40, delay: 1.6, icon: "021-numerology.svg" },
  { top: "80%", left: "72%", size: 50, delay: 2.0, icon: "020-astrology.svg" },
  { top: "45%", left: "82%", size: 44, delay: 2.4, icon: "011-scorpio.svg" },
  { top: "5%", left: "50%", size: 38, delay: 2.8, icon: "003-pisces.svg" },
];

// ═══════════════════════════════════════════════════════════════
// COMPONENTES
// ═══════════════════════════════════════════════════════════════

// ---------------------------------------------------------------------------
// Navbar
// ---------------------------------------------------------------------------
function Navbar() {
  return (
    <motion.nav
      initial={{ opacity: 0, y: -16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: EASE_OUT_EXPO, delay: 0.1 }}
      className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-5 lg:px-10"
      style={{
        background: "linear-gradient(180deg, rgba(15,10,26,0.7) 0%, rgba(15,10,26,0) 100%)",
      }}
    >
      {/* Logo */}
      <Link href="/landing" className="flex items-center gap-2.5">
        <Image
          src="/img/isotipo-blanco.png"
          alt="ASTRA"
          width={28}
          height={28}
          className="opacity-90"
        />
        <span className="text-[17px] font-semibold tracking-[0.04em] text-white/90">
          ASTRA
        </span>
      </Link>

      {/* Links centro */}
      <div className="hidden items-center gap-8 md:flex">
        {NAV_LINKS.map((link) => (
          <a
            key={link.href}
            href={link.href}
            className="text-[14px] text-white/60 transition-colors hover:text-white/90"
          >
            {link.label}
          </a>
        ))}
      </div>

      {/* Auth derecha */}
      <div className="flex items-center gap-3">
        <Link
          href="/login"
          className="hidden text-[14px] text-white/60 transition-colors hover:text-white/90 sm:block"
        >
          Iniciar sesión
        </Link>
        <Link
          href="/registro"
          className="rounded-full border border-white/20 bg-white/5 px-4 py-2 text-[13px] font-medium text-white backdrop-blur-sm transition-all hover:border-white/30 hover:bg-white/10"
        >
          Comenzar
        </Link>
      </div>
    </motion.nav>
  );
}

// ---------------------------------------------------------------------------
// Hero — orbital circles + headline serif
// ---------------------------------------------------------------------------
function Hero() {
  return (
    <section className="relative flex min-h-[100dvh] items-center overflow-hidden">
      {/* BG gradient con blurs */}
      <div className="absolute inset-0" style={{ background: "#0F0A1A" }}>
        {/* Bloom violeta top-left */}
        <div
          className="absolute -left-[10%] -top-[20%] h-[700px] w-[700px] rounded-full blur-[140px]"
          style={{ background: "rgba(124,77,255,0.25)" }}
        />
        {/* Bloom violeta center */}
        <div
          className="absolute left-[30%] top-[20%] h-[500px] w-[500px] rounded-full blur-[160px]"
          style={{ background: "rgba(168,85,247,0.12)" }}
        />
        {/* Bloom oscuro bottom-right */}
        <div
          className="absolute -bottom-[10%] -right-[5%] h-[600px] w-[600px] rounded-full blur-[120px]"
          style={{ background: "rgba(30,15,60,0.6)" }}
        />
      </div>

      <div className="relative z-10 mx-auto flex w-full max-w-[1280px] flex-col gap-12 px-6 pt-28 pb-20 lg:flex-row lg:items-center lg:gap-8 lg:px-10 lg:pt-0 lg:pb-0">
        {/* Columna izquierda — headline */}
        <div className="flex flex-col gap-8 lg:w-[48%] lg:gap-10">
          <motion.h1
            variants={FADE_UP}
            initial="hidden"
            animate="visible"
            custom={0}
            className="font-[var(--font-serif)] text-[clamp(36px,6vw,72px)] leading-[1.08] tracking-[-0.02em] text-white"
            style={{ fontFamily: "var(--font-serif), Georgia, serif" }}
          >
            Accedé a la Sabiduría Cósmica Que Creías Inalcanzable — Ahora a Solo Un Click
          </motion.h1>

          <motion.p
            variants={FADE_UP}
            initial="hidden"
            animate="visible"
            custom={2}
            className="max-w-[440px] text-[15px] leading-[1.7] text-white/50"
          >
            Carta Astral, Diseño Humano y Numerología integrados en una sola plataforma.
            Precisión astronómica real con Swiss Ephemeris.
          </motion.p>

          <motion.div
            variants={FADE_UP}
            initial="hidden"
            animate="visible"
            custom={3}
            className="flex items-center gap-4"
          >
            <Link
              href="/registro"
              className="group flex items-center gap-2 rounded-full bg-white/[0.07] border border-white/[0.12] px-6 py-3 text-[14px] font-medium text-white backdrop-blur-sm transition-all hover:bg-white/[0.12] hover:border-white/20"
            >
              Comenzar gratis
              <svg
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="none"
                className="transition-transform group-hover:translate-x-0.5"
              >
                <path
                  d="M3 8h10m0 0L9 4m4 4L9 12"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </Link>
          </motion.div>

          {/* Cursor tooltip como en la referencia */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 1.2 }}
            className="hidden items-center gap-1.5 lg:flex"
          >
            <svg width="14" height="18" viewBox="0 0 14 18" fill="none">
              <path
                d="M1 1l5 15 2-6 6-2L1 1z"
                fill="#a855f7"
                stroke="#a855f7"
                strokeWidth="1"
                strokeLinejoin="round"
              />
            </svg>
            <span className="rounded-full bg-violet-500 px-3 py-1 text-[11px] font-medium text-white">
              Astra
            </span>
          </motion.div>
        </div>

        {/* Columna derecha — orbital circles */}
        <div className="relative flex items-center justify-center lg:w-[52%]">
          <OrbitalUI />
        </div>
      </div>

      {/* Trust bar bottom */}
      <div className="absolute bottom-0 left-0 right-0 z-10 border-t border-white/[0.06]">
        <div className="mx-auto flex max-w-[1280px] items-center justify-between gap-6 overflow-x-auto px-6 py-5 lg:px-10">
          {TRUST_ITEMS.map((item) => (
            <div
              key={item.label}
              className="flex shrink-0 items-center gap-2 opacity-40 transition-opacity hover:opacity-60"
            >
              <Image
                src={`/img/icons/${item.icon}`}
                alt={item.label}
                width={20}
                height={20}
                className="brightness-0 invert"
              />
              <span className="text-[13px] font-medium tracking-wide text-white whitespace-nowrap">
                {item.label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Orbital UI — círculos concéntricos + elementos flotantes
// ---------------------------------------------------------------------------
function OrbitalUI() {
  return (
    <div className="relative aspect-square w-full max-w-[520px]">
      {/* Círculos concéntricos */}
      {[0.95, 0.68, 0.42].map((scale, i) => (
        <div
          key={i}
          className="absolute left-1/2 top-1/2 rounded-full border border-white/[0.07]"
          style={{
            width: `${scale * 100}%`,
            height: `${scale * 100}%`,
            transform: "translate(-50%, -50%)",
          }}
        />
      ))}

      {/* Stat central */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8, ease: EASE_OUT_EXPO, delay: 0.6 }}
        className="absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-1/2 flex-col items-center"
      >
        <span
          className="text-[clamp(48px,8vw,72px)] font-light tracking-[-0.03em] text-white"
          style={{ fontFamily: "var(--font-serif), Georgia, serif" }}
        >
          3 en 1
        </span>
        <span className="text-[13px] tracking-[0.08em] text-white/50">Disciplinas</span>
      </motion.div>

      {/* Elementos orbitales flotantes */}
      {ORBITAL_ITEMS.map((item, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{
            duration: 0.6,
            ease: EASE_OUT_EXPO,
            delay: 0.8 + item.delay * 0.3,
          }}
          className="absolute"
          style={{
            top: item.top,
            left: item.left,
            width: item.size,
            height: item.size,
            animation: `landing-float ${3 + (i % 3)}s ease-in-out ${item.delay}s infinite alternate`,
          }}
        >
          <div
            className="flex h-full w-full items-center justify-center rounded-2xl border border-white/10 backdrop-blur-sm"
            style={{
              background: "linear-gradient(135deg, rgba(255,255,255,0.08), rgba(255,255,255,0.02))",
              boxShadow: "0 4px 24px rgba(124,77,255,0.15), inset 0 1px 0 rgba(255,255,255,0.06)",
            }}
          >
            <Image
              src={`/img/icons/${item.icon}`}
              alt=""
              width={item.size * 0.5}
              height={item.size * 0.5}
              className="brightness-0 invert opacity-70"
            />
          </div>
        </motion.div>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Sección de Features
// ---------------------------------------------------------------------------
function SeccionFeatures() {
  const { ref, enVista } = usarInView();

  return (
    <section
      id="funciones"
      ref={ref}
      className="relative overflow-hidden py-28 lg:py-36"
      style={{ background: "#0B0716" }}
    >
      <div className="mx-auto max-w-[1280px] px-6 lg:px-10">
        <motion.div
          variants={FADE_UP}
          initial="hidden"
          animate={enVista ? "visible" : "hidden"}
          custom={0}
          className="mb-16 max-w-[560px]"
        >
          <span className="mb-4 inline-block text-[11px] font-semibold uppercase tracking-[0.2em] text-violet-400">
            Todo integrado
          </span>
          <h2
            className="text-[clamp(28px,4vw,48px)] leading-[1.1] tracking-[-0.02em] text-white"
            style={{ fontFamily: "var(--font-serif), Georgia, serif" }}
          >
            Lo que tu mapa cósmico revela
          </h2>
        </motion.div>

        <div className="grid gap-5 md:grid-cols-2">
          {FEATURES.map((feat, i) => (
            <motion.div
              key={feat.titulo}
              variants={FADE_UP}
              initial="hidden"
              animate={enVista ? "visible" : "hidden"}
              custom={i + 1}
              className="group relative overflow-hidden rounded-[20px] border border-white/[0.06] p-7 transition-all hover:border-white/[0.12] lg:p-9"
              style={{
                background:
                  "linear-gradient(135deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.01) 100%)",
              }}
            >
              {/* Glow sutil en hover */}
              <div
                className="pointer-events-none absolute -right-20 -top-20 h-40 w-40 rounded-full blur-[80px] opacity-0 transition-opacity duration-500 group-hover:opacity-100"
                style={{ background: "rgba(124,77,255,0.15)" }}
              />

              <div className="relative">
                <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl border border-white/[0.08] bg-white/[0.04]">
                  <Image
                    src={`/img/icons/${feat.icono}`}
                    alt=""
                    width={24}
                    height={24}
                    className="brightness-0 invert opacity-60"
                  />
                </div>
                <h3 className="mb-3 text-[18px] font-semibold leading-snug text-white lg:text-[20px]">
                  {feat.titulo}
                </h3>
                <p className="text-[14px] leading-[1.7] text-white/45 lg:text-[15px]">
                  {feat.descripcion}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Cómo funciona — 3 pasos
// ---------------------------------------------------------------------------
function SeccionPasos() {
  const { ref, enVista } = usarInView();

  return (
    <section
      id="como-funciona"
      ref={ref}
      className="relative overflow-hidden py-28 lg:py-36"
      style={{ background: "#0F0A1A" }}
    >
      {/* Glow decorativo */}
      <div
        className="pointer-events-none absolute left-1/2 top-0 h-[400px] w-[600px] -translate-x-1/2 blur-[160px]"
        style={{ background: "rgba(124,77,255,0.08)" }}
      />

      <div className="relative mx-auto max-w-[1280px] px-6 lg:px-10">
        <motion.div
          variants={FADE_UP}
          initial="hidden"
          animate={enVista ? "visible" : "hidden"}
          custom={0}
          className="mb-16 text-center"
        >
          <span className="mb-4 inline-block text-[11px] font-semibold uppercase tracking-[0.2em] text-violet-400">
            Simple y rápido
          </span>
          <h2
            className="mx-auto max-w-[480px] text-[clamp(28px,4vw,48px)] leading-[1.1] tracking-[-0.02em] text-white"
            style={{ fontFamily: "var(--font-serif), Georgia, serif" }}
          >
            Comenzá en tres pasos
          </h2>
        </motion.div>

        <div className="grid gap-6 md:grid-cols-3 md:gap-8">
          {PASOS.map((paso, i) => (
            <motion.div
              key={paso.numero}
              variants={FADE_UP}
              initial="hidden"
              animate={enVista ? "visible" : "hidden"}
              custom={i + 1}
              className="relative rounded-[20px] border border-white/[0.06] p-7 lg:p-8"
              style={{
                background:
                  "linear-gradient(180deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.005) 100%)",
              }}
            >
              <span
                className="mb-6 block text-[48px] font-light tracking-[-0.04em] text-violet-500/30"
                style={{ fontFamily: "var(--font-serif), Georgia, serif" }}
              >
                {paso.numero}
              </span>
              <h3 className="mb-2 text-[17px] font-semibold text-white">
                {paso.titulo}
              </h3>
              <p className="text-[14px] leading-[1.7] text-white/45">
                {paso.descripcion}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Testimonios
// ---------------------------------------------------------------------------
function SeccionTestimonios() {
  const { ref, enVista } = usarInView();

  return (
    <section
      ref={ref}
      className="relative overflow-hidden py-28 lg:py-36"
      style={{ background: "#0B0716" }}
    >
      <div className="mx-auto max-w-[1280px] px-6 lg:px-10">
        <motion.div
          variants={FADE_UP}
          initial="hidden"
          animate={enVista ? "visible" : "hidden"}
          custom={0}
          className="mb-16 text-center"
        >
          <span className="mb-4 inline-block text-[11px] font-semibold uppercase tracking-[0.2em] text-violet-400">
            Comunidad
          </span>
          <h2
            className="mx-auto max-w-[520px] text-[clamp(28px,4vw,48px)] leading-[1.1] tracking-[-0.02em] text-white"
            style={{ fontFamily: "var(--font-serif), Georgia, serif" }}
          >
            Lo que dicen quienes ya descubrieron su mapa
          </h2>
        </motion.div>

        <div className="grid gap-5 md:grid-cols-3">
          {TESTIMONIOS.map((test, i) => (
            <motion.div
              key={test.nombre}
              variants={FADE_UP}
              initial="hidden"
              animate={enVista ? "visible" : "hidden"}
              custom={i + 1}
              className="rounded-[20px] border border-white/[0.06] p-7 lg:p-8"
              style={{
                background:
                  "linear-gradient(135deg, rgba(255,255,255,0.03), rgba(255,255,255,0.01))",
              }}
            >
              {/* Estrellas */}
              <div className="mb-5 flex gap-1">
                {[...Array(5)].map((_, j) => (
                  <svg
                    key={j}
                    width="14"
                    height="14"
                    viewBox="0 0 14 14"
                    fill="#a855f7"
                  >
                    <path d="M7 0l2.16 4.38 4.84.7-3.5 3.42.83 4.8L7 11.18 2.67 13.3l.83-4.8-3.5-3.42 4.84-.7L7 0z" />
                  </svg>
                ))}
              </div>

              <p className="mb-6 text-[14px] leading-[1.7] text-white/60 lg:text-[15px]">
                &ldquo;{test.texto}&rdquo;
              </p>

              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-violet-500/20 text-[12px] font-semibold text-violet-300">
                  {test.avatar}
                </div>
                <div>
                  <p className="text-[13px] font-medium text-white">
                    {test.nombre}
                  </p>
                  <p className="text-[12px] text-white/40">{test.rol}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Pricing
// ---------------------------------------------------------------------------
function SeccionPrecios() {
  const { ref, enVista } = usarInView();

  return (
    <section
      id="precios"
      ref={ref}
      className="relative overflow-hidden py-28 lg:py-36"
      style={{ background: "#0F0A1A" }}
    >
      {/* Glow */}
      <div
        className="pointer-events-none absolute right-[20%] top-[10%] h-[400px] w-[400px] rounded-full blur-[160px]"
        style={{ background: "rgba(124,77,255,0.08)" }}
      />

      <div className="relative mx-auto max-w-[960px] px-6 lg:px-10">
        <motion.div
          variants={FADE_UP}
          initial="hidden"
          animate={enVista ? "visible" : "hidden"}
          custom={0}
          className="mb-16 text-center"
        >
          <span className="mb-4 inline-block text-[11px] font-semibold uppercase tracking-[0.2em] text-violet-400">
            Precios
          </span>
          <h2
            className="mx-auto max-w-[480px] text-[clamp(28px,4vw,48px)] leading-[1.1] tracking-[-0.02em] text-white"
            style={{ fontFamily: "var(--font-serif), Georgia, serif" }}
          >
            Elegí tu plan
          </h2>
        </motion.div>

        <div className="grid gap-6 md:grid-cols-2">
          {[PLAN_GRATIS, PLAN_PREMIUM].map((plan, i) => (
            <motion.div
              key={plan.nombre}
              variants={FADE_UP}
              initial="hidden"
              animate={enVista ? "visible" : "hidden"}
              custom={i + 1}
              className={`relative overflow-hidden rounded-[24px] border p-8 lg:p-10 ${
                plan.destacado
                  ? "border-violet-500/30"
                  : "border-white/[0.06]"
              }`}
              style={{
                background: plan.destacado
                  ? "linear-gradient(135deg, rgba(124,77,255,0.1), rgba(124,77,255,0.03))"
                  : "linear-gradient(135deg, rgba(255,255,255,0.03), rgba(255,255,255,0.01))",
              }}
            >
              {plan.destacado && (
                <div
                  className="pointer-events-none absolute -right-20 -top-20 h-48 w-48 rounded-full blur-[100px]"
                  style={{ background: "rgba(124,77,255,0.15)" }}
                />
              )}

              <div className="relative">
                {plan.destacado && (
                  <span className="mb-4 inline-block rounded-full bg-violet-500/20 px-3 py-1 text-[11px] font-semibold text-violet-300">
                    Recomendado
                  </span>
                )}

                <h3 className="mb-2 text-[20px] font-semibold text-white">
                  {plan.nombre}
                </h3>

                <div className="mb-6 flex items-baseline gap-1.5">
                  <span
                    className="text-[42px] font-light tracking-[-0.03em] text-white"
                    style={{ fontFamily: "var(--font-serif), Georgia, serif" }}
                  >
                    {plan.precio}
                  </span>
                  <span className="text-[14px] text-white/40">
                    {plan.periodo}
                  </span>
                </div>

                <ul className="mb-8 flex flex-col gap-3">
                  {plan.features.map((feat) => (
                    <li
                      key={feat}
                      className="flex items-start gap-2.5 text-[14px] text-white/60"
                    >
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 16 16"
                        fill="none"
                        className="mt-0.5 shrink-0 text-violet-400"
                      >
                        <path
                          d="M3.5 8.5L6.5 11.5L12.5 4.5"
                          stroke="currentColor"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                      {feat}
                    </li>
                  ))}
                </ul>

                <Link
                  href="/registro"
                  className={`block w-full rounded-full py-3 text-center text-[14px] font-medium transition-all ${
                    plan.destacado
                      ? "bg-violet-500 text-white hover:bg-violet-400"
                      : "border border-white/[0.1] bg-white/[0.04] text-white hover:bg-white/[0.08]"
                  }`}
                >
                  {plan.destacado ? "Comenzar ahora" : "Crear cuenta gratis"}
                </Link>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// CTA final
// ---------------------------------------------------------------------------
function SeccionCTA() {
  const { ref, enVista } = usarInView();

  return (
    <section ref={ref} className="relative overflow-hidden py-28 lg:py-36" style={{ background: "#0B0716" }}>
      {/* Glows */}
      <div
        className="pointer-events-none absolute left-1/2 top-1/2 h-[500px] w-[700px] -translate-x-1/2 -translate-y-1/2 rounded-full blur-[180px]"
        style={{ background: "rgba(124,77,255,0.1)" }}
      />

      <motion.div
        variants={FADE_UP}
        initial="hidden"
        animate={enVista ? "visible" : "hidden"}
        custom={0}
        className="relative mx-auto max-w-[640px] px-6 text-center lg:px-10"
      >
        <h2
          className="mb-6 text-[clamp(28px,5vw,52px)] leading-[1.1] tracking-[-0.02em] text-white"
          style={{ fontFamily: "var(--font-serif), Georgia, serif" }}
        >
          Tu mapa cósmico te está esperando
        </h2>
        <p className="mx-auto mb-10 max-w-[400px] text-[15px] leading-[1.7] text-white/45">
          Descubrí lo que las estrellas, los números y tu diseño revelan sobre vos. Gratis, en minutos.
        </p>
        <Link
          href="/registro"
          className="group inline-flex items-center gap-2 rounded-full bg-violet-500 px-8 py-3.5 text-[15px] font-medium text-white transition-all hover:bg-violet-400"
        >
          Crear mi perfil gratis
          <svg
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
            className="transition-transform group-hover:translate-x-0.5"
          >
            <path
              d="M3 8h10m0 0L9 4m4 4L9 12"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </Link>
      </motion.div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Footer
// ---------------------------------------------------------------------------
function FooterLanding() {
  return (
    <footer
      className="border-t border-white/[0.06] py-12"
      style={{ background: "#080510" }}
    >
      <div className="mx-auto flex max-w-[1280px] flex-col items-center gap-8 px-6 md:flex-row md:justify-between lg:px-10">
        {/* Logo */}
        <div className="flex items-center gap-2.5">
          <Image
            src="/img/isotipo-blanco.png"
            alt="ASTRA"
            width={22}
            height={22}
            className="opacity-70"
          />
          <span className="text-[14px] font-semibold tracking-[0.04em] text-white/50">
            ASTRA
          </span>
        </div>

        {/* Links */}
        <div className="flex flex-wrap items-center justify-center gap-6">
          {[
            { label: "Política de privacidad", href: "/politica-de-privacidad" },
            { label: "Términos", href: "/terminos" },
          ].map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-[13px] text-white/30 transition-colors hover:text-white/50"
            >
              {link.label}
            </Link>
          ))}
        </div>

        {/* Copy */}
        <p className="text-[12px] text-white/25">
          &copy; {new Date().getFullYear()} ASTRA. Todos los derechos reservados.
        </p>
      </div>
    </footer>
  );
}

// ═══════════════════════════════════════════════════════════════
// PAGE
// ═══════════════════════════════════════════════════════════════
export default function PaginaLanding() {
  return (
    <main className="min-h-screen bg-[#0F0A1A] text-white">
      {/* CSS para animación float de los orbitales */}
      <style>{`
        @keyframes landing-float {
          0% { transform: translateY(0px); }
          100% { transform: translateY(-8px); }
        }
      `}</style>

      <Navbar />
      <Hero />
      <SeccionFeatures />
      <SeccionPasos />
      <SeccionTestimonios />
      <SeccionPrecios />
      <SeccionCTA />
      <FooterLanding />
    </main>
  );
}
