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
  "rounded-[16px] border backdrop-blur-xl";

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
        "flex h-full min-h-0 flex-col text-[color:var(--shell-texto)]",
        esMovil &&
          "tema-superficie-panel rounded-t-[22px]",
      )}
    >
      {esMovil ? (
        <div
          className="flex items-start justify-between gap-4 border-b px-5 py-4"
          style={{ borderColor: "var(--shell-borde)" }}
        >
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[color:var(--color-acento)]">
              {detalle.sobrelinea}
            </p>
            <h3 className="mt-2 text-[17px] font-semibold leading-tight text-[color:var(--shell-texto)]">
              {detalle.titulo}
            </h3>
          </div>

          <button
            onClick={onCerrar}
            className="shrink-0 rounded-full border p-2 text-[color:var(--shell-texto-secundario)] transition-colors hover:text-[color:var(--shell-texto)]"
            style={{
              borderColor: "var(--shell-borde)",
              background: "var(--shell-superficie)",
            }}
            title="Cerrar detalle"
          >
            <Icono nombre="x" tamaño={16} />
          </button>
        </div>
      ) : null}

      <div className="flex-1 overflow-y-auto scroll-sutil px-5 py-5">
        <article
          className={cn(TARJETA_PANEL, "overflow-hidden")}
          style={{
            borderColor: "var(--shell-borde)",
            background: "var(--shell-superficie)",
            boxShadow: "var(--shell-sombra-suave)",
          }}
        >
          <section className="px-4 py-4">
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[color:var(--color-acento)]">
              Qué es
            </p>
            <p className="mt-2.5 text-[13px] leading-7 text-[color:var(--shell-texto-secundario)]">
              {detalle.resumen}
            </p>
          </section>

          <div className="border-t" style={{ borderColor: "var(--shell-borde)" }} />

          <section className="px-4 py-4">
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[color:var(--color-acento)]">
              En vos
            </p>
            <p className="mt-2.5 text-[13px] leading-7 text-[color:var(--shell-texto)]">
              {detalle.significadoUsuario}
            </p>
          </section>
        </article>
      </div>
    </div>
  );
}
