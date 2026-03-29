"use client";

import {
  COLORES_PLANETA,
  BADGE_ASPECTO,
  SIMBOLOS_ASPECTO,
  normalizarClave,
  agruparAspectos,
} from "@/lib/utilidades/interpretaciones-natal";
import type { Aspecto } from "@/lib/tipos";

interface AspectosNarrativoProps {
  aspectos: Aspecto[];
  onSeleccionar: (a: Aspecto) => void;
}

export function AspectosNarrativo({ aspectos, onSeleccionar }: AspectosNarrativoProps) {
  const grupos = agruparAspectos(aspectos);

  return (
    <section className="mb-8">
      <h2 className="text-[15px] font-semibold text-[#2C2926] mb-3">Aspectos Planetarios</h2>
      <div className="space-y-5">
        {grupos.map((grupo) => {
          const badge = BADGE_ASPECTO[grupo.tipo];
          return (
            <div key={grupo.tipo}>
              {/* Encabezado de grupo */}
              <div className="flex items-center gap-2 mb-2">
                {badge && (
                  <span className={`text-[11px] font-semibold rounded-full px-2.5 py-0.5 ${badge.bg} ${badge.text}`}>
                    {badge.label}
                  </span>
                )}
                <span className="text-[11px] text-[#B3ADA7]">{grupo.aspectos.length} aspectos</span>
              </div>
              {/* Lista */}
              <div className="space-y-1.5">
                {grupo.aspectos.map((aspecto, idx) => {
                  const clave = normalizarClave(aspecto.tipo);
                  const simbolo = SIMBOLOS_ASPECTO[clave] || "·";
                  const orbeEstrecho = aspecto.orbe < 3;
                  const color1 = COLORES_PLANETA[aspecto.planeta1] || "#9E9E9E";
                  const color2 = COLORES_PLANETA[aspecto.planeta2] || "#9E9E9E";

                  return (
                    <button
                      key={`${aspecto.planeta1}-${aspecto.planeta2}-${idx}`}
                      onClick={() => onSeleccionar(aspecto)}
                      className={`
                        w-full text-left bg-white rounded-xl px-4 py-3 flex items-center justify-between
                        border transition-all cursor-pointer hover:border-[#E8E4E0] hover:shadow-sm
                        ${orbeEstrecho ? "border-[#E8E4E0]/80" : "border-transparent"}
                      `}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: color1 }} />
                        <span className="text-[13px] font-medium text-[#2C2926]">{aspecto.planeta1}</span>
                        <span className="text-[14px] text-[#B3ADA7]">{simbolo}</span>
                        <span className="text-[13px] font-medium text-[#2C2926]">{aspecto.planeta2}</span>
                        <div className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: color2 }} />
                      </div>
                      <div className="flex items-center gap-2 shrink-0 ml-2">
                        <span className="text-[11px] text-[#8A8580]">
                          {aspecto.orbe.toFixed(1)}°
                        </span>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded ${
                          aspecto.aplicativo ? "bg-emerald-50 text-emerald-600" : "bg-gray-50 text-gray-500"
                        }`}>
                          {aspecto.aplicativo ? "Ap" : "Sep"}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
