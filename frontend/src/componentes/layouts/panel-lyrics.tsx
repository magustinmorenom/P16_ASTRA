"use client";

import { useRef, useEffect, useState } from "react";
import { useStoreUI } from "@/lib/stores/store-ui";
import { RailLateral } from "@/componentes/layouts/rail-lateral";
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
      requestAnimationFrame(() => setMontado(false));
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
    <RailLateral
      modo="overlay"
      visible={visible}
      montado={montado}
      etiqueta="Transcripción"
      titulo={pistaActual.titulo}
      subtitulo={pistaActual.subtitulo}
      onCerrar={cerrar}
      cuerpoClassName="space-y-4 px-5 py-6 pb-24"
    >
      <div ref={contenedorRef}>
          {segmentos.map((seg, idx) => (
            <div
              key={idx}
              ref={(el) => {
                if (el) segmentoRefs.current.set(idx, el);
              }}
              className={cn(
                "transition-all duration-300 py-2 px-3 rounded-lg leading-relaxed text-sm",
                idx === segmentoActual
                  ? "text-shell-texto font-medium border-l-2 border-primario bg-shell-superficie-suave"
                  : idx < segmentoActual
                    ? "text-shell-texto-tenue"
                    : "text-shell-texto-secundario"
              )}
            >
              {seg.texto}
            </div>
          ))}
      </div>
    </RailLateral>
  );
}
