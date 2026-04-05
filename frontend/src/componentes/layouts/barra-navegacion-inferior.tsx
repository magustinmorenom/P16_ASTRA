"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utilidades/cn";
import { Icono, type NombreIcono } from "@/componentes/ui/icono";

// ---------------------------------------------------------------------------
// Definicion de tabs
// ---------------------------------------------------------------------------
interface TabInferior {
  etiqueta: string;
  ruta: string;
  icono: NombreIcono;
  /** Rutas adicionales que activan este tab */
  rutasActivas?: string[];
}

const tabs: TabInferior[] = [
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
  {
    etiqueta: "Descubrir",
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
    etiqueta: "Podcasts",
    ruta: "/podcast",
    icono: "microfono",
  },
  {
    etiqueta: "Perfil",
    ruta: "/perfil",
    icono: "usuario",
    rutasActivas: ["/perfil", "/suscripcion"],
  },
];

// ---------------------------------------------------------------------------
// Componente
// ---------------------------------------------------------------------------
export default function BarraNavegacionInferior() {
  const pathname = usePathname();

  function estaActivo(tab: TabInferior): boolean {
    if (tab.rutasActivas) {
      return tab.rutasActivas.some((r) => pathname.startsWith(r));
    }
    return tab.ruta === "/dashboard"
      ? pathname === "/dashboard"
      : pathname.startsWith(tab.ruta);
  }

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 border-t backdrop-blur-xl"
      style={{
        background: "var(--shell-tabbar)",
        borderColor: "var(--shell-borde)",
        paddingBottom: "env(safe-area-inset-bottom, 0px)",
      }}
    >
      <div className="flex items-center justify-around h-[56px]">
        {tabs.map((tab) => {
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
        })}
      </div>
    </nav>
  );
}
