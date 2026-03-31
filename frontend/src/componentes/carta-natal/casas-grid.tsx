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
          <p className={`${ETIQUETA_CARTA} text-[#7C4DFF]`}>Escenarios de vida</p>
          <h2 className="mt-1.5 text-[18px] font-semibold tracking-tight text-[#2C2926]">
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
                  ? "border-[#7C4DFF]/30 bg-[linear-gradient(180deg,rgba(124,77,255,0.12),rgba(255,255,255,0.82))] shadow-[0_18px_42px_rgba(77,29,149,0.10)]"
                  : "hover:-translate-y-0.5 hover:border-[#D7C8F4]"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className={`text-[11px] font-semibold ${esAngular ? "text-[#7C4DFF]" : "text-[#8A8580]"}`}>
                    Casa {ROMANO[casa.numero]}
                  </p>
                  <p className="mt-2 text-[18px] font-semibold tracking-tight text-[#2C2926]">
                    {casa.signo}
                  </p>
                </div>

                <div className="rounded-2xl border border-[#ECE4FA] bg-[#F8F4FF] p-3">
                  <IconoSigno signo={casa.signo} tamaño={18} className="text-[#7C4DFF]" />
                </div>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                <span className="rounded-full border border-[#ECE4FA] bg-white px-2.5 py-1 text-[11px] font-medium text-[#5B5560]">
                  {Math.floor(casa.grado_en_signo)}°
                </span>
                <span
                  className={`rounded-full px-2.5 py-1 text-[11px] font-medium ${
                    esAngular
                      ? "bg-[#F5F0FF] text-[#7C4DFF]"
                      : "border border-[#ECE4FA] bg-[#FAF7FF] text-[#6F6A65]"
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
