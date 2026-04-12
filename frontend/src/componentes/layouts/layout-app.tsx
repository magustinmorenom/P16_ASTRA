"use client";

import { useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";

import Navbar from "@/componentes/layouts/navbar";
import SidebarNavegacion from "@/componentes/layouts/sidebar-navegacion";
import ReproductorCosmico from "@/componentes/layouts/reproductor-cosmico";
import PanelLyrics from "@/componentes/layouts/panel-lyrics";
import LayoutMobile from "@/componentes/layouts/layout-mobile";
import BannerPodcastDia from "@/componentes/layouts/banner-podcast-dia";
import { ContenedorToasts } from "@/componentes/layouts/contenedor-toasts";
import { CapaExplicar } from "@/componentes/explicar/capa-explicar";
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

  // Clave de sección para animar transiciones de contenido (solo al cambiar de sección principal)
  const seccionActual = pathname.split("/")[1] || "dashboard";
  const seccionAnteriorRef = useRef(seccionActual);
  // Dirección de la animación: 1 = hacia abajo (avanzar), -1 = hacia arriba (retroceder)
  const ordenSecciones = ["chat", "dashboard", "perfil-espiritual", "podcast", "carta-natal", "diseno-humano", "numerologia", "calendario-cosmico"];
  const idxActual = ordenSecciones.indexOf(seccionActual);
  const idxAnterior = ordenSecciones.indexOf(seccionAnteriorRef.current);
  const direccion = idxActual >= idxAnterior ? 1 : -1;
  useEffect(() => {
    seccionAnteriorRef.current = seccionActual;
  }, [seccionActual]);

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
      <div data-explicable="true" data-app-shell="true">
        <BannerPodcastDia />
        <LayoutMobile>{children}</LayoutMobile>
        <ContenedorToasts />
        <CapaExplicar />
      </div>
    );
  }

  /* ======= DESKTOP LAYOUT ======= */
  return (
    <div
      data-explicable="true"
      data-app-shell="true"
      className="flex h-screen flex-col overflow-hidden"
      style={{ background: "var(--shell-fondo-profundo)" }}
    >
      {/* Navbar — full width.
          La caja central del navbar funciona como centro de notificaciones
          (incluye los estados generando/listo/error del podcast del día),
          por eso en desktop ya no montamos BannerPodcastDia. */}
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
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={seccionActual}
              initial={{ opacity: 0, y: direccion * 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: direccion * -8 }}
              transition={{ duration: 0.22, ease: [0.25, 0.1, 0.25, 1] }}
              className="h-full"
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      <ReproductorCosmico />
      <PanelLyrics />
      <ContenedorToasts />
      <CapaExplicar />
    </div>
  );
}
