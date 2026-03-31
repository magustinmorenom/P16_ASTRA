"use client";

import { ETIQUETA_CARTA, SUPERFICIE_CLARA_CARTA } from "@/componentes/carta-natal/estilos";
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

  return (
    <section className="mb-8">
      <div className="mb-3">
        <div>
          <p className={`${ETIQUETA_CARTA} text-violet-200/72`}>Relaciones internas</p>
          <h2 className="mt-1.5 text-[18px] font-semibold tracking-tight text-white">
            Aspectos planetarios
          </h2>
        </div>
      </div>

      <div className="space-y-5">
        {grupos.map((grupo) => {
          const badge = BADGE_ASPECTO[grupo.tipo];
          return (
            <div key={grupo.tipo} className={`${SUPERFICIE_CLARA_CARTA} p-4`}>
              <div className="mb-3 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  {badge && (
                    <span className={`text-[11px] font-semibold rounded-full px-2.5 py-1 ${badge.bg} ${badge.text}`}>
                      {badge.label}
                    </span>
                  )}
                  <span className="text-[11px] text-white/46">
                    {grupo.aspectos.length} aspecto{grupo.aspectos.length === 1 ? "" : "s"}
                  </span>
                </div>
                <span className="text-[11px] font-medium uppercase tracking-[0.16em] text-white/36">
                  Grupo
                </span>
              </div>

              <div className="space-y-1.5">
                {grupo.aspectos.map((aspecto, idx) => {
                  const clave = normalizarClave(aspecto.tipo);
                  const simbolo = SIMBOLOS_ASPECTO[clave] || "·";
                  const orbeEstrecho = aspecto.orbe < 3;
                  const color1 = COLORES_PLANETA[aspecto.planeta1] || "#9E9E9E";
                  const color2 = COLORES_PLANETA[aspecto.planeta2] || "#9E9E9E";

                  return (
                    <button
                      key={`${aspecto.planeta1}-${aspecto.planeta2}-${idx}`}
                      onClick={() => onSeleccionar(aspecto)}
                      className={`w-full rounded-2xl border px-4 py-3 text-left transition-all hover:-translate-y-0.5 ${
                        orbeEstrecho
                          ? "border-[#B388FF]/24 bg-[#7C4DFF]/10 shadow-[0_16px_36px_rgba(77,29,149,0.12)]"
                          : "border-white/[0.08] bg-white/[0.04] hover:border-white/15 hover:bg-white/[0.06]"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2.5">
                            <div className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: color1 }} />
                            <span className="text-[13px] font-medium text-white">{aspecto.planeta1}</span>
                            <span className="text-[14px] text-white/36">{simbolo}</span>
                            <span className="text-[13px] font-medium text-white">{aspecto.planeta2}</span>
                            <div className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: color2 }} />
                          </div>
                          <p className="mt-2 text-[12px] text-white/56">
                            {orbeEstrecho ? "Orbe estrecho" : "Influencia presente"} ·{" "}
                            {aspecto.aplicativo ? "en crecimiento" : "ya desplegada"}
                          </p>
                        </div>

                        <div className="ml-2 flex shrink-0 flex-col items-end gap-2">
                          <span className="text-[11px] text-white/48">
                            {aspecto.orbe.toFixed(1)}°
                          </span>
                          <span
                            className={`rounded-full px-2 py-1 text-[10px] ${
                              aspecto.aplicativo
                                ? "bg-emerald-500/16 text-emerald-200"
                                : "bg-white/10 text-white/60"
                            }`}
                          >
                            {aspecto.aplicativo ? "Aplicativo" : "Separativo"}
                          </span>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
