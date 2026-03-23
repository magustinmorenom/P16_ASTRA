"use client";

import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import { Icono } from "@/componentes/ui/icono";
import { IconoSigno } from "@/componentes/ui/icono-astral";
import { Esqueleto } from "@/componentes/ui/esqueleto";
import type { TransitosDia } from "@/lib/tipos";

function formatearGrado(grado: number): string {
  const entero = Math.floor(grado);
  const minutos = Math.floor((grado - entero) * 60);
  return `${entero}°${minutos.toString().padStart(2, "0")}'`;
}

export function PanelDetalleDia({
  datos,
  cargando,
  onCerrar,
}: {
  datos: TransitosDia | undefined;
  cargando: boolean;
  onCerrar: () => void;
}) {
  return (
    <aside className="hidden lg:flex w-[300px] flex-shrink-0 bg-white flex-col border-l border-[#E8E4E0]/40 scroll-sutil overflow-y-auto">
      {/* Header */}
      <div className="p-5 pb-3 shrink-0">
        <div className="flex items-center justify-between mb-1">
          <h3 className="text-[15px] font-semibold text-[#2C2926]">
            Detalle del Día
          </h3>
          {datos && (
            <button
              onClick={onCerrar}
              className="text-[#8A8580] hover:text-[#2C2926] transition-colors"
            >
              <Icono nombre="x" tamaño={18} />
            </button>
          )}
        </div>
        {datos && (
          <p className="text-[12px] text-[#8A8580] capitalize">
            {format(parseISO(datos.fecha), "EEEE d 'de' MMMM, yyyy", { locale: es })}
          </p>
        )}
      </div>

      <div className="h-px bg-[#E8E4E0] mx-5" />

      {/* Loading */}
      {cargando && (
        <div className="p-5 flex flex-col gap-2">
          {Array.from({ length: 11 }).map((_, i) => (
            <Esqueleto key={i} className="h-[52px] rounded-xl" />
          ))}
        </div>
      )}

      {/* Sin selección */}
      {!datos && !cargando && (
        <div className="p-5 flex-1 flex flex-col items-center justify-center text-center gap-3">
          <Icono nombre="calendario" tamaño={32} className="text-[#B388FF]" />
          <p className="text-sm text-[#8A8580]">
            Seleccioná un día en el calendario o la semana para ver el detalle
          </p>
        </div>
      )}

      {/* Grid de planetas — estilo imagen */}
      {datos && (
        <div className="p-5 pt-4 flex flex-col gap-0">
          {datos.planetas.map((planeta) => (
            <div
              key={planeta.nombre}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-[#F5F0FF] transition-colors"
            >
              <IconoSigno
                signo={planeta.signo}
                tamaño={20}
                className="text-[#7C4DFF] shrink-0"
              />
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-semibold text-[#2C2926] leading-tight">
                  {planeta.nombre}
                  {planeta.retrogrado && (
                    <span className="text-red-400 text-[10px] font-bold ml-1">R</span>
                  )}
                </p>
                <p className="text-[11px] text-[#8A8580] leading-tight">
                  {planeta.signo} {formatearGrado(planeta.grado_en_signo)}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Separador */}
      {datos && <div className="h-px bg-[#E8E4E0] mx-5" />}

      {/* Espacio para texto oracular (futuro — IA) */}
      {datos && (
        <div className="p-5 flex-1">
          <p className="text-[11px] font-semibold text-[#7C4DFF] uppercase tracking-wider mb-2">
            Lectura del Día
          </p>
          <div className="rounded-xl bg-[#F5F0FF] p-4 min-h-[120px] flex items-center justify-center">
            <p className="text-[12px] text-[#8A8580] text-center italic">
              Próximamente: lectura oracular generada por IA para este día
            </p>
          </div>
        </div>
      )}
    </aside>
  );
}
