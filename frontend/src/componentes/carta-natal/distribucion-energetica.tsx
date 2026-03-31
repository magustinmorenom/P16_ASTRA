"use client";

import {
  ETIQUETA_CARTA,
  SUPERFICIE_CLARA_CARTA,
  SUPERFICIE_OSCURA_CARTA,
} from "@/componentes/carta-natal/estilos";
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

const ETIQUETAS_ELEMENTO: Record<ElementoResumen, string[]> = {
  Fuego: ["impulso", "coraje"],
  Tierra: ["sostén", "cuerpo"],
  Aire: ["idea", "vínculo"],
  Agua: ["intuición", "clima"],
};

const ETIQUETAS_MODALIDAD: Record<ModalidadResumen, string[]> = {
  Cardinal: ["inicia", "abre"],
  Fijo: ["sostiene", "afirma"],
  Mutable: ["adapta", "responde"],
};

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

function BotonDetalle({
  titulo,
  detalle,
  color,
  activa,
  onClick,
}: {
  titulo: string;
  detalle: string;
  color: string;
  activa?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "w-full rounded-2xl border px-4 py-3 text-left transition-all duration-200",
        activa
          ? "border-white/18 bg-white/[0.12] shadow-[0_10px_28px_rgba(10,4,25,0.22)]"
          : "border-white/10 bg-white/[0.06] hover:border-white/16 hover:bg-white/[0.09]",
      )}
    >
      <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-violet-200/70">
        {titulo}
      </p>
      <div className="mt-2 flex items-center gap-2">
        <div className="h-3 w-3 rounded-full" style={{ backgroundColor: color }} />
        <p className="text-[15px] font-semibold text-white">{detalle}</p>
      </div>
    </button>
  );
}

