"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { PanelGlass } from "./panel-glass";
import { Icono, type NombreIcono } from "@/componentes/ui/icono";
import type { DiaSemanalDTO } from "@/lib/tipos";

/* ─── Constantes de layout SVG ─── */

const VB_W = 600;
const VB_H = 240;
const PAD_L = 24;
const PAD_R = 4;
const PAD_T = 16;
const PAD_B = 36;
const CHART_W = VB_W - PAD_L - PAD_R;
const CHART_H = VB_H - PAD_T - PAD_B;

const Y_MIN = 1;
const Y_MAX = 10;

const DIAS_SEMANA = ["DOM", "LUN", "MAR", "MIÉ", "JUE", "VIE", "SÁB"] as const;

/* ─── Lineas: config ─── */

interface ConfigLinea {
  clave: "energia" | "claridad" | "intuicion";
  etiqueta: string;
  icono: NombreIcono;
  color: string;
  ancho: number;
  dash?: string;
}

const LINEAS: ConfigLinea[] = [
  { clave: "energia", etiqueta: "Energía", icono: "rayo", color: "var(--color-acento)", ancho: 2.5 },
  { clave: "claridad", etiqueta: "Claridad", icono: "ojo", color: "var(--shell-badge-violeta-texto)", ancho: 2 },
  { clave: "intuicion", etiqueta: "Intuición", icono: "wifi", color: "var(--shell-badge-exito-texto)", ancho: 2, dash: "6 3" },
];

/* ─── Helpers de coordenadas ─── */

function mapX(i: number, total: number): number {
  if (total <= 1) return PAD_L + CHART_W / 2;
  return PAD_L + (i / (total - 1)) * CHART_W;
}

function mapY(valor: number): number {
  const t = (valor - Y_MIN) / (Y_MAX - Y_MIN);
  return PAD_T + (1 - t) * CHART_H;
}

/* ─── Interpolación Monótona en X (evita rebotes/overshoot) ─── */

function generarPathSuave(puntos: [number, number][]): string {
  if (puntos.length === 0) return "";
  if (puntos.length === 1) return `M ${puntos[0][0]},${puntos[0][1]}`;
  if (puntos.length === 2) {
    return `M ${puntos[0][0]},${puntos[0][1]} L ${puntos[1][0]},${puntos[1][1]}`;
  }

  const n = puntos.length;
  const m: number[] = new Array(n - 1);
  const dx: number[] = new Array(n - 1);
  
  for (let i = 0; i < n - 1; i++) {
    dx[i] = puntos[i + 1][0] - puntos[i][0];
    const dy = puntos[i + 1][1] - puntos[i][1];
    m[i] = dx[i] === 0 ? 0 : dy / dx[i];
  }

  const t: number[] = new Array(n);
  t[0] = m[0];
  t[n - 1] = m[n - 2];

  for (let i = 1; i < n - 1; i++) {
    if (m[i - 1] * m[i] <= 0) {
      t[i] = 0; // Extremo local: tangente horizontal
    } else {
      // Media armónica para asegurar la monotonicidad
      t[i] = 2 / (1 / m[i - 1] + 1 / m[i]);
    }
  }

  let d = `M ${puntos[0][0]},${puntos[0][1]}`;

  for (let i = 0; i < n - 1; i++) {
    const p0 = puntos[i];
    const p1 = puntos[i + 1];

    const cp1x = p0[0] + dx[i] / 3;
    const cp1y = p0[1] + t[i] * dx[i] / 3;
    const cp2x = p1[0] - dx[i] / 3;
    const cp2y = p1[1] - t[i + 1] * dx[i] / 3;

    d += ` C ${cp1x},${cp1y} ${cp2x},${cp2y} ${p1[0]},${p1[1]}`;
  }

  return d;
}

/* ─── Helpers de fecha ─── */

function obtenerDiaSemana(fechaStr: string): string {
  const f = new Date(fechaStr + "T12:00:00");
  return DIAS_SEMANA[f.getDay()];
}

function obtenerDiaMes(fechaStr: string): number {
  return new Date(fechaStr + "T12:00:00").getDate();
}

