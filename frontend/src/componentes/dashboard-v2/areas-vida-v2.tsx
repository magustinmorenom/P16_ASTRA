"use client";

import { useState } from "react";
import { PanelGlass } from "./panel-glass";
import { Icono, type NombreIcono } from "@/componentes/ui/icono";
import type { AreaVidaDTO } from "@/lib/tipos";

const TABS_ORDEN: { nombre: string; icono: NombreIcono }[] = [
  { nombre: "Amor", icono: "corazon" },
  { nombre: "Salud", icono: "latido" },
  { nombre: "Proyectos", icono: "cohete" },
  { nombre: "Finanzas", icono: "moneda" },
  { nombre: "Espiritualidad", icono: "loto" },
];

interface AreasVidaV2Props {
  areas: AreaVidaDTO[];
}

export function AreasVidaV2({ areas }: AreasVidaV2Props) {
  const [tabActivo, setTabActivo] = useState(0);

  const areasMapeadas = TABS_ORDEN.map(
    (tab) =>
      areas.find((a) => a.nombre.toLowerCase() === tab.nombre.toLowerCase()) ?? null
  );

  const areaActual = areasMapeadas[tabActivo];

  return (
    <div className="rounded-[10px] bg-gradient-to-b from-[#382954] to-[#6a4f99] p-2.5 flex flex-col gap-2.5">
      {/* Tab pills */}
      <div className="flex items-center rounded-[10px] bg-[#6750a4] px-1.5 py-1 overflow-x-auto">
        {TABS_ORDEN.map((tab, i) => (
          <button
            key={tab.nombre}
            onClick={() => setTabActivo(i)}
            className={`flex items-center gap-1.5 px-4 py-1.5 text-[14px] font-medium tracking-[0.5px] text-[#f8f6ff] rounded-lg transition-colors whitespace-nowrap ${
              tabActivo === i
                ? "bg-white/15"
                : "hover:bg-white/10"
            }`}
          >
            <Icono nombre={tab.icono} tamaño={16} peso={tabActivo === i ? "fill" : "regular"} />
            {tab.nombre}
          </button>
        ))}
      </div>

      {/* Contenido del tab */}
      <PanelGlass className="px-4 py-3 min-h-[56px]">
        {areaActual ? (
          <p className="text-white/90 text-[14px] font-medium leading-[1.35]">
            {areaActual.detalle || areaActual.frase}
          </p>
        ) : (
          <p className="text-white/50 text-[14px] font-medium">
            Sin información para esta área
          </p>
        )}
      </PanelGlass>
    </div>
  );
}
