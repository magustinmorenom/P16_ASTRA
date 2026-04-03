"use client";

import {
  IconoAstral,
  type NombreIconoAstral,
} from "@/componentes/ui/icono-astral";

interface FeatureProximamenteProps {
  titulo: string;
  descripcion: string;
  icono: NombreIconoAstral;
}

export function FeatureProximamente({
  titulo,
  descripcion,
  icono,
}: FeatureProximamenteProps) {
  return (
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

          <div className="relative max-w-3xl">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[color:var(--color-acento)]">
              Próximamente
            </p>

            <div className="mt-5 flex items-start gap-4">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-[20px] bg-gradient-to-br from-[#7C4DFF] via-[#9C6DFF] to-[#B388FF] shadow-[0_18px_40px_rgba(34,12,72,0.45)]">
                <IconoAstral nombre={icono} tamaño={24} className="text-white" />
              </div>

              <div>
                <h1 className="tema-hero-titulo text-xl font-semibold tracking-tight sm:text-2xl">
                  {titulo}
                </h1>
                <p className="tema-hero-secundario mt-3 max-w-3xl text-sm leading-6">
                  {descripcion}
                </p>
                <div className="tema-hero-tenue mt-5 inline-flex h-10 items-center justify-center rounded-full border border-white/10 bg-white/[0.06] px-4 text-sm font-medium">
                  Disponible pronto
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
