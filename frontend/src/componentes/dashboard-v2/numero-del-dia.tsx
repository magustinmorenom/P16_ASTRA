"use client";

import { useState } from "react";
import { PanelGlass } from "./panel-glass";
import type { NumeroPersonalDTO } from "@/lib/tipos";

interface NumeroDelDiaProps {
  numero: NumeroPersonalDTO;
  compacto?: boolean;
}

const ESTILO_TARJETA_NUMERO = {
  background: "var(--shell-superficie)",
  borderColor: "var(--shell-borde-fuerte)",
  boxShadow: "none",
  backdropFilter: "none",
} as const;

const ESTILO_PLACA_NUMERO = {
  background: "var(--shell-superficie-fuerte)",
  borderColor: "var(--shell-chip-borde)",
  boxShadow: "none",
} as const;

function ChipNumero({ etiqueta, valor }: { etiqueta: string; valor: number }) {
  return (
    <span
      className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium"
      style={{
        background: "var(--shell-chip)",
        color: "var(--shell-texto-secundario)",
        border: "1px solid var(--shell-chip-borde)",
      }}
    >
      <span className="text-[color:var(--shell-texto-tenue)]">{etiqueta}</span>
      <span className="font-semibold text-[color:var(--color-acento)]">{valor}</span>
    </span>
  );
}

export function NumeroDelDia({ numero, compacto = false }: NumeroDelDiaProps) {
  const [expandido, setExpandido] = useState(false);
  const tieneInterpretacion = !!numero.interpretacion_integrada;
  const tieneExtras = !!numero.mes || !!numero.ano;

  if (compacto) {
    return (
      <PanelGlass
        tono="panel"
        className="flex items-center gap-2.5 px-3 py-2.5"
        style={ESTILO_TARJETA_NUMERO}
      >
        <div
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border"
          style={ESTILO_PLACA_NUMERO}
        >
          <span className="font-[family-name:var(--font-inria)] text-[20px] font-normal leading-none text-[color:var(--color-acento)]">
            {numero.numero}
          </span>
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <p className="text-[11px] font-semibold text-[color:var(--shell-texto)]">
              Número del día
            </p>
            {tieneExtras && (
              <div className="flex gap-1">
                {numero.mes && <ChipNumero etiqueta="Mes" valor={numero.mes.numero} />}
                {numero.ano && <ChipNumero etiqueta="Año" valor={numero.ano.numero} />}
              </div>
            )}
          </div>
          <p className="mt-0.5 text-[11px] leading-4 text-[color:var(--shell-texto-secundario)] line-clamp-2">
            {numero.descripcion}
          </p>
        </div>
      </PanelGlass>
    );
  }

  return (
    <PanelGlass
      tono="panel"
      className="flex flex-col gap-0 px-3.5 py-3"
      style={ESTILO_TARJETA_NUMERO}
    >
      <div className="flex items-center gap-3">
        <div
          className="flex min-h-[66px] min-w-[72px] shrink-0 flex-col items-center justify-center rounded-[14px] border px-3 py-2"
          style={ESTILO_PLACA_NUMERO}
        >
          <span className="text-[9px] font-semibold uppercase tracking-[0.18em] text-[color:var(--shell-texto-tenue)]">
            Hoy
          </span>
          <span className="mt-1 font-[family-name:var(--font-inria)] text-[30px] font-normal leading-none text-[color:var(--color-acento)]">
            {numero.numero}
          </span>
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[color:var(--shell-texto-tenue)]">
              Número del día
            </p>
            {tieneExtras && (
              <div className="flex gap-1">
                {numero.mes && <ChipNumero etiqueta="Mes" valor={numero.mes.numero} />}
                {numero.ano && <ChipNumero etiqueta="Año" valor={numero.ano.numero} />}
              </div>
            )}
          </div>
          <p className="mt-1 text-[15px] font-semibold leading-tight text-[color:var(--shell-texto)]">
            Tu pulso del día
          </p>
          <p className="mt-1 text-[13px] leading-5 text-[color:var(--shell-texto-secundario)]">
            {numero.descripcion}
          </p>
        </div>
      </div>

      {/* Interpretación integrada: hover en desktop, tap en mobile */}
      {tieneInterpretacion && (
        <div className="relative mt-2">
          {/* Desktop: visible on hover */}
          <div className="group hidden lg:block">
            <button
              type="button"
              className="flex items-center gap-1 text-[11px] font-medium text-[color:var(--color-acento)] transition-opacity hover:opacity-80"
            >
              <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                <circle cx="8" cy="8" r="6.5" />
                <path d="M8 7v4M8 5.5v0" />
              </svg>
              Lectura integrada día · mes · año
            </button>
            <div
              className="pointer-events-none absolute left-0 right-0 top-full z-10 mt-1 rounded-xl border px-3 py-2.5 opacity-0 transition-all duration-200 group-hover:pointer-events-auto group-hover:opacity-100"
              style={{
                background: "var(--shell-superficie-fuerte)",
                borderColor: "var(--shell-borde)",
                boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
              }}
            >
              <p className="text-[12px] leading-[1.5] text-[color:var(--shell-texto-secundario)]">
                {numero.interpretacion_integrada}
              </p>
            </div>
          </div>

          {/* Mobile: tap to expand */}
          <div className="lg:hidden">
            <button
              type="button"
              onClick={() => setExpandido(!expandido)}
              className="flex items-center gap-1 text-[11px] font-medium text-[color:var(--color-acento)] transition-opacity active:opacity-70"
            >
              <svg
                width="12"
                height="12"
                viewBox="0 0 16 16"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                className={`transition-transform duration-200 ${expandido ? "rotate-180" : ""}`}
              >
                <path d="M4 6l4 4 4-4" />
              </svg>
              Lectura integrada
            </button>
            <div
              className={`overflow-hidden transition-all duration-200 ease-out ${
                expandido ? "mt-1.5 max-h-24 opacity-100" : "max-h-0 opacity-0"
              }`}
            >
              <p className="text-[12px] leading-[1.5] text-[color:var(--shell-texto-secundario)]">
                {numero.interpretacion_integrada}
              </p>
            </div>
          </div>
        </div>
      )}
    </PanelGlass>
  );
}
