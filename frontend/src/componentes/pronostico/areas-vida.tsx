"use client";

import { useState } from "react";
import { Icono, type NombreIcono } from "@/componentes/ui/icono";
import { IndicadorNivel } from "./indicador-nivel";
import { cn } from "@/lib/utilidades/cn";
import type { AreaVidaDTO } from "@/lib/tipos";

interface AreasVidaProps {
  areas: AreaVidaDTO[];
}

const ICONO_MAP: Record<string, NombreIcono> = {
  briefcase: "grafico",
  heart: "corazon",
  activity: "rayo",
  wallet: "corona",
  palette: "destello",
  "trending-up": "cohete",
};

export function AreasVida({ areas }: AreasVidaProps) {
  const [areaExpandida, setAreaExpandida] = useState<string | null>(null);

  return (
    <div>
      <h3 className="text-[14px] font-semibold text-[#2C2926] mb-2.5">
        Áreas de Vida
      </h3>
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-2">
        {areas.map((area) => {
          const expandida = areaExpandida === area.id;
          return (
            <button
              key={area.id}
              onClick={() => setAreaExpandida(expandida ? null : area.id)}
              className={cn(
                "rounded-xl bg-white/70 backdrop-blur-xl border border-white/50 p-3 text-left transition-all",
                "shadow-[0_2px_8px_rgba(124,77,255,0.08)] hover:shadow-[0_4px_12px_rgba(124,77,255,0.12)]",
                "hover:bg-white/80",
                expandida && "col-span-2 lg:col-span-3 bg-white/85"
              )}
            >
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-violet-500/15 to-fuchsia-500/10 flex items-center justify-center border border-violet-200/30">
                    <Icono
                      nombre={ICONO_MAP[area.icono] ?? "destello"}
                      tamaño={15}
                      peso="fill"
                      className="text-violet-500"
                    />
                  </div>
                  <span className="text-[13px] font-semibold text-[#2C2926]">
                    {area.nombre}
                  </span>
                </div>
                <IndicadorNivel nivel={area.nivel} />
              </div>
              <p className="text-[12px] text-[#5C5650] leading-snug">
                {area.frase}
              </p>
              {expandida && (
                <p className="mt-2 text-[12px] text-[#5C5650] leading-relaxed pt-2 border-t border-violet-100/50">
                  {area.detalle}
                </p>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
