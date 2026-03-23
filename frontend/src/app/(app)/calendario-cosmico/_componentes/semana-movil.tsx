"use client";

import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import { IconoSigno } from "@/componentes/ui/icono-astral";
import { Esqueleto } from "@/componentes/ui/esqueleto";
import { cn } from "@/lib/utilidades/cn";
import type { TransitosDia } from "@/lib/tipos";

export function SemanaMovil({
  dias,
  hoy,
  diaSeleccionado,
  onSeleccionar,
  cargando,
}: {
  dias: TransitosDia[] | undefined;
  hoy: string;
  diaSeleccionado: string | null;
  onSeleccionar: (fecha: string) => void;
  cargando: boolean;
}) {
  if (cargando) {
    return (
      <div className="flex gap-3 overflow-x-auto pb-2 scroll-sutil">
        {Array.from({ length: 7 }).map((_, i) => (
          <Esqueleto key={i} className="h-28 w-24 shrink-0 rounded-xl" />
        ))}
      </div>
    );
  }

  if (!dias || dias.length === 0) return null;

  return (
    <div>
      <h2 className="text-lg font-bold text-texto mb-3">Próximos 7 días</h2>
      <div className="flex gap-3 overflow-x-auto pb-2 scroll-sutil">
        {dias.map((dia) => {
          const esHoy = dia.fecha === hoy;
          const seleccionado = dia.fecha === diaSeleccionado;
          const fechaObj = parseISO(dia.fecha);
          const sol = dia.planetas.find((p) => p.nombre === "Sol");
          const luna = dia.planetas.find((p) => p.nombre === "Luna");
          const hayRetrogrado = dia.planetas.some((p) => p.retrogrado);

          return (
            <button
              key={dia.fecha}
              onClick={() => onSeleccionar(dia.fecha)}
              className={cn(
                "shrink-0 w-24 rounded-xl p-3 flex flex-col items-center gap-1.5 transition-all border",
                esHoy
                  ? "bg-[#7C4DFF] text-white border-[#7C4DFF]"
                  : seleccionado
                    ? "bg-[#F5F0FF] border-[#B388FF]"
                    : "bg-white border-[#E8E4E0] hover:border-[#B388FF]"
              )}
            >
              <p
                className={cn(
                  "text-[10px] font-medium uppercase",
                  esHoy ? "text-white/80" : "text-texto-terciario"
                )}
              >
                {format(fechaObj, "EEE", { locale: es })}
              </p>
              <p
                className={cn(
                  "text-lg font-bold",
                  esHoy ? "text-white" : "text-texto"
                )}
              >
                {format(fechaObj, "d")}
              </p>

              {/* Sol */}
              {sol && (
                <div className="flex items-center gap-1">
                  <IconoSigno
                    signo={sol.signo}
                    tamaño={14}
                    className={esHoy ? "text-white/90" : "text-[#7C4DFF]"}
                  />
                </div>
              )}

              {/* Luna */}
              {luna && (
                <p
                  className={cn(
                    "text-[9px]",
                    esHoy ? "text-white/70" : "text-texto-terciario"
                  )}
                >
                  Luna {luna.signo}
                </p>
              )}

              {/* Indicadores */}
              <div className="flex gap-1">
                {hayRetrogrado && (
                  <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
