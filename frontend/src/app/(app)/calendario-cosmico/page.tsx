"use client";

import { useEffect, useState } from "react";
import {
  addMonths,
  endOfMonth,
  endOfWeek,
  format,
  isSameMonth,
  startOfMonth,
  startOfWeek,
} from "date-fns";
import { es } from "date-fns/locale";

import HeaderMobile from "@/componentes/layouts/header-mobile";
import { Esqueleto } from "@/componentes/ui/esqueleto";
import { Icono } from "@/componentes/ui/icono";
import { usarMiPerfil, usarTransitosRango } from "@/lib/hooks";
import { formatearFechaISOlocal, calcularRitmoPersonal } from "@/lib/utilidades/calendario-cosmico";

import { CalendarioMes } from "./_componentes/calendario-mes";
import { CalendarioMobileAcordion } from "./_componentes/calendario-mobile-acordion";

function crearFechaLocal(anio: number, mes: number, dia: number) {
  return new Date(anio, mes, dia, 12, 0, 0);
}

function obtenerHoyLocal() {
  const ahora = new Date();
  return crearFechaLocal(ahora.getFullYear(), ahora.getMonth(), ahora.getDate());
}

export default function PaginaCalendarioCosmico() {
  const [hoyFecha, setHoyFecha] = useState<Date>(() => obtenerHoyLocal());
  const hoy = formatearFechaISOlocal(hoyFecha);
  const mesBase = startOfMonth(hoyFecha);
  const proximoMes = startOfMonth(addMonths(mesBase, 1));

  const [mesVisible, setMesVisible] = useState<Date>(() => startOfMonth(hoyFecha));
  const [fechaSeleccionada, setFechaSeleccionada] = useState(hoy);

  // Si el mes real cambió desde la última render, actualizar hoy para re-renderizar.
  useEffect(() => {
    const verificar = () => {
      const nuevoHoy = obtenerHoyLocal();
      setHoyFecha((anterior) =>
        isSameMonth(anterior, nuevoHoy) ? anterior : nuevoHoy,
      );
    };

    const alCambiarVisibilidad = () => {
      if (document.visibilityState === "visible") verificar();
    };

    document.addEventListener("visibilitychange", alCambiarVisibilidad);
    window.addEventListener("focus", verificar);

    return () => {
      document.removeEventListener("visibilitychange", alCambiarVisibilidad);
      window.removeEventListener("focus", verificar);
    };
  }, []);

  // Si cambia el día real y se cruzó de mes, deslizar la vista al nuevo mes base.
  useEffect(() => {
    const nuevoMesBase = startOfMonth(hoyFecha);
    setMesVisible((actual) => (isSameMonth(actual, nuevoMesBase) ? actual : nuevoMesBase));
    setFechaSeleccionada((actual) => {
      const fechaActual = new Date(actual);
      return isSameMonth(fechaActual, nuevoMesBase) ? actual : formatearFechaISOlocal(hoyFecha);
    });
  }, [hoyFecha]);

  const { data: perfil } = usarMiPerfil();

  const inicioGrid = format(startOfWeek(startOfMonth(mesVisible), { weekStartsOn: 1 }), "yyyy-MM-dd");
  const finGrid = format(endOfWeek(endOfMonth(mesVisible), { weekStartsOn: 1 }), "yyyy-MM-dd");
  const { data, isLoading, isError, error, refetch } = usarTransitosRango(inicioGrid, finGrid);

  const dias = data?.dias ?? [];
  const ritmoHoy = calcularRitmoPersonal(perfil?.fecha_nacimiento, hoyFecha);
  const limiteTexto = format(proximoMes, "MMMM", { locale: es });

  return (
    <>
      <HeaderMobile titulo="Calendario Cósmico" mostrarAtras />

      <section
        className="relative min-h-full overflow-hidden"
        style={{ background: "var(--shell-fondo)" }}
      >
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(circle_at_top_left, var(--shell-glow-1), transparent 26%), radial-gradient(circle_at_top_right, var(--shell-glow-2), transparent 24%), radial-gradient(circle_at_bottom_left, var(--shell-glow-1), transparent 32%)",
          }}
        />
        <div
          className="absolute right-[-80px] top-0 h-72 w-72 rounded-full blur-3xl"
          style={{ background: "var(--shell-glow-2)" }}
        />
        <div
          className="absolute left-[-40px] top-1/3 h-64 w-64 rounded-full blur-3xl"
          style={{ background: "var(--shell-glow-1)" }}
        />

        <div className="relative z-10 mx-auto max-w-[1440px] px-4 py-4 lg:px-6 lg:py-5">
          <section className="tema-superficie-panel overflow-hidden rounded-[26px]">
            {isLoading ? (
              <div className="min-h-[720px] px-4 py-4 lg:px-5">
                <div className="flex flex-col gap-3">
                  <div className="flex items-center justify-between gap-3">
                    <Esqueleto className="h-6 w-44 rounded-full" />
                    <div className="flex gap-2">
                      <Esqueleto className="h-9 w-9 rounded-full" />
                      <Esqueleto className="h-9 w-9 rounded-full" />
                    </div>
                  </div>
                  <div className="flex flex-col gap-3">
                    <div className="flex flex-wrap gap-2">
                      <Esqueleto className="h-7 w-24 rounded-full" />
                      <Esqueleto className="h-7 w-24 rounded-full" />
                      <Esqueleto className="h-7 w-28 rounded-full" />
                    </div>
                    <div className="grid grid-cols-7 gap-2 pt-2">
                      {Array.from({ length: 35 }).map((_, indice) => (
                        <Esqueleto key={indice} className="h-28 rounded-[18px]" />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ) : null}

            {isError ? (
              <div className="flex min-h-[320px] flex-col items-start justify-center gap-4 px-5 py-6">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[color:var(--shell-texto-tenue)]">
                  Calendario no disponible
                </p>
                <h2 className="text-lg font-semibold text-[color:var(--shell-texto)]">
                  No pudimos cargar la ventana mensual
                </h2>
                <p className="max-w-xl text-sm leading-6 text-[color:var(--shell-texto-secundario)]">
                  {error?.message ?? "Intentá nuevamente en unos segundos."}
                </p>
                <button
                  type="button"
                  onClick={() => refetch()}
                  className="inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium"
                  style={{
                    borderColor: "var(--shell-borde)",
                    background: "var(--shell-superficie-suave)",
                    color: "var(--shell-texto)",
                  }}
                >
                  <Icono nombre="flecha" tamaño={14} />
                  Reintentar
                </button>
              </div>
            ) : null}

            {!isLoading && !isError ? (
              <>
                {/* Desktop: grilla mensual */}
                <div className="hidden lg:block min-h-[720px]">
                  <CalendarioMes
                    mesVisible={mesVisible}
                    hoy={hoy}
                    ritmoHoy={ritmoHoy}
                    limiteTexto={limiteTexto}
                    fechaNacimiento={perfil?.fecha_nacimiento}
                    fechaSeleccionada={fechaSeleccionada}
                    onSeleccionarFecha={setFechaSeleccionada}
                    onMesAnterior={() => {
                      setMesVisible(mesBase);
                      setFechaSeleccionada(hoy);
                    }}
                    onMesSiguiente={() => {
                      setMesVisible(proximoMes);
                      setFechaSeleccionada(format(proximoMes, "yyyy-MM-dd"));
                    }}
                    puedeIrAtras={!isSameMonth(mesVisible, mesBase)}
                    puedeIrAdelante={!isSameMonth(mesVisible, proximoMes)}
                    dias={dias}
                  />
                </div>

                {/* Mobile: acordeón por día */}
                <div className="lg:hidden">
                  <CalendarioMobileAcordion
                    mesVisible={mesVisible}
                    hoy={hoy}
                    fechaNacimiento={perfil?.fecha_nacimiento}
                    onMesAnterior={() => {
                      setMesVisible(mesBase);
                      setFechaSeleccionada(hoy);
                    }}
                    onMesSiguiente={() => {
                      setMesVisible(proximoMes);
                      setFechaSeleccionada(format(proximoMes, "yyyy-MM-dd"));
                    }}
                    puedeIrAtras={!isSameMonth(mesVisible, mesBase)}
                    puedeIrAdelante={!isSameMonth(mesVisible, proximoMes)}
                    dias={dias}
                  />
                </div>
              </>
            ) : null}
          </section>
        </div>
      </section>
    </>
  );
}
