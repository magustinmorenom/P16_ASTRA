"use client";

import { useRef, useEffect, useState } from "react";
import { useStoreUI } from "@/lib/stores/store-ui";
import { Icono } from "@/componentes/ui/icono";
import { cn } from "@/lib/utilidades/cn";

/**
 * Panel modal de lyrics sincronizadas estilo Spotify.
 * Aparece como overlay glassmorphic con slide-in desde la derecha.
 */
export default function PanelLyrics() {
  const { pistaActual, reproduciendo, segmentoActual } = useStoreUI();
  const contenedorRef = useRef<HTMLDivElement>(null);
  const segmentoRefs = useRef<Map<number, HTMLDivElement>>(new Map());
  const [montado, setMontado] = useState(false);

  const segmentos = pistaActual?.segmentos;
  const visible = !!segmentos && segmentos.length > 0 && pistaActual?.tipo === "podcast";

  // Controlar animación de entrada/salida
  useEffect(() => {
    if (visible) {
      // Pequeño delay para que el DOM monte antes de animar
      requestAnimationFrame(() => setMontado(true));
    } else {
      setMontado(false);
    }
  }, [visible]);

  // Auto-scroll al segmento activo
  useEffect(() => {
    if (!visible || !reproduciendo) return;
    const el = segmentoRefs.current.get(segmentoActual);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [segmentoActual, visible, reproduciendo]);

  if (!visible) return null;

  const cerrar = () => {
    setMontado(false);
    setTimeout(() => {
      useStoreUI.setState({
        pistaActual: null,
        reproduciendo: false,
        progresoSegundos: 0,
        segmentoActual: 0,
      });
    }, 350);
  };

  return (
    <div className="hidden lg:block fixed inset-0 z-50 pointer-events-none">
      {/* Backdrop sutil — clic cierra */}
      <div
        onClick={cerrar}
        className={cn(
          "absolute inset-0 bg-black/20 transition-opacity duration-350 pointer-events-auto",
          montado ? "opacity-100" : "opacity-0"
        )}
      />

      {/* Panel glassmorphic */}
      <aside
        className={cn(
          "absolute top-0 right-0 h-full w-[360px] pointer-events-auto",
          "flex flex-col",
          "backdrop-blur-2xl bg-[#1A1128]/75 border-l border-white/10",
          "shadow-[-8px_0_32px_rgba(124,77,255,0.08)]",
          "transition-all duration-350 ease-[cubic-bezier(0.25,0.1,0.25,1)]",
          montado
            ? "translate-x-0 opacity-100"
            : "translate-x-full opacity-0"
        )}
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-white/8 flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-xs font-semibold text-[#B388FF] uppercase tracking-wider">
              Transcripción
            </p>
            <p className="text-sm text-[#F5F0FF]/70 truncate mt-0.5">
              {pistaActual.titulo}
            </p>
          </div>
          <button
            onClick={cerrar}
            className="text-[#B388FF]/60 hover:text-[#F5F0FF] transition-colors shrink-0 mt-0.5 cursor-pointer"
            title="Cerrar transcripción"
          >
            <Icono nombre="x" tamaño={18} />
          </button>
        </div>

        {/* Lyrics */}
        <div
          ref={contenedorRef}
          className="flex-1 overflow-y-auto scroll-sutil px-5 py-6 pb-24 space-y-4"
        >
          {segmentos.map((seg, idx) => (
            <div
              key={idx}
              ref={(el) => {
                if (el) segmentoRefs.current.set(idx, el);
              }}
              className={cn(
                "transition-all duration-300 py-2 px-3 rounded-lg leading-relaxed text-sm",
                idx === segmentoActual
                  ? "text-[#F5F0FF] font-medium border-l-2 border-[#7C4DFF] bg-white/5"
                  : idx < segmentoActual
                    ? "text-[#B388FF]/40"
                    : "text-[#B388FF]/60"
              )}
            >
              {seg.texto}
            </div>
          ))}
        </div>
      </aside>
    </div>
  );
}
