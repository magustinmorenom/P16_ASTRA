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
}

const CENTROS: PosicionCentro[] = [
  { nombre: "Cabeza", x: 200, y: 30, forma: "triangulo" },
  { nombre: "Ajna", x: 200, y: 90, forma: "triangulo" },
  { nombre: "Garganta", x: 200, y: 155, forma: "cuadrado" },
  { nombre: "G", x: 200, y: 225, forma: "diamante" },
  { nombre: "Corazón", x: 130, y: 225, forma: "triangulo" },
  { nombre: "Plexo Solar", x: 270, y: 295, forma: "triangulo" },
  { nombre: "Sacral", x: 200, y: 310, forma: "cuadrado" },
  { nombre: "Raíz", x: 200, y: 390, forma: "cuadrado" },
  { nombre: "Bazo", x: 130, y: 310, forma: "triangulo" },
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

function DibujarCentro({
  centro,
  definido,
}: {
  centro: PosicionCentro;
  definido: boolean;
}) {
  const fill = definido ? "#7C4DFF" : "transparent";
  const stroke = definido ? "#a855f7" : "#525252";
  const tam = 28;

  return (
    <g>
      {centro.forma === "cuadrado" && (
        <rect
          x={centro.x - tam / 2}
          y={centro.y - tam / 2}
          width={tam}
          height={tam}
          rx={4}
          fill={fill}
          stroke={stroke}
          strokeWidth="1.5"
          opacity={definido ? 0.8 : 0.4}
        />
      )}
      {centro.forma === "triangulo" && (
        <polygon
          points={`${centro.x},${centro.y - tam / 2} ${centro.x - tam / 2},${centro.y + tam / 2} ${centro.x + tam / 2},${centro.y + tam / 2}`}
          fill={fill}
          stroke={stroke}
          strokeWidth="1.5"
          opacity={definido ? 0.8 : 0.4}
        />
      )}
      {centro.forma === "diamante" && (
        <polygon
          points={`${centro.x},${centro.y - tam / 2} ${centro.x + tam / 2},${centro.y} ${centro.x},${centro.y + tam / 2} ${centro.x - tam / 2},${centro.y}`}
          fill={fill}
          stroke={stroke}
          strokeWidth="1.5"
          opacity={definido ? 0.8 : 0.4}
        />
      )}
      <text
        x={centro.x}
        y={centro.y + tam / 2 + 14}
        textAnchor="middle"
        fill={definido ? "#f5f5f5" : "#737373"}
        fontSize="8"
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

  const centrosDefinidos = datos.centros
    ? typeof datos.centros === "object" && !Array.isArray(datos.centros)
      ? (datos.centros as Record<string, string>)
      : {}
    : {};

  function estaDefinido(nombre: string): boolean {
    const valor = centrosDefinidos[nombre];
    return valor === "definido";
  }

  return (
    <div className={cn("flex items-center justify-center", className)}>
      <svg viewBox="0 0 400 440" className="w-full max-w-[350px]">
        {/* Conexiones */}
        {CONEXIONES.map(([a, b], i) => {
          const ca = obtenerPosCentro(a);
          const cb = obtenerPosCentro(b);
          if (!ca || !cb) return null;
          const ambosDefinidos = estaDefinido(a) && estaDefinido(b);
          return (
            <line
              key={i}
              x1={ca.x}
              y1={ca.y}
              x2={cb.x}
              y2={cb.y}
              stroke={ambosDefinidos ? "#7C4DFF" : "#404040"}
              strokeWidth={ambosDefinidos ? 2 : 1}
              opacity={ambosDefinidos ? 0.7 : 0.3}
            />
          );
        })}

        {/* Centros */}
        {CENTROS.map((centro) => (
          <DibujarCentro
            key={centro.nombre}
            centro={centro}
            definido={estaDefinido(centro.nombre)}
          />
        ))}
      </svg>
    </div>
  );
}
