"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
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

const SWIPE_UMBRAL = 50;
const SWIPE_VELOCIDAD = 300;

export function AreasVidaV2({ areas }: AreasVidaV2Props) {
  const [tabActivo, setTabActivo] = useState(0);
  const [tabVisible, setTabVisible] = useState(0);
  const [transicionando, setTransicionando] = useState(false);
  const [direccion, setDireccion] = useState(0);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const tabsRef = useRef<HTMLDivElement>(null);
  const areaVisible = areas[tabVisible] ?? areas[0];

  // Limpiar timeout al desmontar
  useEffect(() => () => { if (timeoutRef.current) clearTimeout(timeoutRef.current); }, []);

  // Scroll del tab activo al centro
  useEffect(() => {
    if (!tabsRef.current) return;
    const contenedor = tabsRef.current;
    const boton = contenedor.children[tabActivo] as HTMLElement | undefined;
    if (!boton) return;
    const offsetCentro = boton.offsetLeft - contenedor.offsetWidth / 2 + boton.offsetWidth / 2;
    contenedor.scrollTo({ left: offsetCentro, behavior: "smooth" });
  }, [tabActivo]);

  if (!areas.length) return null;

  const iconoVisible: NombreIcono = ICONO_MAP[areaVisible.icono] ?? "destello";
  const tonoArea =
    areaVisible.nivel === "favorable"
      ? "var(--shell-badge-exito-texto)"
      : areaVisible.nivel === "precaucion"
        ? "var(--shell-badge-error-texto)"
        : "var(--shell-badge-violeta-texto)";
  const etiquetaArea =
    areaVisible.nivel === "favorable"
      ? "Favorable"
      : areaVisible.nivel === "precaucion"
        ? "Precaución"
        : "Neutro";

  function cambiarTab(nuevoTab: number) {
    if (nuevoTab < 0 || nuevoTab >= areas.length || nuevoTab === tabActivo || transicionando) return;
    setDireccion(nuevoTab > tabActivo ? 1 : -1);
    setTabActivo(nuevoTab);
    setTransicionando(true);

    // Fade-out → cambiar contenido → fade-in
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      setTabVisible(nuevoTab);
      setTransicionando(false);
    }, 180);
  }

  function manejarDragEnd(
    _: MouseEvent | TouchEvent | PointerEvent,
    info: { offset: { x: number }; velocity: { x: number } },
  ) {
    if (info.offset.x < -SWIPE_UMBRAL || info.velocity.x < -SWIPE_VELOCIDAD) {
      cambiarTab(tabActivo + 1);
    } else if (info.offset.x > SWIPE_UMBRAL || info.velocity.x > SWIPE_VELOCIDAD) {
      cambiarTab(tabActivo - 1);
    }
  }

  return (
    <div
      className="animate-[fade-in_300ms_ease-out_both] rounded-[18px] border"
      style={{
        borderColor: "var(--shell-borde)",
        background: "var(--shell-panel)",
        boxShadow: "var(--shell-sombra-suave)",
      }}
    >
      <div
        ref={tabsRef}
        className="scroll-sutil-dark flex items-center gap-2 overflow-x-auto border-b px-2.5 py-2"
        style={{ borderColor: "var(--shell-borde)" }}
      >
        {areas.map((area, i) => {
          const icono: NombreIcono = ICONO_MAP[area.icono] ?? "destello";
          const activo = tabActivo === i;
          return (
            <button
              key={area.id}
              onClick={() => cambiarTab(i)}
              className={cn(
                "flex shrink-0 items-center gap-2 rounded-[12px] px-3 py-2 text-[13px] font-medium tracking-[0.01em] transition-all duration-200",
                activo
                  ? "text-[color:var(--shell-texto)]"
                  : "text-[color:var(--shell-texto-tenue)] hover:text-[color:var(--shell-texto)]"
              )}
              style={{ background: activo ? "var(--shell-chip)" : "transparent" }}
            >
              <Icono nombre={icono} tamaño={15} peso={activo ? "fill" : "regular"} />
              {area.nombre}
            </button>
          );
        })}
      </div>

      <div className="min-h-[136px] overflow-hidden px-4 py-4 lg:pb-5">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={tabVisible}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.15}
            onDragEnd={manejarDragEnd}
            initial={{ opacity: 0, x: direccion * 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: direccion * -30 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            className="touch-none"
          >
            <div className="flex items-start gap-3">
              <div
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px] border"
                style={{
                  borderColor: "var(--shell-borde)",
                  background: "var(--shell-superficie-suave)",
                  color: "var(--color-acento)",
                }}
              >
                <Icono nombre={iconoVisible} tamaño={18} peso="fill" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-[15px] font-semibold text-[color:var(--shell-texto)]">
                    {areaVisible.nombre}
                  </p>
                  <span
                    className="shrink-0 text-[11px] font-medium tracking-[0.12em] uppercase"
                    style={{ color: tonoArea }}
                  >
                    {etiquetaArea}
                  </span>
                </div>
                <p className="mt-1 text-[14px] leading-5 text-[color:var(--shell-texto-secundario)]">
                  {areaVisible.frase}
                </p>
                {areaVisible.detalle && areaVisible.detalle !== areaVisible.frase && (
                  <p className="mt-1.5 text-[12px] leading-5 text-[color:var(--shell-texto-tenue)]">
                    {areaVisible.detalle}
                  </p>
                )}
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
