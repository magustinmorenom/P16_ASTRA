"use client";

import { useMemo, useState } from "react";

import { Badge } from "@/componentes/ui/badge";
import { Icono } from "@/componentes/ui/icono";
import { IconoAstral, type NombreIconoAstral } from "@/componentes/ui/icono-astral";
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
          />
        ) : (
          <VistaDefault datos={datos} modo={modo} />
        )}
      </div>

      {detalle?.formula && (
        <div className={cn(
          "border-t",
          modo === "desktop" ? "border-white/[0.08]" : "border-white/10",
        )}>
          <button
            onClick={() => setMostrarTecnico((actual) => !actual)}
            className={cn(
              "flex w-full items-center justify-between px-5 py-3 text-[11px] font-medium uppercase tracking-[0.18em] transition-colors",
              modo === "desktop"
                ? "text-white/44 hover:bg-white/[0.04]"
                : "text-white/50 hover:bg-white/[0.04]",
            )}
          >
            <span>Dato técnico</span>
            <Icono nombre={mostrarTecnico ? "caretUp" : "caretDown"} tamaño={14} />
          </button>
          {mostrarTecnico && (
            <div className={cn(
              "px-5 pb-5 text-[13px] leading-6",
              modo === "desktop" ? "text-white/62" : "text-white/72",
            )}>
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
  modo,
}: {
  datos: Numerologia;
  modo: "desktop" | "mobile";
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
      <div className="rounded-[28px] border border-white/[0.08] bg-[linear-gradient(180deg,rgba(255,255,255,0.08),rgba(255,255,255,0.03))] p-5 shadow-[0_18px_40px_rgba(8,2,22,0.24)]">
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#7C4DFF]/16 text-[#D9C2FF]">
          <IconoAstral nombre="numerologia" tamaño={28} className="text-current" />
        </div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/48">
          Lectura contextual
        </p>
        <h3 className="mt-3 text-2xl font-semibold tracking-[-0.03em] text-white">
          Tu carta se lee por capas
        </h3>
        <p className={cn(
          "mt-3 text-[14px] leading-7",
          modo === "desktop" ? "text-white/62" : "text-white/72",
        )}>
          Tocá cualquier número, mes o etapa para ver una definición breve y después
          qué significa específicamente en tu carta.
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
      </div>

      <div className="mt-5 rounded-[24px] border border-white/[0.08] bg-white/[0.04] p-4">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/48">
          Ahora mismo
        </p>
        <p className="mt-2 text-[15px] font-medium text-white">
          {etapaActiva?.nombre ?? "Etapa activa"}
        </p>
        <p className="mt-1 text-[13px] leading-6 text-white/60">
          {etapaActiva
            ? `Estás transitando el número ${etapaActiva.numero} entre los ${etapaActiva.edad_inicio} y ${etapaActiva.edad_fin ?? "∞"} años.`
            : "Seleccioná una etapa para ver cómo ordena este tramo de tu vida."}
        </p>
      </div>
    </div>
  );
}

function VistaDetalle({
  detalle,
  onCerrar,
}: {
  detalle: DetalleNumerologia;
  onCerrar?: () => void;
}) {
  return (
    <div className="p-5">
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/48">
            {detalle.categoria}
          </p>
          <h3 className="mt-2 text-[22px] font-semibold tracking-[-0.03em] text-white">
            {detalle.titulo}
          </h3>
          {detalle.subtitulo && (
            <p className="mt-2 text-[13px] leading-6 text-white/62">
              {detalle.subtitulo}
            </p>
          )}
        </div>
        {onCerrar && (
          <button
            onClick={onCerrar}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-white/70 transition-colors hover:text-white"
          >
            <Icono nombre="x" tamaño={16} />
          </button>
        )}
      </div>

      <div className="rounded-[28px] border border-white/[0.08] bg-[linear-gradient(180deg,rgba(255,255,255,0.08),rgba(255,255,255,0.03))] p-5 shadow-[0_18px_40px_rgba(8,2,22,0.22)]">
        <div className="flex items-center gap-4">
          {detalle.icono && (
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#7C4DFF]/14 text-[#D9C2FF]">
              <IconoAstral nombre={detalle.icono} tamaño={24} className="text-current" />
            </div>
          )}
          <div>
            <p className={cn(
              "text-5xl font-semibold leading-none",
              detalle.esMaestro ? "text-[#F0D68A]" : "text-[#D9C2FF]",
            )}>
              {detalle.numero}
            </p>
            <p className="mt-2 text-[14px] font-medium text-white/82">
              {detalle.descripcion}
            </p>
          </div>
        </div>
        {detalle.esMaestro && (
          <Badge variante="advertencia" className="mt-4">
            Número Maestro
          </Badge>
        )}
      </div>

      <div className="mt-5 rounded-[24px] border border-white/[0.08] bg-white/[0.04] p-4">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/48">
          Qué es
        </p>
        <p className="mt-3 text-[14px] leading-7 text-white/72">
          {detalle.queEs}
        </p>
      </div>

      <div className="mt-4 rounded-[24px] border border-[#B388FF]/12 bg-[#7C4DFF]/10 p-4">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#D9C2FF]">
          Qué significa para vos
        </p>
        <p className="mt-3 text-[14px] leading-7 text-white/82">
          {detalle.significadoPersonal}
        </p>
        {detalle.descripcion_larga && (
          <p className="mt-3 text-[13px] leading-6 text-white/62">
            {detalle.descripcion_larga}
          </p>
        )}
      </div>

      {detalle.extra && (
        <div className="mt-4 rounded-[24px] border border-white/[0.08] bg-white/[0.04] p-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/48">
            Lectura puntual
          </p>
          <p className="mt-3 text-[14px] leading-7 text-white/72">
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
    <div className="rounded-[20px] border border-white/[0.08] bg-white/[0.04] px-4 py-3">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/44">
            {etiqueta}
          </p>
          <p className="mt-1 text-[13px] text-white/60">
            {descripcion}
          </p>
        </div>
        <span className="text-[28px] font-semibold tracking-[-0.03em] text-[#D9C2FF]">
          {valor}
        </span>
      </div>
    </div>
  );
}
