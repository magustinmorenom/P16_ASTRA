"use client";

import { forwardRef, type InputHTMLAttributes, type ReactNode } from "react";
import { cn } from "@/lib/utilidades/cn";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  etiqueta?: string;
  icono?: ReactNode;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ etiqueta, icono, error, className, id, ...props }, ref) => {
    const inputId = id || props.name || undefined;

    return (
      <div className="flex flex-col gap-1.5 w-full">
        {etiqueta && (
          <label
            htmlFor={inputId}
            className="text-sm font-medium text-texto-secundario"
          >
            {etiqueta}
          </label>
        )}

        <div className="relative">
          {icono && (
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-texto-terciario pointer-events-none">
              {icono}
            </span>
          )}

          <input
            ref={ref}
            id={inputId}
            className={cn(
              "w-full h-10 rounded-lg bg-fondo-input text-texto text-sm",
              "border border-borde placeholder:text-texto-terciario",
              "transition-colors duration-200",
              "focus:outline-none focus:border-primario focus:ring-1 focus:ring-primario",
              icono ? "pl-10 pr-3" : "px-3",
              error && "border-error focus:border-error focus:ring-error",
              "disabled:opacity-50 disabled:cursor-not-allowed",
              className
            )}
            {...props}
          />
        </div>

        {error && (
          <p className="text-xs text-error mt-0.5">{error}</p>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";
