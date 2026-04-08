"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type RefObject,
} from "react";
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

interface TooltipDiaState {
  fecha: string;
  eventos: EventoClaveCalendario[];
  ritmo: RitmoPersonalCalendario | null;
  faseLunar: string;
}

interface PosicionTooltipState {
  x: number;
  y: number;
}

const ANCHO_MAXIMO_TOOLTIP = 296;
const MARGEN_VIEWPORT = 12;
const OFFSET_CURSOR_Y = 14;
const OFFSET_CURSOR_X = 4;

function limitar(valor: number, minimo: number, maximo: number) {
  return Math.min(Math.max(valor, minimo), maximo);
}

/**
 * Posiciona el tooltip relativo al cursor del mouse.
 * Detecta en qué cuadrante del viewport está el cursor y coloca
 * el tooltip en la dirección donde hay más espacio.
 */
export function calcularPosicionTooltip({
  cursorX,
  cursorY,
  tooltipWidth,
  tooltipHeight,
  viewportWidth,
  viewportHeight,
}: {
  cursorX: number;
  cursorY: number;
  tooltipWidth: number;
  tooltipHeight: number;
  viewportWidth: number;
  viewportHeight: number;
}) {
  const maxX = viewportWidth - tooltipWidth - MARGEN_VIEWPORT;
  const maxY = viewportHeight - tooltipHeight - MARGEN_VIEWPORT;

  /* ── Eje horizontal: preferir centrado sobre el cursor, clampeado al viewport ── */
  const xIdeal = cursorX - tooltipWidth / 2 + OFFSET_CURSOR_X;
  const x = limitar(xIdeal, MARGEN_VIEWPORT, maxX);

  /* ── Eje vertical: preferir arriba del cursor; si no cabe, abajo ── */
  const arribaY = cursorY - tooltipHeight - OFFSET_CURSOR_Y;
  const abajoY = cursorY + OFFSET_CURSOR_Y + 8;

  const y = arribaY >= MARGEN_VIEWPORT
    ? arribaY
    : limitar(abajoY, MARGEN_VIEWPORT, maxY);

  return { x, y };
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
  posicion,
  referencia,
  cerrando,
}: {
  estado: TooltipDiaState;
  posicion: PosicionTooltipState | null;
  referencia: RefObject<HTMLDivElement | null>;
  cerrando: boolean;
}) {
  const primerEvento = estado.eventos[0];
  const visible = posicion !== null;

  return (
    <div
      ref={referencia}
      className={cn(
        "pointer-events-none fixed z-[100]",
        visible && !cerrando && "animate-[tooltip-in_180ms_ease-out_both]",
        cerrando && "animate-[tooltip-out_120ms_ease-in_both]",
      )}
      style={{
        left: posicion?.x ?? -9999,
        top: posicion?.y ?? -9999,
        opacity: visible && !cerrando ? 1 : 0,
      }}
    >
      <div
        className="overflow-hidden rounded-[18px] border backdrop-blur-3xl"
        style={{
          width: `min(${ANCHO_MAXIMO_TOOLTIP}px, calc(100vw - 32px))`,
          background: "rgba(14, 7, 26, 0.92)",
          borderColor: "rgba(124, 77, 255, 0.22)",
          boxShadow: "0 16px 48px rgba(0, 0, 0, 0.45), 0 0 0 1px rgba(124, 77, 255, 0.08), 0 4px 32px rgba(124, 77, 255, 0.08)",
        }}
      >
        {/* Acento superior violeta */}
        <div
          aria-hidden
          className="h-[2px] w-full"
          style={{ background: "linear-gradient(90deg, transparent 0%, rgba(124,77,255,0.7) 35%, rgba(179,136,255,0.9) 50%, rgba(124,77,255,0.7) 65%, transparent 100%)" }}
        />

        <div className="px-4 py-3.5">
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
              className="inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-semibold"
              style={{
                background: "rgba(124, 77, 255, 0.14)",
                borderColor: "rgba(124, 77, 255, 0.25)",
                color: "var(--color-acento)",
              }}
            >
              <IconoFaseLunar fase={estado.faseLunar} tamaño={13} className="text-[color:var(--color-acento)]" />
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
  const anclaTooltipRef = useRef<HTMLButtonElement | null>(null);
  const tooltipRef = useRef<HTMLDivElement | null>(null);
  const rafRef = useRef<number>(0);
  const cursorRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const [tooltip, setTooltip] = useState<TooltipDiaState | null>(null);
  const [tooltipVisible, setTooltipVisible] = useState<TooltipDiaState | null>(null);
  const [cerrando, setCerrando] = useState(false);
  const [posicionTooltip, setPosicionTooltip] = useState<PosicionTooltipState | null>(null);

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

  /* ── Animación de salida: mantener datos visibles durante fade-out ── */
  useEffect(() => {
    if (tooltip) {
      setCerrando(false);
      setTooltipVisible(tooltip);
    } else if (tooltipVisible) {
      setCerrando(true);
      const timer = setTimeout(() => {
        setTooltipVisible(null);
        setCerrando(false);
        setPosicionTooltip(null);
      }, 120);
      return () => clearTimeout(timer);
    }
  }, [tooltip]); // eslint-disable-line react-hooks/exhaustive-deps

  const ocultarTooltip = useCallback(() => {
    anclaTooltipRef.current = null;
    setTooltip(null);
  }, []);

  /* ── Reposicionar tooltip relativo al cursor ── */
  const reposicionar = useCallback(() => {
    const elementoTooltip = tooltipRef.current;
    if (!elementoTooltip || !anclaTooltipRef.current) return;

    const { x: cx, y: cy } = cursorRef.current;

    const { x, y } = calcularPosicionTooltip({
      cursorX: cx,
      cursorY: cy,
      tooltipWidth: elementoTooltip.offsetWidth,
      tooltipHeight: elementoTooltip.offsetHeight,
      viewportWidth: window.innerWidth,
      viewportHeight: window.innerHeight,
    });

    setPosicionTooltip((actual) =>
      actual?.x === x && actual?.y === y ? actual : { x, y },
    );
  }, []);

  /* ── Posicionamiento inicial: useLayoutEffect elimina 1 frame de delay ── */
  useLayoutEffect(() => {
    if (!tooltip) return;
    reposicionar();
  }, [tooltip, reposicionar]);

  /* ── Ocultar tooltip en scroll (la celda se desplaza bajo el cursor) ── */
  useEffect(() => {
    if (!tooltip) return;

    const onScroll = () => ocultarTooltip();

    window.addEventListener("scroll", onScroll, true);
    return () => window.removeEventListener("scroll", onScroll, true);
  }, [tooltip, ocultarTooltip]);

  const mostrarTooltip = useCallback(
    (
      fecha: string,
      faseLunar: string,
      eventos: EventoClaveCalendario[],
      ritmo: RitmoPersonalCalendario | null,
      elementoAncla: HTMLButtonElement,
      clientX: number,
      clientY: number,
    ) => {
      anclaTooltipRef.current = elementoAncla;
      cursorRef.current = { x: clientX, y: clientY };
      setPosicionTooltip(null);
      setTooltip({ fecha, eventos, ritmo, faseLunar });
    },
    [],
  );

  const moverTooltip = useCallback(
    (clientX: number, clientY: number) => {
      cursorRef.current = { x: clientX, y: clientY };
      if (!anclaTooltipRef.current || !tooltipRef.current) return;
      cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(reposicionar);
    },
    [reposicionar],
  );

  return (
    <div className="flex h-full flex-col">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b px-4 py-3 lg:px-5" style={{ borderColor: "var(--shell-borde)" }}>
        <div className="flex min-w-0 flex-wrap items-center gap-2.5">
          <h2 className="text-[17px] font-semibold capitalize text-[color:var(--shell-texto)]">
            {format(mesVisible, "MMMM yyyy", { locale: es })}
          </h2>
          <span className="text-[12px] text-[color:var(--shell-texto-secundario)]">
            {ritmoHoy ? `Año ${ritmoHoy.anio} · Día ${ritmoHoy.dia}` : ""}
            {ritmoHoy ? " · " : ""}
            hasta {limiteTexto}
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
                    onMouseEnter={(e) => {
                      if (!dia) return;
                      mostrarTooltip(
                        fechaStr,
                        dia.fase_lunar,
                        eventos,
                        ritmo,
                        e.currentTarget,
                        e.clientX,
                        e.clientY,
                      );
                    }}
                    onMouseMove={(e) => {
                      if (!dia) return;
                      moverTooltip(e.clientX, e.clientY);
                    }}
                    onFocus={(e) => {
                      if (!dia) return;
                      const rect = e.currentTarget.getBoundingClientRect();
                      mostrarTooltip(
                        fechaStr,
                        dia.fase_lunar,
                        eventos,
                        ritmo,
                        e.currentTarget,
                        rect.left + rect.width / 2,
                        rect.top,
                      );
                    }}
                    onMouseLeave={ocultarTooltip}
                    onBlur={ocultarTooltip}
                    className={cn(
                      "group relative min-h-[80px] overflow-hidden border-r px-2.5 py-2.5 text-left transition-[box-shadow] duration-200 last:border-r-0 sm:min-h-[90px]",
                      !perteneceAlMes && "opacity-50",
                      tieneData ? "cursor-pointer" : "cursor-default opacity-80",
                    )}
                    style={{
                      borderColor: indiceDia === 6 ? "transparent" : "var(--shell-borde)",
                      background: estaSeleccionado
                        ? "rgba(124, 77, 255, 0.055)"
                        : undefined,
                      boxShadow: estaSeleccionado
                        ? "inset 0 0 0 1.5px rgba(124, 77, 255, 0.32), inset 0 1px 0 rgba(124, 77, 255, 0.18)"
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

                    {/* Hover: gradiente violeta sutil */}
                    {tieneData && (
                      <span
                        aria-hidden
                        className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-200 group-hover:opacity-100"
                        style={{ background: "linear-gradient(145deg, rgba(124,77,255,0.09) 0%, rgba(124,77,255,0.03) 45%, transparent 75%)" }}
                      />
                    )}

                    {/* Hover: ring borde violeta sutil */}
                    {tieneData && (
                      <span
                        aria-hidden
                        className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-200 group-hover:opacity-100"
                        style={{ boxShadow: "inset 0 0 0 1px rgba(124, 77, 255, 0.18)" }}
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

      {tooltipVisible ? (
        <TooltipDiaCalendario
          estado={tooltipVisible}
          posicion={posicionTooltip}
          referencia={tooltipRef}
          cerrando={cerrando}
        />
      ) : null}
    </div>
  );
}
