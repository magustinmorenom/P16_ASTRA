"use client";

import { IconoSigno } from "@/componentes/ui/icono-astral";
import { ETIQUETA_CARTA, SUPERFICIE_CLARA_CARTA } from "@/componentes/carta-natal/estilos";
import { ROMANO } from "@/lib/utilidades/interpretaciones-natal";
import type { Casa } from "@/lib/tipos";

interface CasasGridProps {
  casas: Casa[];
  onSeleccionar: (casa: Casa) => void;
}

export function CasasGrid({ casas, onSeleccionar }: CasasGridProps) {
  return (
    <section className="mb-8">
      <div className="mb-3">
        <div>
          <p className={`${ETIQUETA_CARTA} text-violet-200/72`}>Escenarios de vida</p>
          <h2 className="mt-1.5 text-[18px] font-semibold tracking-tight text-white">
            Las 12 casas
          </h2>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4">
        {casas.map((casa) => {
          const esAngular = [1, 4, 7, 10].includes(casa.numero);
          return (
            <button
              key={casa.numero}
              onClick={() => onSeleccionar(casa)}
              className={`${SUPERFICIE_CLARA_CARTA} px-3 py-4 text-left transition-all duration-200 ${
                esAngular
                  ? "border-[#B388FF]/24 bg-[#7C4DFF]/10 shadow-[0_18px_42px_rgba(77,29,149,0.14)]"
                  : "hover:-translate-y-0.5 hover:border-white/15 hover:bg-white/[0.06]"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className={`text-[11px] font-semibold ${esAngular ? "text-[#D9C2FF]" : "text-white/46"}`}>
                    Casa {ROMANO[casa.numero]}
                  </p>
                  <p className="mt-2 text-[18px] font-semibold tracking-tight text-white">
                    {casa.signo}
                  </p>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/[0.08] p-3">
                  <IconoSigno signo={casa.signo} tamaño={18} className="text-[#B388FF]" />
                </div>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                <span className="rounded-full border border-white/10 bg-white/[0.06] px-2.5 py-1 text-[11px] font-medium text-white/64">
                  {Math.floor(casa.grado_en_signo)}°
                </span>
                <span
                  className={`rounded-full px-2.5 py-1 text-[11px] font-medium ${
                    esAngular
                      ? "bg-[#7C4DFF]/16 text-[#E4D5FF]"
                      : "border border-white/10 bg-white/[0.06] text-white/60"
                  }`}
                >
                  {esAngular ? "Angular" : "Casa derivada"}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}
