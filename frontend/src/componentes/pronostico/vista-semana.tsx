"use client";

import { cn } from "@/lib/utilidades/cn";
import type { DiaSemanalDTO } from "@/lib/tipos";
import { fechaHoyLocal } from "@/lib/utilidades/fecha-local";

interface VistaSemanaProps {
  semana: DiaSemanalDTO[];
}

const CLIMA_DOT: Record<string, string> = {
  despejado: "bg-violet-400",
  soleado: "bg-violet-500",
  nublado: "bg-gray-400",
  tormenta: "bg-slate-500",
  arcoiris: "bg-violet-600",
};

const DIAS_CORTOS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

export function VistaSemana({ semana }: VistaSemanaProps) {
  const hoyStr = fechaHoyLocal();

  return (
    <div>
      <h3 className="text-[14px] font-semibold text-[#2C2926] mb-2.5">
        Tu Semana
      </h3>
      <div className="flex gap-1.5 overflow-x-auto pb-1 scroll-sutil">
        {semana.map((dia) => {
          const esHoy = dia.fecha === hoyStr;
          const diaObj = new Date(dia.fecha + "T12:00:00");
          const diaSemana = DIAS_CORTOS[diaObj.getDay() === 0 ? 6 : diaObj.getDay() - 1];
          const diaNum = diaObj.getDate();

          return (
            <div
              key={dia.fecha}
              className={cn(
                "min-w-[72px] rounded-xl backdrop-blur-xl border p-2.5 text-center shrink-0 transition-all",
                esHoy
                  ? "bg-gradient-to-b from-violet-500/15 to-white/80 border-violet-400/50 ring-1 ring-violet-400/30 shadow-[0_2px_10px_rgba(124,77,255,0.15)]"
                  : "bg-white/60 border-white/50 shadow-[0_1px_4px_rgba(124,77,255,0.06)]"
              )}
            >
              <p className="text-[10px] font-semibold text-[#8A8580] uppercase tracking-wide">
                {diaSemana}
              </p>
              <p className={cn(
                "text-[17px] font-bold my-0.5",
                esHoy ? "text-violet-600" : "text-[#2C2926]"
              )}>
                {diaNum}
              </p>
              <div className="flex justify-center mb-1">
                <span className={cn("h-1.5 w-1.5 rounded-full", CLIMA_DOT[dia.clima_estado] ?? CLIMA_DOT.nublado)} />
              </div>
              {/* Mini barra energía */}
              <div className="h-1.5 rounded-full bg-violet-100/60 overflow-hidden mb-1">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-violet-400 to-violet-300"
                  style={{ width: `${dia.energia * 10}%` }}
                />
              </div>
              <p className="text-[11px] text-[color:var(--shell-texto-secundario)] leading-tight line-clamp-2">
                {dia.frase_corta}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
