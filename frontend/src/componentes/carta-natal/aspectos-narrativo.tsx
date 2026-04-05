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
    <section className="divide-y divide-[var(--shell-borde)]">
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
                ? "border-l-[#B388FF] bg-[var(--shell-chip)]"
                : "border-l-transparent hover:border-l-[#B388FF] hover:bg-[var(--shell-superficie-suave)]"
            }`}
          >
            <div className="flex min-w-0 flex-1 flex-wrap items-center gap-1.5">
              <div className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: color1 }} />
              <span className="text-[12px] font-medium text-[color:var(--shell-texto)]">{aspecto.planeta1}</span>
              <span className="text-[14px] text-[color:var(--shell-texto-tenue)]">{simbolo}</span>
              <span className="text-[12px] font-medium text-[color:var(--shell-texto)]">{aspecto.planeta2}</span>
              <div className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: color2 }} />
            </div>

            <div className="flex shrink-0 flex-col items-end border-l border-[var(--shell-borde)] pl-3 text-right">
              <div className="flex flex-wrap items-center justify-end gap-1.5">
                {badge ? (
                  <span className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] ${badge.bg} ${badge.text}`}>
                    {badge.label}
                  </span>
                ) : null}
              </div>
              <p className="mt-1 text-[11px] text-[color:var(--shell-texto-tenue)]">
                {aspecto.orbe.toFixed(1)}° · {aspecto.aplicativo ? "Aplicativo" : "Separativo"}
              </p>
            </div>

            <span className="text-[color:var(--shell-texto-tenue)] transition-colors group-hover:text-[color:var(--shell-texto-secundario)]">
              <span className="text-lg">›</span>
            </span>
          </button>
        );
      })}
    </section>
  );
}
