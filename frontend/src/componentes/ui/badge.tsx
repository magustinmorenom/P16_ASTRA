import { type ReactNode } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utilidades/cn";

const variantes = cva(
  "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
  {
    variants: {
      variante: {
        default: "bg-violet-900/60 text-violet-200 border border-violet-700/40",
        exito: "bg-exito/15 text-exito border border-exito/30",
        advertencia:
          "bg-advertencia/15 text-advertencia border border-advertencia/30",
        error: "bg-error/15 text-error border border-error/30",
        info: "bg-info/15 text-info border border-info/30",
      },
    },
    defaultVariants: {
      variante: "default",
    },
  }
);

interface BadgeProps extends VariantProps<typeof variantes> {
  children: ReactNode;
  className?: string;
}

export function Badge({ children, variante, className }: BadgeProps) {
  return (
    <span className={cn(variantes({ variante }), className)}>{children}</span>
  );
}
