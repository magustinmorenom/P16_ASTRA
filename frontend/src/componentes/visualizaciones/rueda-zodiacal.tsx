"use client";

import { cn } from "@/lib/utilidades/cn";
import { SIMBOLOS_SIGNOS, SIGNOS } from "@/lib/utilidades/formatear-grado";
import type { Planeta, Casa, Aspecto } from "@/lib/tipos";

interface PropsRuedaZodiacal {
  planetas?: Planeta[];
  casas?: Casa[];
  aspectos?: Aspecto[];
  className?: string;
  /** Usar colores claros para fondo blanco */
  claro?: boolean;
  /** Callback al hacer clic en un planeta */
  onPlanetaClick?: (planeta: Planeta) => void;
}

const COLORES_SIGNOS: Record<string, string> = {
  Aries: "#ef4444", Tauro: "#22c55e", Géminis: "#eab308",
  Cáncer: "#6366f1", Leo: "#f97316", Virgo: "#22c55e",
  Libra: "#eab308", Escorpio: "#6366f1", Sagitario: "#ef4444",
  Capricornio: "#22c55e", Acuario: "#eab308", Piscis: "#6366f1",
};

const COLORES_PLANETAS: Record<string, string> = {
  Sol: "#D4A234", Luna: "#9575CD", Mercurio: "#E57373", Venus: "#66BB6A",
  Marte: "#EF5350", Júpiter: "#FFA726", Saturno: "#78909C", Urano: "#26C6DA",
  Neptuno: "#5C6BC0", Plutón: "#8D6E63", "Nodo Norte": "#66BB6A", "Nodo Sur": "#A1887F",
};

const COLORES_ASPECTOS: Record<string, string> = {
  conjunción: "#FBBF24",
  trígono: "#22c55e",
  sextil: "#22D3EE",
  cuadratura: "#ef4444",
  oposición: "#ef4444",
};

const SIMBOLOS_PLANETAS: Record<string, string> = {
  Sol: "☉", Luna: "☽", Mercurio: "☿", Venus: "♀",
  Marte: "♂", Júpiter: "♃", Saturno: "♄", Urano: "♅",
  Neptuno: "♆", Plutón: "♇", "Nodo Norte": "☊", "Nodo Sur": "☋",
};

const CX = 200;
const CY = 200;
const R_EXT = 180;
const R_SIGNOS = 155;
const R_CASAS = 130;
const R_PLANETAS = 105;
const R_CENTRO = 60;

