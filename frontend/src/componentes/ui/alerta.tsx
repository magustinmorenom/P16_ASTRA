"use client";

import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utilidades/cn";
import { Icono } from "@/componentes/ui/icono";
import type { NombreIcono } from "@/componentes/ui/icono";

const variantes = cva(
  "flex items-start gap-3 rounded-lg border px-4 py-3 text-sm",
  {
    variants: {
      variante: {
        exito: "bg-exito/10 text-exito border-exito/20",
        error: "bg-error/10 text-error border-error/20",
        advertencia: "bg-advertencia/10 text-advertencia border-advertencia/20",
        info: "bg-info/10 text-info border-info/20",
      },
    },
    defaultVariants: {
      variante: "info",
    },
  },
);

const ICONO_POR_VARIANTE: Record<string, NombreIcono> = {
  exito: "verificado",
  error: "cerrar",
  advertencia: "advertencia",
  info: "info",
};

interface AlertaProps extends VariantProps<typeof variantes> {
  mensaje: string;
  onCerrar?: () => void;
  className?: string;
}

export function Alerta({ variante = "info", mensaje, onCerrar, className }: AlertaProps) {
  const icono = ICONO_POR_VARIANTE[variante || "info"];

  return (
    <div className={cn(variantes({ variante }), className)} role="alert">
      <Icono nombre={icono} tamaño={18} className="mt-0.5 shrink-0" />
      <span className="flex-1">{mensaje}</span>
      {onCerrar && (
        <button
          onClick={onCerrar}
          className="shrink-0 opacity-70 hover:opacity-100 transition-opacity"
          aria-label="Cerrar alerta"
        >
          <Icono nombre="cerrar" tamaño={16} />
        </button>
      )}
    </div>
  );
}
