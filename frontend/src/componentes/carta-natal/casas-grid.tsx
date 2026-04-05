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
              className="rounded-[20px] border px-3 py-3 text-left transition-all duration-200 hover:-translate-y-0.5"
              style={
                esAngular
                  ? {
                      borderColor: "var(--shell-borde-fuerte)",
                      background: "var(--shell-chip)",
                      boxShadow: "var(--shell-sombra-suave)",
                    }
                  : {
                      borderColor: "var(--shell-borde)",
                      background: "var(--shell-superficie)",
                    }
              }
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className={`text-[10px] font-semibold ${esAngular ? "text-[color:var(--color-acento)]" : "text-[color:var(--shell-texto-tenue)]"}`}>
                    Casa {ROMANO[casa.numero]}
                  </p>
                  <p className="mt-2 text-[14px] font-semibold tracking-tight text-[color:var(--shell-texto)]">
                    {casa.signo}
                  </p>
                </div>

                <div
                  className="rounded-[14px] border p-2"
                  style={{
                    borderColor: "var(--shell-chip-borde)",
                    background: "var(--shell-superficie-suave)",
                  }}
                >
                  <IconoSigno signo={casa.signo} tamaño={16} className="text-[#B388FF]" />
                </div>
              </div>

              <p className="mt-3 text-[11px] text-[color:var(--shell-texto-tenue)]">
                {Math.floor(casa.grado_en_signo)}° · {esAngular ? "Angular" : "Casa derivada"}
              </p>
            </button>
          );
        })}
      </div>
    </section>
  );
}
