"use client";

import { Icono, type NombreIcono } from "@/componentes/ui/icono";
import {
  IconoAstral,
  type NombreIconoAstral,
} from "@/componentes/ui/icono-astral";

interface ResumenFeature {
  titulo: string;
  descripcion: string;
  icono: NombreIcono;
}

interface PuntoFeature {
  titulo: string;
  descripcion: string;
}

interface FeatureProximamenteProps {
  titulo: string;
  descripcion: string;
  icono: NombreIconoAstral;
  resumen: ResumenFeature[];
  puntos: PuntoFeature[];
  nota: string;
}

export function FeatureProximamente({
  titulo,
  descripcion,
  icono,
  resumen,
  puntos,
  nota,
}: FeatureProximamenteProps) {
  return (
    <section className="relative isolate min-h-full overflow-hidden">
      <div className="absolute inset-0 bg-[#16011b]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(179,136,255,0.16),transparent_28%),radial-gradient(circle_at_bottom_left,rgba(124,77,255,0.2),transparent_30%),linear-gradient(135deg,#0f0826_0%,#1b1137_42%,#16011b_100%)]" />
      <div className="absolute -right-12 top-0 h-72 w-72 rounded-full bg-[#B388FF]/18 blur-3xl" />
      <div className="absolute bottom-0 left-0 h-80 w-80 rounded-full bg-[#7C4DFF]/14 blur-3xl" />
      <div className="absolute left-1/3 top-1/2 h-48 w-48 rounded-full bg-[#D4A234]/10 blur-3xl" />

      <div className="relative z-10 mx-auto flex max-w-6xl flex-col gap-6 px-5 py-6 lg:px-8 lg:py-8">
        <div className="overflow-hidden rounded-[28px] border border-white/12 bg-white/[0.08] p-6 shadow-[0_24px_80px_rgba(8,5,20,0.35)] backdrop-blur-xl lg:p-8">
          <div className="max-w-4xl">
            <span className="inline-flex items-center rounded-full border border-white/12 bg-white/[0.08] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-violet-100/85">
              Próximamente
            </span>

            <div className="mt-4 flex items-start gap-4">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.08] text-[#D4A234]">
                <IconoAstral nombre={icono} tamaño={28} />
              </div>

              <div>
                <h1 className="text-3xl font-semibold tracking-tight text-white lg:text-4xl">
                  {titulo}
                </h1>
                <p className="mt-3 max-w-3xl text-sm leading-relaxed text-violet-100/72 lg:text-[15px]">
                  {descripcion}
                </p>
              </div>
            </div>
          </div>

          <div className="mt-6 grid gap-3 md:grid-cols-3">
            {resumen.map((item) => (
              <div
                key={item.titulo}
                className="rounded-2xl border border-white/10 bg-black/10 p-4 backdrop-blur-md"
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/[0.08] text-[#D4A234]">
                  <Icono nombre={item.icono} tamaño={18} />
                </div>
                <p className="mt-3 text-sm font-medium text-white">
                  {item.titulo}
                </p>
                <p className="mt-1 max-w-[28ch] text-sm leading-relaxed text-violet-100/62">
                  {item.descripcion}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-[24px] border border-white/10 bg-white/[0.06] p-5 backdrop-blur-xl lg:p-6">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-violet-200/70">
            Qué va a hacer esta feature
          </p>

          <div className="mt-4 grid gap-3 md:grid-cols-3">
            {puntos.map((punto) => (
              <article
                key={punto.titulo}
                className="rounded-2xl border border-white/8 bg-black/10 p-4"
              >
                <p className="text-sm font-medium text-white">{punto.titulo}</p>
                <p className="mt-2 text-sm leading-relaxed text-violet-100/68">
                  {punto.descripcion}
                </p>
              </article>
            ))}
          </div>

          <div className="mt-4 rounded-2xl border border-white/10 bg-black/10 p-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#D4A234]">
              Vista previa
            </p>
            <p className="mt-2 max-w-3xl text-sm leading-relaxed text-violet-100/72">
              {nota}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
