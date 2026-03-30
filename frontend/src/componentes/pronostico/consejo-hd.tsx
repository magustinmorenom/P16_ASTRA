"use client";

import { Icono } from "@/componentes/ui/icono";
import type { ConsejoHDDTO } from "@/lib/tipos";

interface ConsejoHDProps {
  consejo: ConsejoHDDTO;
}

export function ConsejoHD({ consejo }: ConsejoHDProps) {
  return (
    <div className="rounded-xl relative overflow-hidden">
      {/* Fondo degradado sutil */}
      <div className="absolute inset-0 bg-gradient-to-r from-violet-200/40 via-fuchsia-100/20 to-violet-100/40" />

      <div className="relative bg-white/50 backdrop-blur-xl border border-violet-200/40 rounded-xl p-4 shadow-[0_2px_8px_rgba(124,77,255,0.08)]">
        <div className="flex items-center gap-2.5 mb-2.5">
          <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-violet-500/15 to-fuchsia-500/10 flex items-center justify-center border border-violet-200/30">
            <Icono nombre="hexagono" tamaño={17} peso="fill" className="text-violet-500" />
          </div>
          <div>
            <p className="text-[14px] font-semibold text-[#2C2926] leading-none">
              {consejo.titulo}
            </p>
            <p className="text-[10px] text-violet-500 uppercase tracking-wider font-medium mt-0.5">
              Diseño Humano — {consejo.centro_destacado}
            </p>
          </div>
        </div>
        <p className="text-[13px] text-[#5C5650] leading-relaxed">
          {consejo.mensaje}
        </p>
      </div>
    </div>
  );
}
