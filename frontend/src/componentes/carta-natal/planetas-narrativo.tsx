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
          <p className={`${ETIQUETA_CARTA} text-violet-200/72`}>Mapa planetario</p>
          <h2 className="mt-1.5 text-[18px] font-semibold tracking-tight text-white">
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
                  ? "border-[#B388FF]/35 bg-[#7C4DFF]/12 shadow-[0_18px_40px_rgba(124,77,255,0.18)]"
                  : "hover:-translate-y-0.5 hover:border-white/15 hover:bg-white/[0.06]"
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-3">
                    <div
                      className="h-3 w-3 rounded-full shrink-0"
                      style={{ backgroundColor: color }}
                    />
                    <span className="text-[15px] font-semibold tracking-tight text-white">
                      {planeta.nombre}
                    </span>
                  </div>

                  <div className="mt-3 flex flex-wrap items-center gap-2 text-[12px]">
                    <span className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/[0.08] px-2.5 py-1 font-medium text-white/78">
                      <IconoSigno signo={planeta.signo} tamaño={14} className="text-[#B388FF]" />
                      {planeta.signo}
                    </span>
                    <span className="rounded-full border border-white/10 bg-white/[0.06] px-2.5 py-1 font-medium text-white/64">
                      Casa {ROMANO[planeta.casa]}
                    </span>
                    <span className="rounded-full border border-white/10 bg-white/[0.06] px-2.5 py-1 font-mono text-[#D9C2FF]">
                      {planeta.grado_en_signo.toFixed(1)}°
                    </span>
                  </div>
                </div>

                <div className="flex flex-col items-end gap-2">
                  {planeta.retrogrado && (
                    <span className="rounded-full bg-rose-500/16 px-2 py-1 text-[10px] font-semibold text-rose-200">
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

              <p className="mt-4 text-[13px] leading-relaxed text-white/60 line-clamp-3">
                {narrativa}
              </p>
            </button>
          );
        })}
      </div>
    </section>
  );
}
