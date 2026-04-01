"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";

import Navbar from "@/componentes/layouts/navbar";
import SidebarNavegacion from "@/componentes/layouts/sidebar-navegacion";
import ReproductorCosmico from "@/componentes/layouts/reproductor-cosmico";
import PanelLyrics from "@/componentes/layouts/panel-lyrics";
import LayoutMobile from "@/componentes/layouts/layout-mobile";
import ChatWidget from "@/componentes/chat/chat-widget";
import { ContenedorToasts } from "@/componentes/layouts/contenedor-toasts";
import { useStoreAuth } from "@/lib/stores/store-auth";
import { usarEsMobile } from "@/lib/hooks/usar-es-mobile";

export default function LayoutApp({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { autenticado, cargando, usuario } = useStoreAuth();
  const esMobile = usarEsMobile();
  const usaRailContextualSeparado =
    pathname.startsWith("/carta-natal") || pathname.startsWith("/diseno-humano");

  useEffect(() => {
    if (!cargando && !autenticado) {
      router.replace("/login");
    } else if (!cargando && autenticado && usuario?.tiene_perfil === false) {
      router.replace("/onboarding");
    }
  }, [autenticado, cargando, usuario, router]);

  /* Mientras carga o si no esta autenticado, no renderizar contenido */
  if (cargando || !autenticado || usuario?.tiene_perfil === false) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-fondo">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primario border-t-transparent" />
      </div>
    );
  }

  /* ======= MOBILE LAYOUT ======= */
  if (esMobile) {
    return (
      <>
        <LayoutMobile>{children}</LayoutMobile>
        <ContenedorToasts />
      </>
    );
  }

  /* ======= DESKTOP LAYOUT ======= */
  return (
    <div className="flex flex-col h-screen overflow-hidden bg-[#16011b]">
      {/* Navbar — full width */}
      <Navbar />

      {/* Body: sidebar + content */}
      <div className="flex flex-1 min-h-0 overflow-hidden">
        <SidebarNavegacion />
        <main
          className={
            usaRailContextualSeparado
              ? "min-h-0 min-w-0 flex-1 overflow-hidden bg-[#16011b]"
              : "min-h-0 min-w-0 flex-1 overflow-y-auto scroll-sutil bg-[#16011b]"
          }
        >
          {children}
        </main>
      </div>

      <ReproductorCosmico />
      <PanelLyrics />
      <ChatWidget />
      <ContenedorToasts />
    </div>
  );
}
