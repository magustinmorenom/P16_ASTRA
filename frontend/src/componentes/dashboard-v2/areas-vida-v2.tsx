"use client";

import { useState, useEffect, useRef } from "react";
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
  const [tabVisible, setTabVisible] = useState(0);
  const [transicionando, setTransicionando] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  if (!areas.length) return null;

  const areaVisible = areas[tabVisible] ?? areas[0];

  function cambiarTab(nuevoTab: number) {
    if (nuevoTab === tabActivo || transicionando) return;
    setTabActivo(nuevoTab);
    setTransicionando(true);

    // Fade-out → cambiar contenido → fade-in
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      setTabVisible(nuevoTab);
      setTransicionando(false);
    }, 180);
  }

  // Limpiar timeout al desmontar
  useEffect(() => () => { if (timeoutRef.current) clearTimeout(timeoutRef.current); }, []);

  return (
    <div className="rounded-[10px] bg-gradient-to-b from-[#382954] to-[#6a4f99] p-2.5 flex flex-col gap-2.5 animate-[fade-in_300ms_ease-out_both]">
      {/* Tab pills — generados desde la respuesta del backend */}
      <div className="flex items-center rounded-[10px] bg-[#6750a4] px-1.5 py-1 overflow-x-auto scroll-sutil-dark">
        {areas.map((area, i) => {
          const icono: NombreIcono = ICONO_MAP[area.icono] ?? "destello";
          return (
            <button
              key={area.id}
              onClick={() => cambiarTab(i)}
              className={`flex items-center gap-1.5 px-4 py-1.5 text-[14px] font-medium tracking-[0.5px] text-[#f8f6ff] rounded-lg transition-all duration-200 whitespace-nowrap ${
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

      {/* Contenido del tab — con transición fade */}
      <PanelGlass className="px-4 py-3 min-h-[56px] overflow-hidden">
        <p
          key={tabVisible}
          className={`text-white/90 text-[14px] font-medium leading-[1.45] transition-all duration-180 ease-out ${
            transicionando
              ? "opacity-0 translate-y-1"
              : "opacity-100 translate-y-0"
          }`}
        >
          {areaVisible.detalle || areaVisible.frase}
        </p>
      </PanelGlass>
    </div>
  );
}
