"use client";

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
      {/* Barra visual */}
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
      {/* Etiquetas */}
      <div className="flex mt-2 gap-4">
        {Object.entries(items).map(([nombre, cantidad]) => (
          <div key={nombre} className="flex items-center gap-1.5">
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

  return (
    <section className="mb-8">
      <h2 className="text-[15px] font-semibold text-[#2C2926] mb-3">Distribución Energética</h2>
      <div className="bg-white rounded-2xl p-5 space-y-5">
        <div>
          <p className="text-[11px] text-[#8A8580] uppercase tracking-wider font-medium mb-2">Elementos</p>
          <BarraDistribucion items={dist.elementos} colores={COLORES_ELEMENTO} total={totalElementos} />
        </div>
        <div>
          <p className="text-[11px] text-[#8A8580] uppercase tracking-wider font-medium mb-2">Modalidades</p>
          <BarraDistribucion items={dist.modalidades} colores={COLORES_MODALIDAD} total={totalModalidades} />
        </div>
      </div>
    </section>
  );
}
