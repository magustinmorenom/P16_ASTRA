"use client";

import { useStoreUI } from "@/lib/stores/store-ui";
import BarraNavegacionInferior from "@/componentes/layouts/barra-navegacion-inferior";
import MiniReproductor from "@/componentes/layouts/mini-reproductor";

// ---------------------------------------------------------------------------
// Layout Mobile — Shell tipo app nativa
// ---------------------------------------------------------------------------
export default function LayoutMobile({
  children,
}: {
  children: React.ReactNode;
}) {
  const { pistaActual } = useStoreUI();

  // Calcular padding inferior: tab bar + safe area + mini player (si hay pista)
  const paddingBottom = pistaActual
    ? "calc(var(--tab-bar-height) + var(--mini-player-height) + env(safe-area-inset-bottom, 0px))"
    : "calc(var(--tab-bar-height) + env(safe-area-inset-bottom, 0px))";

  return (
    <div className="flex flex-col h-[100dvh] bg-fondo">
      {/* Contenido principal — cada pagina incluye su propio HeaderMobile */}
      <main
        className="flex-1 mobile-scroll animate-fade-in"
        style={{ paddingBottom }}
      >
        {children}
      </main>

      {/* Mini reproductor flotante (encima del tab bar) */}
      <MiniReproductor />

      {/* Barra de navegacion inferior */}
      <BarraNavegacionInferior />
    </div>
  );
}
