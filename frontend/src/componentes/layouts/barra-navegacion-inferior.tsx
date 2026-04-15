"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utilidades/cn";
import { Icono } from "@/componentes/ui/icono";
import { useStoreUI } from "@/lib/stores/store-ui";

export default function BarraNavegacionInferior() {
  const pathname = usePathname();
  const chatActivo = pathname.startsWith("/chat");
  const dashboardActivo = pathname === "/dashboard";
  const { toggleMenuExplorar, menuExplorarAbierto } = useStoreUI();

  return (
    <nav
      data-no-explicable="true"
      className="fixed bottom-0 left-0 right-0 z-50 overflow-hidden border-t backdrop-blur-xl lg:hidden"
      style={{
        background: "var(--shell-tabbar)",
        borderColor: "var(--shell-borde)",
        paddingBottom: "env(safe-area-inset-bottom, 0px)",
      }}
    >
      {/* Glow izquierdo */}
      <div
        className="pointer-events-none absolute left-0 top-0 bottom-0 w-24"
        style={{
          background: "radial-gradient(ellipse at left center, rgba(124,77,255,0.10) 0%, transparent 70%)",
        }}
      />
      {/* Glow derecho */}
      <div
        className="pointer-events-none absolute right-0 top-0 bottom-0 w-24"
        style={{
          background: "radial-gradient(ellipse at right center, rgba(124,77,255,0.10) 0%, transparent 70%)",
        }}
      />
      <div className="relative grid grid-cols-[1fr_auto_1fr] items-center h-[76px] pb-[10px]">
        {/* Mi día — centrado en su columna */}
        <Link
          href="/dashboard"
          className={cn(
            "touch-feedback flex flex-col items-center justify-center gap-1.5 justify-self-end mr-12 rounded-lg transition-colors",
            dashboardActivo
              ? "text-[color:var(--color-acento)]"
              : "text-[color:var(--shell-texto-tenue)]"
          )}
        >
          <Icono
            nombre="sol"
            tamaño={22}
            peso={dashboardActivo ? "fill" : "regular"}
          />
          <span
            className={cn(
              "text-[10px] leading-tight",
              dashboardActivo ? "font-semibold" : "font-medium"
            )}
          >
            Mi día
          </span>
        </Link>

        {/* FAB Chat — centro (siempre visible) */}
        <Link
          href="/chat"
          aria-label="Abrir chat"
          className={cn(
            "flex items-center justify-center justify-self-center z-30",
            "w-[60px] h-[60px] rounded-full",
            "animate-chat-soft-pulse transition-colors",
            chatActivo
              ? "bg-[rgba(147,51,234,0.22)]"
              : "bg-[rgba(124,77,255,0.16)]"
          )}
        >
          <div
            className={cn(
              "flex items-center justify-center",
              "w-[52px] h-[52px] rounded-full",
              "shadow-[0_4px_18px_rgba(124,77,255,0.55)]",
              "transition-colors",
              chatActivo ? "bg-[#9333EA]" : "bg-[#7C4DFF]"
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

        {/* Explorar — centrado en su columna */}
        <button
          type="button"
          onClick={toggleMenuExplorar}
          className={cn(
            "touch-feedback flex flex-col items-center justify-center gap-1.5 justify-self-start ml-12 rounded-lg transition-colors",
            menuExplorarAbierto
              ? "text-[color:var(--color-acento)]"
              : "text-[color:var(--shell-texto-tenue)]"
          )}
        >
          <Icono
            nombre="menu"
            tamaño={22}
            peso={menuExplorarAbierto ? "fill" : "regular"}
          />
          <span
            className={cn(
              "text-[10px] leading-tight",
              menuExplorarAbierto ? "font-semibold" : "font-medium"
            )}
          >
            Explorar
          </span>
        </button>
      </div>
    </nav>
  );
}
