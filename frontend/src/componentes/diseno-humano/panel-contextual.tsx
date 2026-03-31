"use client";

import { useMemo, useState } from "react";
import { Icono } from "@/componentes/ui/icono";
import { cn } from "@/lib/utilidades/cn";
import {
  construirDetalleContextualHD,
  type SeleccionContextualHD,
} from "@/lib/utilidades/interpretaciones-diseno-humano";
import type { DisenoHumano } from "@/lib/tipos";

interface PanelContextualHDProps {
  seleccion: SeleccionContextualHD;
  datos: DisenoHumano;
  onCerrar: () => void;
  modoMovil?: boolean;
}

export function PanelContextualHD({
  seleccion,
  datos,
  onCerrar,
  modoMovil = false,
}: PanelContextualHDProps) {
  const [mostrarTecnico, setMostrarTecnico] = useState(false);

  const detalle = useMemo(
    () => construirDetalleContextualHD(seleccion, datos),
    [datos, seleccion],
  );

  return (
    <div
      className={cn(
        "flex h-full flex-col overflow-hidden",
        modoMovil
          ? "rounded-t-[28px] border border-white/10 bg-[linear-gradient(180deg,#14081f_0%,#24123f_100%)]"
          : "border-l border-white/10 bg-[linear-gradient(180deg,#fcfbff_0%,#f4effd_100%)]",
      )}
    >
      <div
        className={cn(
          "flex items-start justify-between gap-4 border-b px-5 py-4",
          modoMovil ? "border-white/10" : "border-[#E6DDF4]",
        )}
      >
        <div className="min-w-0">
          <p
            className={cn(
              "text-[11px] font-semibold uppercase tracking-[0.18em]",
              modoMovil ? "text-[#D2BAFF]" : "text-[#7C4DFF]",
            )}
          >
            {detalle.sobrelinea}
          </p>
          <h3
            className={cn(
              "mt-2 text-[20px] font-semibold leading-tight",
              modoMovil ? "text-white" : "text-[#20172E]",
            )}
          >
            {detalle.titulo}
          </h3>
        </div>

        {seleccion.tipo !== "default" && (
          <button
            onClick={onCerrar}
            className={cn(
              "shrink-0 rounded-full border p-2 transition-colors",
              modoMovil
                ? "border-white/10 bg-white/[0.08] text-white/70 hover:bg-white/[0.14] hover:text-white"
                : "border-[#E6DDF4] bg-white/80 text-[#7C4DFF] hover:bg-[#F6F1FF]",
            )}
            title="Cerrar detalle"
          >
            <Icono nombre="x" tamaño={16} />
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto scroll-sutil px-5 py-5">
        <div className="flex flex-col gap-4">
          <article
            className={cn(
              "rounded-[22px] border p-4",
              modoMovil
                ? "border-white/10 bg-white/[0.06]"
                : "border-white/80 bg-white/80 shadow-[0_20px_40px_rgba(87,48,153,0.08)]",
            )}
          >
            <p
              className={cn(
                "text-[11px] font-semibold uppercase tracking-[0.16em]",
                modoMovil ? "text-white/45" : "text-[#7C4DFF]",
              )}
            >
              Qué es
            </p>
            <p
              className={cn(
                "mt-3 text-[14px] leading-relaxed",
                modoMovil ? "text-white/84" : "text-[#433B52]",
              )}
            >
              {detalle.resumen}
            </p>
          </article>

          <article
            className={cn(
              "rounded-[22px] border p-4",
              modoMovil
                ? "border-[#B388FF]/20 bg-[#B388FF]/10"
                : "border-[#E5D8FF] bg-[linear-gradient(135deg,rgba(124,77,255,0.12),rgba(179,136,255,0.06))]",
            )}
          >
            <p
              className={cn(
                "text-[11px] font-semibold uppercase tracking-[0.16em]",
                modoMovil ? "text-[#E1CFFF]" : "text-[#6B3ED8]",
              )}
            >
              Qué significa para vos
            </p>
            <p
              className={cn(
                "mt-3 text-[14px] leading-relaxed",
                modoMovil ? "text-white/90" : "text-[#2A2140]",
              )}
            >
              {detalle.significadoUsuario}
            </p>
          </article>

          <article
            className={cn(
              "rounded-[22px] border p-4",
              modoMovil
                ? "border-white/10 bg-white/[0.04]"
                : "border-[#E6DDF4] bg-white/75",
            )}
          >
            <p
              className={cn(
                "text-[11px] font-semibold uppercase tracking-[0.16em]",
                modoMovil ? "text-white/45" : "text-[#7C4DFF]",
              )}
            >
              Claves de lectura
            </p>
            <div className="mt-3 flex flex-col gap-2.5">
              {detalle.claves.map((clave) => (
                <div
                  key={clave}
                  className={cn(
                    "flex items-start gap-3 rounded-2xl px-3 py-3",
                    modoMovil ? "bg-white/[0.05]" : "bg-[#F8F5FF]",
                  )}
                >
                  <span
                    className={cn(
                      "mt-1 h-2.5 w-2.5 shrink-0 rounded-full",
                      modoMovil ? "bg-[#D4A234]" : "bg-[#7C4DFF]",
                    )}
                  />
                  <p
                    className={cn(
                      "text-[13px] leading-relaxed",
                      modoMovil ? "text-white/82" : "text-[#504666]",
                    )}
                  >
                    {clave}
                  </p>
                </div>
              ))}
            </div>
          </article>
        </div>
      </div>

      <div
        className={cn(
          "border-t px-5 py-4",
          modoMovil ? "border-white/10" : "border-[#E6DDF4]",
        )}
      >
        <button
          onClick={() => setMostrarTecnico((valor) => !valor)}
          className={cn(
            "flex w-full items-center justify-between text-left",
            modoMovil ? "text-white/78" : "text-[#5C4B81]",
          )}
        >
          <span className="text-[11px] font-semibold uppercase tracking-[0.16em]">
            Datos técnicos
          </span>
          <Icono
            nombre={mostrarTecnico ? "caretArriba" : "caretAbajo"}
            tamaño={16}
          />
        </button>

        {mostrarTecnico && (
          <div className="mt-3 flex flex-col gap-2">
            {detalle.tecnico.map((fila) => (
              <div
                key={`${fila.etiqueta}-${fila.valor}`}
                className={cn(
                  "flex items-center justify-between gap-4 rounded-2xl px-3 py-2.5",
                  modoMovil ? "bg-white/[0.05]" : "bg-white/80",
                )}
              >
                <span
                  className={cn(
                    "text-[12px]",
                    modoMovil ? "text-white/56" : "text-[#7C6A9A]",
                  )}
                >
                  {fila.etiqueta}
                </span>
                <span
                  className={cn(
                    "text-[12px] font-medium",
                    modoMovil ? "text-white/86" : "text-[#2A2140]",
                  )}
                >
                  {fila.valor}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
