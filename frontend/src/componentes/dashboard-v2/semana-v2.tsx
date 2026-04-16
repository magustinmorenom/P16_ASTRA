"use client";

import { useState, useRef, useCallback, useMemo, useEffect } from "react";
import { PanelGlass } from "./panel-glass";
import { Icono } from "@/componentes/ui/icono";
import { usarPronosticoSemanaSiguiente } from "@/lib/hooks/usar-pronostico";
import type { DiaSemanalDTO } from "@/lib/tipos";
import { fechaHoyLocal, fechaDeDate } from "@/lib/utilidades/fecha-local";

const DIAS_SEMANA = ["DOM", "LUN", "MAR", "MIÉ", "JUE", "VIE", "SÁB"] as const;

function obtenerDiaSemana(fechaStr: string): string {
  const fecha = new Date(fechaStr + "T12:00:00");
  return DIAS_SEMANA[fecha.getDay()];
}

function obtenerDiaMes(fechaStr: string): number {
  return new Date(fechaStr + "T12:00:00").getDate();
}

/** Calcula el lunes de la siguiente semana a partir de hoy. */
function lunesSiguienteSemana(): string {
  const hoy = new Date();
  const diff = (7 - hoy.getDay() + 1) % 7 || 7; // días hasta próximo lunes
  const lunes = new Date(hoy);
  lunes.setDate(hoy.getDate() + diff);
  return fechaDeDate(lunes);
}

const CLIMA_LABEL: Record<string, string> = {
  favorable: "Favorable",
  neutro: "Neutro",
  desafiante: "Desafiante",
};

const CLIMA_COLOR: Record<string, string> = {
  favorable: "var(--shell-badge-exito-texto)",
  neutro: "var(--shell-badge-violeta-texto)",
  desafiante: "var(--shell-badge-error-texto)",
};

interface TooltipState {
  dia: DiaSemanalDTO | null;
  x: number;
  y: number;
}

