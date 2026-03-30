"use client";

import { cn } from "@/lib/utilidades/cn";
import type { DisenoHumano } from "@/lib/tipos";

interface PropsBodyGraph {
  datos?: DisenoHumano;
  className?: string;
}

interface PosicionCentro {
  nombre: string;
  x: number;
  y: number;
  forma: "cuadrado" | "triangulo" | "diamante";
  aliases: string[];
}

const CENTROS: PosicionCentro[] = [
  { nombre: "Cabeza", x: 200, y: 30, forma: "triangulo", aliases: ["cabeza"] },
  { nombre: "Ajna", x: 200, y: 90, forma: "triangulo", aliases: ["ajna"] },
  { nombre: "Garganta", x: 200, y: 155, forma: "cuadrado", aliases: ["garganta"] },
  { nombre: "G", x: 200, y: 225, forma: "diamante", aliases: ["g", "identidad"] },
  { nombre: "Corazón", x: 130, y: 225, forma: "triangulo", aliases: ["corazon", "ego"] },
  {
    nombre: "Plexo Solar",
    x: 270,
    y: 295,
    forma: "triangulo",
    aliases: ["plexosolar", "plexo_solar", "emocional", "plexo solar"],
  },
  { nombre: "Sacral", x: 200, y: 310, forma: "cuadrado", aliases: ["sacral", "sacro"] },
  { nombre: "Raíz", x: 200, y: 390, forma: "cuadrado", aliases: ["raiz"] },
  { nombre: "Bazo", x: 130, y: 310, forma: "triangulo", aliases: ["bazo", "esplenico"] },
];

const CONEXIONES: [string, string][] = [
  ["Cabeza", "Ajna"],
  ["Ajna", "Garganta"],
  ["Garganta", "G"],
  ["Garganta", "Corazón"],
  ["Garganta", "Plexo Solar"],
  ["G", "Sacral"],
  ["G", "Corazón"],
  ["Corazón", "Sacral"],
  ["Plexo Solar", "Sacral"],
  ["Sacral", "Raíz"],
  ["Bazo", "Sacral"],
  ["Bazo", "Raíz"],
  ["Bazo", "G"],
  ["Bazo", "Garganta"],
];

function obtenerPosCentro(nombre: string) {
  return CENTROS.find((c) => c.nombre === nombre);
}

function normalizarClave(valor: string) {
  return valor
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[\s_()]/g, "");
}

function DibujarCentro({
  centro,
  definido,
}: {
  centro: PosicionCentro;
  definido: boolean;
}) {
  const fill = definido ? "#7C4DFF" : "rgba(255,255,255,0.04)";
  const stroke = definido ? "#D4A234" : "rgba(255,255,255,0.25)";
  const tam = 34;

  return (
    <g>
      {centro.forma === "cuadrado" && (
        <rect
          x={centro.x - tam / 2}
          y={centro.y - tam / 2}
          width={tam}
          height={tam}
          rx={6}
          fill={fill}
          stroke={stroke}
          strokeWidth="1.8"
          opacity={definido ? 0.95 : 1}
        />
      )}
      {centro.forma === "triangulo" && (
        <polygon
          points={`${centro.x},${centro.y - tam / 2} ${centro.x - tam / 2},${centro.y + tam / 2} ${centro.x + tam / 2},${centro.y + tam / 2}`}
          fill={fill}
          stroke={stroke}
          strokeWidth="1.8"
          opacity={definido ? 0.95 : 1}
        />
      )}
      {centro.forma === "diamante" && (
        <polygon
          points={`${centro.x},${centro.y - tam / 2} ${centro.x + tam / 2},${centro.y} ${centro.x},${centro.y + tam / 2} ${centro.x - tam / 2},${centro.y}`}
          fill={fill}
          stroke={stroke}
          strokeWidth="1.8"
          opacity={definido ? 0.95 : 1}
        />
      )}
      <text
        x={centro.x}
        y={centro.y + tam / 2 + 16}
        textAnchor="middle"
        fill={definido ? "#FFFFFF" : "rgba(233,213,255,0.72)"}
        fontSize="9"
        fontWeight={definido ? "600" : "500"}
      >
        {centro.nombre}
      </text>
    </g>
  );
}

export default function BodyGraph({ datos, className }: PropsBodyGraph) {
  if (!datos) {
    return (
      <div className={cn("flex items-center justify-center rounded-2xl bg-fondo-tarjeta p-8", className)}>
        <p className="text-texto-secundario">Cargando Body Graph...</p>
      </div>
    );
  }

  const centrosNormalizados = Object.entries(datos.centros ?? {}).reduce<Record<string, string>>(
    (acc, [clave, estado]) => {
      acc[normalizarClave(clave)] = estado;
      return acc;
    },
    {},
  );

  const canalesActivos = new Set(
    (datos.canales ?? []).flatMap((canal) => {
      const [a, b] = canal.centros.map(normalizarClave);
      return [`${a}:${b}`, `${b}:${a}`];
    }),
  );

  function estaDefinido(centro: PosicionCentro): boolean {
    return centro.aliases.some((alias) => {
      const valor = centrosNormalizados[normalizarClave(alias)];
      return valor === "definido" || valor === "defined";
    });
  }

  function estaConexionActiva(origen: string, destino: string): boolean {
    const centroA = obtenerPosCentro(origen);
    const centroB = obtenerPosCentro(destino);
    if (!centroA || !centroB) return false;

    return centroA.aliases.some((aliasA) =>
      centroB.aliases.some((aliasB) =>
        canalesActivos.has(`${normalizarClave(aliasA)}:${normalizarClave(aliasB)}`),
      ),
    );
  }

  return (
    <div className={cn("flex items-center justify-center", className)}>
      <svg viewBox="0 0 400 440" className="w-full max-w-[360px] overflow-visible">
        <defs>
          <radialGradient id="hdGlow" cx="50%" cy="40%" r="70%">
            <stop offset="0%" stopColor="rgba(179,136,255,0.20)" />
            <stop offset="100%" stopColor="rgba(23,13,44,0)" />
          </radialGradient>
        </defs>

        <circle cx="200" cy="220" r="158" fill="url(#hdGlow)" />

        {CONEXIONES.map(([a, b], i) => {
          const ca = obtenerPosCentro(a);
          const cb = obtenerPosCentro(b);
          if (!ca || !cb) return null;

          const activa = estaConexionActiva(a, b);

          return (
            <line
              key={i}
              x1={ca.x}
              y1={ca.y}
              x2={cb.x}
              y2={cb.y}
              stroke={activa ? "#D4A234" : "rgba(255,255,255,0.16)"}
              strokeWidth={activa ? 2.6 : 1.2}
              opacity={activa ? 0.95 : 0.65}
            />
          );
        })}

        {CENTROS.map((centro) => (
          <DibujarCentro
            key={centro.nombre}
            centro={centro}
            definido={estaDefinido(centro)}
          />
        ))}
      </svg>
    </div>
  );
}
