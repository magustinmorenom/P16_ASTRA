"use client";

import { cn } from "@/lib/utilidades/cn";
import {
  crearIdCanal,
  normalizarClaveHD,
} from "@/lib/utilidades/interpretaciones-diseno-humano";
import type { DisenoHumano } from "@/lib/tipos";
import type { Canal } from "@/lib/tipos/diseno-humano";

interface PropsBodyGraph {
  datos?: DisenoHumano;
  className?: string;
  centroSeleccionado?: string | null;
  canalSeleccionado?: string | null;
  onCentroClick?: (clave: string, estado: string) => void;
  onCanalClick?: (canal: Canal) => void;
}

interface PosicionCentro {
  nombre: string;
  x: number;
  y: number;
  forma: "cuadrado" | "triangulo" | "diamante";
  aliases: string[];
}

const CENTROS: PosicionCentro[] = [
  { nombre: "Cabeza", x: 200, y: 30, forma: "triangulo", aliases: ["cabeza", "corona"] },
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

function obtenerCentroPorClave(nombre: string) {
  const normalizado = normalizarClaveHD(nombre);
  return CENTROS.find((centro) =>
    centro.aliases.some((alias) => normalizarClaveHD(alias) === normalizado),
  );
}

function DibujarCentro({
  centro,
  definido,
  activo,
  relacionado,
  onClick,
  estado,
}: {
  centro: PosicionCentro;
  definido: boolean;
  activo: boolean;
  relacionado: boolean;
  onClick?: (clave: string, estado: string) => void;
  estado: string;
}) {
  const fill = activo
    ? "rgba(211,184,255,0.38)"
    : definido
      ? "rgba(124,77,255,0.78)"
      : "rgba(255,255,255,0.05)";
  const stroke = activo
    ? "#F5F0FF"
    : definido
      ? "#D8BBFF"
      : relacionado
        ? "rgba(211,184,255,0.72)"
        : "rgba(255,255,255,0.24)";
  const tam = 34;
  const brillo = activo ? "0 0 18px rgba(179,136,255,0.45)" : undefined;

  function manejarAccion() {
    onClick?.(centro.aliases[0], estado);
  }

  return (
    <g
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      onClick={onClick ? manejarAccion : undefined}
      onKeyDown={
        onClick
          ? (evento) => {
              if (evento.key === "Enter" || evento.key === " ") {
                evento.preventDefault();
                manejarAccion();
              }
            }
          : undefined
      }
      style={{ cursor: onClick ? "pointer" : "default" }}
    >
      <title>{`${centro.nombre} · ${estado}`}</title>
      {centro.forma === "cuadrado" && (
        <rect
          x={centro.x - tam / 2}
          y={centro.y - tam / 2}
          width={tam}
          height={tam}
          rx={6}
          fill={fill}
          stroke={stroke}
          strokeWidth={activo ? "2.8" : "1.8"}
          opacity={definido ? 0.95 : 1}
          style={{ filter: brillo }}
        />
      )}
      {centro.forma === "triangulo" && (
        <polygon
          points={`${centro.x},${centro.y - tam / 2} ${centro.x - tam / 2},${centro.y + tam / 2} ${centro.x + tam / 2},${centro.y + tam / 2}`}
          fill={fill}
          stroke={stroke}
          strokeWidth={activo ? "2.8" : "1.8"}
          opacity={definido ? 0.95 : 1}
          style={{ filter: brillo }}
        />
      )}
      {centro.forma === "diamante" && (
        <polygon
          points={`${centro.x},${centro.y - tam / 2} ${centro.x + tam / 2},${centro.y} ${centro.x},${centro.y + tam / 2} ${centro.x - tam / 2},${centro.y}`}
          fill={fill}
          stroke={stroke}
          strokeWidth={activo ? "2.8" : "1.8"}
          opacity={definido ? 0.95 : 1}
          style={{ filter: brillo }}
        />
      )}
      <text
        x={centro.x}
        y={centro.y + tam / 2 + 16}
        textAnchor="middle"
        fill={activo ? "#FFFFFF" : definido ? "#FFFFFF" : "rgba(233,213,255,0.72)"}
        fontSize="9"
        fontWeight={activo || definido ? "600" : "500"}
      >
        {centro.nombre}
      </text>
    </g>
  );
}

export default function BodyGraph({
  datos,
  className,
  centroSeleccionado,
  canalSeleccionado,
  onCentroClick,
  onCanalClick,
}: PropsBodyGraph) {
  if (!datos) {
    return (
      <div className={cn("flex items-center justify-center rounded-2xl bg-fondo-tarjeta p-8", className)}>
        <p className="text-texto-secundario">Cargando Body Graph…</p>
      </div>
    );
  }

  const centrosNormalizados = Object.entries(datos?.centros ?? {}).reduce<Record<string, string>>(
    (acc, [clave, estado]) => {
      acc[normalizarClaveHD(clave)] = estado;
      return acc;
    },
    {},
  );

  const centroActivo = centroSeleccionado ? normalizarClaveHD(centroSeleccionado) : null;

  function estaDefinido(centro: PosicionCentro): boolean {
    return centro.aliases.some((alias) => {
      const valor = centrosNormalizados[normalizarClaveHD(alias)];
      return valor === "definido" || valor === "defined";
    });
  }

  function estadoCentro(centro: PosicionCentro): string {
    return (
      centro.aliases
        .map((alias) => centrosNormalizados[normalizarClaveHD(alias)])
        .find(Boolean) ?? "abierto"
    );
  }

  function centroCoincide(centro: PosicionCentro, clave: string | null): boolean {
    if (!clave) return false;
    return centro.aliases.some((alias) => normalizarClaveHD(alias) === clave);
  }

  function canalTocaCentro(canal: Canal, clave: string | null): boolean {
    if (!clave) return false;
    return canal.centros.some((centro) => normalizarClaveHD(centro) === clave);
  }

  function centroPerteneceACanal(canal: Canal, centro: PosicionCentro): boolean {
    return canal.centros.some((clave) =>
      centro.aliases.some((alias) => normalizarClaveHD(alias) === normalizarClaveHD(clave)),
    );
  }

  function canalesDeFondo(origen: string, destino: string): boolean {
    const canalRelacionado = (datos?.canales ?? []).some((canal) => {
      const [a, b] = canal.centros.map(normalizarClaveHD);
      const origenNormalizado = normalizarClaveHD(origen);
      const destinoNormalizado = normalizarClaveHD(destino);
      return (
        (a === origenNormalizado && b === destinoNormalizado) ||
        (a === destinoNormalizado && b === origenNormalizado)
      );
    });

    return canalRelacionado;
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

          const activa = canalesDeFondo(a, b);
          const relacionada =
            centroCoincide(ca, centroActivo) || centroCoincide(cb, centroActivo);

          return (
            <line
              key={i}
              x1={ca.x}
              y1={ca.y}
              x2={cb.x}
              y2={cb.y}
              stroke={
                activa
                  ? relacionada
                    ? "rgba(216,187,255,0.78)"
                    : "rgba(179,136,255,0.38)"
                  : "rgba(255,255,255,0.14)"
              }
              strokeWidth={activa ? 2.4 : 1.1}
              opacity={relacionada ? 1 : activa ? 0.72 : 0.58}
            />
          );
        })}

        {(datos?.canales ?? []).map((canal) => {
          const centroA = obtenerCentroPorClave(canal.centros[0]);
          const centroB = obtenerCentroPorClave(canal.centros[1]);
          if (!centroA || !centroB) return null;

          const id = crearIdCanal(canal);
          const seleccionado = canalSeleccionado === id;
          const relacionado = canalTocaCentro(canal, centroActivo);

          function manejarCanal() {
            onCanalClick?.(canal);
          }

          return (
            <g
              key={id}
              role={onCanalClick ? "button" : undefined}
              tabIndex={onCanalClick ? 0 : undefined}
              onClick={onCanalClick ? manejarCanal : undefined}
              onKeyDown={
                onCanalClick
                  ? (evento) => {
                      if (evento.key === "Enter" || evento.key === " ") {
                        evento.preventDefault();
                        manejarCanal();
                      }
                    }
                  : undefined
              }
              style={{ cursor: onCanalClick ? "pointer" : "default" }}
            >
              <title>{`${canal.nombre} · Puertas ${canal.puertas[0]}-${canal.puertas[1]}`}</title>
              <line
                x1={centroA.x}
                y1={centroA.y}
                x2={centroB.x}
                y2={centroB.y}
                stroke="transparent"
                strokeWidth={14}
              />
              <line
                x1={centroA.x}
                y1={centroA.y}
                x2={centroB.x}
                y2={centroB.y}
                stroke={
                  seleccionado
                    ? "#F5F0FF"
                    : relacionado
                      ? "#E6D4FF"
                      : "#B388FF"
                }
                strokeWidth={seleccionado ? 4.6 : relacionado ? 3.8 : 3.2}
                opacity={centroActivo && !relacionado && !seleccionado ? 0.22 : 0.96}
                strokeLinecap="round"
                style={{
                  filter: seleccionado ? "drop-shadow(0 0 12px rgba(179,136,255,0.6))" : undefined,
                }}
              />
            </g>
          );
        })}

        {CENTROS.map((centro) => (
          <DibujarCentro
            key={centro.nombre}
            centro={centro}
            definido={estaDefinido(centro)}
            estado={estadoCentro(centro)}
            activo={
              centroCoincide(centro, centroActivo) ||
              (datos?.canales ?? []).some((canal) => {
                if (canalSeleccionado !== crearIdCanal(canal)) return false;
                return centroPerteneceACanal(canal, centro);
              })
            }
            relacionado={
              centroActivo
                ? (datos?.canales ?? []).some(
                    (canal) => canalTocaCentro(canal, centroActivo) && centroPerteneceACanal(canal, centro),
                  )
                : false
            }
            onClick={onCentroClick}
          />
        ))}
      </svg>
    </div>
  );
}
