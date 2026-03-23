import { type ReactNode } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utilidades/cn";

const variantes = cva("rounded-xl border transition-colors duration-200", {
  variants: {
    variante: {
      default: "bg-fondo-tarjeta border-borde",
      violeta:
        "bg-gradient-to-br from-violet-900/60 to-fondo-tarjeta border-violet-700/40",
      dorado: "bg-fondo-tarjeta border-dorado-400/40",
    },
    padding: {
      sm: "p-3",
      md: "p-5",
      lg: "p-8",
    },
  },
  defaultVariants: {
    variante: "default",
    padding: "md",
  },
});

interface TarjetaProps extends VariantProps<typeof variantes> {
  children: ReactNode;
  className?: string;
}

export function Tarjeta({
  children,
  variante,
  padding,
  className,
}: TarjetaProps) {
  return (
    <div className={cn(variantes({ variante, padding }), className)}>
      {children}
    </div>
  );
}