function polarAXY(angulo: number, radio: number) {
  const rad = ((angulo - 90) * Math.PI) / 180;
  return { x: CX + radio * Math.cos(rad), y: CY + radio * Math.sin(rad) };
}

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

  function ajustarAngulo(longitud: number) {
    return (ascGrado - longitud + 360) % 360;
  }

  // Colores según tema
  const t = claro
    ? {
        fondoExt: "#F8F5FF",
        strokeAnillo: "#D0C4F0",
        fondoCentro: "#F0EBFF",
        strokeCasa: "#C4B8E0",
        strokeSigno: "#D0C4F0",
        fondoPlaneta: "#FFFFFF",
        strokePlaneta: "#B388FF",
        textoPlaneta: "#2C2926",
        textoRetro: "#ef4444",
        textoAsc: "#7C4DFF",
      }
    : {
        fondoExt: "#1e1b2e",
        strokeAnillo: "#7C4DFF",
        fondoCentro: "#1a0a3e",
        strokeCasa: "#7C4DFF",
        strokeSigno: "#7C4DFF",
        fondoPlaneta: "#1e1b2e",
        strokePlaneta: "#7C4DFF",
        textoPlaneta: "#f5f5f5",
        textoRetro: "#ef4444",
        textoAsc: "#7C4DFF",
      };

  return (
    <div className={cn("flex items-center justify-center", className)}>
      <svg viewBox="0 0 400 400" className="w-full max-w-[500px]">
        {/* Fondo */}
        <circle cx={CX} cy={CY} r={R_EXT} fill={t.fondoExt} stroke={t.strokeAnillo} strokeWidth="1" opacity={claro ? "0.8" : "0.3"} />
        <circle cx={CX} cy={CY} r={R_CASAS} fill="none" stroke={t.strokeAnillo} strokeWidth="0.5" opacity={claro ? "0.5" : "0.2"} />
        <circle cx={CX} cy={CY} r={R_CENTRO} fill={t.fondoCentro} stroke={t.strokeAnillo} strokeWidth="0.5" opacity={claro ? "0.6" : "0.3"} />

        {/* Signos zodiacales */}
        {SIGNOS.map((signo, i) => {
          const inicio = ajustarAngulo(i * 30);
          const medio = ajustarAngulo(i * 30 + 15);
          const pInicio = polarAXY(inicio, R_EXT);
          const pInicioInt = polarAXY(inicio, R_SIGNOS);
          const pTexto = polarAXY(medio, (R_EXT + R_SIGNOS) / 2);

          return (
            <g key={signo}>
              <line
                x1={pInicio.x} y1={pInicio.y}
                x2={pInicioInt.x} y2={pInicioInt.y}
                stroke={t.strokeSigno} strokeWidth="0.5" opacity={claro ? "0.5" : "0.3"}
              />
              <text
                x={pTexto.x} y={pTexto.y}
                textAnchor="middle" dominantBaseline="central"
                fill={COLORES_SIGNOS[signo] || (claro ? "#666" : "#fff")}
                fontSize="14"
              >
                {SIMBOLOS_SIGNOS[signo]}
              </text>
            </g>
          );
        })}

        {/* Líneas de casas */}
        {casas.map((casa) => {
          const angulo = ajustarAngulo(casa.grado);
          const pExt = polarAXY(angulo, R_SIGNOS);
          const pInt = polarAXY(angulo, R_CENTRO);
          const esAngular = casa.numero === 1 || casa.numero === 10;
          return (
            <line
              key={casa.numero}
              x1={pExt.x} y1={pExt.y}
              x2={pInt.x} y2={pInt.y}
              stroke={t.strokeCasa} strokeWidth={esAngular ? 1.5 : 0.5}
              opacity={esAngular ? 0.8 : (claro ? 0.4 : 0.3)}
            />
          );
        })}

        {/* Líneas de aspectos */}
        {aspectos?.map((asp, i) => {
          const p1 = planetas.find((p) => p.nombre === asp.planeta1);
          const p2 = planetas.find((p) => p.nombre === asp.planeta2);
          if (!p1 || !p2) return null;
          const a1 = ajustarAngulo(p1.longitud);
          const a2 = ajustarAngulo(p2.longitud);
          const pos1 = polarAXY(a1, R_PLANETAS);
          const pos2 = polarAXY(a2, R_PLANETAS);
          const tipoNorm = asp.tipo.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
          return (
            <line
              key={i}
              x1={pos1.x} y1={pos1.y}
              x2={pos2.x} y2={pos2.y}
              stroke={COLORES_ASPECTOS[tipoNorm] || "#999"}
              strokeWidth="0.7"
              opacity={claro ? "0.4" : "0.5"}
            />
          );
        })}

        {/* Planetas */}
        {planetas.map((planeta) => {
          const angulo = ajustarAngulo(planeta.longitud);
          const pos = polarAXY(angulo, R_PLANETAS);
          const simbolo = SIMBOLOS_PLANETAS[planeta.nombre] || planeta.nombre[0];
          const colorPlaneta = COLORES_PLANETAS[planeta.nombre] || "#7C4DFF";
          return (
            <g
              key={planeta.nombre}
              className={onPlanetaClick ? "cursor-pointer" : ""}
              onClick={() => onPlanetaClick?.(planeta)}
            >
              <circle
                cx={pos.x} cy={pos.y} r="10"
                fill={claro ? "#fff" : t.fondoPlaneta}
                stroke={claro ? colorPlaneta : t.strokePlaneta}
                strokeWidth={claro ? "1.5" : "0.5"}
              />
              <text
                x={pos.x} y={pos.y}
                textAnchor="middle" dominantBaseline="central"
                fill={planeta.retrogrado ? t.textoRetro : (claro ? colorPlaneta : t.textoPlaneta)}
                fontSize="11"
                fontWeight="bold"
              >
                {simbolo}
              </text>
            </g>
          );
        })}

        {/* ASC / MC labels */}
        <text x={CX} y={CY} textAnchor="middle" dominantBaseline="central" fill={t.textoAsc} fontSize="10" fontWeight="bold">
          ASC
        </text>
      </svg>
    </div>
  );
}
