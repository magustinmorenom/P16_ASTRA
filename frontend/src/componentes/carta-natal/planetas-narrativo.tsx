"use client";

import { IconoSigno } from "@/componentes/ui/icono-astral";
import { ETIQUETA_CARTA, SUPERFICIE_CLARA_CARTA } from "@/componentes/carta-natal/estilos";
import {
  COLORES_PLANETA,
  ROMANO,
  DIGNIDAD_BADGE,
  normalizarClave,
  interpretarPlaneta,
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
    <section className="mb-8">
      <div className="mb-3">
        <div>
          <p className={`${ETIQUETA_CARTA} text-[#7C4DFF]`}>Mapa planetario</p>
          <h2 className="mt-1.5 text-[18px] font-semibold tracking-tight text-[#2C2926]">
            Tus planetas
          </h2>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
        {ordenados.map((planeta) => {
          const color = COLORES_PLANETA[planeta.nombre] || "#9E9E9E";
          const claveDignidad = planeta.dignidad ? normalizarClave(planeta.dignidad) : null;
          const dignidadEstilo = claveDignidad ? DIGNIDAD_BADGE[claveDignidad] : null;
          const esSeleccionado = planetaSeleccionado === planeta.nombre;
          const narrativa = interpretarPlaneta(
            planeta.nombre, planeta.signo, planeta.casa, planeta.dignidad, planeta.retrogrado,
          );

          return (
            <button
              key={planeta.nombre}
              onClick={() => onSeleccionar(planeta)}
              className={`${SUPERFICIE_CLARA_CARTA} w-full p-4 text-left transition-all duration-200 ${
                esSeleccionado
                  ? "border-[#7C4DFF]/55 bg-[linear-gradient(180deg,rgba(124,77,255,0.08),rgba(255,255,255,0.92))] shadow-[0_0_0_1px_rgba(124,77,255,0.14),0_24px_48px_rgba(77,29,149,0.12)]"
                  : "hover:-translate-y-0.5 hover:border-[#D9CCF5]"
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-3">
                    <div
                      className="h-3 w-3 rounded-full shrink-0"
                      style={{ backgroundColor: color }}
                    />
                    <span className="text-[15px] font-semibold tracking-tight text-[#2C2926]">
                      {planeta.nombre}
                    </span>
                  </div>

                  <div className="mt-3 flex flex-wrap items-center gap-2 text-[12px]">
                    <span className="inline-flex items-center gap-1 rounded-full border border-[#ECE4FA] bg-[#F8F4FF] px-2.5 py-1 font-medium text-[#433B51]">
                      <IconoSigno signo={planeta.signo} tamaño={14} className="text-[#7C4DFF]" />
                      {planeta.signo}
                    </span>
                    <span className="rounded-full border border-[#ECE4FA] bg-white px-2.5 py-1 font-medium text-[#5B5560]">
                      Casa {ROMANO[planeta.casa]}
                    </span>
                    <span className="rounded-full border border-[#ECE4FA] bg-white px-2.5 py-1 font-mono text-[#7C4DFF]">
                      {planeta.grado_en_signo.toFixed(1)}°
                    </span>
                  </div>
                </div>

                <div className="flex flex-col items-end gap-2">
                  {planeta.retrogrado && (
                    <span className="rounded-full bg-[#F5E9C9] px-2 py-1 text-[10px] font-semibold text-[#8A5A00]">
                      Retrógrado
                    </span>
                  )}
                  {dignidadEstilo && (
                    <span className={`rounded-full px-2 py-1 text-[10px] font-medium ${dignidadEstilo.bg} ${dignidadEstilo.text}`}>
                      {planeta.dignidad}
                    </span>
                  )}
                </div>
              </div>

              <p className="mt-4 text-[13px] leading-relaxed text-[#6F6A65] line-clamp-3">
                {narrativa}
              </p>
            </button>
          );
        })}
      </div>
    </section>
  );
}
