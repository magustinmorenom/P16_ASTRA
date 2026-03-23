"use client";

import { type ButtonHTMLAttributes, type ReactNode } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utilidades/cn";

const variantes = cva(
  [
    "inline-flex items-center justify-center gap-2",
    "font-medium rounded-lg transition-all duration-200",
    "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primario",
    "disabled:opacity-50 disabled:pointer-events-none",
    "cursor-pointer",
  ],
  {
    variants: {
      variante: {
        primario: [
          "bg-primario text-white",
          "hover:bg-primario-hover",
          "active:scale-[0.98]",
          "shadow-lg shadow-violet-500/25",
        ],
        secundario: [
          "border border-borde bg-transparent text-texto",
          "hover:border-borde-hover hover:bg-fondo-elevado",
          "active:scale-[0.98]",
        ],
        fantasma: [
          "bg-transparent text-texto-secundario",
          "hover:text-texto hover:bg-fondo-elevado",
          "active:scale-[0.98]",
        ],
      },
      tamaño: {
        sm: "h-8 px-3 text-sm",
        md: "h-10 px-4 text-sm",
        lg: "h-12 px-6 text-base",
      },
    },
    defaultVariants: {
      variante: "primario",
      tamaño: "md",
    },
  }
);

type VariantesBtnProps = VariantProps<typeof variantes>;

interface BotonProps
  extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "className">,
    VariantesBtnProps {
  children: ReactNode;
  icono?: ReactNode;
  cargando?: boolean;
  className?: string;
}

export function Boton({
  children,
  variante,
  tamaño,
  icono,
  cargando = false,
  disabled,
  className,
  type = "button",
  ...props
}: BotonProps) {
  return (
    <button
      type={type}
      disabled={disabled || cargando}
      className={cn(variantes({ variante, tamaño }), className)}
      {...props}
    >
      {cargando ? (
        <svg
          className="animate-spin h-4 w-4"
          viewBox="0 0 24 24"
          fill="none"
          aria-hidden="true"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
          />
        </svg>
      ) : icono ? (
        <span className="shrink-0">{icono}</span>
      ) : null}
      {children}
    </button>
  );
}
