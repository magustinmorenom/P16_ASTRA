"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utilidades/cn";
import { Icono, type NombreIcono } from "@/componentes/ui/icono";

// ---------------------------------------------------------------------------
// Definicion de tabs (4 — Perfil se accede desde el avatar del header)
// ---------------------------------------------------------------------------
interface TabInferior {
  etiqueta: string;
  ruta: string;
  icono: NombreIcono;
  /** Rutas adicionales que activan este tab */
  rutasActivas?: string[];
}

const TABS_IZQUIERDOS: TabInferior[] = [
  {
    etiqueta: "Inicio",
    ruta: "/dashboard",
    icono: "casa",
  },
  {
    etiqueta: "Astral",
    ruta: "/carta-natal",
    icono: "estrella",
  },
];

const TABS_DERECHOS: TabInferior[] = [
  {
    etiqueta: "Explorar",
    ruta: "/descubrir",
    icono: "brujula",
    rutasActivas: [
      "/descubrir",
      "/diseno-humano",
      "/numerologia",
      "/calendario-cosmico",
      "/retorno-solar",
      "/transitos",
      "/match-pareja",
    ],
  },
  {
    etiqueta: "Podcast",
    ruta: "/podcast",
    icono: "microfono",
  },
];

// ---------------------------------------------------------------------------
// Componente
// ---------------------------------------------------------------------------
export default function BarraNavegacionInferior() {
  const pathname = usePathname();
  const chatActivo = pathname.startsWith("/chat");

  function estaActivo(tab: TabInferior): boolean {
    if (tab.rutasActivas) {
      return tab.rutasActivas.some((r) => pathname.startsWith(r));
    }
    return tab.ruta === "/dashboard"
      ? pathname === "/dashboard"
      : pathname.startsWith(tab.ruta);
  }

  function renderTab(tab: TabInferior) {
    const activo = estaActivo(tab);
    return (
      <Link
        key={tab.ruta}
        href={tab.ruta}
        className={cn(
          "touch-feedback flex flex-col items-center justify-center gap-0.5 min-w-[56px] min-h-[44px] px-2 rounded-lg transition-colors",
          activo
            ? "text-[color:var(--color-acento)]"
            : "text-[color:var(--shell-texto-tenue)]"
        )}
      >
        <Icono
          nombre={tab.icono}
          tamaño={22}
          peso={activo ? "fill" : "regular"}
        />
        <span
          className={cn(
            "text-[10px] leading-tight",
            activo ? "font-semibold" : "font-medium"
          )}
        >
          {tab.etiqueta}
        </span>
      </Link>
    );
  }

  return (
    <nav
      data-no-explicable="true"
      className="fixed bottom-0 left-0 right-0 z-50 overflow-hidden border-t backdrop-blur-xl"
      style={{
        background: "var(--shell-tabbar)",
        borderColor: "var(--shell-borde)",
        paddingBottom: "env(safe-area-inset-bottom, 0px)",
      }}
    >
      <div className="relative flex items-center justify-evenly h-[72px] pb-[10px]">
        {/* Tabs izquierdos */}
        {TABS_IZQUIERDOS.map(renderTab)}

        {/* Spacer central — reserva columna para el FAB */}
        <div className="w-[68px] shrink-0" aria-hidden="true" />

        {/* Tabs derechos */}
        {TABS_DERECHOS.map(renderTab)}

        {/* FAB Chat — flota sobre el spacer central (oculto en /chat) */}
        {!chatActivo && (
          <Link
            href="/chat"
            aria-label="Abrir chat"
            className={cn(
              "absolute left-1/2 -translate-x-1/2 bottom-[7px] z-20",
              "flex items-center justify-center",
              "w-[60px] h-[60px] rounded-full",
              "animate-chat-soft-pulse transition-colors",
              "bg-[rgba(124,77,255,0.16)]"
            )}
          >
            <div
              className={cn(
                "flex items-center justify-center",
                "w-[52px] h-[52px] rounded-full",
                "shadow-[0_4px_18px_rgba(124,77,255,0.55)]",
                "transition-colors",
                "bg-[#7C4DFF]"
              )}
            >
              <Icono
                nombre="chatCirculo"
                tamaño={26}
                peso="fill"
                className="text-white"
              />
            </div>
          </Link>
        )}
      </div>
    </nav>
  );
}
