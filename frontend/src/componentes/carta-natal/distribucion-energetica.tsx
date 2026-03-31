"use client";

import {
  ETIQUETA_CARTA,
  SUPERFICIE_CLARA_CARTA,
  SUPERFICIE_OSCURA_CARTA,
} from "@/componentes/carta-natal/estilos";
import {
  calcularDistribucion,
  COLORES_ELEMENTO,
  COLORES_MODALIDAD,
} from "@/lib/utilidades/interpretaciones-natal";
import type { Planeta } from "@/lib/tipos";

interface DistribucionEnergeticaProps {
  planetas: Planeta[];
}

function BarraDistribucion({
  items,
  colores,
  total,
}: {
  items: Record<string, number>;
  colores: Record<string, string>;
  total: number;
}) {
  return (
    <div>
      <div className="flex h-3 rounded-full overflow-hidden bg-[#F0EEF6]">
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
        {Object.entries(items).map(([nombre, cantidad]) => (
          <div
            key={nombre}
            className="flex items-center gap-1.5 rounded-full border border-[#ECE4FA] bg-white px-3 py-1.5"
          >
            <div
              className="h-2.5 w-2.5 rounded-full"
              style={{ backgroundColor: colores[nombre] || "#9E9E9E" }}
            />
            <span className="text-[12px] text-[#2C2926] font-medium">{nombre}</span>
            <span className="text-[11px] text-[#8A8580]">{cantidad}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function DistribucionEnergetica({ planetas }: DistribucionEnergeticaProps) {
  const dist = calcularDistribucion(planetas);
  const totalElementos = Object.values(dist.elementos).reduce((a, b) => a + b, 0);
  const totalModalidades = Object.values(dist.modalidades).reduce((a, b) => a + b, 0);
  const elementoDominante = Object.entries(dist.elementos).sort((a, b) => b[1] - a[1])[0];
  const modalidadDominante = Object.entries(dist.modalidades).sort((a, b) => b[1] - a[1])[0];

  return (
    <section className="mb-8">
      <div className="mb-3">
        <div>
          <p className={`${ETIQUETA_CARTA} text-[#7C4DFF]`}>Ritmo de la carta</p>
          <h2 className="mt-1.5 text-[18px] font-semibold tracking-tight text-[#2C2926]">
            Distribución energética
          </h2>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-[0.85fr_1.1fr_1.1fr]">
        <div className={`${SUPERFICIE_OSCURA_CARTA} p-5`}>
          <div className="relative z-10">
            <p className={`${ETIQUETA_CARTA} text-violet-200/75`}>Lectura rápida</p>
            <h3 className="mt-3 text-[20px] font-semibold tracking-tight text-white">
              El pulso dominante de tu carta
            </h3>
            <p className="mt-2.5 text-[13px] leading-relaxed text-violet-100/72">
              Acá se ve si tu energía tiende más a iniciar, sostener o adaptarse,
              y qué elemento toma mayor protagonismo en tu manera de vivir.
            </p>

            <div className="mt-5 grid gap-3">
              <div className="rounded-2xl border border-white/10 bg-white/[0.08] px-4 py-4 backdrop-blur-md">
                <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-violet-200/70">
                  Elemento dominante
                </p>
                <div className="mt-2 flex items-center gap-2">
                  <div
                    className="h-3 w-3 rounded-full"
                    style={{ backgroundColor: COLORES_ELEMENTO[elementoDominante[0]] }}
                  />
                  <p className="text-sm font-semibold text-white">{elementoDominante[0]}</p>
                </div>
                <p className="mt-1 text-[12px] text-violet-100/62">
                  {elementoDominante[1]} planetas en este elemento.
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/[0.08] px-4 py-4 backdrop-blur-md">
                <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-violet-200/70">
                  Modalidad dominante
                </p>
                <p className="mt-2 text-sm font-semibold text-white">{modalidadDominante[0]}</p>
                <p className="mt-1 text-[12px] text-violet-100/62">
                  {modalidadDominante[1]} planetas marcan esta forma de moverte.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className={`${SUPERFICIE_CLARA_CARTA} p-5`}>
          <p className={`${ETIQUETA_CARTA} text-[#7C4DFF]`}>Elementos</p>
          <h3 className="mt-2 text-[16px] font-semibold text-[#2C2926]">
            Cómo circula tu energía base
          </h3>
          <p className="mt-2 text-[13px] leading-relaxed text-[#6F6A65]">
            Fuego, Tierra, Aire y Agua muestran desde qué registro sentís, actuás
            y ordenás tu experiencia.
          </p>
          <div className="mt-5">
            <BarraDistribucion
              items={dist.elementos}
              colores={COLORES_ELEMENTO}
              total={totalElementos}
            />
          </div>
        </div>

        <div className={`${SUPERFICIE_CLARA_CARTA} p-5`}>
          <p className={`${ETIQUETA_CARTA} text-[#7C4DFF]`}>Modalidades</p>
          <h3 className="mt-2 text-[16px] font-semibold text-[#2C2926]">
            Tu forma de entrar en movimiento
          </h3>
          <p className="mt-2 text-[13px] leading-relaxed text-[#6F6A65]">
            Cardinal, Fijo y Mutable revelan si tendés a abrir, sostener o
            flexibilizar las situaciones.
          </p>
          <div className="mt-5">
            <BarraDistribucion
              items={dist.modalidades}
              colores={COLORES_MODALIDAD}
              total={totalModalidades}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
