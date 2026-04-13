"use client";

import Image from "next/image";
import { motion, useReducedMotion } from "motion/react";
import { IconoAstral, type NombreIconoAstral } from "./icono-astral";

/* ────────────────────────────────────────────────────────
   Configuración de elementos orbitales
   ──────────────────────────────────────────────────────── */

interface ElementoOrbita {
  id: string;
  angulo: number;
  radioPercent: number;
  forma: "tarjeta" | "circulo" | "punto";
  icono?: NombreIconoAstral;
  tamano: number;
  floatDuracion: number;
  floatRetraso: number;
  ocultoMobile?: boolean;
}

const ELEMENTOS: ElementoOrbita[] = [
  // ── Anillo exterior (~44%) ──
  {
    id: "astro",
    angulo: 50,
    radioPercent: 44,
    forma: "tarjeta",
    icono: "astrologia",
    tamano: 56,
    floatDuracion: 5.2,
    floatRetraso: 0,
  },
  {
    id: "num",
    angulo: 145,
    radioPercent: 44,
    forma: "circulo",
    icono: "numerologia",
    tamano: 48,
    floatDuracion: 5.8,
    floatRetraso: 0.7,
  },
  {
    id: "emo",
    angulo: 228,
    radioPercent: 44,
    forma: "tarjeta",
    icono: "emocion",
    tamano: 46,
    floatDuracion: 5.4,
    floatRetraso: 1.4,
  },
  {
    id: "car",
    angulo: 318,
    radioPercent: 44,
    forma: "circulo",
    icono: "carrera",
    tamano: 44,
    floatDuracion: 4.9,
    floatRetraso: 0.3,
  },

  // ── Anillo medio (~30%) ──
  {
    id: "per",
    angulo: 12,
    radioPercent: 30,
    forma: "tarjeta",
    icono: "personal",
    tamano: 52,
    floatDuracion: 6,
    floatRetraso: 0.2,
  },
  {
    id: "lib",
    angulo: 115,
    radioPercent: 30,
    forma: "circulo",
    icono: "libro",
    tamano: 44,
    floatDuracion: 5.5,
    floatRetraso: 0.9,
  },
  {
    id: "sal",
    angulo: 295,
    radioPercent: 30,
    forma: "tarjeta",
    icono: "salud",
    tamano: 44,
    floatDuracion: 5.6,
    floatRetraso: 0.5,
  },
  {
    id: "p1",
    angulo: 205,
    radioPercent: 30,
    forma: "punto",
    tamano: 10,
    floatDuracion: 4,
    floatRetraso: 1.1,
    ocultoMobile: true,
  },

  // ── Anillo interior (~18%) — decorativo ──
  {
    id: "p2",
    angulo: 65,
    radioPercent: 18,
    forma: "punto",
    tamano: 8,
    floatDuracion: 3.6,
    floatRetraso: 0.6,
    ocultoMobile: true,
  },
  {
    id: "p3",
    angulo: 245,
    radioPercent: 18,
    forma: "punto",
    tamano: 10,
    floatDuracion: 4.2,
    floatRetraso: 1.3,
    ocultoMobile: true,
  },
];

/* ────────────────────────────────────────────────────────
   Helpers
   ──────────────────────────────────────────────────────── */

function posicion(angulo: number, radio: number) {
  const rad = (angulo * Math.PI) / 180;
  return {
    left: `${50 + Math.cos(rad) * radio}%`,
    top: `${50 - Math.sin(rad) * radio}%`,
  };
}

/* ────────────────────────────────────────────────────────
   Sub-componentes
   ──────────────────────────────────────────────────────── */

function AnilloSVG({
  radio,
  opacidad,
}: {
  radio: number;
  opacidad: number;
}) {
  return (
    <div
      className="pointer-events-none absolute left-1/2 top-1/2"
      style={{
        width: `${radio * 2}%`,
        height: `${radio * 2}%`,
        transform: "translate(-50%, -50%)",
      }}
    >
      <svg viewBox="0 0 200 200" className="h-full w-full" fill="none">
        <circle
          cx="100"
          cy="100"
          r="99"
          stroke={`rgba(255, 255, 255, ${opacidad})`}
          strokeWidth="0.5"
        />
      </svg>
    </div>
  );
}

function TarjetaIcono({
  icono,
  tamano,
}: {
  icono: NombreIconoAstral;
  tamano: number;
}) {
  return (
    <div
      className="flex items-center justify-center rounded-[18%] border border-white/[0.1] bg-[#1a0f2e]/85 shadow-xl shadow-black/25 backdrop-blur-xl transition-transform duration-300 hover:scale-110"
      style={{ width: tamano, height: tamano }}
    >
      <IconoAstral
        nombre={icono}
        tamano={Math.round(tamano * 0.48)}
        className="text-[#B388FF]"
      />
    </div>
  );
}

