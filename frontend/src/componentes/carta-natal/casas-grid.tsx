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
    <section className="mb-8">
      <h2 className="text-[15px] font-semibold text-[#2C2926] mb-3">Las 12 Casas</h2>
      <div className="grid grid-cols-4 gap-2">
        {casas.map((casa) => {
          const esAngular = [1, 4, 7, 10].includes(casa.numero);
          return (
            <button
              key={casa.numero}
              onClick={() => onSeleccionar(casa)}
              className={`
                rounded-xl px-2.5 py-3 text-center transition-all cursor-pointer
                ${esAngular
                  ? "bg-[#7C4DFF] text-white hover:bg-[#6D28D9]"
                  : "bg-white text-[#2C2926] hover:bg-[#F5F0FF] border border-transparent hover:border-[#E8E4E0]"
                }
              `}
            >
              <p className={`text-[11px] font-semibold ${esAngular ? "text-white/70" : "text-[#8A8580]"}`}>
                {ROMANO[casa.numero]}
              </p>
              <div className="flex items-center justify-center gap-1 mt-1">
                <IconoSigno signo={casa.signo} tamaño={14} className={esAngular ? "text-white" : "text-[#7C4DFF]"} />
                <span className="text-[13px] font-medium">{Math.floor(casa.grado_en_signo)}°</span>
              </div>
              <p className={`text-[10px] mt-0.5 ${esAngular ? "text-white/60" : "text-[#B3ADA7]"}`}>
                {casa.signo}
              </p>
            </button>
          );
        })}
      </div>
    </section>
  );
}
