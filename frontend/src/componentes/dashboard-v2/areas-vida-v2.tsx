"use client";

import { useState } from "react";
import { PanelGlass } from "./panel-glass";
import type { AreaVidaDTO } from "@/lib/tipos";

const TABS_ORDEN = ["Amor", "Salud", "Proyectos", "Finanzas", "Espiritualidad"] as const;

interface AreasVidaV2Props {
  areas: AreaVidaDTO[];
}

export function AreasVidaV2({ areas }: AreasVidaV2Props) {
  const [tabActivo, setTabActivo] = useState(0);

  const areasMapeadas = TABS_ORDEN.map(
    (nombre) =>
      areas.find((a) => a.nombre.toLowerCase() === nombre.toLowerCase()) ?? null
  );

  const areaActual = areasMapeadas[tabActivo];

  return (
    <div className="rounded-[10px] bg-gradient-to-b from-[#382954] to-[#6a4f99] p-2.5 flex flex-col gap-2.5">
      {/* Tab pills */}
      <div className="flex items-center rounded-[10px] bg-[#6750a4] px-1.5 py-1 overflow-x-auto">
        {TABS_ORDEN.map((nombre, i) => (
          <button
            key={nombre}
            onClick={() => setTabActivo(i)}
            className={`px-4 py-1.5 text-[12px] font-medium tracking-[0.5px] text-[#f8f6ff] rounded-lg transition-colors whitespace-nowrap ${
              tabActivo === i
                ? "bg-white/15"
                : "hover:bg-white/10"
            }`}
          >
            {nombre}
          </button>
        ))}
      </div>

      {/* Contenido del tab */}
      <PanelGlass className="px-4 py-3 min-h-[56px]">
        {areaActual ? (
          <p className="text-white/90 text-[11px] leading-relaxed">
            {areaActual.detalle || areaActual.frase}
          </p>
        ) : (
          <p className="text-white/50 text-[11px]">
            Sin información para esta área
          </p>
        )}
      </PanelGlass>
    </div>
  );
}
