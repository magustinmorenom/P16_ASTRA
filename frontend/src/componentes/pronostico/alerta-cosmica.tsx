"use client";

import { Icono } from "@/componentes/ui/icono";
import { cn } from "@/lib/utilidades/cn";
import type { AlertaCosmicaDTO } from "@/lib/tipos";

interface AlertaCosmicaProps {
  alertas: AlertaCosmicaDTO[];
}

const URGENCIA_STYLES: Record<string, { border: string; glow: string }> = {
  baja: {
    border: "border-violet-300/40",
    glow: "shadow-[0_2px_8px_rgba(124,77,255,0.08)]",
  },
  media: {
    border: "border-violet-400/50",
    glow: "shadow-[0_2px_12px_rgba(124,77,255,0.12)]",
  },
  alta: {
    border: "border-red-400/40",
    glow: "shadow-[0_2px_12px_rgba(239,68,68,0.1)]",
  },
};

export function AlertaCosmica({ alertas }: AlertaCosmicaProps) {
  if (!alertas || alertas.length === 0) return null;

  return (
    <div className="flex flex-col gap-2">
      {alertas.map((alerta, i) => {
        const styles = URGENCIA_STYLES[alerta.urgencia] ?? URGENCIA_STYLES.baja;
        return (
          <div
            key={i}
            className={cn(
              "rounded-xl bg-white/70 backdrop-blur-xl border p-3 flex items-start gap-2.5",
              styles.border,
              styles.glow
            )}
          >
            <div className={cn(
              "h-8 w-8 rounded-lg flex items-center justify-center shrink-0 border",
              alerta.urgencia === "alta"
                ? "bg-red-500/10 border-red-200/30"
                : "bg-gradient-to-br from-violet-500/15 to-fuchsia-500/10 border-violet-200/30"
            )}>
              <Icono
                nombre="rayo"
                tamaño={15}
                peso="fill"
                className={alerta.urgencia === "alta" ? "text-red-500" : "text-violet-500"}
              />
            </div>
            <div className="min-w-0">
              <p className="text-[13px] font-semibold text-[#2C2926] mb-0.5">
                {alerta.titulo}
              </p>
              <p className="text-[12px] text-[#5C5650] leading-snug">
                {alerta.descripcion}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
