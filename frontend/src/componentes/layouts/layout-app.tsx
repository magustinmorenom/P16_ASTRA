"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import Navbar from "@/componentes/layouts/navbar";
import SidebarNavegacion from "@/componentes/layouts/sidebar-navegacion";
import ReproductorCosmico from "@/componentes/layouts/reproductor-cosmico";
import PanelLyrics from "@/componentes/layouts/panel-lyrics";
import { useStoreAuth } from "@/lib/stores/store-auth";
import { useStoreUI } from "@/lib/stores/store-ui";

export default function LayoutApp({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { autenticado, cargando, usuario } = useStoreAuth();
  const { pistaActual } = useStoreUI();

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

  const alturaContenido = pistaActual
    ? "h-[calc(100vh-56px-80px)]"
    : "h-[calc(100vh-56px)]";

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      <Navbar />
      <div className={`flex flex-1 mt-[56px] ${pistaActual ? "mb-[80px]" : ""} overflow-hidden`}>
        <SidebarNavegacion alturaContenido={alturaContenido} />
        <main className={`flex-1 overflow-y-auto scroll-sutil ${alturaContenido}`}>
          {children}
        </main>
        <PanelLyrics />
      </div>
      <ReproductorCosmico />
    </div>
  );
}
