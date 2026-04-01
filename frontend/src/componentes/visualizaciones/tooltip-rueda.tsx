"use client";

import {
  ELEMENTO_SIGNO,
  MODALIDAD_SIGNO,
  REGENTE_SIGNO,
  ROMANO,
} from "@/lib/utilidades/interpretaciones-natal";
import {
  interpretacionPlaneta,
  interpretacionCasa,
  INTERPRETACION_EJE,
  INTERPRETACION_SIGNO,
} from "./interpretaciones-tooltip";

// ---------------------------------------------------------------------------
// Tipos
// ---------------------------------------------------------------------------

export type DatosTooltipPlaneta = {
  tipo: "planeta";
  nombre: string;
  signo: string;
  casa?: number;
  retrogrado?: boolean;
};

export type DatosTooltipSigno = {
  tipo: "signo";
  nombre: string;
};

export type DatosTooltipCasa = {
  tipo: "casa";
  numero: number;
  signo?: string;
};

export type DatosTooltipEje = {
  tipo: "eje";
  nombre: string; // "As", "Ds", "Mc", "Ic"
};

export type DatosTooltip =
  | DatosTooltipPlaneta
  | DatosTooltipSigno
  | DatosTooltipCasa
  | DatosTooltipEje;

interface PropsTooltipRueda {
  datos: DatosTooltip;
  x: number;
  y: number;
  saliendo: boolean;
}

// ---------------------------------------------------------------------------
// Componente
// ---------------------------------------------------------------------------

export default function TooltipRueda({ datos, x, y, saliendo }: PropsTooltipRueda) {
  return (
    <div
      className={`fixed z-[200] pointer-events-none transition-all duration-200 ease-out ${
        saliendo
          ? "opacity-0 translate-y-1.5 scale-[0.97]"
          : "animate-[tooltip-in_200ms_ease-out_both]"
      }`}
      style={{ left: x, top: y }}
    >
      <div className="backdrop-blur-3xl bg-[#1A1128]/85 border border-white/15 rounded-2xl px-4 py-3 shadow-[0_8px_40px_rgba(124,77,255,0.25),0_0_1px_rgba(255,255,255,0.1)] w-[250px]">
        {datos.tipo === "planeta" && <ContenidoPlaneta datos={datos} />}
        {datos.tipo === "signo" && <ContenidoSigno datos={datos} />}
        {datos.tipo === "casa" && <ContenidoCasa datos={datos} />}
        {datos.tipo === "eje" && <ContenidoEje datos={datos} />}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Contenidos por tipo
// ---------------------------------------------------------------------------

function ContenidoPlaneta({ datos }: { datos: DatosTooltipPlaneta }) {
  const interpretacion = interpretacionPlaneta(datos.nombre, datos.signo);

  return (
    <>
      <div className="flex items-center gap-2 mb-1.5">
        <span className="text-[#f8f6ff] text-[15px] font-semibold leading-none">
          {datos.nombre} en {datos.signo}
        </span>
        {datos.retrogrado && (
          <span className="text-[10px] font-bold text-rose-400 bg-rose-400/15 rounded px-1.5 py-0.5 leading-none">
            R
          </span>
        )}
      </div>
      {datos.casa && (
        <p className="text-white/40 text-[11px] mb-2">
          Casa {ROMANO[datos.casa] ?? datos.casa}
        </p>
      )}
      <p className="text-white/85 text-[13px] leading-[1.45]">
        {interpretacion}
      </p>
    </>
  );
}

function ContenidoSigno({ datos }: { datos: DatosTooltipSigno }) {
  const elemento = ELEMENTO_SIGNO[datos.nombre] ?? "";
  const modalidad = MODALIDAD_SIGNO[datos.nombre] ?? "";
  const regente = REGENTE_SIGNO[datos.nombre] ?? "";
  const interpretacion = INTERPRETACION_SIGNO[datos.nombre] ?? "";

  return (
    <>
      <p className="text-[#f8f6ff] text-[15px] font-semibold leading-none mb-1.5">
        {datos.nombre}
      </p>
      <p className="text-white/45 text-[11px] mb-2">
        {elemento} · {modalidad} · Regente: {regente}
      </p>
      <p className="text-white/85 text-[13px] leading-[1.45]">
        {interpretacion}
      </p>
    </>
  );
}

function ContenidoCasa({ datos }: { datos: DatosTooltipCasa }) {
  const interpretacion = interpretacionCasa(datos.numero, datos.signo);

  return (
    <>
      <p className="text-[#f8f6ff] text-[15px] font-semibold leading-none mb-1.5">
        Casa {ROMANO[datos.numero] ?? datos.numero}
        {datos.signo ? ` en ${datos.signo}` : ""}
      </p>
      <p className="text-white/85 text-[13px] leading-[1.45]">
        {interpretacion}
      </p>
    </>
  );
}

function ContenidoEje({ datos }: { datos: DatosTooltipEje }) {
  const interpretacion = INTERPRETACION_EJE[datos.nombre] ?? "";

  const NOMBRE_LARGO: Record<string, string> = {
    As: "Ascendente",
    Ds: "Descendente",
    Mc: "Medio Cielo",
    Ic: "Fondo de Cielo",
  };

  return (
    <>
      <p className="text-[#f8f6ff] text-[15px] font-semibold leading-none mb-1.5">
        {NOMBRE_LARGO[datos.nombre] ?? datos.nombre}
      </p>
      <p className="text-white/85 text-[13px] leading-[1.45]">
        {interpretacion}
      </p>
    </>
  );
}
