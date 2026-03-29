"use client";

import { IconoSigno } from "@/componentes/ui/icono-astral";
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
      <h2 className="text-[15px] font-semibold text-[#2C2926] mb-3">Tus Planetas</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
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
              className={`
                w-full text-left bg-white rounded-2xl p-4 border transition-all cursor-pointer
                ${esSeleccionado
                  ? "border-[#7C4DFF] shadow-[0_0_0_1px_#7C4DFF] bg-[#FDFBFF]"
                  : "border-transparent hover:border-[#E8E4E0] hover:shadow-sm"
                }
              `}
            >
              {/* Header compacto */}
              <div className="flex items-center gap-3 mb-2">
                <div
                  className="h-3 w-3 rounded-full shrink-0"
                  style={{ backgroundColor: color }}
                />
                <span className="font-semibold text-[#2C2926] text-[14px]">{planeta.nombre}</span>
                <div className="flex items-center gap-1">
                  <IconoSigno signo={planeta.signo} tamaño={15} className="text-[#7C4DFF]" />
                  <span className="text-[13px] text-[#2C2926]">{planeta.signo}</span>
                </div>
                <span className="text-[12px] text-[#8A8580]">Casa {ROMANO[planeta.casa]}</span>
                <span className="text-[12px] font-mono text-[#7C4DFF]">{planeta.grado_en_signo.toFixed(1)}°</span>
                {planeta.retrogrado && (
                  <span className="text-[10px] font-semibold bg-amber-100 text-amber-700 rounded-full px-1.5 py-0.5">R</span>
                )}
                {dignidadEstilo && (
                  <span className={`text-[10px] font-medium rounded-full px-1.5 py-0.5 ${dignidadEstilo.bg} ${dignidadEstilo.text}`}>
                    {planeta.dignidad}
                  </span>
                )}
              </div>
              {/* Narrativa breve */}
              <p className="text-[13px] text-[#6B7280] leading-relaxed line-clamp-2">
                {narrativa}
              </p>
            </button>
          );
        })}
      </div>
    </section>
  );
}
