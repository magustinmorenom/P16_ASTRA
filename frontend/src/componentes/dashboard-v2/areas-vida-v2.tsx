"use client";

import { useState } from "react";
import { PanelGlass } from "./panel-glass";
import { Icono, type NombreIcono } from "@/componentes/ui/icono";
import type { AreaVidaDTO } from "@/lib/tipos";

/** Mapea el icono que devuelve el backend a un icono de Phosphor válido. */
const ICONO_MAP: Record<string, NombreIcono> = {
  heart: "corazon",
  activity: "latido",
  briefcase: "cohete",
  wallet: "moneda",
  palette: "loto",
  "trending-up": "destello",
};

interface AreasVidaV2Props {
  areas: AreaVidaDTO[];
}

export function AreasVidaV2({ areas }: AreasVidaV2Props) {
  const [tabActivo, setTabActivo] = useState(0);

  if (!areas.length) return null;

  const areaActual = areas[tabActivo] ?? areas[0];

  return (
    <div className="rounded-[10px] bg-gradient-to-b from-[#382954] to-[#6a4f99] p-2.5 flex flex-col gap-2.5">
      {/* Tab pills — generados desde la respuesta del backend */}
      <div className="flex items-center rounded-[10px] bg-[#6750a4] px-1.5 py-1 overflow-x-auto scroll-sutil-dark">
        {areas.map((area, i) => {
          const icono: NombreIcono = ICONO_MAP[area.icono] ?? "destello";
          return (
            <button
              key={area.id}
              onClick={() => setTabActivo(i)}
              className={`flex items-center gap-1.5 px-4 py-1.5 text-[14px] font-medium tracking-[0.5px] text-[#f8f6ff] rounded-lg transition-colors whitespace-nowrap ${
                tabActivo === i
                  ? "bg-white/15"
                  : "hover:bg-white/10"
              }`}
            >
              <Icono nombre={icono} tamaño={16} peso={tabActivo === i ? "fill" : "regular"} />
              {area.nombre}
            </button>
          );
        })}
      </div>

      {/* Contenido del tab */}
      <PanelGlass className="px-4 py-3 min-h-[56px]">
        <p className="text-white/90 text-[14px] font-medium leading-[1.45]">
          {areaActual.detalle || areaActual.frase}
        </p>
      </PanelGlass>
    </div>
  );
}
