import { cn } from "@/lib/utilidades/cn";

interface IndicadorPasosProps {
  pasoActual: number;
  total: number;
  etiquetas?: string[];
  className?: string;
}

export function IndicadorPasos({
  pasoActual,
  total,
  etiquetas,
  className,
}: IndicadorPasosProps) {
  return (
    <div className={cn("flex items-center gap-2 w-full", className)}>
      {Array.from({ length: total }, (_, i) => {
        const completado = i < pasoActual;
        const activo = i === pasoActual;

        return (
          <div key={i} className="flex flex-col items-center gap-1.5 flex-1">
            {/* Indicador visual */}
            <div className="flex items-center w-full gap-1">
              {/* Linea izquierda */}
              {i > 0 && (
                <div
                  className={cn(
                    "h-0.5 flex-1 rounded-full transition-colors duration-300",
                    completado || activo ? "bg-primario" : "bg-borde"
                  )}
                />
              )}

              {/* Circulo del paso */}
              <div
                className={cn(
                  "shrink-0 flex items-center justify-center",
                  "w-8 h-8 rounded-full text-xs font-semibold",
                  "transition-all duration-300",
                  activo && [
                    "bg-primario text-white",
                    "ring-2 ring-primario/30 ring-offset-2 ring-offset-fondo",
                  ],
                  completado && "bg-primario text-white",
                  !activo && !completado && "bg-fondo-elevado text-texto-terciario border border-borde"
                )}
              >
                {completado ? (
                  <svg
                    className="w-3.5 h-3.5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={3}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                ) : (
                  i + 1
                )}
              </div>

              {/* Linea derecha */}
              {i < total - 1 && (
                <div
                  className={cn(
                    "h-0.5 flex-1 rounded-full transition-colors duration-300",
                    completado ? "bg-primario" : "bg-borde"
                  )}
                />
              )}
            </div>

            {/* Etiqueta */}
            {etiquetas?.[i] && (
              <span
                className={cn(
                  "text-xs text-center transition-colors duration-300",
                  activo
                    ? "text-primario font-medium"
                    : completado
                      ? "text-texto-secundario"
                      : "text-texto-terciario"
                )}
              >
                {etiquetas[i]}
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}
