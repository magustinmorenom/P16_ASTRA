"use client";

import Link from "next/link";

import HeaderMobile from "@/componentes/layouts/header-mobile";
import { Icono } from "@/componentes/ui/icono";
import {
  IconoAstral,
  type NombreIconoAstral,
} from "@/componentes/ui/icono-astral";

interface CardDescubrir {
  titulo: string;
  subtitulo: string;
  icono: NombreIconoAstral;
  ruta: string;
  disponible: "ahora" | "proximo";
}

const SUPERFICIE_HERO =
  "tema-superficie-hero relative overflow-hidden rounded-[24px]";
const SUPERFICIE_ITEM =
  "tema-superficie-panel-suave block rounded-[20px] p-5 transition-all hover:-translate-y-0.5 hover:brightness-[1.01]";

const cards: CardDescubrir[] = [
  {
    titulo: "Diseño Humano",
    subtitulo: "Tu tipo, tu autoridad y la mecánica que sostiene tus decisiones.",
    icono: "personal",
    ruta: "/diseno-humano",
    disponible: "ahora",
  },
  {
    titulo: "Numerología",
    subtitulo: "Núcleo, ritmo y etapas en una lectura más compacta.",
    icono: "numerologia",
    ruta: "/numerologia",
    disponible: "ahora",
  },
  {
    titulo: "Calendario Cósmico",
    subtitulo: "Vista mensual compacta con número personal, fase lunar y eventos de tránsito.",
    icono: "horoscopo",
    ruta: "/calendario-cosmico",
    disponible: "ahora",
  },
  {
    titulo: "Revolución Solar",
    subtitulo: "Tu mapa anual cuando cambia el ciclo del Sol.",
    icono: "astrologia",
    ruta: "/retorno-solar",
    disponible: "proximo",
  },
  {
    titulo: "Tránsitos",
    subtitulo: "Posiciones actuales y velocidad de los planetas en tiempo real.",
    icono: "horoscopo",
    ruta: "/transitos",
    disponible: "ahora",
  },
  {
    titulo: "Match de Pareja",
    subtitulo: "Cruce de compatibilidad entre astrología, numerología y diseño humano.",
    icono: "compatibilidad",
    ruta: "/match-pareja",
    disponible: "proximo",
  },
];

export default function PaginaDescubrir() {
  return (
    <>
      <HeaderMobile titulo="Descubrir" />

      <section
        className="relative min-h-full overflow-hidden"
        style={{ background: "var(--shell-fondo)" }}
      >
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(circle_at_top_left, var(--shell-glow-1), transparent 26%), radial-gradient(circle_at_top_right, var(--shell-glow-2), transparent 24%), radial-gradient(circle_at_bottom_left, var(--shell-glow-1), transparent 32%)",
          }}
        />
        <div
          className="absolute right-[-80px] top-0 h-72 w-72 rounded-full blur-3xl"
          style={{ background: "var(--shell-glow-2)" }}
        />
        <div
          className="absolute left-[-40px] top-1/3 h-64 w-64 rounded-full blur-3xl"
          style={{ background: "var(--shell-glow-1)" }}
        />

        <div className="relative z-10 mx-auto max-w-6xl px-4 py-5 lg:px-6 lg:py-6">
          <section className={`${SUPERFICIE_HERO} p-5 sm:p-6 lg:p-7`}>
            <div className="flex items-start gap-4">
              <div className="tema-gradiente-acento rounded-[22px] border border-shell-borde p-4 text-white shadow-[var(--shell-sombra-fuerte)]">
                <IconoAstral nombre="libro" tamaño={24} className="text-white" />
              </div>

              <div className="min-w-0">
                <p className="tema-hero-secundario text-[11px] font-semibold uppercase tracking-[0.18em]">
                  Explorar ASTRA
                </p>
                <h1 className="tema-hero-titulo mt-2 text-lg font-semibold tracking-tight sm:text-xl">
                  Elegí la herramienta que querés abrir
                </h1>
                <p className="tema-hero-secundario mt-2 text-sm leading-6">
                  Todo el sistema en el mismo lenguaje: lecturas compactas, panel
                  contextual y menos ruido visual.
                </p>
              </div>
            </div>
          </section>

          <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {cards.map((card) => (
              <Link
                key={card.ruta}
                href={card.ruta}
                className={SUPERFICIE_ITEM}
              >
                <div className="flex items-start justify-between gap-3">
                  <div
                    className="rounded-[18px] border p-3"
                    style={{
                      borderColor: "var(--shell-chip-borde)",
                      background: "var(--shell-gradiente-acento-suave)",
                      color: "var(--color-acento)",
                    }}
                  >
                    <IconoAstral nombre={card.icono} tamaño={22} />
                  </div>

                  <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[color:var(--shell-texto-tenue)]">
                    {card.disponible === "ahora" ? "Disponible" : "Próximamente"}
                  </span>
                </div>

                <div className="mt-5">
                  <h2 className="text-base font-semibold text-[color:var(--shell-texto)]">
                    {card.titulo}
                  </h2>
                  <p className="mt-2 text-sm leading-6 text-[color:var(--shell-texto-secundario)]">
                    {card.subtitulo}
                  </p>
                </div>

                <div
                  className="mt-5 flex items-center justify-between border-t pt-4 text-sm text-[color:var(--shell-texto-secundario)]"
                  style={{ borderColor: "var(--shell-borde)" }}
                >
                  <span>
                    {card.disponible === "ahora" ? "Abrir lectura" : "Ver avance"}
                  </span>
                  <Icono nombre="caretDerecha" tamaño={16} className="text-[color:var(--shell-texto-tenue)]" />
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
