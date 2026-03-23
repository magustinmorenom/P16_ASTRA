"use client";

import { useRef, useEffect } from "react";
import { useStoreUI } from "@/lib/stores/store-ui";
import { cn } from "@/lib/utilidades/cn";

/**
 * Panel lateral de lyrics sincronizadas estilo Spotify.
 * Muestra el texto del podcast con highlight del segmento activo.
 */
export default function PanelLyrics() {
  const { pistaActual, reproduciendo, segmentoActual } = useStoreUI();
  const contenedorRef = useRef<HTMLDivElement>(null);
  const segmentoRefs = useRef<Map<number, HTMLDivElement>>(new Map());

  const segmentos = pistaActual?.segmentos;
  const visible = !!segmentos && segmentos.length > 0 && pistaActual?.tipo === "podcast";

  // Auto-scroll al segmento activo
  useEffect(() => {
    if (!visible || !reproduciendo) return;
    const el = segmentoRefs.current.get(segmentoActual);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [segmentoActual, visible, reproduciendo]);

  if (!visible) return null;

  return (
    <aside className="hidden lg:flex w-[320px] flex-shrink-0 flex-col bg-[#1A1128] border-l border-white/5 overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-white/5">
        <p className="text-xs font-semibold text-[#B388FF] uppercase tracking-wider">
          Transcripción
        </p>
        <p className="text-sm text-[#F5F0FF]/70 truncate mt-0.5">
          {pistaActual.titulo}
        </p>
      </div>

      {/* Lyrics */}
      <div
        ref={contenedorRef}
        className="flex-1 overflow-y-auto scroll-sutil px-5 py-6 space-y-4"
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
  );
}
