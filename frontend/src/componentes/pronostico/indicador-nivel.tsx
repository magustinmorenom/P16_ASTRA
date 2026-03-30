"use client";

import { cn } from "@/lib/utilidades/cn";

interface IndicadorNivelProps {
  nivel: "favorable" | "neutro" | "precaucion";
  conTexto?: boolean;
  className?: string;
}

const CONFIG = {
  favorable: { color: "bg-emerald-400", texto: "text-emerald-600", etiqueta: "Favorable" },
  neutro: { color: "bg-violet-400", texto: "text-violet-600", etiqueta: "Neutro" },
  precaucion: { color: "bg-red-400", texto: "text-red-500", etiqueta: "Precaución" },
};

export function IndicadorNivel({
  nivel,
  conTexto = false,
  className,
}: IndicadorNivelProps) {
  const cfg = CONFIG[nivel];
  return (
    <span className={cn("inline-flex items-center gap-1.5", className)}>
      <span className={cn("h-2 w-2 rounded-full shrink-0", cfg.color)} />
      {conTexto && (
        <span className={cn("text-[11px] font-medium", cfg.texto)}>
          {cfg.etiqueta}
        </span>
      )}
    </span>
  );
}
