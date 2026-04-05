"use client";

import { IconoSigno } from "@/componentes/ui/icono-astral";
import {
  COLORES_PLANETA,
  ROMANO,
  DIGNIDAD_BADGE,
  normalizarClave,
  ordenarPlanetas,
} from "@/lib/utilidades/interpretaciones-natal";
import type { Planeta } from "@/lib/tipos";

interface PlanetasNarrativoProps {
  planetas: Planeta[];
  planetaSeleccionado: string | null;
  onSeleccionar: (p: Planeta) => void;
}

export function PlanetasNarrativo({ planetas, planetaSeleccionado, onSeleccionar }: PlanetasNarrativoProps) {
  const ordenados = ordenarPlanetas(planetas);

  return (
    <section className="divide-y divide-[var(--shell-borde)]">
      {ordenados.map((planeta) => {
          const color = COLORES_PLANETA[planeta.nombre] || "#9E9E9E";
          const claveDignidad = planeta.dignidad ? normalizarClave(planeta.dignidad) : null;
          const dignidadEstilo = claveDignidad ? DIGNIDAD_BADGE[claveDignidad] : null;
          const esSeleccionado = planetaSeleccionado === planeta.nombre;

          return (
            <button
              key={planeta.nombre}
              onClick={() => onSeleccionar(planeta)}
              className={`group flex w-full items-center gap-3 border-l-2 px-4 py-3 text-left transition-all duration-200 ${
                esSeleccionado
                  ? "border-l-[#B388FF] bg-[var(--shell-chip)]"
                  : "border-l-transparent hover:border-l-[#B388FF] hover:bg-[var(--shell-superficie-suave)]"
              }`}
            >
              <div
                className="h-3 w-3 rounded-full shrink-0"
                style={{ backgroundColor: color }}
              />

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-[14px] font-semibold tracking-tight text-[color:var(--shell-texto)]">
                    {planeta.nombre}
                  </span>
                  {planeta.retrogrado && (
                    <span
                      className="rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em]"
                      style={{
                        borderColor: "var(--shell-badge-error-borde)",
                        background: "var(--shell-badge-error-fondo)",
                        color: "var(--shell-badge-error-texto)",
                      }}
                    >
                      Retrógrado
                    </span>
                  )}
                  {dignidadEstilo && (
                    <span className={`rounded-full border px-2 py-0.5 text-[10px] font-medium ${dignidadEstilo.bg} ${dignidadEstilo.text}`}>
                      {planeta.dignidad}
                    </span>
                  )}
                </div>

                <div className="mt-1.5 flex flex-wrap items-center gap-1.5 text-[11px] text-[color:var(--shell-texto-tenue)]">
                  <span className="inline-flex items-center gap-1 font-medium text-[color:var(--shell-texto-secundario)]">
                    <IconoSigno signo={planeta.signo} tamaño={14} className="text-[#B388FF]" />
                    {planeta.signo}
                  </span>
                  <span>· Casa {ROMANO[planeta.casa]}</span>
                  <span className="font-mono text-[#D9C2FF]">· {planeta.grado_en_signo.toFixed(1)}°</span>
                </div>
              </div>

              <span className="text-[color:var(--shell-texto-tenue)] transition-colors group-hover:text-[color:var(--shell-texto-secundario)]">
                <span className="text-lg">›</span>
              </span>
            </button>
          );
        })}
    </section>
  );
}
