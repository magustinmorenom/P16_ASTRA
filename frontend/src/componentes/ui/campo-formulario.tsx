import { type ReactNode } from "react";
import { cn } from "@/lib/utilidades/cn";

interface CampoFormularioProps {
  etiqueta: string;
  error?: string;
  children: ReactNode;
  requerido?: boolean;
  className?: string;
}

export function CampoFormulario({
  etiqueta,
  error,
  children,
  requerido = false,
  className,
}: CampoFormularioProps) {
  return (
    <div className={cn("flex flex-col gap-1.5 w-full", className)}>
      <label className="text-sm font-medium text-texto-secundario">
        {etiqueta}
        {requerido && (
          <span className="text-error ml-0.5" aria-label="campo requerido">
            *
          </span>
        )}
      </label>

      {children}

      {error && (
        <p className="text-xs text-error mt-0.5" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
