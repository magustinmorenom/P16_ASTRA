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
  modo?: "movil" | "escritorio";
}

const TARJETA_PANEL =
  "rounded-[18px] border border-white/10 bg-white/[0.06] p-4 backdrop-blur-xl";

const TARJETA_PANEL_ACENTO =
  "rounded-[18px] border border-[#B388FF]/18 bg-[linear-gradient(135deg,rgba(124,77,255,0.16),rgba(179,136,255,0.08))] p-4";

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
    subtitulo:
      seleccion.tipo === "default"
        ? "Elegí un punto del diseño para ampliar qué es y qué significa para vos."
        : detalle.resumen,
  };
}

export function PanelContextualHD({
  seleccion,
  datos,
  onCerrar,
  modo = "movil",
}: PanelContextualHDProps) {
  const [mostrarTecnico, setMostrarTecnico] = useState(false);
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
          "rounded-t-[28px] border border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(179,136,255,0.18),transparent_28%),linear-gradient(135deg,#170d2c_0%,#241148_54%,#34205f_100%)]",
      )}
    >
      {esMovil ? (
        <div className="flex items-start justify-between gap-4 border-b border-white/10 px-5 py-4">
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#D2BAFF]">
              {detalle.sobrelinea}
            </p>
            <h3 className="mt-2 text-[20px] font-semibold leading-tight text-white">
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
        <div className="flex flex-col gap-4">
          <article className={TARJETA_PANEL}>
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-violet-200/72">
              Qué es
            </p>
            <p className="mt-3 text-[14px] leading-relaxed text-violet-50/84">
              {detalle.resumen}
            </p>
          </article>

          <article className={TARJETA_PANEL_ACENTO}>
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#E1CFFF]">
              Qué significa para vos
            </p>
            <p className="mt-3 text-[14px] leading-relaxed text-white/90">
              {detalle.significadoUsuario}
            </p>
          </article>

          <article className={TARJETA_PANEL}>
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-violet-200/72">
              Claves de lectura
            </p>
            <div className="mt-3 flex flex-col gap-2.5">
              {detalle.claves.map((clave) => (
                <div
                  key={clave}
                  className="flex items-start gap-3 rounded-2xl bg-white/[0.04] px-3 py-3"
                >
                  <span className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-[#D4A234]" />
                  <p className="text-[13px] leading-relaxed text-violet-50/80">
                    {clave}
                  </p>
                </div>
              ))}
            </div>
          </article>

          <article className={TARJETA_PANEL}>
            <button
              onClick={() => setMostrarTecnico((valor) => !valor)}
              className="flex w-full items-center justify-between text-left text-violet-100/78"
            >
              <span className="text-[11px] font-semibold uppercase tracking-[0.16em]">
                Datos técnicos
              </span>
              <Icono
                nombre={mostrarTecnico ? "caretArriba" : "caretAbajo"}
                tamaño={16}
              />
            </button>

            {mostrarTecnico ? (
              <div className="mt-3 flex flex-col gap-2">
                {detalle.tecnico.map((fila) => (
                  <div
                    key={`${fila.etiqueta}-${fila.valor}`}
                    className="flex items-center justify-between gap-4 rounded-2xl bg-white/[0.04] px-3 py-2.5"
                  >
                    <span className="text-[12px] text-violet-100/56">
                      {fila.etiqueta}
                    </span>
                    <span className="text-[12px] font-medium text-white/86">
                      {fila.valor}
                    </span>
                  </div>
                ))}
              </div>
            ) : null}
          </article>
        </div>
      </div>
    </div>
  );
}
