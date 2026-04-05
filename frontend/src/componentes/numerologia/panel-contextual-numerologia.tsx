"use client";

import { useMemo, useState } from "react";

import { Icono } from "@/componentes/ui/icono";
import { type NombreIconoAstral } from "@/componentes/ui/icono-astral";
import { cn } from "@/lib/utilidades/cn";
import type { Numerologia } from "@/lib/tipos";

export interface DetalleNumerologia {
  categoria: string;
  clave: string;
  titulo: string;
  subtitulo?: string;
  numero: number;
  descripcion: string;
  descripcion_larga?: string;
  queEs: string;
  significadoPersonal: string;
  formula?: string;
  extra?: string;
  esMaestro: boolean;
  icono?: NombreIconoAstral;
}

interface PanelContextualNumerologiaProps {
  detalle: DetalleNumerologia | null;
  datos: Numerologia;
  onCerrar?: () => void;
  modo?: "desktop" | "mobile";
}

const ESTILO_PANEL = {
  borderColor: "var(--shell-borde)",
  background: "var(--shell-superficie)",
  boxShadow: "var(--shell-sombra-suave)",
} as const;
const ESTILO_PANEL_SUAVE = {
  borderColor: "var(--shell-borde)",
  background: "var(--shell-superficie-suave)",
} as const;
const ESTILO_PANEL_ACENTO = {
  borderColor: "var(--shell-borde-fuerte)",
  background: "var(--shell-chip)",
} as const;

function obtenerEdad(fechaNacimiento: string) {
  const hoy = new Date();
  const nacimiento = new Date(fechaNacimiento);
  let edad = hoy.getFullYear() - nacimiento.getFullYear();
  const mesDiff = hoy.getMonth() - nacimiento.getMonth();
  if (mesDiff < 0 || (mesDiff === 0 && hoy.getDate() < nacimiento.getDate())) {
    edad--;
  }
  return edad;
}

