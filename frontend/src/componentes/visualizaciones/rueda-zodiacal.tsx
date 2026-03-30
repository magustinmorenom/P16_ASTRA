"use client";

import { cn } from "@/lib/utilidades/cn";
import type { Planeta, Casa, Aspecto } from "@/lib/tipos";
import {
  glifoPath,
  COLORES_PLANETAS,
  COLORES_ELEMENTO,
  ELEMENTO_SIGNO,
  ESTILOS_ASPECTO,
} from "./glifos-astrologicos";
import {
  polarAXY,
  ajustarAngulo,
  resolverColisiones,
  generarArcoSVG,
  ROMANO,
  SIGNOS,
} from "./utilidades-rueda";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface PropsRuedaZodiacal {
  planetas?: Planeta[];
  casas?: Casa[];
  aspectos?: Aspecto[];
  className?: string;
  claro?: boolean;
  onPlanetaClick?: (planeta: Planeta) => void;
}

// ---------------------------------------------------------------------------
// Constantes de layout — viewBox 800x800
// ---------------------------------------------------------------------------

const CX = 400;
const CY = 400;

const R_EXTERIOR = 380;      // borde externo del anillo zodiacal
const R_ZODIACAL_INT = 320;  // borde interno del anillo zodiacal (donde van ticks)
const R_TICKS_INT = 312;     // fin de tick marks
const R_CASAS_EXT = 312;     // borde externo del area de casas
const R_PLANETAS = 260;      // radio de planetas (display)
const R_CONECTORA = 300;     // radio donde llega la linea conectora al grado real
const R_ASPECTO = 175;       // radio maximo para lineas de aspectos
const R_CENTRO = 70;         // circulo central

// ---------------------------------------------------------------------------
// Normalizador de clave (quitar acentos y minusculas)
// ---------------------------------------------------------------------------