function BarraDistribucion({
  items,
  colores,
  total,
  onSeleccionar,
  seleccionActiva,
  tipo,
}: {
  items: Record<string, number>;
  colores: Record<string, string>;
  total: number;
  onSeleccionar: (seleccion: SeleccionEnergiaContextual) => void;
  seleccionActiva?: SeleccionEnergiaContextual | null;
  tipo: "elemento" | "modalidad";
}) {
  return (
    <div>
      <div className="flex h-3 overflow-hidden rounded-full bg-white/[0.08]">
        {Object.entries(items).map(([nombre, cantidad]) => {
          const pct = total > 0 ? (cantidad / total) * 100 : 0;
          if (pct === 0) return null;
          return (
            <div
              key={nombre}
              className="transition-all duration-500"
              style={{
                width: `${pct}%`,
                backgroundColor: colores[nombre] || "#9E9E9E",
              }}
            />
          );
        })}
      </div>

      <div className="mt-3 flex flex-wrap gap-3">
        {Object.entries(items).map(([nombre, cantidad]) => {
          const seleccion =
            tipo === "elemento"
              ? ({
                  tipo: "energia",
                  categoria: "elemento",
                  nombre: nombre as ElementoResumen,
                } as const)
              : ({
                  tipo: "energia",
                  categoria: "modalidad",
                  nombre: nombre as ModalidadResumen,
                } as const);

          return (
            <button
              key={nombre}
              type="button"
              onClick={() => onSeleccionar(seleccion)}
              className={cn(
                "flex items-center gap-1.5 rounded-full border px-3 py-1.5 transition-all duration-200",
                estaActiva(seleccionActiva, seleccion)
                  ? "border-white/18 bg-white/[0.12] text-white shadow-[0_8px_20px_rgba(10,4,25,0.18)]"
                  : "border-white/10 bg-white/[0.06] text-white/86 hover:border-white/16 hover:bg-white/[0.1]",
              )}
            >
              <div
                className="h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: colores[nombre] || "#9E9E9E" }}
              />
              <span className="text-[12px] font-medium">{nombre}</span>
              <span className="text-[11px] text-white/48">{cantidad}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
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

  const seleccionPulso = { tipo: "energia", categoria: "pulso" } as const;
  const seleccionElementos = { tipo: "energia", categoria: "elementos" } as const;
  const seleccionModalidades = { tipo: "energia", categoria: "modalidades" } as const;
  const seleccionElementoDominante = {
    tipo: "energia",
    categoria: "elemento",
    nombre: elementoDominante,
  } as const;
  const seleccionModalidadDominante = {
    tipo: "energia",
    categoria: "modalidad",
    nombre: modalidadDominante,
  } as const;

  return (
    <section className="mb-7">
      <div className="mb-3">
        <div>
          <p className={`${ETIQUETA_CARTA} text-violet-200/72`}>Ritmo de la carta</p>
          <h2 className="mt-1.5 text-[18px] font-semibold tracking-tight text-white">
            Distribución energética
          </h2>
        </div>
      </div>

      <div className="grid items-stretch gap-4 xl:grid-cols-[0.9fr_1.05fr_1.05fr]">
        <div className={`${SUPERFICIE_OSCURA_CARTA} p-4`}>
          <div className="relative z-10 flex h-full flex-col">
            <button
              type="button"
              onClick={() => onSeleccionar(seleccionPulso)}
              className={cn(
                "rounded-[22px] border px-4 py-4 text-left transition-all duration-200",
                estaActiva(seleccionActiva, seleccionPulso)
                  ? "border-white/18 bg-white/[0.12] shadow-[0_12px_32px_rgba(10,4,25,0.24)]"
                  : "border-white/10 bg-white/[0.06] hover:border-white/16 hover:bg-white/[0.1]",
              )}
            >
              <p className={`${ETIQUETA_CARTA} text-violet-200/75`}>Resumen</p>
              <h3 className="mt-2 text-[18px] font-semibold tracking-tight text-white">
                Pulso dominante
              </h3>
              <p className="mt-3 text-[14px] font-medium text-white/82">
                {elementoDominante} + {modalidadDominante}
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {[elementoDominante, modalidadDominante].map((item) => (
                  <span
                    key={item}
                    className="rounded-full border border-white/10 bg-white/[0.08] px-3 py-1.5 text-[11px] font-medium text-white/72"
                  >
                    {item}
                  </span>
                ))}
              </div>
            </button>

            <div className="mt-3 grid gap-3">
              <BotonDetalle
                titulo="Elemento dominante"
                detalle={`${elementoDominante} · ${cantidadElementoDominante}`}
                color={COLORES_ELEMENTO[elementoDominante]}
                activa={estaActiva(seleccionActiva, seleccionElementoDominante)}
                onClick={() => onSeleccionar(seleccionElementoDominante)}
              />
              <BotonDetalle
                titulo="Modalidad dominante"
                detalle={`${modalidadDominante} · ${cantidadModalidadDominante}`}
                color={COLORES_MODALIDAD[modalidadDominante]}
                activa={estaActiva(seleccionActiva, seleccionModalidadDominante)}
                onClick={() => onSeleccionar(seleccionModalidadDominante)}
              />
            </div>
          </div>
        </div>

        <div className={`${SUPERFICIE_CLARA_CARTA} p-4`}>
          <button
            type="button"
            onClick={() => onSeleccionar(seleccionElementos)}
            className={cn(
              "w-full rounded-[22px] border px-4 py-4 text-left transition-all duration-200",
              estaActiva(seleccionActiva, seleccionElementos)
                ? "border-white/18 bg-white/[0.12] shadow-[0_12px_28px_rgba(10,4,25,0.18)]"
                : "border-white/10 bg-white/[0.05] hover:border-white/16 hover:bg-white/[0.08]",
            )}
          >
            <p className={`${ETIQUETA_CARTA} text-violet-200/72`}>Elementos</p>
            <h3 className="mt-2 text-[16px] font-semibold text-white">
              Cómo circula tu energía base
            </h3>
            <div className="mt-3 flex flex-wrap gap-2">
              {["registro base", "sensación", "respuesta"].map((item) => (
                <span
                  key={item}
                  className="rounded-full border border-white/10 bg-white/[0.08] px-3 py-1.5 text-[11px] font-medium text-white/66"
                >
                  {item}
                </span>
              ))}
            </div>
          </button>

          <div className="mt-4">
            <BarraDistribucion
              items={dist.elementos}
              colores={COLORES_ELEMENTO}
              total={totalElementos}
              onSeleccionar={onSeleccionar}
              seleccionActiva={seleccionActiva}
              tipo="elemento"
            />
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            {ETIQUETAS_ELEMENTO[elementoDominante].map((item) => (
              <span
                key={item}
                className="rounded-full border border-white/10 bg-white/[0.05] px-3 py-1.5 text-[11px] font-medium text-white/58"
              >
                {item}
              </span>
            ))}
          </div>
        </div>

        <div className={`${SUPERFICIE_CLARA_CARTA} p-4`}>
          <button
            type="button"
            onClick={() => onSeleccionar(seleccionModalidades)}
            className={cn(
              "w-full rounded-[22px] border px-4 py-4 text-left transition-all duration-200",
              estaActiva(seleccionActiva, seleccionModalidades)
                ? "border-white/18 bg-white/[0.12] shadow-[0_12px_28px_rgba(10,4,25,0.18)]"
                : "border-white/10 bg-white/[0.05] hover:border-white/16 hover:bg-white/[0.08]",
            )}
          >
            <p className={`${ETIQUETA_CARTA} text-violet-200/72`}>Modalidades</p>
            <h3 className="mt-2 text-[16px] font-semibold text-white">
              Tu forma de entrar en movimiento
            </h3>
            <div className="mt-3 flex flex-wrap gap-2">
              {["inicia", "sostiene", "adapta"].map((item) => (
                <span
                  key={item}
                  className="rounded-full border border-white/10 bg-white/[0.08] px-3 py-1.5 text-[11px] font-medium text-white/66"
                >
                  {item}
                </span>
              ))}
            </div>
          </button>

          <div className="mt-4">
            <BarraDistribucion
              items={dist.modalidades}
              colores={COLORES_MODALIDAD}
              total={totalModalidades}
              onSeleccionar={onSeleccionar}
              seleccionActiva={seleccionActiva}
              tipo="modalidad"
            />
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            {ETIQUETAS_MODALIDAD[modalidadDominante].map((item) => (
              <span
                key={item}
                className="rounded-full border border-white/10 bg-white/[0.05] px-3 py-1.5 text-[11px] font-medium text-white/58"
              >
                {item}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
