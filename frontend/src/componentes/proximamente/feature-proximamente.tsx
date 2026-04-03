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
    <section className="relative isolate min-h-full overflow-hidden text-white">
      <div className="absolute inset-0 bg-[#16011b]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(179,136,255,0.18),transparent_28%),radial-gradient(circle_at_top_right,rgba(124,77,255,0.14),transparent_24%),linear-gradient(135deg,#0f0826_0%,#1b1137_42%,#16011b_100%)]" />
      <div className="absolute -right-12 top-0 h-72 w-72 rounded-full bg-[#B388FF]/18 blur-3xl" />
      <div className="absolute bottom-0 left-0 h-80 w-80 rounded-full bg-[#7C4DFF]/14 blur-3xl" />

      <div className="relative z-10 mx-auto flex max-w-6xl px-5 py-6 lg:px-8 lg:py-8">
        <div className="relative w-full overflow-hidden rounded-[24px] border border-white/[0.08] bg-[radial-gradient(circle_at_top_left,rgba(179,136,255,0.2),transparent_32%),linear-gradient(135deg,rgba(45,27,105,0.96),rgba(22,1,27,0.98))] p-6 shadow-[0_24px_70px_rgba(8,2,22,0.38)] sm:p-8">
          <div className="pointer-events-none absolute -right-12 top-[-72px] h-44 w-44 rounded-full bg-[#B388FF]/18 blur-3xl" />
          <div className="pointer-events-none absolute bottom-[-64px] left-10 h-36 w-36 rounded-full bg-[#7C4DFF]/16 blur-3xl" />

          <div className="relative max-w-3xl">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-violet-200/72">
              Próximamente
            </p>

            <div className="mt-5 flex items-start gap-4">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-[20px] bg-gradient-to-br from-[#7C4DFF] via-[#9C6DFF] to-[#B388FF] shadow-[0_18px_40px_rgba(34,12,72,0.45)]">
                <IconoAstral nombre={icono} tamaño={24} className="text-white" />
              </div>

              <div>
                <h1 className="text-xl font-semibold tracking-tight text-white sm:text-2xl">
                  {titulo}
                </h1>
                <p className="mt-3 max-w-3xl text-sm leading-6 text-white/64">
                  {descripcion}
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
  );
}
