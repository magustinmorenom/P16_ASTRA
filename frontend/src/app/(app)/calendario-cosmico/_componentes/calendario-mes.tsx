"use client";

import { useMemo } from "react";
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isToday,
  addMonths,
  subMonths,
} from "date-fns";
import { es } from "date-fns/locale";
import { Icono } from "@/componentes/ui/icono";
import { cn } from "@/lib/utilidades/cn";
import type { TransitosDia } from "@/lib/tipos";

const DIAS_SEMANA = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

export function CalendarioMes({
  mesActual,
  onCambiarMes,
  diaSeleccionado,
  onSeleccionar,
  datosRango,
}: {
  mesActual: Date;
  onCambiarMes: (mes: Date) => void;
  diaSeleccionado: string | null;
  onSeleccionar: (fecha: string) => void;
  datosRango: TransitosDia[] | undefined;
}) {
  const diasCalendario = useMemo(() => {
    const inicioMes = startOfMonth(mesActual);
    const finMes = endOfMonth(mesActual);
    const inicioSemana = startOfWeek(inicioMes, { weekStartsOn: 1 });
    const finSemana = endOfWeek(finMes, { weekStartsOn: 1 });
    return eachDayOfInterval({ start: inicioSemana, end: finSemana });
  }, [mesActual]);

  // Mapa de fecha -> datos para acceso rápido
  const mapaFechas = useMemo(() => {
    const mapa = new Map<string, TransitosDia>();
    if (datosRango) {
      for (const dia of datosRango) {
        mapa.set(dia.fecha, dia);
      }
    }
    return mapa;
  }, [datosRango]);

  return (
    <div>
      {/* Header con navegación de mes */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-texto">
          {format(mesActual, "MMMM yyyy", { locale: es })}
        </h2>
        <div className="flex gap-2">
          <button
            onClick={() => onCambiarMes(subMonths(mesActual, 1))}
            className="p-1.5 rounded-lg hover:bg-[#F5F0FF] transition-colors"
          >
            <Icono nombre="flechaIzquierda" tamaño={18} />
          </button>
          <button
            onClick={() => onCambiarMes(addMonths(mesActual, 1))}
            className="p-1.5 rounded-lg hover:bg-[#F5F0FF] transition-colors"
          >
            <Icono nombre="flecha" tamaño={18} />
          </button>
        </div>
      </div>

      {/* Headers de días de la semana */}
      <div className="grid grid-cols-7 gap-1 mb-1">
        {DIAS_SEMANA.map((dia) => (
          <div
            key={dia}
            className="text-center text-xs font-medium text-texto-terciario py-1"
          >
            {dia}
          </div>
        ))}
      </div>

      {/* Celdas del calendario */}
      <div className="grid grid-cols-7 gap-1">
        {diasCalendario.map((fecha) => {
          const fechaStr = format(fecha, "yyyy-MM-dd");
          const esMesActual = isSameMonth(fecha, mesActual);
          const esHoy = isToday(fecha);
          const seleccionado = fechaStr === diaSeleccionado;
          const datosDia = mapaFechas.get(fechaStr);
          const hayRetrogrado = datosDia?.planetas?.some(
            (p) => p.retrogrado
          );

          return (
            <button
              key={fechaStr}
              onClick={() => esMesActual && onSeleccionar(fechaStr)}
              disabled={!esMesActual}
              className={cn(
                "relative rounded-lg p-1.5 min-h-[44px] flex flex-col items-center gap-0.5 transition-all text-sm",
                !esMesActual && "opacity-30 cursor-default",
                esMesActual && !esHoy && !seleccionado && "bg-[#F5F0FF] hover:bg-[#EDE5FF]",
                esHoy && !seleccionado && "bg-[#7C4DFF] text-white font-bold",
                seleccionado && "ring-2 ring-[#B388FF] bg-[#EDE5FF]",
              )}
            >
              <span>{format(fecha, "d")}</span>

              {/* Indicadores de eventos */}
              {datosDia && esMesActual && (
                <div className="flex gap-0.5">
                  {hayRetrogrado && (
                    <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
                  )}
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