/* ─── Componente: linea animada ─── */

function LineaAnimada({
  d,
  color,
  ancho,
  dash,
  delay,
}: {
  d: string;
  color: string;
  ancho: number;
  dash?: string;
  delay: number;
}) {
  const ref = useRef<SVGPathElement>(null);
  const [longitud, setLongitud] = useState(0);

  useEffect(() => {
    if (ref.current) {
      setLongitud(ref.current.getTotalLength());
    }
  }, [d]);

  return (
    <path
      ref={ref}
      d={d}
      fill="none"
      stroke={color}
      strokeWidth={ancho}
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeDasharray={dash || (longitud > 0 ? `${longitud}` : undefined)}
      strokeDashoffset={dash ? undefined : (longitud > 0 ? `${longitud}` : undefined)}
      style={
        !dash && longitud > 0
          ? {
              animation: `dibujarLinea 1s ease-out ${delay}ms forwards`,
            }
          : dash && longitud > 0
            ? {
                strokeDasharray: dash,
                opacity: 0,
                animation: `aparecerLinea 0.4s ease-out ${delay}ms forwards`,
              }
            : undefined
      }
    />
  );
}

/* ─── Componente principal ─── */

interface GraficaTendenciaProps {
  datos: DiaSemanalDTO[];
  fechaHoy: string;
}

