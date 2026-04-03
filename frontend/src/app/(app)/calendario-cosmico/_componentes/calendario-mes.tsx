"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameMonth,
  parseISO,
  startOfMonth,
  startOfWeek,
} from "date-fns";
import { es } from "date-fns/locale";

import { Icono } from "@/componentes/ui/icono";
import type { TransitosDia } from "@/lib/tipos";
import { cn } from "@/lib/utilidades/cn";
import {
  calcularRitmoPersonal,
  describirFaseLunar,
  obtenerEventosClave,
  type EventoClaveCalendario,
  type RitmoPersonalCalendario,
} from "@/lib/utilidades/calendario-cosmico";

const DIAS_SEMANA = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

interface TooltipDiaState {
  fecha: string;
  x: number;
  y: number;
  eventos: EventoClaveCalendario[];
  ritmo: RitmoPersonalCalendario | null;
  faseLunar: string;
}

function tonoEvento(impacto: EventoClaveCalendario["impacto"]) {
  switch (impacto) {
    case "favorable":
      return {
        punto: "var(--shell-badge-exito-texto)",
        fondo: "var(--shell-badge-exito-fondo)",
      };
    case "precaucion":
      return {
        punto: "var(--shell-badge-error-texto)",
        fondo: "var(--shell-badge-error-fondo)",
      };
    default:
      return {
        punto: "var(--shell-badge-violeta-texto)",
        fondo: "var(--shell-badge-violeta-fondo)",
      };
  }
}

