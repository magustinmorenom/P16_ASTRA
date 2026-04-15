"use client";

import { useState } from "react";
import type { ClaveDiaDTO } from "@/lib/tipos";
import { Icono } from "@/componentes/ui/icono";
import { cn } from "@/lib/utilidades/cn";

interface ClavesDiaProps {
  claves: ClaveDiaDTO[];
  expandido?: boolean;
  preparando?: boolean;
}

export function ClavesDia({ claves, expandido = false, preparando = false }: ClavesDiaProps) {
  const [claveAbierta, setClaveAbierta] = useState<number | null>(null);

  const sinClaves = claves.length === 0;

  /* ── Estado: preparando ── */
  if (preparando && sinClaves) {
    return (
      <div
        className={cn(
          "flex w-full flex-col items-center justify-center overflow-hidden rounded-[18px] border px-4 py-6 text-center",
          expandido && "lg:h-full"
        )}
        style={{
          background: "linear-gradient(135deg, rgba(124,77,255,0.06), rgba(179,136,255,0.04))",
          borderColor: "rgba(124,77,255,0.12)",
        }}
      >
        <div className="mb-3 flex h-8 w-8 items-center justify-center">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-violet-400 border-t-transparent" />
        </div>
        <p className="text-[12px] font-medium leading-[1.5] text-[color:var(--shell-texto-secundario)]">
          Astra está preparando las claves de tu día
        </p>
      </div>
    );
  }

  /* ── Estado: vacío ── */
  if (sinClaves) {
    return (
      <div
        className={cn(
          "flex w-full flex-col items-center justify-center overflow-hidden rounded-[18px] border px-4 py-6 text-center",
          expandido && "lg:h-full"
        )}
        style={{
          background: "linear-gradient(135deg, rgba(124,77,255,0.06), rgba(179,136,255,0.04))",
          borderColor: "rgba(124,77,255,0.12)",
        }}
      >
        <Icono
          nombre="listaCheck"
          tamaño={20}
          peso="regular"
          className="mb-2 text-violet-400/60"
        />
        <p className="text-[12px] font-medium text-[color:var(--shell-texto-tenue)]">
          Las claves de tu día aparecen con tu podcast
        </p>
      </div>
    );
  }

  /* ── Estado: con claves ── */
  return (
    <div
      className={cn(
        "flex w-full flex-col overflow-hidden rounded-[18px] border",
        expandido && "lg:h-full"
      )}
      style={{
        background: "linear-gradient(160deg, rgba(124,77,255,0.07), rgba(179,136,255,0.03) 60%, transparent)",
        borderColor: "rgba(124,77,255,0.12)",
      }}
    >
      {/* Header */}
      <div className="flex items-center gap-2 px-3.5 pt-3 pb-1">
        <Icono
          nombre="listaCheck"
          tamaño={15}
          peso="fill"
          className="text-violet-400"
        />
        <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-violet-400">
          Claves del día
        </p>
      </div>

      {/* Lista de claves */}
      <div className="flex flex-col gap-0.5 px-2.5 pb-3 overflow-y-auto">
        {claves.map((clave, idx) => {
          const abierta = claveAbierta === idx;
          return (
            <button
              key={idx}
              type="button"
              onClick={() => setClaveAbierta(abierta ? null : idx)}
              className={cn(
                "group w-full text-left rounded-xl px-3 py-2 transition-all duration-200",
                abierta
                  ? "bg-white/[0.07] ring-1 ring-violet-400/20"
                  : "hover:bg-white/[0.04]"
              )}
            >
              <div className="flex items-start gap-2.5">
                <span
                  className={cn(
                    "flex-1 text-[12px] leading-[1.45] transition-colors",
                    abierta
                      ? "font-semibold text-[color:var(--shell-texto)]"
                      : "font-medium text-[color:var(--shell-texto)]"
                  )}
                >
                  {clave.clave}
                </span>
                {clave.contexto && (
                  <Icono
                    nombre={abierta ? "caretArriba" : "caretAbajo"}
                    tamaño={11}
                    peso="bold"
                    className={cn(
                      "mt-[3px] shrink-0 transition-colors duration-200",
                      abierta ? "text-violet-400" : "text-[color:var(--shell-texto-tenue)]"
                    )}
                  />
                )}
              </div>

              {/* Contexto expandido */}
              {abierta && clave.contexto && (
                <div className="mt-1.5 animate-[fadeIn_150ms_ease-out] border-l-2 border-violet-400/30 pl-2.5">
                  <p className="text-[11px] leading-[1.5] text-[color:var(--shell-texto-secundario)]">
                    {clave.contexto}
                  </p>
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