export function GraficaTendencia({ datos, fechaHoy }: GraficaTendenciaProps) {
  const [indiceFoco, setIndiceFoco] = useState<number | null>(null);
  const total = datos.length;

  const indiceHoy = useMemo(
    () => datos.findIndex((d) => d.fecha === fechaHoy),
    [datos, fechaHoy],
  );

  /* Precalcular puntos por linea */
  const puntosPorLinea = useMemo(() => {
    const resultado: Record<string, [number, number][]> = {};
    for (const linea of LINEAS) {
      // Filtrar puntos válidos o usar un valor por defecto si no existen
      const puntos = datos.map((d, i) => {
        const val = d[linea.clave] !== undefined && d[linea.clave] !== null ? d[linea.clave] : 5; // Fallback a 5 si falta
        return [mapX(i, total), mapY(val)] as [number, number];
      });
      resultado[linea.clave] = puntos;
    }
    return resultado;
  }, [datos, total]);

  /* Gridlines Y — valores 2, 4, 6, 8, 10 */
  const gridY = [2, 4, 6, 8, 10];

  /* Ancho de columna para hit areas */
  const anchoCol = total > 1 ? CHART_W / (total - 1) : CHART_W;

  if (datos.length < 2) return null;

  return (
    <div className="flex w-full flex-col gap-3">
      <h2 className="text-[20px] font-medium text-[color:var(--shell-texto)] tracking-[-0.01em]">
        Tendencia cósmica
      </h2>

      <PanelGlass
        tono="panel"
        className="flex flex-col gap-0 overflow-hidden rounded-[24px] border border-white/[0.06] bg-white/[0.02] backdrop-blur-xl shadow-[0_18px_40px_rgba(8,3,20,0.22)] py-4"
      >
        {/* Keyframes inline para animacion de dibujo */}
        <style>{`
          @keyframes dibujarLinea {
            to { stroke-dashoffset: 0; }
          }
          @keyframes aparecerLinea {
            to { opacity: 1; }
          }
        `}</style>

        <svg
          viewBox={`0 0 ${VB_W} ${VB_H}`}
          className="w-full"
          style={{ maxHeight: 260, width: "100%" }}
          role="img"
          aria-label="Gráfica de tendencia cósmica de 10 días"
        >
          {/* ── Gridlines Y Simplificadas (Ruido Visual Bajo) ── */}
          {[2, 5, 8].map((v) => (
            <g key={v}>
              <line
                x1={PAD_L}
                y1={mapY(v)}
                x2={VB_W - PAD_R}
                y2={mapY(v)}
                stroke="currentColor"
                className="text-white/[0.05]"
                strokeWidth={1}
              />
              <text
                x={PAD_L - 10}
                y={mapY(v) + 3}
                textAnchor="end"
                fill="var(--shell-texto-tenue)"
                opacity={0.6}
                fontSize={10}
                fontWeight={500}
                fontFamily="Inter, sans-serif"
              >
                {v}
              </text>
            </g>
          ))}

          {/* ── Linea vertical HOY Elegante ── */}
          {indiceHoy >= 0 && (
            <g>
              <defs>
                <linearGradient id="gradHoy" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--color-acento)" stopOpacity="0.0" />
                  <stop offset="50%" stopColor="var(--color-acento)" stopOpacity="0.08" />
                  <stop offset="100%" stopColor="var(--color-acento)" stopOpacity="0.0" />
                </linearGradient>
              </defs>
              <rect
                x={mapX(indiceHoy, total) - anchoCol / 2 + 4}
                y={PAD_T}
                width={anchoCol - 8}
                height={CHART_H}
                rx={12}
                fill="url(#gradHoy)"
              />
              <line
                x1={mapX(indiceHoy, total)}
                y1={PAD_T}
                x2={mapX(indiceHoy, total)}
                y2={PAD_T + CHART_H}
                stroke="var(--color-acento)"
                strokeDasharray="2 4"
                strokeWidth={1.5}
                opacity={0.3}
              />
            </g>
          )}

          {/* ── Curvas ── */}
          {LINEAS.map((linea, idx) => {
            const pts = puntosPorLinea[linea.clave];
            if (!pts || pts.length < 2) return null;
            const d = generarPathSuave(pts);
            return (
              <LineaAnimada
                key={linea.clave}
                d={d}
                color={linea.color}
                ancho={linea.ancho}
                dash={linea.dash}
                delay={idx * 200}
              />
            );
          })}

          {/* ── Circulos en HOY Premium ── */}
          {indiceHoy >= 0 &&
            LINEAS.map((linea) => {
              const pts = puntosPorLinea[linea.clave];
              if (!pts?.[indiceHoy]) return null;
              const [cx, cy] = pts[indiceHoy];
              return (
                <g key={`hoy-${linea.clave}`}>
                  <circle
                    cx={cx}
                    cy={cy}
                    r={7}
                    fill={linea.color}
                    opacity={0.15}
                  />
                  <circle
                    cx={cx}
                    cy={cy}
                    r={3.5}
                    fill={linea.color}
                    stroke="#1C0627" // Ciruela base
                    strokeWidth={2}
                  />
                </g>
              );
            })}

          {/* ── Circulos hover Glassy ── */}
          {indiceFoco !== null &&
            indiceFoco !== indiceHoy &&
            LINEAS.map((linea) => {
              const pts = puntosPorLinea[linea.clave];
              if (!pts?.[indiceFoco]) return null;
              const [cx, cy] = pts[indiceFoco];
              return (
                <circle
                  key={`foco-${linea.clave}`}
                  cx={cx}
                  cy={cy}
                  r={3.5}
                  fill={linea.color}
                  stroke="#1C0627"
                  strokeWidth={1.5}
                  className="transition-all duration-200"
                />
              );
            })}

          {/* ── Tooltip vertical en hover ── */}
          {indiceFoco !== null && indiceFoco !== indiceHoy && (
            <g className="transition-opacity duration-150">
              <line
                x1={mapX(indiceFoco, total)}
                y1={PAD_T}
                x2={mapX(indiceFoco, total)}
                y2={PAD_T + CHART_H}
                stroke="white"
                strokeWidth={1}
                opacity={0.1}
              />
            </g>
          )}

          {/* ── Labels X ── */}
          {datos.map((d, i) => {
            const x = mapX(i, total);
            const esHoy = i === indiceHoy;
            const esFoco = i === indiceFoco;
            return (
              <g key={d.fecha}>
                <text
                  x={x}
                  y={VB_H - PAD_B + 18}
                  textAnchor="middle"
                  fill={
                    esHoy
                      ? "var(--color-acento)"
                      : esFoco
                        ? "white"
                        : "var(--shell-texto-tenue)"
                  }
                  fontSize={esHoy ? 11 : 10}
                  fontWeight={esHoy ? 600 : 400}
                  fontFamily="Inter, sans-serif"
                  opacity={esHoy || esFoco ? 1 : 0.6}
                  className="transition-colors duration-200"
                >
                  {obtenerDiaSemana(d.fecha)}
                </text>
                <text
                  x={x}
                  y={VB_H - PAD_B + 32}
                  textAnchor="middle"
                  fill={
                    esHoy
                      ? "white"
                      : "var(--shell-texto-tenue)"
                  }
                  fontSize={11}
                  fontWeight={esHoy ? 700 : 500}
                  fontFamily="Inter, sans-serif"
                  opacity={esHoy || esFoco ? 1 : 0.4}
                  className="transition-colors duration-200"
                >
                  {obtenerDiaMes(d.fecha)}
                </text>
              </g>
            );
          })}

          {/* ── Hit areas invisibles ── */}
          {datos.map((_, i) => (
            <rect
              key={`hit-${i}`}
              x={mapX(i, total) - anchoCol / 2}
              y={0}
              width={anchoCol}
              height={VB_H}
              fill="transparent"
              onMouseEnter={() => setIndiceFoco(i)}
              onMouseLeave={() => setIndiceFoco(null)}
              onTouchStart={() => setIndiceFoco(i)}
              onTouchEnd={() => setIndiceFoco(null)}
              style={{ cursor: "crosshair" }}
            />
          ))}
        </svg>

        {/* ── Area Inferior: Tooltip dinámico y Leyenda ── */}
        <div className="relative mt-2 flex h-[38px] items-center justify-center">
          {/* Leyenda base (se desvanece si hay hover) */}
          <div 
            className={`absolute flex items-center gap-6 transition-all duration-300 ${
              indiceFoco !== null ? "opacity-0 scale-95 pointer-events-none" : "opacity-100 scale-100"
            }`}
          >
            {LINEAS.map((linea) => (
              <div key={linea.clave} className="flex items-center gap-2">
                <span style={{ color: linea.color }}>
                  <Icono nombre={linea.icono} tamaño={14} peso="fill" className="text-current drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]" />
                </span>
                <span className="text-[12px] font-medium text-white/50 tracking-wide">
                  {linea.etiqueta}
                </span>
              </div>
            ))}
          </div>

          {/* Tooltip Hover Glassmorphism */}
          <div
            className={`absolute flex items-center justify-center gap-5 px-5 py-2 rounded-full bg-white/[0.06] border border-white/[0.1] backdrop-blur-md shadow-lg transition-all duration-300 ${
              indiceFoco !== null
                ? "opacity-100 scale-100 translate-y-0"
                : "opacity-0 scale-95 translate-y-2 pointer-events-none"
            }`}
          >
            {indiceFoco !== null && datos[indiceFoco] && (
              <>
                <div className="flex items-center pr-3 border-r border-white/10">
                  <span className="text-[12px] font-semibold text-white/90">
                    {obtenerDiaSemana(datos[indiceFoco].fecha)} {obtenerDiaMes(datos[indiceFoco].fecha)}
                  </span>
                  {indiceFoco === indiceHoy && (
                    <span className="ml-2 text-[10px] font-bold uppercase tracking-wider text-[color:var(--color-acento)] bg-[var(--color-acento)]/10 px-2 py-0.5 rounded-md">
                      Hoy
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-4">
                  {LINEAS.map((linea) => {
                    const valor = datos[indiceFoco][linea.clave];
                    return (
                      <span key={linea.clave} className="flex items-center gap-1.5">
                        <span
                          className="inline-block h-2 w-2 rounded-full shadow-[0_0_8px_currentColor]"
                          style={{ background: linea.color, color: linea.color }}
                        />
                        <span className="text-[12px] text-white/50">
                          {linea.etiqueta.slice(0, 3)}
                        </span>
                        <span className="text-[13px] font-bold text-white">
                          {valor !== undefined && valor !== null ? valor : "-"}
                        </span>
                      </span>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        </div>
      </PanelGlass>
    </div>
  );
}
