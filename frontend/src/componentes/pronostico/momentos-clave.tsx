"use client";

import { Icono, type NombreIcono } from "@/componentes/ui/icono";
import { IndicadorNivel } from "./indicador-nivel";
import { cn } from "@/lib/utilidades/cn";
import type { MomentoClaveDTO } from "@/lib/tipos";

interface MomentosClaveProps {
  momentos: MomentoClaveDTO[];
}

const ICONO_MAP: Record<string, NombreIcono> = {
  sunrise: "retornoSolar",
  sun: "sol",
  moon: "luna",
};

const GRADIENTE_BARRA: Record<string, string> = {
  favorable: "from-emerald-400 to-emerald-300",
  neutro: "from-violet-400 to-violet-300",
  precaucion: "from-red-400 to-red-300",
};

export function MomentosClave({ momentos }: MomentosClaveProps) {
  return (
    <div>
      <h3 className="text-[14px] font-semibold text-[#2C2926] mb-2.5">
        Momentos del Día
      </h3>
      <div className="flex flex-col lg:flex-row gap-2">
        {momentos.map((momento) => (
          <div
            key={momento.bloque}
            className="flex-1 rounded-xl bg-white/70 backdrop-blur-xl border border-white/50 overflow-hidden shadow-[0_2px_8px_rgba(124,77,255,0.08)]"
          >
            {/* Barra superior de color */}
            <div
              className={cn(
                "h-1.5 w-full bg-gradient-to-r",
                GRADIENTE_BARRA[momento.nivel] ?? GRADIENTE_BARRA.neutro
              )}
            />
            <div className="p-3 flex items-start gap-2.5">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-violet-500/15 to-fuchsia-500/10 flex items-center justify-center shrink-0 border border-violet-200/30">
                <Icono
                  nombre={ICONO_MAP[momento.icono] ?? "sol"}
                  tamaño={16}
                  peso="fill"
                  className="text-violet-500"
                />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 mb-0.5">
                  <span className="text-[13px] font-semibold text-[#2C2926]">
                    {momento.titulo}
                  </span>
                  <IndicadorNivel nivel={momento.nivel} />
                </div>
                <p className="text-[12px] text-[#5C5650] leading-snug">
                  {momento.frase}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
