"use client";

import { useMemo, useState, useEffect } from "react";
import {
  eachDayOfInterval,
  endOfMonth,
  format,
  isToday,
  parseISO,
  startOfMonth,
} from "date-fns";
import { es } from "date-fns/locale";

import { Icono } from "@/componentes/ui/icono";
import { IconoFaseLunar } from "@/componentes/ui/icono-fase-lunar";
import { IconoSigno } from "@/componentes/ui/icono-astral";
import type { TransitosDia } from "@/lib/tipos";
import { cn } from "@/lib/utilidades/cn";
import {
  calcularRitmoPersonal,
  describirFaseLunar,
  obtenerEventosClave,
  obtenerPlanetasClave,
  obtenerRetrogradosActivos,
  type EventoClaveCalendario,
  type RitmoPersonalCalendario,
} from "@/lib/utilidades/calendario-cosmico";

function tonoEvento(impacto: EventoClaveCalendario["impacto"]) {
  switch (impacto) {
    case "favorable":
      return "var(--shell-badge-exito-texto)";
    case "precaucion":
      return "var(--shell-badge-error-texto)";
    default:
      return "var(--shell-badge-violeta-texto)";
  }
}

export function CalendarioMobileAcordion({
  mesVisible,
  hoy,
  fechaNacimiento,
  onMesAnterior,
  onMesSiguiente,
  puedeIrAtras,
  puedeIrAdelante,
  dias,
}: {
  mesVisible: Date;
  hoy: string;
  fechaNacimiento?: string | null;
  onMesAnterior: () => void;
  onMesSiguiente: () => void;
  puedeIrAtras: boolean;
  puedeIrAdelante: boolean;
  dias: TransitosDia[];
}) {
  const [diaAbierto, setDiaAbierto] = useState<string | null>(hoy);

  // Al cambiar de mes, abrir el primer día
  useEffect(() => {
    const primerDia = format(startOfMonth(mesVisible), "yyyy-MM-dd");
    setDiaAbierto((actual) => {
      const fechaActual = actual ? parseISO(actual) : null;
      if (fechaActual && format(startOfMonth(fechaActual), "yyyy-MM") === format(mesVisible, "yyyy-MM")) {
        return actual;
      }
      return primerDia;
    });
  }, [mesVisible]);

  const mapaDias = useMemo(
    () => new Map(dias.map((d) => [d.fecha, d])),
    [dias],
  );

  const diasDelMes = useMemo(() => {
    return eachDayOfInterval({
      start: startOfMonth(mesVisible),
      end: endOfMonth(mesVisible),
    });
  }, [mesVisible]);

  const mesNombre = format(mesVisible, "MMMM yyyy", { locale: es });

  return (
    <div className="flex h-full flex-col">
      {/* Header: mes + navegacion */}
      <div
        className="flex items-center justify-between border-b px-4 py-3"
        style={{ borderColor: "var(--shell-borde)" }}
      >
        <h2 className="text-[16px] font-semibold capitalize text-[color:var(--shell-texto)]">
          {mesNombre}
        </h2>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={onMesAnterior}
            disabled={!puedeIrAtras}
            aria-label="Mes actual"
            className={cn(
              "flex h-9 w-9 items-center justify-center rounded-full border transition-colors",
              !puedeIrAtras && "opacity-40 pointer-events-none"
            )}
            style={{
              borderColor: "var(--shell-borde)",
              background: "var(--shell-superficie-suave)",
              color: "var(--shell-texto)",
            }}
          >
            <Icono nombre="flechaIzquierda" tamaño={15} />
          </button>
          <button
            type="button"
            onClick={onMesSiguiente}
            disabled={!puedeIrAdelante}
            aria-label="Próximo mes"
            className={cn(
              "flex h-9 w-9 items-center justify-center rounded-full border transition-colors",
              !puedeIrAdelante && "opacity-40 pointer-events-none"
            )}
            style={{
              borderColor: "var(--shell-borde)",
              background: "var(--shell-superficie-suave)",
              color: "var(--shell-texto)",
            }}
          >
            <Icono nombre="flecha" tamaño={15} />
          </button>
        </div>
      </div>

      {/* Lista de días accordion */}
      <div className="flex-1 overflow-y-auto scroll-sutil">
        {diasDelMes.map((fecha) => {
          const fechaStr = format(fecha, "yyyy-MM-dd");
          const dia = mapaDias.get(fechaStr);
          const esHoy = fechaStr === hoy;
          const abierto = diaAbierto === fechaStr;
          const ritmo = calcularRitmoPersonal(fechaNacimiento, fecha);
          const eventos = dia ? obtenerEventosClave(dia) : [];
          const cantEventos = eventos.length;

          return (
            <div
              key={fechaStr}
              className={cn(
                "border-b transition-colors duration-200",
                esHoy && !abierto && "bg-[var(--shell-superficie-suave)]"
              )}
              style={{ borderColor: "var(--shell-borde)" }}
            >
              {/* Titulo accordion */}
              <button
                type="button"
                onClick={() => setDiaAbierto(abierto ? null : fechaStr)}
                className={cn(
                  "flex w-full items-center gap-3 px-4 py-3 text-left transition-colors duration-200",
                  abierto && "bg-[var(--shell-superficie-suave)]"
                )}
              >
                {/* Indicador lateral hoy */}
                <div
                  className={cn(
                    "h-8 w-[3px] shrink-0 rounded-full transition-colors",
                    esHoy
                      ? "bg-[var(--color-acento)]"
                      : abierto
                        ? "bg-[var(--shell-borde-fuerte)]"
                        : "bg-transparent"
                  )}
                />

                {/* Fecha + primer evento */}
                <div className="min-w-0 flex-1">
                  <p
                    className={cn(
                      "text-[14px] font-semibold capitalize leading-tight",
                      esHoy
                        ? "text-[color:var(--color-acento)]"
                        : "text-[color:var(--shell-texto)]"
                    )}
                  >
                    {esHoy ? "Hoy" : format(fecha, "EEE", { locale: es })}
                    <span className="font-normal text-[color:var(--shell-texto-secundario)]">
                      {", "}
                      {format(fecha, "d MMM", { locale: es })}
                    </span>
                  </p>
                  {eventos[0] && (
                    <p className="mt-0.5 truncate text-[11px] leading-tight text-[color:var(--shell-texto-secundario)]">
                      {eventos[0].titulo}
                    </p>
                  )}
                </div>

                {/* Metas compactas */}
                <div className="flex items-center gap-2 shrink-0">
                  {dia?.fase_lunar && (
                    <IconoFaseLunar
                      fase={dia.fase_lunar}
                      tamaño={16}
                      className="text-[color:var(--color-acento)]"
                    />
                  )}
                  {ritmo && (
                    <span
                      className="inline-flex h-5 min-w-[20px] items-center justify-center rounded-full px-1 text-[10px] font-semibold"
                      style={{
                        background: esHoy ? "var(--color-acento)" : "var(--shell-chip)",
                        color: esHoy ? "white" : "var(--color-acento)",
                      }}
                    >
                      {ritmo.dia}
                    </span>
                  )}
                  {cantEventos > 0 && (
                    <span className="text-[10px] font-medium text-[color:var(--shell-texto-tenue)]">
                      {cantEventos}
                    </span>
                  )}
                  <Icono
                    nombre={abierto ? "caretArriba" : "caretAbajo"}
                    tamaño={14}
                    peso="bold"
                    className={cn(
                      "transition-colors",
                      abierto ? "text-[color:var(--color-acento)]" : "text-[color:var(--shell-texto-tenue)]"
                    )}
                  />
                </div>
              </button>

              {/* Detalle expandido */}
              {abierto && dia && (
                <DetalleAcordion
                  dia={dia}
                  ritmo={ritmo}
                  eventos={eventos}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ─── Detalle del día expandido ─── */

function DetalleAcordion({
  dia,
  ritmo,
  eventos,
}: {
  dia: TransitosDia;
  ritmo: RitmoPersonalCalendario | null;
  eventos: EventoClaveCalendario[];
}) {
  const retrogrados = obtenerRetrogradosActivos(dia.planetas);
  const planetas = obtenerPlanetasClave(dia);

  return (
    <div
      className="animate-[fadeIn_150ms_ease-out] border-t px-4 pb-4"
      style={{
        borderColor: "var(--shell-borde)",
        background: "var(--shell-superficie-suave)",
      }}
    >
      {/* Ritmo personal */}
      {ritmo && (
        <div className="py-3 border-b" style={{ borderColor: "var(--shell-borde)" }}>
          <div className="flex items-baseline gap-4">
            <div className="flex items-baseline gap-1.5">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-[color:var(--shell-texto-tenue)]">Día</span>
              <span className="text-[20px] font-bold text-[color:var(--shell-texto)]">{ritmo.dia}</span>
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-[color:var(--shell-texto-tenue)]">Año</span>
              <span className="text-[16px] font-semibold text-[color:var(--shell-texto)]">{ritmo.anio}</span>
            </div>
          </div>
          <p className="mt-1 text-[11px] leading-[1.5] text-[color:var(--shell-texto-secundario)]">
            {ritmo.descripcionDia}
          </p>
        </div>
      )}

      {/* Eventos */}
      {eventos.length > 0 && (
        <div className="py-3 border-b" style={{ borderColor: "var(--shell-borde)" }}>
          <div className="flex flex-col gap-2.5">
            {eventos.map((evento) => (
              <div key={evento.id} className="flex gap-2.5">
                <span
                  className="mt-1.5 h-2 w-2 shrink-0 rounded-full"
                  style={{ background: tonoEvento(evento.impacto) }}
                />
                <div className="min-w-0">
                  <p
                    className="text-[12px] font-medium"
                    style={{ color: tonoEvento(evento.impacto) }}
                  >
                    {evento.titulo}
                  </p>
                  <p className="mt-0.5 text-[11px] leading-[1.5] text-[color:var(--shell-texto-secundario)]">
                    {evento.descripcion}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Luna + retro */}
      <div className="py-3 border-b" style={{ borderColor: "var(--shell-borde)" }}>
        <div className="flex items-center gap-2">
          <IconoFaseLunar fase={dia.fase_lunar} tamaño={18} className="text-[color:var(--color-acento)]" />
          <span className="text-[12px] font-medium text-[color:var(--shell-texto)]">{dia.fase_lunar}</span>
        </div>
        <p className="mt-1 text-[11px] leading-[1.5] text-[color:var(--shell-texto-secundario)]">
          {describirFaseLunar(dia.fase_lunar)}
        </p>
        {retrogrados.length > 0 && (
          <p className="mt-1.5 flex items-center gap-1.5 text-[11px] text-[color:var(--shell-texto-secundario)]">
            <Icono nombre="flechaIzquierda" tamaño={11} className="text-[color:var(--shell-badge-error-texto)]" />
            Retro: {retrogrados.join(", ")}
          </p>
        )}
      </div>

      {/* Planetas clave */}
      <div className="pt-3">
        <div className="flex flex-wrap gap-2">
          {planetas.map((planeta) => (
            <div
              key={planeta.nombre}
              className="flex items-center gap-2 rounded-full border px-2.5 py-1"
              style={{
                borderColor: "var(--shell-borde)",
                background: "var(--shell-superficie)",
              }}
            >
              <IconoSigno
                signo={planeta.signo}
                tamaño={14}
                className="text-[color:var(--color-acento)]"
              />
              <span className="text-[11px] font-medium text-[color:var(--shell-texto)]">
                {planeta.nombre}
                {planeta.retrogrado && (
                  <span className="ml-0.5 text-[color:var(--shell-badge-error-texto)]">R</span>
                )}
              </span>
              <span className="text-[10px] text-[color:var(--shell-texto-tenue)]">
                {planeta.grado_en_signo.toFixed(0)}°
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