export function PanelContextualNumerologia({
  detalle,
  datos,
  onCerrar,
  modo = "desktop",
}: PanelContextualNumerologiaProps) {
  const [mostrarTecnico, setMostrarTecnico] = useState(false);

  return (
    <div className="flex h-full flex-col">
      <div className="flex-1 overflow-y-auto scroll-sutil">
        {detalle ? (
          <VistaDetalle
            detalle={detalle}
            onCerrar={onCerrar}
            modo={modo}
          />
        ) : (
          <VistaDefault datos={datos} />
        )}
      </div>

      {detalle?.formula && (
        <div className={cn(
          "border-t",
          "border-[var(--shell-borde)]",
        )}>
          <button
            onClick={() => setMostrarTecnico((actual) => !actual)}
            className={cn(
              "flex w-full items-center justify-between px-5 py-3 text-[11px] font-medium uppercase tracking-[0.18em] transition-colors",
              "text-[color:var(--shell-texto-tenue)] hover:bg-[var(--shell-superficie-suave)]",
            )}
          >
            <span>Dato técnico</span>
            <Icono nombre={mostrarTecnico ? "caretUp" : "caretDown"} tamaño={14} />
          </button>
          {mostrarTecnico && (
            <div className="px-5 pb-5 text-[13px] leading-6 text-[color:var(--shell-texto-secundario)]">
              {detalle.formula}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function VistaDefault({
  datos,
}: {
  datos: Numerologia;
}) {
  const edadActual = obtenerEdad(datos.fecha_nacimiento);
  const senderoNatal = datos.camino_de_vida;
  const esencia = datos.impulso_del_alma;
  const diaPersonal = datos.dia_personal;
  const etapaActiva = useMemo(
    () => {
      const etapasDeVida = Array.isArray(datos.etapas_de_la_vida)
        ? datos.etapas_de_la_vida
        : [];
      return etapasDeVida.find((etapa) =>
        edadActual >= etapa.edad_inicio &&
        (etapa.edad_fin === null || edadActual < etapa.edad_fin)
      );
    },
    [datos.etapas_de_la_vida, edadActual],
  );

  return (
    <div className="p-5">
      <div className="rounded-[24px] border p-5" style={ESTILO_PANEL}>
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[color:var(--color-acento)]">
          Lectura contextual
        </p>
        <h3 className="mt-3 text-[18px] font-semibold tracking-[-0.03em] text-[color:var(--shell-texto)]">
          Seleccioná un número
        </h3>
        <p className="mt-3 text-[13px] leading-6 text-[color:var(--shell-texto-secundario)]">
          Abrí sendero, esencia, ritmo o etapa y el panel te devuelve definición breve y lectura puntual.
        </p>
      </div>

      <div className="mt-5 space-y-3">
        <ResumenLinea
          etiqueta="Sendero natal"
          valor={senderoNatal?.numero ?? "—"}
          descripcion={senderoNatal?.descripcion ?? "Sin lectura disponible todavía."}
        />
        <ResumenLinea
          etiqueta="Esencia"
          valor={esencia?.numero ?? "—"}
          descripcion={esencia?.descripcion ?? "Sin lectura disponible todavía."}
        />
        <ResumenLinea
          etiqueta="Día personal"
          valor={diaPersonal?.numero ?? "—"}
          descripcion={diaPersonal?.descripcion ?? "Sin lectura disponible todavía."}
        />
        <div className="rounded-[20px] border px-4 py-3" style={ESTILO_PANEL_SUAVE}>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[color:var(--shell-texto-tenue)]">
            Etapa activa
          </p>
          <p className="mt-1 text-[13px] leading-6 text-[color:var(--shell-texto-secundario)]">
            <span className="font-medium text-[color:var(--shell-texto)]">{etapaActiva?.nombre ?? "Tramo actual"}</span>
            {" · "}
          {etapaActiva
            ? `Estás transitando el número ${etapaActiva.numero} entre los ${etapaActiva.edad_inicio} y ${etapaActiva.edad_fin ?? "∞"} años.`
            : "Seleccioná una etapa para ver cómo ordena este tramo de tu vida."}
          </p>
        </div>
      </div>
    </div>
  );
}

function VistaDetalle({
  detalle,
  onCerrar,
  modo,
}: {
  detalle: DetalleNumerologia;
  onCerrar?: () => void;
  modo: "desktop" | "mobile";
}) {
  return (
    <div className="p-5">
      {modo === "mobile" && (
        <div className="mb-4 flex items-start justify-between gap-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[color:var(--color-acento)]">
              {detalle.categoria}
            </p>
            <h3 className="mt-2 text-[18px] font-semibold tracking-[-0.03em] text-[color:var(--shell-texto)]">
              {detalle.titulo}
            </h3>
            {detalle.subtitulo && (
              <p className="mt-2 text-[13px] leading-6 text-[color:var(--shell-texto-secundario)]">
                {detalle.subtitulo}
              </p>
            )}
          </div>
          {onCerrar && (
            <button
              onClick={onCerrar}
              className="flex h-9 w-9 items-center justify-center rounded-full border text-[color:var(--shell-texto-secundario)] transition-colors hover:text-[color:var(--shell-texto)]"
              style={ESTILO_PANEL_SUAVE}
            >
              <Icono nombre="x" tamaño={16} />
            </button>
          )}
        </div>
      )}

      <div className="rounded-[24px] border p-5" style={ESTILO_PANEL}>
        <div className="flex items-center gap-4">
          <div>
            <p className={cn(
              "text-[36px] font-semibold leading-none",
              detalle.esMaestro ? "text-[#D4A234]" : "text-[color:var(--color-acento)]",
            )}>
              {detalle.numero}
            </p>
            <p className="mt-2 text-[14px] font-medium text-[color:var(--shell-texto)]">
              {detalle.descripcion}
            </p>
          </div>
        </div>
        {detalle.esMaestro ? (
          <p className="mt-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#D4A234]">
            Número maestro
          </p>
        ) : null}
      </div>

      <div className="mt-5 rounded-[24px] border p-4" style={ESTILO_PANEL_SUAVE}>
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[color:var(--shell-texto-tenue)]">
          Qué es
        </p>
        <p className="mt-3 text-[14px] leading-7 text-[color:var(--shell-texto-secundario)]">
          {detalle.queEs}
        </p>
      </div>

      <div className="mt-4 rounded-[24px] border p-4" style={ESTILO_PANEL_ACENTO}>
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[color:var(--color-acento)]">
          Qué significa para vos
        </p>
        <p className="mt-3 text-[14px] leading-7 text-[color:var(--shell-texto)]">
          {detalle.significadoPersonal}
        </p>
        {detalle.descripcion_larga && (
          <p className="mt-3 text-[13px] leading-6 text-[color:var(--shell-texto-secundario)]">
            {detalle.descripcion_larga}
          </p>
        )}
      </div>

      {detalle.extra && (
        <div className="mt-4 rounded-[24px] border p-4" style={ESTILO_PANEL_SUAVE}>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[color:var(--shell-texto-tenue)]">
            Lectura puntual
          </p>
          <p className="mt-3 text-[14px] leading-7 text-[color:var(--shell-texto-secundario)]">
            {detalle.extra}
          </p>
        </div>
      )}
    </div>
  );
}

function ResumenLinea({
  etiqueta,
  valor,
  descripcion,
}: {
  etiqueta: string;
  valor: number | string;
  descripcion: string;
}) {
  return (
    <div className="rounded-[20px] border px-4 py-3" style={ESTILO_PANEL_SUAVE}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[color:var(--shell-texto-tenue)]">
            {etiqueta}
          </p>
          <p className="mt-1 text-[13px] text-[color:var(--shell-texto-secundario)]">
            {descripcion}
          </p>
        </div>
        <span className="text-[28px] font-semibold tracking-[-0.03em] text-[color:var(--color-acento)]">
          {valor}
        </span>
      </div>
    </div>
  );
}
