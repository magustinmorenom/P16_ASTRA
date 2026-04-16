"use client";

import { useMemo } from "react";

import { usarPerlasDiarias } from "@/lib/hooks/usar-perlas";
import { Icono } from "@/componentes/ui/icono";
import { cn } from "@/lib/utilidades/cn";

interface PropsPerlasDia {
  expandido?: boolean;
}

export function PerlasDia({ expandido = true }: PropsPerlasDia) {
  const { data, isLoading, isError } = usarPerlasDiarias();

  const perlasVisibles = useMemo<string[]>(() => {
    const todas: string[] = data?.perlas ?? [];
    const limite = expandido ? 3 : 2;
    return todas.slice(0, limite);
  }, [data, expandido]);

  /* ── Loading ── */
  if (isLoading) {
    return (
      <div
        className="overflow-hidden rounded-[18px] border px-3.5 pt-3 pb-3"
        style={{
          background: "linear-gradient(160deg, rgba(124,77,255,0.07), rgba(179,136,255,0.03) 60%, transparent)",
          borderColor: "rgba(124,77,255,0.12)",
        }}
      >
        <div className="flex items-center gap-2 mb-2.5">
          <Icono nombre="foco" tamaño={15} peso="fill" className="text-violet-400" />
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-violet-400">
            Perlas de tu perfil - Conocete mejor
          </p>
        </div>
        <SkeletonPerlas cantidad={expandido ? 3 : 2} />
      </div>
    );
  }

  /* ── Error / vacío ── */
  if (isError || perlasVisibles.length === 0) {
    return (
      <div
        className="flex items-center justify-center overflow-hidden rounded-[18px] border px-4 py-5 text-center"
        style={{
          background: "linear-gradient(160deg, rgba(124,77,255,0.07), rgba(179,136,255,0.03) 60%, transparent)",
          borderColor: "rgba(124,77,255,0.12)",
        }}
      >
        <Icono nombre="foco" tamaño={18} peso="regular" className="mr-2 text-violet-400/60" />
        <p className="text-[12px] font-medium text-[color:var(--shell-texto-tenue)]">
          Las perlas vuelven pronto
        </p>
      </div>
    );
  }

  /* ── Con perlas ── */
  return (
    <div
      className="overflow-hidden rounded-[18px] border"
      style={{
        background: "linear-gradient(160deg, rgba(124,77,255,0.07), rgba(179,136,255,0.03) 60%, transparent)",
        borderColor: "rgba(124,77,255,0.12)",
      }}
    >
      {/* Header */}
      <div className="flex items-center gap-2 px-3.5 pt-3 pb-1.5">
        <Icono nombre="foco" tamaño={15} peso="fill" className="text-violet-400" />
        <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-violet-400">
          Perlas de tu perfil - Concete mejor
        </p>
      </div>

      {/* Chips */}
      <div
        key={perlasVisibles.join("|")}
        className="flex flex-wrap gap-1.5 px-3 pb-3 animate-[fadeIn_240ms_ease-out_both]"
      >
        {perlasVisibles.map((perla, idx) => (
          <span
            key={`${idx}-${perla.slice(0, 16)}`}
            className={cn(
              "inline-block rounded-full border px-3 py-1.5",
              "text-[11px] font-normal leading-[1.4] tracking-[0.01em]",
              "text-[color:var(--shell-texto-secundario)]"
            )}
            style={{
              background: "var(--shell-superficie)",
              borderColor: "var(--shell-borde)",
              animationDelay: `${idx * 60}ms`,
            }}
          >
            {perla}
          </span>
        ))}
      </div>
    </div>
  );
}

function SkeletonPerlas({ cantidad }: { cantidad: number }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {Array.from({ length: cantidad }).map((_, idx) => (
        <div
          key={idx}
          className="h-[30px] rounded-full"
          style={{
            background: "rgba(124,77,255,0.08)",
            width: `${80 + ((idx * 23) % 60)}px`,
            animation: "pulse 1.4s ease-in-out infinite",
            animationDelay: `${idx * 120}ms`,
          }}
        />
      ))}
    </div>
  );
}
