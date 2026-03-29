"use client";

import { cn } from "@/lib/utilidades/cn";

interface BarraEnergiaProps {
  etiqueta: string;
  valor: number; // 1-10
  className?: string;
}

export function BarraEnergia({
  etiqueta,
  valor,
  className,
}: BarraEnergiaProps) {
  const porcentaje = Math.min(Math.max(valor, 1), 10) * 10;

  return (
    <div className={cn("flex items-center gap-3", className)}>
      <span className="text-[12px] font-medium text-white/60 w-[72px] shrink-0">
        {etiqueta}
      </span>
      <div className="flex-1 h-[7px] rounded-full bg-white/[0.08] overflow-hidden backdrop-blur-sm">
        <div
          className="h-full rounded-full bg-gradient-to-r from-violet-400 to-violet-200/90 transition-all duration-700"
          style={{ width: `${porcentaje}%` }}
        />
      </div>
      <span className="text-[13px] font-bold text-white/90 w-5 text-right tabular-nums">
        {valor}
      </span>
    </div>
  );
}
