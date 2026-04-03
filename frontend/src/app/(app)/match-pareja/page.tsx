"use client";

import HeaderMobile from "@/componentes/layouts/header-mobile";
import { IconoAstral } from "@/componentes/ui/icono-astral";
import { Icono } from "@/componentes/ui/icono";

const FEATURES_SPOILER = [
  {
    icono: "estrella" as const,
    titulo: "Sinastría",
    descripcion: "Dónde fluye y dónde roza la dinámica entre dos cartas.",
  },
  {
    icono: "corazon" as const,
    titulo: "Numerología",
    descripcion: "Cruce de senderos, misión y números dominantes.",
  },
  {
    icono: "hexagono" as const,
    titulo: "Diseño Humano",
    descripcion: "Tipo, autoridad y puntos de compatibilidad entre ambos.",
  },
];

export default function PaginaMatchPareja() {
  return (
    <>
      <HeaderMobile titulo="Match de Pareja" mostrarAtras />

      <section className="relative isolate min-h-full overflow-hidden text-white">
        <div className="absolute inset-0 bg-[#16011b]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(179,136,255,0.18),transparent_28%),radial-gradient(circle_at_top_right,rgba(124,77,255,0.14),transparent_24%),linear-gradient(135deg,#0f0826_0%,#1b1137_42%,#16011b_100%)]" />
        <div className="absolute -right-12 top-0 h-72 w-72 rounded-full bg-[#B388FF]/18 blur-3xl" />
        <div className="absolute bottom-0 left-0 h-80 w-80 rounded-full bg-[#7C4DFF]/14 blur-3xl" />

        <div className="relative z-10 mx-auto flex max-w-6xl px-5 py-6 lg:px-8 lg:py-8">
          <div className="relative w-full overflow-hidden rounded-[24px] border border-white/[0.08] bg-[radial-gradient(circle_at_top_left,rgba(179,136,255,0.2),transparent_32%),linear-gradient(135deg,rgba(45,27,105,0.96),rgba(22,1,27,0.98))] p-6 shadow-[0_24px_70px_rgba(8,2,22,0.38)] sm:p-8">
            <div className="pointer-events-none absolute -right-12 top-[-72px] h-44 w-44 rounded-full bg-[#B388FF]/18 blur-3xl" />
            <div className="pointer-events-none absolute bottom-[-64px] left-10 h-36 w-36 rounded-full bg-[#7C4DFF]/16 blur-3xl" />

            <div className="relative">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-violet-200/72">
                Próximamente
              </p>

              <div className="mt-5 flex items-start gap-4">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-[20px] bg-gradient-to-br from-[#7C4DFF] via-[#9C6DFF] to-[#B388FF] shadow-[0_18px_40px_rgba(34,12,72,0.45)]">
                  <IconoAstral nombre="compatibilidad" tamaño={24} className="text-white" />
                </div>

                <div>
                  <h1 className="text-xl font-semibold tracking-tight text-white sm:text-2xl">
                    Match de Pareja
                  </h1>
                  <p className="mt-3 max-w-3xl text-sm leading-6 text-white/64">
                    Una lectura cruzada para ver afinidad, tensión y dinámica entre
                    dos personas sin repartir la experiencia en tres módulos separados.
                  </p>
                </div>
              </div>

              <div className="mt-8 grid gap-3 lg:grid-cols-[1.05fr_0.95fr]">
                <div className="rounded-[20px] border border-white/[0.08] bg-white/[0.04] p-4">
                  <div className="space-y-3">
                    {FEATURES_SPOILER.map((feat) => (
                      <div
                        key={feat.titulo}
                        className="flex items-start gap-3 border-b border-white/[0.08] pb-3 last:border-b-0 last:pb-0"
                      >
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[14px] bg-white/[0.08] text-[#D8C0FF]">
                          <Icono nombre={feat.icono} tamaño={18} peso="fill" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-white">
                            {feat.titulo}
                          </p>
                          <p className="mt-1 text-xs leading-5 text-white/48">
                            {feat.descripcion}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-[20px] border border-white/[0.08] bg-white/[0.04] p-4">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-violet-200/70">
                    Estado
                  </p>
                  <p className="mt-3 text-sm leading-6 text-white/64">
                    Estamos cerrando la versión inicial. Va a entrar al mismo sistema
                    compacto que ya usan Carta Astral, Numerología y Diseño Humano.
                  </p>
                  <div className="mt-5 inline-flex h-10 items-center justify-center rounded-full border border-white/10 bg-white/[0.06] px-4 text-sm font-medium text-white/44">
                    Disponible pronto
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
