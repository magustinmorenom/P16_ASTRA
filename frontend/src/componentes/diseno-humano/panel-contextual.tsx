"use client";

import { useMemo } from "react";
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
  modo?: "movil" | "escritorio";
}

const TARJETA_PANEL =
  "rounded-[16px] border border-white/10 bg-white/[0.05] backdrop-blur-xl";

export function obtenerClavePanelContextualHD(seleccion: SeleccionContextualHD) {
  switch (seleccion.tipo) {
    case "default":
      return "default";
    case "tipo":
    case "autoridad":
    case "perfil":
    case "definicion":
    case "bodygraph":
      return seleccion.tipo;
    case "centro":
      return `centro:${seleccion.clave}:${seleccion.estado}`;
    case "canal":
      return `canal:${seleccion.canal.nombre}:${seleccion.canal.puertas.join("-")}`;
    case "cruz":
      return `cruz:${seleccion.clave}:${seleccion.puerta ?? "sin-puerta"}`;
    case "activacion":
      return `activacion:${seleccion.origen}:${seleccion.activacion.planeta}:${seleccion.activacion.puerta}:${seleccion.activacion.linea}:${seleccion.activacion.color}`;
    default:
      return "default";
  }
}

export function obtenerMetaPanelContextualHD(
  seleccion: SeleccionContextualHD,
  datos: DisenoHumano,
) {
  const detalle = construirDetalleContextualHD(seleccion, datos);

  return {
    etiqueta: detalle.sobrelinea,
    titulo: detalle.titulo,
    subtitulo: undefined,
  };
}

export function PanelContextualHD({
  seleccion,
  datos,
  onCerrar,
  modo = "movil",
}: PanelContextualHDProps) {
  const esMovil = modo === "movil";

  const detalle = useMemo(
    () => construirDetalleContextualHD(seleccion, datos),
    [datos, seleccion],
  );

  return (
    <div
      className={cn(
        "flex h-full min-h-0 flex-col text-white",
        esMovil &&
          "rounded-t-[22px] border border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(179,136,255,0.18),transparent_28%),linear-gradient(135deg,#170d2c_0%,#241148_54%,#34205f_100%)]",
      )}
    >
      {esMovil ? (
        <div className="flex items-start justify-between gap-4 border-b border-white/10 px-5 py-4">
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#D2BAFF]">
              {detalle.sobrelinea}
            </p>
            <h3 className="mt-2 text-[17px] font-semibold leading-tight text-white">
              {detalle.titulo}
            </h3>
          </div>

          <button
            onClick={onCerrar}
            className="shrink-0 rounded-full border border-white/10 bg-white/[0.08] p-2 text-white/72 transition-colors hover:bg-white/[0.14] hover:text-white"
            title="Cerrar detalle"
          >
            <Icono nombre="x" tamaño={16} />
          </button>
        </div>
      ) : null}

      <div className="flex-1 overflow-y-auto scroll-sutil px-5 py-5">
        <article className={cn(TARJETA_PANEL, "overflow-hidden")}>
          <section className="px-4 py-4">
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-violet-200/62">
              Qué es
            </p>
            <p className="mt-2.5 text-[13px] leading-7 text-violet-50/82">
              {detalle.resumen}
            </p>
          </section>

          <div className="border-t border-white/8" />

          <section className="px-4 py-4">
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-violet-200/62">
              En vos
            </p>
            <p className="mt-2.5 text-[13px] leading-7 text-white/84">
              {detalle.significadoUsuario}
            </p>
          </section>
        </article>
      </div>
    </div>
  );
}