function normClave(s: string): string {
  return s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

// ---------------------------------------------------------------------------
// Componente
// ---------------------------------------------------------------------------

export default function RuedaZodiacal({
  planetas,
  casas,
  aspectos,
  className,
  claro = false,
  onPlanetaClick,
}: PropsRuedaZodiacal) {
  if (!planetas || !casas) {
    return (
      <div className={cn("flex items-center justify-center rounded-2xl bg-fondo-tarjeta p-8", className)}>
        <p className="text-texto-secundario">Cargando rueda zodiacal...</p>
      </div>
    );
  }

  const ascGrado = casas[0]?.grado ?? 0;

  // Resolver colisiones de planetas
  const planetasResueltos = resolverColisiones(planetas, ascGrado, 10);

  // Colores segun tema
  const t = claro
    ? {
        fondoExt: "#FAFAFA",
        strokeAnillo: "#D0C4F0",
        fondoCentro: "#F8F5FF",
        strokeCasa: "#B0A4D0",
        textoRomano: "#8A8580",
        textoPlaneta: "#2C2926",
        textoRetro: "#ef4444",
        textoAsc: "#7C4DFF",
        tickColor: "#C4B8E0",
        centroStroke: "#D0C4F0",
        ejeColor: "#7C4DFF",
      }
    : {
        fondoExt: "#1e1b2e",
        strokeAnillo: "#7C4DFF",
        fondoCentro: "#1a0a3e",
        strokeCasa: "#5A3FAA",
        textoRomano: "#9575CD",
        textoPlaneta: "#f5f5f5",
        textoRetro: "#ef4444",
        textoAsc: "#B388FF",
        tickColor: "#5A3FAA",
        centroStroke: "#7C4DFF",
        ejeColor: "#B388FF",
      };

  return (
    <div className={cn("flex items-center justify-center", className)}>
      <svg viewBox="0 0 800 800" className="w-full max-w-[600px]">
        {/* Filter para hover glow */}
        <defs>
          <filter id="glow-planeta" x="-50%" y="-50%" width="200%" height="200%">
            <feDropShadow dx="0" dy="0" stdDeviation="3" floodColor="#7C4DFF" floodOpacity="0.6" />
          </filter>
        </defs>

        {/* ============================================================= */}
        {/* CAPA 1: Fondo */}
        {/* ============================================================= */}
        <circle cx={CX} cy={CY} r={R_EXTERIOR} fill={t.fondoExt} stroke={t.strokeAnillo} strokeWidth="1.5" />
        <circle cx={CX} cy={CY} r={R_ZODIACAL_INT} fill={claro ? "#fff" : "#151024"} stroke={t.strokeAnillo} strokeWidth="0.8" />
        <circle cx={CX} cy={CY} r={R_CENTRO} fill={t.fondoCentro} stroke={t.centroStroke} strokeWidth="0.8" opacity="0.6" />

        {/* ============================================================= */}
        {/* CAPA 2: Arcos zodiacales coloreados por elemento */}
        {/* ============================================================= */}
        {SIGNOS.map((signo, i) => {
          const startLong = i * 30;
          const endLong = (i + 1) * 30;
          const startAng = ajustarAngulo(startLong, ascGrado);
          const endAng = ajustarAngulo(endLong, ascGrado);
          const elemento = ELEMENTO_SIGNO[signo];
          const colores = elemento ? COLORES_ELEMENTO[elemento] : COLORES_ELEMENTO.Fuego;
          const midAng = ajustarAngulo(startLong + 15, ascGrado);
          const pGlifo = polarAXY(midAng, (R_EXTERIOR + R_ZODIACAL_INT) / 2, CX, CY);

          const arcPath = generarArcoSVG(startAng, endAng, R_ZODIACAL_INT, R_EXTERIOR, CX, CY);
          const pathData = glifoPath("signo", signo);

          return (
            <g key={signo}>
              {/* Arco de fondo */}
              <path
                d={arcPath}
                fill={claro ? colores.fondo : `${colores.borde}15`}
                stroke={colores.borde}
                strokeWidth="0.5"
                opacity={claro ? 0.8 : 0.4}
              />
              {/* Glifo del signo */}
              {pathData && (
                <g transform={`translate(${pGlifo.x - 10}, ${pGlifo.y - 10}) scale(${20/24})`}>
                  <path
                    d={pathData}
                    fill="none"
                    stroke={claro ? colores.borde : colores.borde}
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    opacity={claro ? 0.9 : 0.8}
                  />
                </g>
              )}
            </g>
          );
        })}

        {/* ============================================================= */}
        {/* CAPA 3: Tick marks de grados */}
        {/* ============================================================= */}
        {Array.from({ length: 360 }, (_, deg) => {
          const ang = ajustarAngulo(deg, ascGrado);
          const esCadaCinco = deg % 5 === 0;
          const esCadaTreinta = deg % 30 === 0;
          if (!esCadaCinco) return null;

          const rExt = R_ZODIACAL_INT;
          const rInt = esCadaTreinta ? R_TICKS_INT - 6 : R_TICKS_INT;
          const p1 = polarAXY(ang, rExt, CX, CY);
          const p2 = polarAXY(ang, rInt, CX, CY);

          return (
            <line
              key={`tick-${deg}`}
              x1={p1.x} y1={p1.y}
              x2={p2.x} y2={p2.y}
              stroke={t.tickColor}
              strokeWidth={esCadaTreinta ? 1.2 : 0.5}
              opacity={esCadaTreinta ? 0.7 : 0.4}
            />
          );
        })}

        {/* ============================================================= */}
        {/* CAPA 4: Lineas de casas + numeros romanos */}
        {/* ============================================================= */}
        {casas.map((casa, idx) => {
          const angulo = ajustarAngulo(casa.grado, ascGrado);
          const pExt = polarAXY(angulo, R_CASAS_EXT, CX, CY);
          const pInt = polarAXY(angulo, R_CENTRO, CX, CY);
          const esAngular = casa.numero === 1 || casa.numero === 4 || casa.numero === 7 || casa.numero === 10;

          // Punto medio para numero romano: entre esta cuspide y la siguiente
          const siguienteCasa = casas[(idx + 1) % casas.length];
          let midGrado = (casa.grado + siguienteCasa.grado) / 2;
          if (Math.abs(casa.grado - siguienteCasa.grado) > 180) {
            midGrado = ((casa.grado + siguienteCasa.grado + 360) / 2) % 360;
          }
          const midAng = ajustarAngulo(midGrado, ascGrado);
          const pNum = polarAXY(midAng, (R_CASAS_EXT + R_ASPECTO) / 2.2, CX, CY);

          return (
            <g key={`casa-${casa.numero}`}>
              <line
                x1={pExt.x} y1={pExt.y}
                x2={pInt.x} y2={pInt.y}
                stroke={t.strokeCasa}
                strokeWidth={esAngular ? 1.8 : 0.6}
                opacity={esAngular ? 0.8 : 0.4}
              />
              <text
                x={pNum.x} y={pNum.y}
                textAnchor="middle"
                dominantBaseline="central"
                fill={t.textoRomano}
                fontSize="12"
                fontWeight={esAngular ? "bold" : "normal"}
                opacity={0.7}
              >
                {ROMANO[casa.numero]}
              </text>
            </g>
          );
        })}

        {/* ============================================================= */}
        {/* CAPA 5: Ejes ASC / MC / DSC / IC */}
        {/* ============================================================= */}
        {(() => {
          const ejes = [
            { label: "ASC", grado: casas[0]?.grado ?? 0 },
            { label: "IC", grado: casas[3]?.grado ?? 90 },
            { label: "DSC", grado: casas[6]?.grado ?? 180 },
            { label: "MC", grado: casas[9]?.grado ?? 270 },
          ];
          return ejes.map(({ label, grado }) => {
            const ang = ajustarAngulo(grado, ascGrado);
            const pBorde = polarAXY(ang, R_EXTERIOR + 2, CX, CY);
            const pLabel = polarAXY(ang, R_EXTERIOR + 18, CX, CY);
            return (
              <g key={label}>
                <text
                  x={pLabel.x}
                  y={pLabel.y}
                  textAnchor="middle"
                  dominantBaseline="central"
                  fill={t.ejeColor}
                  fontSize="11"
                  fontWeight="bold"
                  opacity="0.9"
                >
                  {label}
                </text>
                {/* Marcador en el borde */}
                <circle
                  cx={pBorde.x} cy={pBorde.y} r="2.5"
                  fill={t.ejeColor}
                  opacity="0.6"
                />
              </g>
            );
          });
        })()}

        {/* ============================================================= */}
        {/* CAPA 6: Lineas de aspectos (diferenciadas por tipo) */}
        {/* ============================================================= */}
        {aspectos?.map((asp, i) => {
          const pr1 = planetasResueltos.find((p) => p.nombre === asp.planeta1);
          const pr2 = planetasResueltos.find((p) => p.nombre === asp.planeta2);
          if (!pr1 || !pr2) return null;

          const pos1 = polarAXY(pr1.display, R_ASPECTO, CX, CY);
          const pos2 = polarAXY(pr2.display, R_ASPECTO, CX, CY);
          const tipoNorm = normClave(asp.tipo);
          const estilo = ESTILOS_ASPECTO[tipoNorm];

          return (
            <line
              key={`asp-${i}`}
              x1={pos1.x} y1={pos1.y}
              x2={pos2.x} y2={pos2.y}
              stroke={estilo?.color ?? "#999"}
              strokeWidth={estilo?.ancho ?? 0.8}
              strokeDasharray={estilo?.dash ?? ""}
              opacity={claro ? 0.35 : 0.45}
            >
              <title>{asp.planeta1} {asp.tipo} {asp.planeta2} (orbe: {asp.orbe?.toFixed(1)}°)</title>
            </line>
          );
        })}

        {/* ============================================================= */}
        {/* CAPA 7: Planetas con glifos SVG + colision avoidance */}
        {/* ============================================================= */}
        {planetasResueltos.map((pr) => {
          const planeta = planetas.find((p) => p.nombre === pr.nombre);
          if (!planeta) return null;

          const posDisplay = polarAXY(pr.display, R_PLANETAS, CX, CY);
          const colorPlaneta = COLORES_PLANETAS[planeta.nombre] || "#7C4DFF";
          const pathData = glifoPath("planeta", planeta.nombre);

          // Si el display difiere significativamente del real, dibujar linea conectora
          let diffAngulo = Math.abs(pr.display - pr.real);
          if (diffAngulo > 180) diffAngulo = 360 - diffAngulo;
          const necesitaConectora = diffAngulo > 2;

          const posReal = polarAXY(pr.real, R_CONECTORA, CX, CY);
          const posTick = polarAXY(pr.real, R_ZODIACAL_INT, CX, CY);

          const glifoSize = 13;

          return (
            <g
              key={planeta.nombre}
              className={cn(
                onPlanetaClick && "cursor-pointer",
                "hover:[filter:url(#glow-planeta)]",
              )}
              onClick={() => onPlanetaClick?.(planeta)}
            >
              <title>
                {planeta.nombre} {planeta.signo} {planeta.grado_en_signo?.toFixed(1)}°
                {planeta.retrogrado ? " (R)" : ""}
                {" — Casa "}{ROMANO[planeta.casa] ?? planeta.casa}
              </title>

              {/* Linea conectora al grado real */}
              {necesitaConectora && (
                <line
                  x1={posDisplay.x} y1={posDisplay.y}
                  x2={posReal.x} y2={posReal.y}
                  stroke={colorPlaneta}
                  strokeWidth="0.6"
                  opacity="0.4"
                  strokeDasharray="2 2"
                />
              )}

              {/* Punto en el grado real (sobre el anillo de ticks) */}
              <circle
                cx={posTick.x} cy={posTick.y} r="2"
                fill={colorPlaneta}
                opacity="0.6"
              />

              {/* Circulo de fondo del planeta */}
              <circle
                cx={posDisplay.x} cy={posDisplay.y} r="16"
                fill={claro ? "#fff" : "#1e1b2e"}
                stroke={colorPlaneta}
                strokeWidth={claro ? 1.5 : 1}
                opacity="0.95"
              />

              {/* Glifo del planeta */}
              {pathData ? (
                <g transform={`translate(${posDisplay.x - glifoSize}, ${posDisplay.y - glifoSize}) scale(${(glifoSize * 2) / 24})`}>
                  <path
                    d={pathData}
                    fill="none"
                    stroke={planeta.retrogrado ? t.textoRetro : colorPlaneta}
                    strokeWidth="1.6"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </g>
              ) : (
                <text
                  x={posDisplay.x} y={posDisplay.y}
                  textAnchor="middle"
                  dominantBaseline="central"
                  fill={planeta.retrogrado ? t.textoRetro : colorPlaneta}
                  fontSize="13"
                  fontWeight="bold"
                >
                  {planeta.nombre[0]}
                </text>
              )}

              {/* Indicador retrogrado */}
              {planeta.retrogrado && (
                <text
                  x={posDisplay.x + 12} y={posDisplay.y - 12}
                  textAnchor="middle"
                  dominantBaseline="central"
                  fill={t.textoRetro}
                  fontSize="9"
                  fontWeight="bold"
                >
                  R
                </text>
              )}
            </g>
          );
        })}

        {/* ============================================================= */}
        {/* CAPA 8: Centro — Cruz ASC/MC sutil */}
        {/* ============================================================= */}
        <line
          x1={CX - R_CENTRO + 10} y1={CY}
          x2={CX + R_CENTRO - 10} y2={CY}
          stroke={t.centroStroke} strokeWidth="0.5" opacity="0.3"
        />
        <line
          x1={CX} y1={CY - R_CENTRO + 10}
          x2={CX} y2={CY + R_CENTRO - 10}
          stroke={t.centroStroke} strokeWidth="0.5" opacity="0.3"
        />
      </svg>
    </div>
  );
}
