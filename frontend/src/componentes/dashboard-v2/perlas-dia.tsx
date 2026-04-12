"use client";

import { useMemo } from "react";

import { usarPerlasDiarias } from "@/lib/hooks/usar-perlas";
import { cn } from "@/lib/utilidades/cn";

interface PropsPerlasDia {
  /** Si es true, muestra hasta 3 perlas; si es false, hasta 2 (modo compacto). */
  expandido?: boolean;
}

/**
 * Stack de 2-3 aforismos breves personalizados generados por Haiku.
 * Vive en el hero del dashboard, justo encima del botón "Escuchar ahora".
 *
 * Estilo: tipografía serif sutil, separadores hairline, sin íconos ni colores,
 * para que las frases sean el único foco visual del bloque.
 */
export function PerlasDia({ expandido = true }: PropsPerlasDia) {
  const { data, isLoading, isError } = usarPerlasDiarias();

  const perlasVisibles = useMemo<string[]>(() => {
    const todas: string[] = data?.perlas ?? [];
    const limite = expandido ? 3 : 2;
    return todas.slice(0, limite);
  }, [data, expandido]);

  return (
    <div className="relative">
      {/* Eyebrow discreto */}
      <div className="mb-2 flex items-center gap-1.5">
        <span
          aria-hidden
          className="text-[10px] leading-none"
          style={{ color: "var(--color-acento)" }}
        >
          ✦
        </span>
        <span
          className="text-[9px] font-semibold uppercase tracking-[0.22em]"
          style={{ color: "var(--shell-texto-tenue)" }}
        >
          Recordatorios para vos
        </span>
      </div>

      {isLoading ? (
        <SkeletonPerlas cantidad={expandido ? 3 : 2} />
      ) : isError || perlasVisibles.length === 0 ? (
        <p className="text-[12px] italic text-[color:var(--shell-texto-tenue)]">
          Las perlas vuelven pronto.
        </p>
      ) : (
        <ul
          key={perlasVisibles.join("|")}
          className="flex flex-col gap-2 animate-[fade-in_240ms_ease-out_both]"
        >
          {perlasVisibles.map((perla, idx) => (
            <li
              key={`${idx}-${perla.slice(0, 16)}`}
              className={cn(idx > 0 && "border-t pt-2")}
              style={
                idx > 0
                  ? {
                      borderColor: "var(--shell-borde)",
                      animationDelay: `${idx * 60}ms`,
                    }
                  : undefined
              }
            >
              <p
                className="text-[12.5px] leading-snug lg:text-[13px]"
                style={{
                  color: "var(--shell-texto-secundario)",
                  fontFamily: "var(--font-serif, ui-serif, Georgia, serif)",
                  letterSpacing: "0.005em",
                }}
              >
                {perla}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function SkeletonPerlas({ cantidad }: { cantidad: number }) {
  return (
    <div className="flex flex-col gap-2">
      {Array.from({ length: cantidad }).map((_, idx) => (
        <div
          key={idx}
          className={cn("flex flex-col gap-1", idx > 0 && "border-t pt-2")}
          style={idx > 0 ? { borderColor: "var(--shell-borde)" } : undefined}
        >
          <div
            className="h-3 rounded-full"
            style={{
              background: "var(--shell-chip)",
              width: `${65 + ((idx * 13) % 25)}%`,
              animation: "pulse 1.4s ease-in-out infinite",
            }}
          />
          <div
            className="h-3 rounded-full"
            style={{
              background: "var(--shell-chip)",
              width: `${40 + ((idx * 17) % 30)}%`,
              animation: "pulse 1.4s ease-in-out infinite",
              animationDelay: "120ms",
            }}
          />
        </div>
      ))}
    </div>
  );
}
