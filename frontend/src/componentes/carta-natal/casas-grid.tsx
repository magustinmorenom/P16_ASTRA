"use client";

import { IconoSigno } from "@/componentes/ui/icono-astral";
import { ROMANO } from "@/lib/utilidades/interpretaciones-natal";
import type { Casa } from "@/lib/tipos";

interface CasasGridProps {
  casas: Casa[];
  onSeleccionar: (casa: Casa) => void;
}

export function CasasGrid({ casas, onSeleccionar }: CasasGridProps) {
  return (
    <section>
      <div className="grid grid-cols-2 gap-2">
        {casas.map((casa) => {
          const esAngular = [1, 4, 7, 10].includes(casa.numero);
          return (
            <button
              key={casa.numero}
              onClick={() => onSeleccionar(casa)}
              className={`rounded-[20px] border px-3 py-3 text-left transition-all duration-200 ${
                esAngular
                  ? "border-[#B388FF]/24 bg-[#7C4DFF]/10 shadow-[0_18px_42px_rgba(77,29,149,0.14)]"
                  : "border-white/10 bg-white/[0.05] hover:-translate-y-0.5 hover:border-white/15 hover:bg-white/[0.08]"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className={`text-[10px] font-semibold ${esAngular ? "text-[#D9C2FF]" : "text-white/46"}`}>
                    Casa {ROMANO[casa.numero]}
                  </p>
                  <p className="mt-2 text-[14px] font-semibold tracking-tight text-white">
                    {casa.signo}
                  </p>
                </div>

                <div className="rounded-[14px] border border-white/10 bg-white/[0.08] p-2">
                  <IconoSigno signo={casa.signo} tamaño={16} className="text-[#B388FF]" />
                </div>
              </div>

              <p className="mt-3 text-[11px] text-white/54">
                {Math.floor(casa.grado_en_signo)}° · {esAngular ? "Angular" : "Casa derivada"}
              </p>
            </button>
          );
        })}
      </div>
    </section>
  );
}
