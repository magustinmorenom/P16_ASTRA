"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { PanelGlass } from "./panel-glass";
import type { DiaSemanalDTO } from "@/lib/tipos";

/* ─── Constantes de layout SVG ─── */

const VB_W = 600;
const VB_H = 276;
const PAD_L = 24;
const PAD_R = 4;
const PAD_T = 16;
const PAD_B = 72;
const CHART_W = VB_W - PAD_L - PAD_R;
const CHART_H = VB_H - PAD_T - PAD_B;

const Y_MIN = 1;
const Y_MAX = 10;

const LINE_COLOR = "#7C4DFF";

const DIAS_SEMANA = ["DOM", "LUN", "MAR", "MIÉ", "JUE", "VIE", "SÁB"] as const;

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
      t[i] = 0;
    } else {
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
  delay,
}: {
  d: string;
  color: string;
  ancho: number;
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
      strokeDasharray={longitud > 0 ? `${longitud}` : undefined}
      strokeDashoffset={longitud > 0 ? `${longitud}` : undefined}
      style={
        longitud > 0
          ? { animation: `dibujarLinea 1s ease-out ${delay}ms forwards` }
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

  /* Precalcular puntos de energía */
  const puntos = useMemo(() => {
    return datos.map((d, i) => {
      const val = d.energia !== undefined && d.energia !== null ? d.energia : 5;
      return [mapX(i, total), mapY(val)] as [number, number];
    });
  }, [datos, total]);

  /* Ancho de columna para hit areas */
  const anchoCol = total > 1 ? CHART_W / (total - 1) : CHART_W;

  if (datos.length < 2) return null;

  const pathD = generarPathSuave(puntos);
  const bottomY = PAD_T + CHART_H;
  const areaD = `${pathD} L ${puntos[puntos.length - 1][0]},${bottomY} L ${puntos[0][0]},${bottomY} Z`;

  return (
    <div className="flex w-full flex-col gap-3 items-start">
      <PanelGlass
        tono="panel"
        className="flex w-full flex-col gap-0 overflow-hidden rounded-[24px] border border-[var(--shell-borde)] bg-[var(--shell-fondo)]/60 backdrop-blur-xl shadow-[0_18px_40px_rgba(8,3,20,0.10)] py-4"
      >
        {/* Keyframes inline para animacion de dibujo */}
        <style>{`
          @keyframes dibujarLinea {
            to { stroke-dashoffset: 0; }
          }
        `}</style>

        <svg
          viewBox={`0 0 ${VB_W} ${VB_H}`}
          className="w-full"
          preserveAspectRatio="xMinYMid meet"
          style={{ maxHeight: 300, width: "100%" }}
          role="img"
          aria-label="Gráfica de tendencia de energía"
        >
          {/* ── Defs ── */}
          <defs>
            <linearGradient id="gradEnergia" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={LINE_COLOR} stopOpacity="0.18" />
              <stop offset="100%" stopColor={LINE_COLOR} stopOpacity="0.0" />
            </linearGradient>
            <linearGradient id="gradHoy" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--color-acento)" stopOpacity="0.0" />
              <stop offset="50%" stopColor="var(--color-acento)" stopOpacity="0.08" />
              <stop offset="100%" stopColor="var(--color-acento)" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* ── Gridlines Y ── */}
          {[2, 5, 8].map((v) => (
            <g key={v}>
              <line
                x1={PAD_L}
                y1={mapY(v)}
                x2={VB_W - PAD_R}
                y2={mapY(v)}
                stroke="currentColor"
                className="text-[color:var(--shell-texto-tenue)] opacity-20"
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

          {/* ── Linea vertical HOY ── */}
          {indiceHoy >= 0 && (
            <g>
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

          {/* ── Area bajo curva ── */}
          <path d={areaD} fill="url(#gradEnergia)" />

          {/* ── Curva ── */}
          <LineaAnimada d={pathD} color={LINE_COLOR} ancho={2.5} delay={0} />

          {/* ── Circulo en HOY ── */}
          {indiceHoy >= 0 && puntos[indiceHoy] && (
            <g>
              <circle
                cx={puntos[indiceHoy][0]}
                cy={puntos[indiceHoy][1]}
                r={7}
                fill={LINE_COLOR}
                opacity={0.15}
              />
              <circle
                cx={puntos[indiceHoy][0]}
                cy={puntos[indiceHoy][1]}
                r={3.5}
                fill={LINE_COLOR}
                stroke="var(--shell-fondo)"
                strokeWidth={2}
              />
            </g>
          )}

          {/* ── Circulo hover ── */}
          {indiceFoco !== null && indiceFoco !== indiceHoy && puntos[indiceFoco] && (
            <>
              <line
                x1={mapX(indiceFoco, total)}
                y1={PAD_T}
                x2={mapX(indiceFoco, total)}
                y2={PAD_T + CHART_H}
                stroke="var(--shell-texto-tenue)"
                strokeWidth={1}
                opacity={0.3}
              />
              <circle
                cx={puntos[indiceFoco][0]}
                cy={puntos[indiceFoco][1]}
                r={3.5}
                fill={LINE_COLOR}
                stroke="var(--shell-fondo)"
                strokeWidth={1.5}
                className="transition-all duration-200"
              />
            </>
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
                        ? "var(--shell-texto)"
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
                      ? "var(--shell-texto)"
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

        {/* ── Tooltip hover ── */}
        {indiceFoco !== null && datos[indiceFoco] && (
          <div className="flex items-center gap-3 px-5 py-1.5 transition-opacity duration-200">
            <span className="text-[12px] font-semibold text-[color:var(--shell-texto)]">
              {obtenerDiaSemana(datos[indiceFoco].fecha)} {obtenerDiaMes(datos[indiceFoco].fecha)}
            </span>
            {indiceFoco === indiceHoy && (
              <span className="text-[10px] font-bold uppercase tracking-wider text-[color:var(--color-acento)] bg-[var(--color-acento)]/10 px-2 py-0.5 rounded-md">
                Hoy
              </span>
            )}
            <span className="text-[13px] font-bold" style={{ color: LINE_COLOR }}>
              {datos[indiceFoco].energia}
            </span>
          </div>
        )}
      </PanelGlass>
    </div>
  );
}