function TooltipDia({ dia, x, y, saliendo }: { dia: DiaSemanalDTO; x: number; y: number; saliendo: boolean }) {
  const diaSem = obtenerDiaSemana(dia.fecha);
  const diaMes = obtenerDiaMes(dia.fecha);

  return (
    <div
      className={`fixed z-[100] pointer-events-none transition-all duration-200 ease-out ${
        saliendo
          ? "opacity-0 translate-y-1.5 scale-[0.97]"
          : "animate-[tooltip-in_200ms_ease-out_both]"
      }`}
      style={{ left: x, top: y, transform: "translateY(-100%)", opacity: saliendo ? 0 : 1 }}
    >
      <div
        className="w-[220px] rounded-2xl border px-4 py-3.5"
        style={{
          background: "var(--shell-panel), var(--shell-fondo)",
          borderColor: "var(--shell-borde-fuerte)",
          boxShadow: "var(--shell-sombra-fuerte)",
        }}
      >
        <div className="flex items-center gap-2 mb-2.5">
          <span className="font-[family-name:var(--font-inria)] text-[20px] font-bold leading-none text-[color:var(--shell-texto)]">
            {diaSem} {diaMes}
          </span>
          <span
            className="h-[7px] w-[7px] rounded-full"
            style={{ background: CLIMA_COLOR[dia.clima_estado] ?? "var(--color-acento)" }}
          />
          <span className="text-[11px] font-medium text-[color:var(--shell-texto-tenue)]">
            {CLIMA_LABEL[dia.clima_estado] ?? dia.clima_estado}
          </span>
        </div>
        <p className="mb-3 text-[13px] leading-[1.4] text-[color:var(--shell-texto-secundario)]">
          {dia.frase_corta}
        </p>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <Icono nombre="rayo" tamaño={12} peso="fill" className="text-[color:var(--color-acento)]" />
            <span className="text-[11px] text-[color:var(--shell-texto-tenue)]">Energía</span>
            <span className="text-[11px] font-semibold text-[color:var(--shell-texto)]">{dia.energia}/10</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Icono nombre="destello" tamaño={12} peso="fill" className="text-[color:var(--color-acento)]" />
            <span className="text-[11px] text-[color:var(--shell-texto-tenue)]">Nº</span>
            <span className="text-[11px] font-semibold text-[color:var(--shell-texto)]">{dia.numero_personal}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

/** Esqueleto de carga para las cards de la semana. */
function EsqueletoSemana() {
  return (
    <div className="flex gap-2 overflow-hidden px-0.5 pt-2 pb-1">
      {Array.from({ length: 7 }, (_, i) => (
        <div
          key={i}
          className="h-[80px] w-[160px] min-w-[160px] animate-pulse rounded-xl"
          style={{
            animationDelay: `${i * 80}ms`,
            background: "var(--shell-superficie)",
          }}
        />
      ))}
    </div>
  );
}

interface SemanaV2Props {
  semana: DiaSemanalDTO[];
  onGenerarPodcastSemana: () => void;
  generandoPodcast: boolean;
}

export function SemanaV2({
  semana,
  onGenerarPodcastSemana,
  generandoPodcast,
}: SemanaV2Props) {
  const [verSiguiente, setVerSiguiente] = useState(false);
  const [animando, setAnimando] = useState(false);
  const carruselRef = useRef<HTMLDivElement | null>(null);

  // Fetch de la siguiente semana (solo cuando se activa)
  const fechaSiguiente = useMemo(() => lunesSiguienteSemana(), []);
  const {
    data: pronosticoSiguiente,
    isLoading: cargandoSiguiente,
  } = usarPronosticoSemanaSiguiente(verSiguiente ? fechaSiguiente : undefined);

  const semanaVisible = verSiguiente
    ? (pronosticoSiguiente?.semana ?? [])
    : semana;

  const primero = semanaVisible[0];
  const ultimo = semanaVisible[semanaVisible.length - 1];
  const rangoTexto = primero && ultimo
    ? `${obtenerDiaMes(primero.fecha)} - ${obtenerDiaMes(ultimo.fecha)}`
    : "";

  // El podcast de la siguiente semana solo se habilita el sábado (día 6)
  const hoyEsSabado = new Date().getDay() === 6;
  const podcastHabilitado = !verSiguiente || hoyEsSabado;

  const alternarSemana = useCallback(() => {
    setAnimando(true);
    // Fade-out
    setTimeout(() => {
      setVerSiguiente((v) => !v);
      // Fade-in tras cambio
      setTimeout(() => setAnimando(false), 50);
    }, 250);
  }, []);

  // Tooltip state
  const [tooltip, setTooltip] = useState<TooltipState>({ dia: null, x: 0, y: 0 });
  const [saliendo, setSaliendo] = useState(false);
  const hideTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fadeTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const mostrarTooltip = useCallback((dia: DiaSemanalDTO, e: React.MouseEvent) => {
    if (hideTimeout.current) clearTimeout(hideTimeout.current);
    if (fadeTimeout.current) clearTimeout(fadeTimeout.current);
    setSaliendo(false);
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const tooltipW = 220;
    const gap = 8;
    // Centrar horizontalmente sobre la card, clampeando dentro del viewport
    const xIdeal = rect.left + rect.width / 2 - tooltipW / 2;
    const xMax = document.documentElement.clientWidth - tooltipW - gap;
    const x = Math.min(Math.max(gap, xIdeal), xMax);
    // Justo arriba de la card
    const y = Math.max(gap, rect.top - gap);
    setTooltip({ dia, x, y });
  }, []);

  const ocultarTooltip = useCallback(() => {
    if (hideTimeout.current) clearTimeout(hideTimeout.current);
    hideTimeout.current = setTimeout(() => {
      setSaliendo(true);
      fadeTimeout.current = setTimeout(() => {
        setTooltip({ dia: null, x: 0, y: 0 });
        setSaliendo(false);
      }, 200);
    }, 100);
  }, []);

  const mostrandoCarga = verSiguiente && cargandoSiguiente;
  const mostrarEsqueleto = mostrandoCarga && semanaVisible.length === 0;

  useEffect(() => {
    const carrusel = carruselRef.current;
    if (!carrusel || mostrarEsqueleto) return;

    const diaActual = new Date().getDay();
    const abrirHaciaLaDerecha = !verSiguiente && diaActual !== 1 && diaActual !== 2;

    const frame = window.requestAnimationFrame(() => {
      carrusel.scrollLeft = abrirHaciaLaDerecha
        ? Math.max(0, carrusel.scrollWidth - carrusel.clientWidth)
        : 0;
    });

    return () => window.cancelAnimationFrame(frame);
  }, [mostrarEsqueleto, verSiguiente, semanaVisible.length]);

  return (
    <div className="flex flex-col gap-3">
      <div
        className="flex flex-col gap-2.5 overflow-hidden rounded-[18px] border p-2.5"
        style={{
          borderColor: "var(--shell-borde)",
          background: "var(--shell-panel)",
          boxShadow: "var(--shell-sombra-suave)",
        }}
      >
        {/* Day cards row — con animación de transición */}
        {mostrarEsqueleto ? (
          <EsqueletoSemana />
        ) : (
        <div
          className={`transition-all duration-250 ease-out ${
            animando
              ? "opacity-0 translate-y-2 scale-[0.98]"
              : "opacity-100 translate-y-0 scale-100"
          }`}
        >
          <div
            ref={carruselRef}
            data-testid="carrusel-semana"
            className="flex gap-2 overflow-x-auto px-0.5 pt-2 pb-1 scroll-sutil-dark"
          >
            {semanaVisible.map((dia, idx) => {
              const diaSem = obtenerDiaSemana(dia.fecha);
              const diaMes = obtenerDiaMes(dia.fecha);
              const hoy = fechaHoyLocal() === dia.fecha;

              return (
                <div
                  key={dia.fecha}
                  onMouseEnter={(e) => mostrarTooltip(dia, e)}
                  onMouseLeave={ocultarTooltip}
                  className="animate-[fade-in-up_300ms_ease-out_both]"
                  style={{ animationDelay: `${idx * 50}ms`, opacity: hoy ? 1 : 0.9 }}
                >
                  <PanelGlass
                    className="relative flex w-[160px] min-w-[160px] shrink-0 items-start gap-2.5 p-2.5"
                    style={
                      hoy
                        ? {
                            background: "var(--shell-chip)",
                            borderColor: "var(--shell-borde-fuerte)",
                            boxShadow: "var(--shell-sombra-suave)",
                          }
                        : undefined
                    }
                  >
                    {hoy && (
                      <span
                        className="absolute -top-1 -right-1 h-2.5 w-2.5 rounded-full shadow-[0_0_6px_var(--shell-glow-1)]"
                        style={{ background: "var(--color-acento)" }}
                      />
                    )}
                    <div
                      className="flex min-w-[40px] shrink-0 flex-col items-center justify-center gap-0.5 rounded-lg border px-2 py-1.5 backdrop-blur-[21px]"
                      style={
                        hoy
                          ? {
                              background: "var(--shell-chip)",
                              borderColor: "var(--shell-borde-fuerte)",
                            }
                          : {
                              background: "var(--shell-superficie-suave)",
                              borderColor: "var(--shell-borde)",
                            }
                      }
                    >
                      <span className="text-[12px] font-medium leading-tight text-[color:var(--shell-texto-secundario)]">
                        {diaSem}
                      </span>
                      <span className="font-[family-name:var(--font-inria)] text-[22px] leading-none text-[color:var(--shell-texto)]">
                        {diaMes}
                      </span>
                    </div>
                    <p className="flex-1 line-clamp-3 text-[13px] leading-[1.4] text-[color:var(--shell-texto-secundario)]">
                      {dia.frase_corta}
                    </p>
                  </PanelGlass>
                </div>
              );
            })}
          </div>
        </div>
        )}

        {/* Divider */}
        <div className="h-px" style={{ background: "var(--shell-borde)" }} />

        {/* Acciones */}
        <div className="flex gap-2.5">
          <button
            onClick={podcastHabilitado ? onGenerarPodcastSemana : undefined}
            disabled={!podcastHabilitado || generandoPodcast}
            className={`flex-1 rounded-2xl overflow-hidden relative transition-opacity duration-200 ${
              !podcastHabilitado ? "opacity-50" : ""
            }`}
            style={{
              borderColor: "var(--shell-borde-fuerte)",
              borderWidth: 1,
              background: "var(--shell-gradiente-acento-suave)",
              boxShadow: "none",
            }}
          >
            <div className="relative flex items-center gap-2 px-4 py-2.5">
              <span
                className="h-[33px] w-[36px] rounded-xl flex items-center justify-center shrink-0"
                style={{
                  background: "var(--shell-superficie)",
                  borderColor: "var(--shell-borde-fuerte)",
                  borderWidth: 1,
                }}
              >
                {generandoPodcast ? (
                  <div className="h-3 w-3 animate-spin rounded-full border-2 border-[color:var(--color-acento)] border-t-transparent" />
                ) : (
                  <Icono nombre="destello" tamaño={16} peso="fill" className="text-[color:var(--color-acento)]" />
                )}
              </span>
              <span className="text-[color:var(--shell-texto)] text-[11px] font-medium tracking-[2px] text-center uppercase flex-1">
                {verSiguiente && !podcastHabilitado
                  ? "El sábado se habilita este podcast"
                  : `Genera podcast de tu semana ${rangoTexto}`}
              </span>
            </div>
          </button>

          <button
            onClick={alternarSemana}
            className="flex shrink-0 items-center gap-2 rounded-2xl px-5 py-2.5 transition-colors"
            style={{
              background: "var(--shell-superficie)",
              color: "var(--shell-texto)",
            }}
          >
            <Icono
              nombre="flecha"
              tamaño={14}
              className={`transition-transform duration-200 ${verSiguiente ? "rotate-180" : ""}`}
            />
            <span className="text-[14px]">
              {verSiguiente ? "Volver a esta semana" : "Ver mi siguiente semana"}
            </span>
          </button>
        </div>
      </div>

      {/* Tooltip flotante */}
      {tooltip.dia && <TooltipDia dia={tooltip.dia} x={tooltip.x} y={tooltip.y} saliendo={saliendo} />}
    </div>
  );
}
