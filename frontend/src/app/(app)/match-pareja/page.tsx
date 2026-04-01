"use client";

import HeaderMobile from "@/componentes/layouts/header-mobile";
import { IconoAstral } from "@/componentes/ui/icono-astral";
import { Icono } from "@/componentes/ui/icono";

const FEATURES_SPOILER = [
  {
    icono: "estrella" as const,
    titulo: "Sinastría astrológica",
    descripcion: "Aspectos entre las dos cartas natales: dónde fluyen y dónde hay fricción.",
  },
  {
    icono: "corazon" as const,
    titulo: "Compatibilidad numerológica",
    descripcion: "Cruce de senderos de vida, expresión y números del alma entre ambos.",
  },
  {
    icono: "hexagono" as const,
    titulo: "Match de Diseño Humano",
    descripcion: "Tipos complementarios, canales electromagnéticos y dinámicas de autoridad.",
  },
  {
    icono: "rayo" as const,
    titulo: "Áreas de armonía y tensión",
    descripcion: "Mapa visual de las zonas fuertes y los desafíos de la relación.",
  },
  {
    icono: "destello" as const,
    titulo: "Consejos para la convivencia",
    descripcion: "Recomendaciones prácticas basadas en el cruce de las tres disciplinas.",
  },
];

export default function PaginaMatchPareja() {
  return (
    <>
      <HeaderMobile titulo="Match de Pareja" mostrarAtras />

      <section className="relative isolate min-h-full overflow-hidden text-white">
        {/* Fondos decorativos */}
        <div className="absolute inset-0 bg-[#16011b]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(179,136,255,0.18),transparent_28%),radial-gradient(circle_at_top_right,rgba(124,77,255,0.14),transparent_24%),linear-gradient(135deg,#0f0826_0%,#1b1137_42%,#16011b_100%)]" />
        <div className="absolute -right-12 top-0 h-72 w-72 rounded-full bg-[#B388FF]/18 blur-3xl" />
        <div className="absolute bottom-0 left-0 h-80 w-80 rounded-full bg-[#7C4DFF]/14 blur-3xl" />
        <div className="absolute left-1/3 top-1/2 h-48 w-48 rounded-full bg-[#D4A234]/10 blur-3xl" />

        <div className="relative z-10 mx-auto flex max-w-6xl px-5 py-6 lg:px-8 lg:py-8">
          <div className="relative w-full overflow-hidden rounded-[32px] border border-white/[0.08] bg-[radial-gradient(circle_at_top_left,rgba(179,136,255,0.2),transparent_32%),linear-gradient(135deg,rgba(45,27,105,0.96),rgba(22,1,27,0.98))] p-6 shadow-[0_24px_70px_rgba(8,2,22,0.38)] sm:p-8">
            {/* Orbes decorativos */}
            <div className="pointer-events-none absolute -right-12 top-[-72px] h-44 w-44 rounded-full bg-[#B388FF]/18 blur-3xl" />
            <div className="pointer-events-none absolute bottom-[-64px] left-10 h-36 w-36 rounded-full bg-[#7C4DFF]/16 blur-3xl" />

            <div className="relative">
              {/* Badge */}
              <span className="inline-flex items-center rounded-full border border-white/10 bg-white/[0.08] px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-white/72">
                Próximamente
              </span>

              {/* Título + icono */}
              <div className="mt-5 flex items-start gap-4">
                <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-[24px] bg-gradient-to-br from-[#7C4DFF] via-[#C084FC] to-[#E879A8] shadow-[0_18px_40px_rgba(34,12,72,0.45)]">
                  <IconoAstral nombre="compatibilidad" tamaño={30} className="text-white" />
                </div>

                <div>
                  <h1 className="text-3xl font-semibold tracking-[-0.03em] text-white sm:text-4xl">
                    Match de Pareja
                  </h1>
                  <p className="mt-3 max-w-3xl text-sm leading-7 text-white/68 sm:text-base">
                    Descubrí la dinámica real entre vos y otra persona cruzando astrología,
                    numerología y diseño humano en un solo análisis integrado.
                  </p>
                </div>
              </div>

              {/* Spoiler: qué va a incluir */}
              <div className="mt-8">
                <p className="mb-4 text-[12px] font-semibold uppercase tracking-[0.2em] text-[#B388FF]/60">
                  Qué vas a encontrar
                </p>

                <div className="grid gap-3 sm:grid-cols-2">
                  {FEATURES_SPOILER.map((feat) => (
                    <div
                      key={feat.titulo}
                      className="flex gap-3.5 rounded-2xl border border-white/[0.06] bg-white/[0.03] p-4 transition-colors hover:border-white/[0.12] hover:bg-white/[0.06]"
                    >
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/[0.08] text-[#B388FF]">
                        <Icono nombre={feat.icono} tamaño={20} peso="fill" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[14px] font-semibold text-white/90">
                          {feat.titulo}
                        </p>
                        <p className="mt-1 text-[12px] leading-relaxed text-white/45">
                          {feat.descripcion}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* CTA deshabilitado */}
              <div className="mt-8 flex items-center gap-4">
                <div className="inline-flex h-12 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.06] px-6 text-sm font-medium text-white/40">
                  <Icono nombre="candado" tamaño={16} className="mr-2" />
                  Disponible pronto
                </div>
                <p className="text-[12px] text-white/30">
                  Estamos preparando esta experiencia para vos.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
