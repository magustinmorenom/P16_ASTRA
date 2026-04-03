"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useStoreAuth } from "@/lib/stores/store-auth";
import { Icono } from "@/componentes/ui/icono";
import { cn } from "@/lib/utilidades/cn";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const queryClient = new QueryClient();

const ENLACES = [
  { ruta: "/admin", etiqueta: "Panel", icono: "grafico-barras" },
  { ruta: "/admin/usuarios", etiqueta: "Usuarios", icono: "usuarios" },
  { ruta: "/admin/suscripciones", etiqueta: "Suscripciones", icono: "tarjeta-credito" },
  { ruta: "/admin/costos", etiqueta: "Costos API", icono: "moneda" },
  { ruta: "/admin/sistema", etiqueta: "Sistema", icono: "engranaje" },
] as const;

export default function LayoutAdmin({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { usuario, cargando, cargarUsuario } = useStoreAuth();

  const esLogin = pathname === "/admin/login";

  useEffect(() => {
    // Solo cargar si no estamos en login Y no hay usuario cargado aún
    if (!esLogin && !usuario) cargarUsuario();
  }, [cargarUsuario, esLogin, usuario]);

  useEffect(() => {
    if (esLogin) return;
    if (!cargando && (!usuario || usuario.rol !== "admin")) {
      router.replace("/admin/login");
    }
  }, [usuario, cargando, router, esLogin]);

  // Login page: render sin layout ni protección
  if (esLogin) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  }

  // Si el usuario ya está cargado y es admin, mostrar directo sin esperar
  if (usuario?.rol === "admin") {
    // Render normal — el usuario ya fue verificado
  } else if (cargando || !usuario) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#0F0A1A]">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-violet-400 border-t-transparent" />
      </div>
    );
  } else {
    // usuario existe pero no es admin — el useEffect redirige
    return null;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <div className="flex h-screen bg-[#0F0A1A]">
        {/* Sidebar */}
        <aside className="flex w-[220px] flex-col border-r border-white/[0.06] bg-[#13082a]">
          <div className="flex items-center gap-2 px-5 py-5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-600">
              <Icono nombre="escudo" tamaño={16} className="text-white" />
            </div>
            <span className="text-sm font-bold text-white">ASTRA Admin</span>
          </div>

          <nav className="flex flex-1 flex-col gap-0.5 px-3 pt-2">
            {ENLACES.map((enlace) => {
              const activo =
                enlace.ruta === "/admin"
                  ? pathname === "/admin"
                  : pathname.startsWith(enlace.ruta);
              return (
                <Link
                  key={enlace.ruta}
                  href={enlace.ruta}
                  className={cn(
                    "flex items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] font-medium transition-colors",
                    activo
                      ? "bg-violet-600/20 text-white"
                      : "text-white/50 hover:bg-white/[0.04] hover:text-white/80",
                  )}
                >
                  <Icono nombre={enlace.icono} tamaño={18} />
                  {enlace.etiqueta}
                </Link>
              );
            })}
          </nav>

          <div className="border-t border-white/[0.06] px-4 py-3">
            <Link
              href="/dashboard"
              className="flex items-center gap-2 text-[12px] text-white/40 transition-colors hover:text-white/70"
            >
              <Icono nombre="flecha-izquierda" tamaño={14} />
              Volver a la app
            </Link>
          </div>
        </aside>

        {/* Main content */}
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </QueryClientProvider>
  );
}