function CirculoIcono({
  icono,
  tamano,
}: {
  icono: NombreIconoAstral;
  tamano: number;
}) {
  return (
    <div
      className="flex items-center justify-center rounded-full border-[1.5px] border-[#B388FF]/20 bg-[#1a0f2e]/85 shadow-[0_0_20px_rgba(179,136,255,0.08)] backdrop-blur-xl transition-transform duration-300 hover:scale-110"
      style={{ width: tamano, height: tamano }}
    >
      <IconoAstral
        nombre={icono}
        tamano={Math.round(tamano * 0.46)}
        className="text-[#B388FF]"
      />
    </div>
  );
}

function PuntoDecorativo({ tamano }: { tamano: number }) {
  return (
    <div
      className="rounded-full bg-[#B388FF]/35 shadow-[0_0_10px_rgba(179,136,255,0.3)]"
      style={{ width: tamano, height: tamano }}
    />
  );
}

/* ── Elemento posicionado con animación float ─────────── */

function ElementoFlotante({ el }: { el: ElementoOrbita }) {
  const reducir = useReducedMotion();
  const { left, top } = posicion(el.angulo, el.radioPercent);

  const contenido =
    el.forma === "tarjeta" && el.icono ? (
      <TarjetaIcono icono={el.icono} tamano={el.tamano} />
    ) : el.forma === "circulo" && el.icono ? (
      <CirculoIcono icono={el.icono} tamano={el.tamano} />
    ) : (
      <PuntoDecorativo tamano={el.tamano} />
    );

  return (
    <motion.div
      className={`absolute z-[5] ${el.ocultoMobile ? "hidden md:block" : ""}`}
      style={{ left, top, transform: "translate(-50%, -50%)" }}
      initial={reducir ? false : { opacity: 0, scale: 0.5 }}
      animate={reducir ? undefined : { opacity: 1, scale: 1 }}
      transition={{
        duration: 0.65,
        delay: 0.5 + el.floatRetraso,
        ease: [0.22, 1, 0.36, 1],
      }}
    >
      <motion.div
        animate={reducir ? undefined : { y: [0, -6, 0] }}
        transition={{
          duration: el.floatDuracion,
          repeat: Infinity,
          ease: "easeInOut",
          delay: el.floatRetraso,
        }}
      >
        {contenido}
      </motion.div>
    </motion.div>
  );
}

/* ────────────────────────────────────────────────────────
   DiagramaOrbital — componente principal
   ──────────────────────────────────────────────────────── */

export function DiagramaOrbital() {
  const reducir = useReducedMotion();

  return (
    <motion.div
      className="relative mx-auto aspect-square w-[300px] sm:w-[400px] md:w-[480px] lg:w-full lg:max-w-[580px]"
      initial={reducir ? false : { opacity: 0, scale: 0.94 }}
      animate={reducir ? undefined : { opacity: 1, scale: 1 }}
      transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1], delay: 0.1 }}
      aria-label="Diagrama orbital de ASTRA: astrología, numerología y Diseño Humano conectados"
    >
      {/* Glow de fondo */}
      <div className="absolute inset-[20%] rounded-full bg-[#7C4DFF]/8 blur-[60px]" />

      {/* Anillos */}
      <AnilloSVG radio={44} opacidad={0.07} />
      <AnilloSVG radio={30} opacidad={0.1} />
      <AnilloSVG radio={18} opacidad={0.14} />

      {/* Elementos orbitales */}
      {ELEMENTOS.map((el) => (
        <ElementoFlotante key={el.id} el={el} />
      ))}

      {/* Centro */}
      <motion.div
        className="absolute left-1/2 top-1/2 z-10 flex -translate-x-1/2 -translate-y-1/2 flex-col items-center text-center"
        initial={reducir ? false : { opacity: 0, scale: 0.7 }}
        animate={reducir ? undefined : { opacity: 1, scale: 1 }}
        transition={{
          duration: 0.85,
          delay: 0.55,
          ease: [0.22, 1, 0.36, 1],
        }}
      >
        <Image
          src="/img/isotipo-blanco.png"
          alt=""
          width={48}
          height={52}
          className="mb-2 h-12 w-auto drop-shadow-[0_0_24px_rgba(179,136,255,0.25)]"
        />
        <p className="font-display text-[24px] font-bold tracking-[-0.025em] text-white sm:text-[28px] md:text-[32px]">
          ASTRA
        </p>
        <p className="mt-0.5 text-[9px] font-medium uppercase tracking-[0.3em] text-[color:var(--texto-muted)] sm:text-[10px] md:text-[11px]">
          Tu mapa cósmico
        </p>
      </motion.div>
    </motion.div>
  );
}
