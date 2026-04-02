"use client";

import {
  COLORES_PLANETA,
  BADGE_ASPECTO,
  SIMBOLOS_ASPECTO,
  normalizarClave,
  agruparAspectos,
} from "@/lib/utilidades/interpretaciones-natal";
import type { Aspecto } from "@/lib/tipos";

interface AspectosNarrativoProps {
  aspectos: Aspecto[];
  onSeleccionar: (a: Aspecto) => void;
}

export function AspectosNarrativo({ aspectos, onSeleccionar }: AspectosNarrativoProps) {
  const grupos = agruparAspectos(aspectos);
  const aspectosOrdenados = grupos.flatMap((grupo) =>
    grupo.aspectos.map((aspecto) => ({ grupo, aspecto })),
  );

  return (
    <section className="divide-y divide-white/[0.06]">
      {aspectosOrdenados.map(({ grupo, aspecto }, idx) => {
        const clave = normalizarClave(aspecto.tipo);
        const badge = BADGE_ASPECTO[grupo.tipo];
        const simbolo = SIMBOLOS_ASPECTO[clave] || "·";
        const orbeEstrecho = aspecto.orbe < 3;
        const color1 = COLORES_PLANETA[aspecto.planeta1] || "#9E9E9E";
        const color2 = COLORES_PLANETA[aspecto.planeta2] || "#9E9E9E";

        return (
          <button
            key={`${aspecto.planeta1}-${aspecto.planeta2}-${idx}`}
            onClick={() => onSeleccionar(aspecto)}
            className={`group flex w-full items-center gap-3 border-l-2 px-4 py-3 text-left transition-all duration-200 ${
              orbeEstrecho
                ? "border-l-[#B388FF] bg-white/[0.06]"
                : "border-l-transparent hover:bg-white/[0.04] hover:border-l-[#B388FF]"
            }`}
          >
            <div className="flex min-w-0 flex-1 items-center gap-1.5">
              <div className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: color1 }} />
              <span className="truncate text-[12px] font-medium text-white">{aspecto.planeta1}</span>
              <span className="text-[14px] text-white/36">{simbolo}</span>
              <span className="truncate text-[12px] font-medium text-white">{aspecto.planeta2}</span>
              <div className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: color2 }} />
            </div>

            <div className="flex shrink-0 flex-col items-end border-l border-white/[0.08] pl-3 text-right">
              <div className="flex flex-wrap items-center justify-end gap-1.5">
                {badge ? (
                  <span className={`text-[10px] font-semibold uppercase tracking-[0.12em] ${badge.text}`}>
                    {badge.label}
                  </span>
                ) : null}
              </div>
              <p className="mt-1 text-[11px] text-white/46">
                {aspecto.orbe.toFixed(1)}° · {aspecto.aplicativo ? "Aplicativo" : "Separativo"}
              </p>
            </div>

            <span className="text-white/26 transition-colors group-hover:text-white/52">
              <span className="text-lg">›</span>
            </span>
          </button>
        );
      })}
    </section>
  );
}
