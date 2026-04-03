"use client";

import { useState, useEffect, useRef } from "react";
import { Icono, type NombreIcono } from "@/componentes/ui/icono";
import { cn } from "@/lib/utilidades/cn";
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
  const areaVisible = areas[tabVisible] ?? areas[0];

  // Limpiar timeout al desmontar
  useEffect(() => () => { if (timeoutRef.current) clearTimeout(timeoutRef.current); }, []);

  if (!areas.length) return null;

  const iconoVisible: NombreIcono = ICONO_MAP[areaVisible.icono] ?? "destello";
  const tonoArea =
    areaVisible.nivel === "favorable"
      ? "text-emerald-300"
      : areaVisible.nivel === "precaucion"
        ? "text-rose-300"
        : "text-violet-200/70";
  const etiquetaArea =
    areaVisible.nivel === "favorable"
      ? "Favorable"
      : areaVisible.nivel === "precaucion"
        ? "Precaución"
        : "Neutro";

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
  return (
    <div className="animate-[fade-in_300ms_ease-out_both] rounded-[18px] border border-white/[0.08] bg-[#160d23] shadow-[0_18px_48px_rgba(8,2,22,0.28)]">
      <div className="flex items-center gap-2 overflow-x-auto border-b border-white/[0.08] px-2.5 py-2 scroll-sutil-dark">
        {areas.map((area, i) => {
          const icono: NombreIcono = ICONO_MAP[area.icono] ?? "destello";
          const activo = tabActivo === i;
          return (
            <button
              key={area.id}
              onClick={() => cambiarTab(i)}
              className={cn(
                "flex shrink-0 items-center gap-2 rounded-[12px] px-3 py-2 text-[13px] font-medium tracking-[0.01em] text-[#f8f6ff] transition-all duration-200",
                activo
                  ? "bg-white/[0.08] text-white"
                  : "text-white/60 hover:bg-white/[0.04] hover:text-white/84"
              )}
            >
              <Icono nombre={icono} tamaño={15} peso={activo ? "fill" : "regular"} />
              {area.nombre}
            </button>
          );
        })}
      </div>

      <div className="min-h-[136px] px-4 py-4 lg:pb-5">
        <div
          key={tabVisible}
          className={`transition-all duration-180 ease-out ${
            transicionando
              ? "opacity-0 translate-y-1"
              : "opacity-100 translate-y-0"
          }`}
        >
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px] border border-white/[0.08] bg-white/[0.05] text-[#CDB7FF]">
              <Icono nombre={iconoVisible} tamaño={18} peso="fill" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-3">
                <p className="text-[15px] font-semibold text-white">{areaVisible.nombre}</p>
                <span className={cn("shrink-0 text-[11px] font-medium tracking-[0.12em] uppercase", tonoArea)}>
                  {etiquetaArea}
                </span>
              </div>
              <p className="mt-1 text-[14px] leading-5 text-white/84">{areaVisible.frase}</p>
              {areaVisible.detalle && areaVisible.detalle !== areaVisible.frase && (
                <p className="mt-1.5 text-[12px] leading-5 text-white/52">
                  {areaVisible.detalle}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
