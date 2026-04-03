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

      <section
        className="relative isolate min-h-full overflow-hidden"
        style={{ background: "var(--shell-fondo)" }}
      >
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(circle_at_top_left, var(--shell-glow-2), transparent 28%), radial-gradient(circle_at_top_right, var(--shell-glow-1), transparent 24%), linear-gradient(180deg, var(--shell-fondo-profundo) 0%, var(--shell-fondo) 100%)",
          }}
        />
        <div
          className="absolute -right-12 top-0 h-72 w-72 rounded-full blur-3xl"
          style={{ background: "var(--shell-glow-2)" }}
        />
        <div
          className="absolute bottom-0 left-0 h-80 w-80 rounded-full blur-3xl"
          style={{ background: "var(--shell-glow-1)" }}
        />

        <div className="relative z-10 mx-auto flex max-w-6xl px-5 py-6 lg:px-8 lg:py-8">
          <div className="tema-superficie-hero relative w-full overflow-hidden rounded-[24px] p-6 sm:p-8">
            <div
              className="pointer-events-none absolute -right-12 top-[-72px] h-44 w-44 rounded-full blur-3xl"
              style={{ background: "var(--shell-glow-2)" }}
            />
            <div
              className="pointer-events-none absolute bottom-[-64px] left-10 h-36 w-36 rounded-full blur-3xl"
              style={{ background: "var(--shell-glow-1)" }}
            />

            <div className="relative">
              <p className="tema-hero-tenue text-[11px] font-semibold uppercase tracking-[0.18em]">
                Próximamente
              </p>

              <div className="mt-5 flex items-start gap-4">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-[20px] bg-gradient-to-br from-[#7C4DFF] via-[#9C6DFF] to-[#B388FF] shadow-[0_18px_40px_rgba(34,12,72,0.45)]">
                  <IconoAstral nombre="compatibilidad" tamaño={24} className="text-white" />
                </div>

                <div>
                  <h1 className="tema-hero-titulo text-xl font-semibold tracking-tight sm:text-2xl">
                    Match de Pareja
                  </h1>
                  <p className="tema-hero-secundario mt-3 max-w-3xl text-sm leading-6">
                    Una lectura cruzada para ver afinidad, tensión y dinámica entre
                    dos personas sin repartir la experiencia en tres módulos separados.
                  </p>
                </div>
              </div>

              <div className="mt-8 grid gap-3 lg:grid-cols-[1.05fr_0.95fr]">
                <div
                  className="rounded-[20px] border p-4"
                  style={{
                    borderColor: "var(--shell-borde)",
                    background: "rgba(255, 255, 255, 0.06)",
                  }}
                >
                  <div className="space-y-3">
                    {FEATURES_SPOILER.map((feat) => (
                      <div
                        key={feat.titulo}
                        className="flex items-start gap-3 border-b pb-3 last:border-b-0 last:pb-0"
                        style={{ borderColor: "var(--shell-hero-borde)" }}
                      >
                        <div
                          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[14px] text-[#D8C0FF]"
                          style={{ background: "rgba(255, 255, 255, 0.08)" }}
                        >
                          <Icono nombre={feat.icono} tamaño={18} peso="fill" />
                        </div>
                        <div className="min-w-0">
                          <p className="tema-hero-titulo text-sm font-medium">
                            {feat.titulo}
                          </p>
                          <p className="tema-hero-tenue mt-1 text-xs leading-5">
                            {feat.descripcion}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div
                  className="rounded-[20px] border p-4"
                  style={{
                    borderColor: "var(--shell-borde)",
                    background: "rgba(255, 255, 255, 0.06)",
                  }}
                >
                  <p className="tema-hero-tenue text-[11px] font-semibold uppercase tracking-[0.18em]">
                    Estado
                  </p>
                  <p className="tema-hero-secundario mt-3 text-sm leading-6">
                    Estamos cerrando la versión inicial. Va a entrar al mismo sistema
                    compacto que ya usan Carta Astral, Numerología y Diseño Humano.
                  </p>
                  <div
                    className="tema-hero-tenue mt-5 inline-flex h-10 items-center justify-center rounded-full border px-4 text-sm font-medium"
                    style={{
                      borderColor: "rgba(255, 255, 255, 0.12)",
                      background: "rgba(255, 255, 255, 0.06)",
                    }}
                  >
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
