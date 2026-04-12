"use client";

import { useEffect, useMemo, useRef } from "react";
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
import { IconoFaseLunar } from "@/componentes/ui/icono-fase-lunar";
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

interface DetalleDiaSeleccionado {
  fecha: string;
  faseLunar: string;
  eventos: EventoClaveCalendario[];
  ritmo: RitmoPersonalCalendario | null;
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

/**
 * Panel inline en el header del calendario que muestra el detalle del día seleccionado.
 * Reemplaza al tooltip flotante: ahora la información vive en un único lugar fijo
 * a la izquierda de las flechas de navegación.
 */
function PanelDetalleDiaHeader({ detalle }: { detalle: DetalleDiaSeleccionado }) {
  const primerEvento = detalle.eventos[0];
  const titulo = detalle.ritmo
    ? `Día personal ${detalle.ritmo.dia} · Año ${detalle.ritmo.anio}`
    : "Día del calendario";
  const descripcion =
    primerEvento?.descripcion ?? describirFaseLunar(detalle.faseLunar);
  const eventosVisibles = detalle.eventos.slice(0, 3);

  return (
    <div
      className="relative flex min-w-0 flex-1 items-center gap-3 self-stretch rounded-[18px] border px-3 py-2.5 lg:gap-3.5 lg:px-3.5 lg:py-3"
      style={{
        borderColor: "var(--shell-borde)",
        background: "var(--shell-superficie-suave)",
      }}
      key={detalle.fecha}
    >
      {/* Ícono fase lunar */}
      <div
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border lg:h-11 lg:w-11"
        style={{
          borderColor: "var(--shell-borde-fuerte)",
          background: "var(--shell-chip)",
          color: "var(--color-acento)",
        }}
      >
        <IconoFaseLunar fase={detalle.faseLunar} tamaño={20} />
      </div>

      {/* Texto: fecha + título + descripción */}
      <div className="min-w-0 flex-1">
        <p className="truncate text-[9px] font-semibold uppercase tracking-[0.18em] text-[color:var(--shell-texto-tenue)]">
          {format(parseISO(detalle.fecha), "EEEE d 'de' MMMM", { locale: es })}
          <span className="mx-1.5 opacity-40">·</span>
          <span className="text-[color:var(--color-acento)]">{detalle.faseLunar}</span>
        </p>
        <p className="mt-0.5 truncate text-[13px] font-semibold leading-tight text-[color:var(--shell-texto)]">
          {titulo}
        </p>
        <p className="mt-0.5 truncate text-[11px] leading-snug text-[color:var(--shell-texto-secundario)]">
          {descripcion}
        </p>
      </div>

      {/* Chips eventos (solo desktop ancho) */}
      {eventosVisibles.length > 0 && (
        <div className="hidden shrink-0 items-center gap-1.5 xl:flex">
          {eventosVisibles.map((evento) => {
            const tono = tonoEvento(evento.impacto);
            return (
              <span
                key={evento.id}
                className="inline-flex max-w-[140px] items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] font-medium"
                style={{ background: tono.fondo, color: tono.punto }}
              >
                <span
                  aria-hidden
                  className="h-1.5 w-1.5 shrink-0 rounded-full"
                  style={{ background: tono.punto }}
                />
                <span className="truncate">{evento.etiquetaCorta}</span>
              </span>
            );
          })}
        </div>
      )}
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

  const mapaDias = useMemo(() => {
    return new Map(dias.map((dia) => [dia.fecha, dia]));
  }, [dias]);

  const detalleSeleccionado = useMemo<DetalleDiaSeleccionado | null>(() => {
    const dia = mapaDias.get(fechaSeleccionada);
    if (!dia) return null;
    return {
      fecha: fechaSeleccionada,
      faseLunar: dia.fase_lunar,
      eventos: obtenerEventosClave(dia),
      ritmo: calcularRitmoPersonal(fechaNacimiento, parseISO(fechaSeleccionada)),
    };
  }, [fechaSeleccionada, mapaDias, fechaNacimiento]);

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

  const fechaHoy = useMemo(() => parseISO(hoy), [hoy]);
  const esHoyEnVista = isSameMonth(fechaHoy, mesVisible);
  const diaDestacado = format(esHoyEnVista ? fechaHoy : startOfMonth(mesVisible), "d");
  const mesNombreVisible = format(mesVisible, "MMMM", { locale: es });
  const anioVisible = format(mesVisible, "yyyy");

  return (
    <div className="flex h-full flex-col">
      <div
        className="relative flex flex-wrap items-center justify-between gap-4 overflow-hidden border-b px-4 py-4 lg:px-6 lg:py-5"
        style={{ borderColor: "var(--shell-borde)" }}
      >
        {/* Glow ambiental sutil violeta */}
        <span
          aria-hidden
          className="pointer-events-none absolute -left-16 -top-20 h-48 w-48 rounded-full blur-3xl"
          style={{ background: "radial-gradient(circle, rgba(124,77,255,0.10) 0%, transparent 70%)" }}
        />
        <span
          aria-hidden
          className="pointer-events-none absolute -right-10 -bottom-16 h-40 w-40 rounded-full blur-3xl"
          style={{ background: "radial-gradient(circle, rgba(179,136,255,0.08) 0%, transparent 70%)" }}
        />

        {/* Bloque numérico día — identidad del mes visible */}
        <div className="relative flex shrink-0 items-center gap-2.5">
          <div className="relative flex flex-col items-start leading-none">
            <span
              aria-hidden
              className="text-[8.5px] font-semibold uppercase tracking-[0.28em]"
              style={{
                color: esHoyEnVista
                  ? "var(--color-acento)"
                  : "var(--shell-texto-tenue)",
              }}
            >
              {esHoyEnVista ? "Hoy" : "Día 1"}
            </span>
            <span
              className="mt-1 block text-[30px] font-light leading-none tabular-nums tracking-[-0.035em] lg:text-[32px]"
              style={
                esHoyEnVista
                  ? {
                      backgroundImage:
                        "linear-gradient(150deg, var(--color-acento) 0%, #B388FF 65%, #D4A234 130%)",
                      WebkitBackgroundClip: "text",
                      WebkitTextFillColor: "transparent",
                      backgroundClip: "text",
                      color: "transparent",
                    }
                  : { color: "var(--shell-texto)" }
              }
            >
              {diaDestacado}
            </span>
          </div>
          <span
            aria-hidden
            className="h-9 w-px"
            style={{
              background:
                "linear-gradient(180deg, transparent 0%, var(--shell-borde) 35%, var(--shell-borde) 65%, transparent 100%)",
            }}
          />
          <div className="flex flex-col leading-[1.05]">
            <span
              className="text-[15px] font-medium capitalize lg:text-[16px]"
              style={{ color: "var(--shell-texto)" }}
            >
              {mesNombreVisible}
            </span>
            <span
              className="mt-1 text-[9px] font-semibold uppercase tracking-[0.32em] tabular-nums"
              style={{ color: "var(--shell-texto-tenue)" }}
            >
              {anioVisible}
            </span>
            <span
              className="mt-1 text-[8.5px] font-medium uppercase tracking-[0.18em]"
              style={{ color: "var(--shell-texto-tenue)" }}
            >
              Hasta{" "}
              <span
                className="capitalize"
                style={{ color: "var(--shell-texto-secundario)" }}
              >
                {limiteTexto}
              </span>
            </span>
          </div>
        </div>

        {/* Panel detalle del día seleccionado — reemplaza al tooltip */}
        {detalleSeleccionado ? (
          <PanelDetalleDiaHeader detalle={detalleSeleccionado} />
        ) : (
          <div
            className="relative flex min-w-0 flex-1 items-center justify-center self-stretch rounded-[18px] border border-dashed px-4 py-3 text-[11px] font-medium text-[color:var(--shell-texto-tenue)]"
            style={{ borderColor: "var(--shell-borde)" }}
          >
            Seleccioná un día del calendario para ver su detalle
          </div>
        )}

        <div className="relative flex shrink-0 items-center gap-2">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onMesAnterior}
              disabled={!puedeIrAtras}
              aria-label="Mes actual"
              className={cn(
                "inline-flex h-10 w-10 items-center justify-center rounded-full border transition-[background-color,border-color] duration-200 hover:bg-[var(--shell-chip)] hover:border-[var(--shell-borde-fuerte)]",
                !puedeIrAtras && "cursor-not-allowed opacity-45 pointer-events-none",
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
                "inline-flex h-10 w-10 items-center justify-center rounded-full border transition-[background-color,border-color] duration-200 hover:bg-[var(--shell-chip)] hover:border-[var(--shell-borde-fuerte)]",
                !puedeIrAdelante && "cursor-not-allowed opacity-45 pointer-events-none",
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

                const tieneData = !!dia;

                return (
                  <button
                    key={fechaStr}
                    type="button"
                    onClick={() => onSeleccionarFecha(fechaStr)}
                    className={cn(
                      "relative min-h-[80px] overflow-hidden border-r px-2.5 py-2.5 text-left transition-[box-shadow,background-color] duration-200 last:border-r-0 sm:min-h-[90px]",
                      !perteneceAlMes && "opacity-50",
                      tieneData ? "cursor-pointer" : "cursor-default opacity-80",
                    )}
                    style={{
                      borderColor: indiceDia === 6 ? "transparent" : "var(--shell-borde)",
                      background: estaSeleccionado
                        ? "var(--shell-chip)"
                        : undefined,
                      boxShadow: estaSeleccionado
                        ? "inset 0 0 0 1.5px var(--shell-borde-fuerte), inset 0 1px 0 var(--shell-glow-1)"
                        : "none",
                    }}
                  >
                    {/* Indicador superior "hoy" */}
                    {esHoy && (
                      <span
                        aria-hidden
                        className="pointer-events-none absolute inset-x-0 top-0 h-[2px]"
                        style={{ background: "linear-gradient(90deg, transparent 0%, rgba(124,77,255,0.8) 30%, rgba(179,136,255,1) 50%, rgba(124,77,255,0.8) 70%, transparent 100%)" }}
                      />
                    )}

                    {/* Fila superior: número + luna + ritmo */}
                    <div className="relative flex items-center justify-between gap-1">
                      <div className="flex items-center gap-2">
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
                        {dia?.fase_lunar && (
                          <IconoFaseLunar
                            fase={dia.fase_lunar}
                            tamaño={20}
                            className="text-[color:var(--color-acento)]"
                          />
                        )}
                      </div>
                      {ritmo ? (
                        <span
                          className="inline-flex min-w-[24px] items-center justify-center rounded-full px-1.5 py-0.5 text-[10px] font-semibold transition-all duration-200"
                          style={
                            esHoy
                              ? {
                                  background: "var(--color-acento)",
                                  color: "white",
                                  boxShadow: "0 0 8px rgba(124,77,255,0.45)",
                                }
                              : {
                                  background: "var(--shell-chip)",
                                  color: "var(--color-acento)",
                                }
                          }
                        >
                          {ritmo.dia}
                        </span>
                      ) : null}
                    </div>

                    {/* Eventos */}
                    {eventos.length > 0 && (
                      <div className="relative mt-2 flex flex-col gap-1">
                        {eventos.slice(0, 2).map((evento) => {
                          const tono = tonoEvento(evento.impacto);
                          return (
                            <span
                              key={evento.id}
                              className="inline-flex items-center gap-1.5 text-[10px] leading-4 text-[color:var(--shell-texto-secundario)]"
                            >
                              <span
                                className="h-1.5 w-1.5 shrink-0 rounded-full"
                                style={{ background: tono.punto }}
                              />
                              <span className="line-clamp-1">{evento.etiquetaCorta}</span>
                            </span>
                          );
                        })}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          );
        })}
      </div>

    </div>
  );
}
