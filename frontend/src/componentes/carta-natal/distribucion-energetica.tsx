"use client";

import type { SeleccionEnergiaContextual } from "@/componentes/carta-natal/panel-contextual";
import {
  calcularDistribucion,
  COLORES_ELEMENTO,
  COLORES_MODALIDAD,
} from "@/lib/utilidades/interpretaciones-natal";
import { cn } from "@/lib/utilidades/cn";
import type { Planeta } from "@/lib/tipos";

type ElementoResumen = "Fuego" | "Tierra" | "Aire" | "Agua";
type ModalidadResumen = "Cardinal" | "Fijo" | "Mutable";

interface DistribucionEnergeticaProps {
  planetas: Planeta[];
  onSeleccionar: (seleccion: SeleccionEnergiaContextual) => void;
  seleccionActiva?: SeleccionEnergiaContextual | null;
}

function estaActiva(
  seleccionActiva: SeleccionEnergiaContextual | null | undefined,
  seleccion: SeleccionEnergiaContextual,
) {
  if (!seleccionActiva) return false;
  if (seleccionActiva.categoria !== seleccion.categoria) return false;

  if ("nombre" in seleccion || "nombre" in seleccionActiva) {
    return "nombre" in seleccion &&
      "nombre" in seleccionActiva &&
      seleccion.nombre === seleccionActiva.nombre;
  }

  return true;
}

export function DistribucionEnergetica({
  planetas,
  onSeleccionar,
  seleccionActiva,
}: DistribucionEnergeticaProps) {
  const dist = calcularDistribucion(planetas);
  const totalElementos = Object.values(dist.elementos).reduce((a, b) => a + b, 0);
  const totalModalidades = Object.values(dist.modalidades).reduce((a, b) => a + b, 0);
  const [elementoDominanteRaw, cantidadElementoDominante] = Object.entries(dist.elementos).sort(
    (a, b) => b[1] - a[1],
  )[0];
  const [modalidadDominanteRaw, cantidadModalidadDominante] = Object.entries(dist.modalidades).sort(
    (a, b) => b[1] - a[1],
  )[0];
  const elementoDominante = elementoDominanteRaw as ElementoResumen;
  const modalidadDominante = modalidadDominanteRaw as ModalidadResumen;

  const items = [
    {
      clave: "pulso",
      etiqueta: "Pulso dominante",
      valor: `${elementoDominante} + ${modalidadDominante}`,
      meta: "Eje principal",
      color: "#B388FF",
      seleccion: { tipo: "energia", categoria: "pulso" } as const,
    },
    {
      clave: "elementos",
      etiqueta: "Elemento",
      valor: elementoDominante,
      meta: `${cantidadElementoDominante}/${totalElementos}`,
      color: COLORES_ELEMENTO[elementoDominante],
      seleccion: { tipo: "energia", categoria: "elemento", nombre: elementoDominante } as const,
    },
    {
      clave: "modalidades",
      etiqueta: "Modalidad",
      valor: modalidadDominante,
      meta: `${cantidadModalidadDominante}/${totalModalidades}`,
      color: COLORES_MODALIDAD[modalidadDominante],
      seleccion: { tipo: "energia", categoria: "modalidad", nombre: modalidadDominante } as const,
    },
  ];

  return (
    <section
      className="rounded-[24px] border px-4 py-4"
      style={{
        borderColor: "var(--shell-borde-fuerte)",
        background: "linear-gradient(180deg, var(--shell-chip), var(--shell-superficie))",
      }}
    >
      <button
        type="button"
        onClick={() => onSeleccionar(items[0].seleccion)}
        className={cn(
          "w-full rounded-[18px] px-0 py-0 text-left transition-all duration-200",
          estaActiva(seleccionActiva, items[0].seleccion)
            ? "text-[color:var(--shell-texto)]"
            : "text-[color:var(--shell-texto-secundario)] hover:text-[color:var(--shell-texto)]",
        )}
      >
        <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[color:var(--shell-texto-tenue)]">
          {items[0].etiqueta}
        </span>

        <p className="mt-2.5 text-[14px] font-semibold tracking-tight text-[color:var(--shell-texto)] sm:text-[15px]">
          {items[0].valor}
        </p>
        <p className="mt-1 text-[11px] text-[color:var(--shell-texto-tenue)]">
          Combustible y activación.
        </p>
      </button>

      <div className="mt-4 grid gap-0 border-t pt-3 sm:grid-cols-2 sm:divide-x" style={{ borderColor: "var(--shell-borde)" }}>
        {items.slice(1).map((item, index) => (
          <button
            key={item.clave}
          type="button"
          onClick={() => onSeleccionar(item.seleccion)}
            className={cn(
              `group flex flex-col items-start gap-1.5 px-0 py-2 text-left transition-all duration-200 ${
              index === 1 ? "sm:pl-4" : "sm:pr-4"
            }`,
            estaActiva(seleccionActiva, item.seleccion)
              ? "text-[color:var(--shell-texto)]"
              : "text-[color:var(--shell-texto-secundario)] hover:text-[color:var(--shell-texto)]",
          )}
        >
          <div className="flex items-center gap-2">
            <div
              className="h-2.5 w-2.5 rounded-full"
              style={{ backgroundColor: item.color }}
            />
            <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[color:var(--shell-texto-tenue)]">
              {item.etiqueta}
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-[13px] font-semibold tracking-tight text-[color:var(--shell-texto)]">
              {item.valor}
            </span>
            <span className="text-[11px] text-[color:var(--shell-texto-tenue)]">{item.meta}</span>
          </div>
          </button>
        ))}
      </div>
    </section>
  );
}
