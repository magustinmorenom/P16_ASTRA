"use client";

import { useState, useMemo } from "react";
import { format, addDays, startOfMonth, endOfMonth } from "date-fns";
import { es } from "date-fns/locale";
import { IconoAstral } from "@/componentes/ui/icono-astral";
import { usarTransitosDia, usarTransitosRango } from "@/lib/hooks";
import {
  TarjetaTransitoHoy,
  SemanaMovil,
  CalendarioMes,
  PanelDetalleDia,
} from "./_componentes";

export default function PaginaCalendarioCosmico() {
  const hoy = useMemo(() => format(new Date(), "yyyy-MM-dd"), []);
  const [mesActual, setMesActual] = useState(() => new Date());
  const [diaSeleccionado, setDiaSeleccionado] = useState<string | null>(null);

  // Tránsitos de hoy
  const { data: datosHoy, isLoading: cargandoHoy } = usarTransitosDia(hoy);

  // Semana móvil: hoy + 6 días
  const semanaFin = useMemo(
    () => format(addDays(new Date(), 6), "yyyy-MM-dd"),
    []
  );
  const { data: datosSemana, isLoading: cargandoSemana } = usarTransitosRango(
    hoy,
    semanaFin
  );

  // Rango del mes actual para el calendario
  const mesInicio = useMemo(
    () => format(startOfMonth(mesActual), "yyyy-MM-dd"),
    [mesActual]
  );
  const mesFin = useMemo(
    () => format(endOfMonth(mesActual), "yyyy-MM-dd"),
    [mesActual]
  );
  const { data: datosMes } = usarTransitosRango(mesInicio, mesFin);

  // Detalle del día seleccionado — reutilizar datos ya cargados
  const datosDetalle = useMemo(() => {
    if (!diaSeleccionado) return undefined;
    const enSemana = datosSemana?.dias?.find(
      (d) => d.fecha === diaSeleccionado
    );
    if (enSemana) return enSemana;
    return datosMes?.dias?.find((d) => d.fecha === diaSeleccionado);
  }, [diaSeleccionado, datosSemana, datosMes]);

  // Fetch individual solo si no está en los rangos
  const { data: datosDetalleFetch, isLoading: cargandoDetalle } =
    usarTransitosDia(diaSeleccionado && !datosDetalle ? diaSeleccionado : null);

  const detalleParaMostrar = datosDetalle ?? datosDetalleFetch;

  return (
    <div className="flex h-full min-h-0 overflow-hidden">
      {/* Panel Central */}
      <section className="flex-1 scroll-sutil bg-[#FAFAFA] p-5 lg:p-[28px_32px] flex flex-col gap-6 overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-[22px] font-semibold text-[#2C2926] tracking-tight flex items-center gap-3">
            <IconoAstral nombre="horoscopo" tamaño={28} className="text-acento" />
            Calendario Cósmico
          </h1>
          <p className="text-[13px] text-[#8A8580] capitalize hidden sm:block">
            {format(new Date(), "EEEE d 'de' MMMM, yyyy", { locale: es })}
          </p>
        </div>

        {/* Tarjeta de tránsitos de hoy — compacta, fondo violeta */}
        <TarjetaTransitoHoy datos={datosHoy} cargando={cargandoHoy} />

        {/* Semana móvil */}
        <SemanaMovil
          dias={datosSemana?.dias}
          hoy={hoy}
          diaSeleccionado={diaSeleccionado}
          onSeleccionar={setDiaSeleccionado}
          cargando={cargandoSemana}
        />

        {/* Calendario mensual */}
        <CalendarioMes
          mesActual={mesActual}
          onCambiarMes={setMesActual}
          diaSeleccionado={diaSeleccionado}
          onSeleccionar={setDiaSeleccionado}
          datosRango={datosMes?.dias}
        />
      </section>

      {/* Panel Derecho — detalle del día */}
      <PanelDetalleDia
        datos={detalleParaMostrar}
        cargando={cargandoDetalle && !detalleParaMostrar}
        onCerrar={() => setDiaSeleccionado(null)}
      />
    </div>
  );
}