function TooltipDiaCalendario({
  estado,
}: {
  estado: TooltipDiaState;
}) {
  const primerEvento = estado.eventos[0];

  return (
    <div
      className="pointer-events-none fixed z-[100] animate-[tooltip-in_180ms_ease-out_both]"
      style={{ left: estado.x, top: estado.y }}
    >
      <div
        className="w-[280px] rounded-[22px] border px-4 py-3.5 backdrop-blur-3xl"
        style={{
          background: "var(--shell-panel)",
          borderColor: "var(--shell-borde)",
          boxShadow: "var(--shell-sombra-fuerte)",
        }}
      >
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[color:var(--shell-texto-tenue)]">
              {format(parseISO(estado.fecha), "EEEE d 'de' MMMM", { locale: es })}
            </p>
            <p className="mt-1 text-sm font-semibold text-[color:var(--shell-texto)]">
              {estado.ritmo
                ? `Día personal ${estado.ritmo.dia} · Año ${estado.ritmo.anio}`
                : "Calendario del día"}
            </p>
          </div>
          <span
            className="rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em]"
            style={{
              background: "var(--shell-chip)",
              color: "var(--color-acento)",
            }}
          >
            {estado.faseLunar}
          </span>
        </div>

        <p className="mt-3 text-[12px] leading-5 text-[color:var(--shell-texto-secundario)]">
          {primerEvento?.descripcion ?? describirFaseLunar(estado.faseLunar)}
        </p>

        <div className="mt-3 flex flex-wrap gap-2">
          {estado.eventos.slice(0, 3).map((evento) => {
            const tono = tonoEvento(evento.impacto);
            return (
              <span
                key={evento.id}
                className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-medium"
                style={{ background: tono.fondo, color: tono.punto }}
              >
                <span
                  className="h-1.5 w-1.5 rounded-full"
                  style={{ background: tono.punto }}
                />
                {evento.etiquetaCorta}
              </span>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export function CalendarioMes({
  mesVisible,
  hoy,
  ritmoHoy,
  limiteTexto,
  fechaNacimiento,
  fechaSeleccionada,
  onSeleccionarFecha,
  onMesAnterior,
  onMesSiguiente,
  puedeIrAtras,
  puedeIrAdelante,
  dias,
}: {
  mesVisible: Date;
  hoy: string;
  ritmoHoy: RitmoPersonalCalendario | null;
  limiteTexto: string;
  fechaNacimiento?: string | null;
  fechaSeleccionada: string;
  onSeleccionarFecha: (fecha: string) => void;
  onMesAnterior: () => void;
  onMesSiguiente: () => void;
  puedeIrAtras: boolean;
  puedeIrAdelante: boolean;
  dias: TransitosDia[];
}) {
  const contenedorSemanasRef = useRef<HTMLDivElement | null>(null);
  const refsSemana = useRef<Record<number, HTMLDivElement | null>>({});
  const [tooltip, setTooltip] = useState<TooltipDiaState | null>(null);

  const mapaDias = useMemo(() => {
    return new Map(dias.map((dia) => [dia.fecha, dia]));
  }, [dias]);

  const semanas = useMemo(() => {
    const inicio = startOfWeek(startOfMonth(mesVisible), { weekStartsOn: 1 });
    const fin = endOfWeek(endOfMonth(mesVisible), { weekStartsOn: 1 });
    const intervalo = eachDayOfInterval({ start: inicio, end: fin });

    return intervalo.reduce<Date[][]>((acumulado, fecha, indice) => {
      const indiceSemana = Math.floor(indice / 7);
      if (!acumulado[indiceSemana]) acumulado[indiceSemana] = [];
      acumulado[indiceSemana].push(fecha);
      return acumulado;
    }, []);
  }, [mesVisible]);

  const indiceSemanaActiva = useMemo(() => {
    const fechaAncla = format(
      isSameMonth(parseISO(hoy), mesVisible) ? parseISO(hoy) : parseISO(fechaSeleccionada),
      "yyyy-MM-dd",
    );
    return semanas.findIndex((semana) =>
      semana.some((fecha) => format(fecha, "yyyy-MM-dd") === fechaAncla),
    );
  }, [fechaSeleccionada, hoy, mesVisible, semanas]);

  useEffect(() => {
    if (indiceSemanaActiva < 0) return;
    const fila = refsSemana.current[indiceSemanaActiva];
    if (!fila || typeof fila.scrollIntoView !== "function") return;
    fila.scrollIntoView({ block: "nearest" });
  }, [indiceSemanaActiva, semanas.length]);

  return (
    <div className="flex h-full flex-col">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b px-4 py-3 lg:px-5" style={{ borderColor: "var(--shell-borde)" }}>
        <div className="flex min-w-0 flex-wrap items-center gap-2.5">
          <h2 className="text-[17px] font-semibold capitalize text-[color:var(--shell-texto)]">
            {format(mesVisible, "MMMM yyyy", { locale: es })}
          </h2>
          {ritmoHoy ? (
            <>
              <span
                className="inline-flex items-center rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em]"
                style={{ background: "var(--shell-chip)", color: "var(--color-acento)" }}
              >
                Año {ritmoHoy.anio}
              </span>
              <span
                className="inline-flex items-center rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em]"
                style={{ background: "var(--shell-chip)", color: "var(--color-acento)" }}
              >
                Hoy {ritmoHoy.dia}
              </span>
            </>
          ) : null}
          <span
            className="inline-flex items-center rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em]"
            style={{ background: "var(--shell-superficie-suave)", color: "var(--shell-texto-tenue)" }}
          >
            Hasta {limiteTexto}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onMesAnterior}
              disabled={!puedeIrAtras}
              aria-label="Mes actual"
              className={cn(
                "inline-flex h-10 w-10 items-center justify-center rounded-full border transition-colors",
                !puedeIrAtras && "cursor-not-allowed opacity-45",
              )}
              style={{
                borderColor: "var(--shell-borde)",
                background: "var(--shell-superficie-suave)",
                color: "var(--shell-texto)",
              }}
            >
              <Icono nombre="flechaIzquierda" tamaño={16} />
            </button>
            <button
              type="button"
              onClick={onMesSiguiente}
              disabled={!puedeIrAdelante}
              aria-label="Próximo mes"
              className={cn(
                "inline-flex h-10 w-10 items-center justify-center rounded-full border transition-colors",
                !puedeIrAdelante && "cursor-not-allowed opacity-45",
              )}
              style={{
                borderColor: "var(--shell-borde)",
                background: "var(--shell-superficie-suave)",
                color: "var(--shell-texto)",
              }}
            >
              <Icono nombre="flecha" tamaño={16} />
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-7 border-b text-[11px] font-semibold uppercase tracking-[0.16em]" style={{ borderColor: "var(--shell-borde)" }}>
        {DIAS_SEMANA.map((dia) => (
          <div
            key={dia}
            className="px-3 py-2.5 text-center text-[color:var(--shell-texto-tenue)]"
          >
            {dia}
          </div>
        ))}
      </div>

      <div ref={contenedorSemanasRef} className="min-h-0 flex-1 overflow-y-auto scroll-sutil">
        {semanas.map((semana, indiceSemana) => {
          const contieneHoy = semana.some((fecha) => format(fecha, "yyyy-MM-dd") === hoy);

          return (
            <div
              key={`${format(semana[0], "yyyy-MM-dd")}-${indiceSemana}`}
              ref={(nodo) => {
                refsSemana.current[indiceSemana] = nodo;
              }}
              className="grid grid-cols-7 border-b"
              style={{
                borderColor: "var(--shell-borde)",
                background: contieneHoy ? "var(--shell-superficie-suave)" : "transparent",
              }}
            >
              {semana.map((fecha, indiceDia) => {
                const fechaStr = format(fecha, "yyyy-MM-dd");
                const dia = mapaDias.get(fechaStr);
                const ritmo = calcularRitmoPersonal(fechaNacimiento, fecha);
                const eventos = obtenerEventosClave(dia);
                const perteneceAlMes = isSameMonth(fecha, mesVisible);
                const estaSeleccionado = fechaStr === fechaSeleccionada;
                const esHoy = fechaStr === hoy;

                return (
                  <button
                    key={fechaStr}
                    type="button"
                    onClick={() => onSeleccionarFecha(fechaStr)}
                    onMouseEnter={(evento) => {
                      if (!dia) return;
                      const rect = (evento.currentTarget as HTMLElement).getBoundingClientRect();
                      const x = Math.min(Math.max(16, rect.left), window.innerWidth - 300);
                      const y = Math.max(16, rect.top - 180);
                      setTooltip({
                        fecha: fechaStr,
                        x,
                        y,
                        eventos,
                        ritmo,
                        faseLunar: dia.fase_lunar,
                      });
                    }}
                    onMouseLeave={() => setTooltip(null)}
                    className={cn(
                      "relative min-h-[112px] border-r px-3 py-3 text-left transition-colors last:border-r-0 sm:min-h-[124px]",
                      !perteneceAlMes && "opacity-55",
                    )}
                    style={{
                      borderColor: indiceDia === 6 ? "transparent" : "var(--shell-borde)",
                      boxShadow: estaSeleccionado ? "inset 0 0 0 1px var(--shell-borde-fuerte)" : "none",
                      background: estaSeleccionado ? "var(--shell-superficie-suave)" : "transparent",
                    }}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p
                          className={cn(
                            "text-sm font-semibold",
                            esHoy
                              ? "text-[color:var(--color-acento)]"
                              : "text-[color:var(--shell-texto)]",
                          )}
                        >
                          {format(fecha, "d")}
                        </p>
                        <p className="mt-0.5 text-[10px] uppercase tracking-[0.14em] text-[color:var(--shell-texto-tenue)]">
                          {esHoy ? "Hoy" : format(fecha, "EEE", { locale: es })}
                        </p>
                      </div>

                      {ritmo ? (
                        <span
                          className="inline-flex min-w-[32px] items-center justify-center rounded-full px-2 py-1 text-[11px] font-semibold"
                          style={{
                            background: esHoy ? "var(--color-acento)" : "var(--shell-chip)",
                            color: esHoy ? "white" : "var(--color-acento)",
                          }}
                        >
                          {ritmo.dia}
                        </span>
                      ) : null}
                    </div>

                    <div className="mt-3 flex flex-col gap-1.5">
                      <p className="line-clamp-1 text-[11px] text-[color:var(--shell-texto-secundario)]">
                        {dia?.fase_lunar ?? "Sin fase disponible"}
                      </p>

                      {eventos.length > 0 ? (
                        eventos.slice(0, 2).map((evento) => {
                          const tono = tonoEvento(evento.impacto);
                          return (
                            <span
                              key={evento.id}
                              className="inline-flex items-center gap-1.5 text-[10px] leading-4 text-[color:var(--shell-texto-secundario)]"
                            >
                              <span
                                className="h-1.5 w-1.5 rounded-full"
                                style={{ background: tono.punto }}
                              />
                              <span className="line-clamp-1">{evento.etiquetaCorta}</span>
                            </span>
                          );
                        })
                      ) : (
                        <span className="text-[10px] leading-4 text-[color:var(--shell-texto-tenue)]">
                          {describirFaseLunar(dia?.fase_lunar ?? "Creciente")}
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          );
        })}
      </div>

      {tooltip ? <TooltipDiaCalendario estado={tooltip} /> : null}
    </div>
  );
}
