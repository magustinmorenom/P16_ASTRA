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
  "relative overflow-hidden rounded-[24px] border border-white/[0.08] bg-[radial-gradient(circle_at_top_left,rgba(179,136,255,0.2),transparent_32%),linear-gradient(135deg,rgba(45,27,105,0.96),rgba(22,1,27,0.98))] shadow-[0_24px_70px_rgba(8,2,22,0.38)]";
const SUPERFICIE_ITEM =
  "rounded-[20px] border border-white/[0.08] bg-white/[0.04] transition-colors hover:border-white/[0.14] hover:bg-white/[0.06]";

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
    subtitulo: "Lectura diaria de ventanas, clima y ritmo del día.",
    icono: "horoscopo",
    ruta: "/calendario-cosmico",
    disponible: "proximo",
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

      <section className="relative min-h-full overflow-hidden bg-[#16011B] text-white">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(124,77,255,0.22),transparent_26%),radial-gradient(circle_at_top_right,rgba(179,136,255,0.14),transparent_24%),radial-gradient(circle_at_bottom_left,rgba(76,35,140,0.16),transparent_32%)]" />
        <div className="absolute right-[-80px] top-0 h-72 w-72 rounded-full bg-[#B388FF]/14 blur-3xl" />
        <div className="absolute left-[-40px] top-1/3 h-64 w-64 rounded-full bg-[#7C4DFF]/12 blur-3xl" />

        <div className="relative z-10 mx-auto max-w-6xl px-4 py-5 lg:px-6 lg:py-6">
          <section className={`${SUPERFICIE_HERO} p-5 sm:p-6 lg:p-7`}>
            <div className="flex items-start gap-4">
              <div className="rounded-[22px] border border-white/10 bg-[linear-gradient(135deg,rgba(124,77,255,0.92),rgba(179,136,255,0.72))] p-4 text-white shadow-[0_16px_34px_rgba(34,10,76,0.34)]">
                <IconoAstral nombre="libro" tamaño={24} className="text-white" />
              </div>

              <div className="min-w-0">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-violet-200/72">
                  Explorar ASTRA
                </p>
                <h1 className="mt-2 text-lg font-semibold tracking-tight text-white sm:text-xl">
                  Elegí la herramienta que querés abrir
                </h1>
                <p className="mt-2 text-sm leading-6 text-white/62">
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
                className={`${SUPERFICIE_ITEM} block p-5`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="rounded-[18px] border border-white/10 bg-[linear-gradient(135deg,rgba(124,77,255,0.72),rgba(179,136,255,0.42))] p-3 text-white">
                    <IconoAstral nombre={card.icono} tamaño={22} className="text-white" />
                  </div>

                  <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/42">
                    {card.disponible === "ahora" ? "Disponible" : "Próximamente"}
                  </span>
                </div>

                <div className="mt-5">
                  <h2 className="text-base font-semibold text-white">
                    {card.titulo}
                  </h2>
                  <p className="mt-2 text-sm leading-6 text-white/56">
                    {card.subtitulo}
                  </p>
                </div>

                <div className="mt-5 flex items-center justify-between border-t border-white/[0.08] pt-4 text-sm text-white/64">
                  <span>
                    {card.disponible === "ahora" ? "Abrir lectura" : "Ver avance"}
                  </span>
                  <Icono nombre="caretDerecha" tamaño={16} className="text-white/42" />
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
