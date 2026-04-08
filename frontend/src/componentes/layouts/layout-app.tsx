"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";

import Navbar from "@/componentes/layouts/navbar";
import SidebarNavegacion from "@/componentes/layouts/sidebar-navegacion";
import ReproductorCosmico from "@/componentes/layouts/reproductor-cosmico";
import PanelLyrics from "@/componentes/layouts/panel-lyrics";
import LayoutMobile from "@/componentes/layouts/layout-mobile";
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
    pathname.startsWith("/carta-natal") || pathname.startsWith("/diseno-humano") || pathname.startsWith("/numerologia");

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
    <div
      className="flex h-screen flex-col overflow-hidden"
      style={{ background: "var(--shell-fondo-profundo)" }}
    >
      {/* Navbar — full width */}
      <Navbar />

      {/* Body: sidebar + content */}
      <div className="flex flex-1 min-h-0 overflow-hidden">
        <SidebarNavegacion />
        <main
          className={
            usaRailContextualSeparado
              ? "min-h-0 min-w-0 flex-1 overflow-hidden"
              : "min-h-0 min-w-0 flex-1 overflow-y-auto scroll-sutil"
          }
          style={{ background: "var(--shell-fondo)" }}
        >
          {children}
        </main>
      </div>

      <ReproductorCosmico />
      <PanelLyrics />
      <ContenedorToasts />
    </div>
  );
}
