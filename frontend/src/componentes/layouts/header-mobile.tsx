"use client";

import { useRouter } from "next/navigation";
import { cn } from "@/lib/utilidades/cn";
import { Icono } from "@/componentes/ui/icono";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------
interface HeaderMobileProps {
  /** Titulo de la pagina */
  titulo?: string;
  /** Mostrar boton de retroceso */
  mostrarAtras?: boolean;
  /** Fondo transparente (para paginas inmersivas con gradient hero) */
  transparente?: boolean;
  /** Elemento a la derecha del header (ej: icono settings) */
  accionDerecha?: React.ReactNode;
  /** Contenido custom en lugar de titulo (ej: greeting en dashboard) */
  children?: React.ReactNode;
}

// ---------------------------------------------------------------------------
// Componente
// ---------------------------------------------------------------------------
export default function HeaderMobile({
  titulo,
  mostrarAtras = false,
  transparente = false,
  accionDerecha,
  children,
}: HeaderMobileProps) {
  const router = useRouter();

  return (
    <header
      className={cn(
        "sticky top-0 z-30 flex items-center gap-3 px-4 min-h-[44px] lg:hidden",
        transparente
          ? "bg-transparent"
          : "bg-fondo/95 backdrop-blur-md border-b border-[#E8E4E0]/40"
      )}
      style={{ paddingTop: "env(safe-area-inset-top, 0px)" }}
    >
      {/* Boton atras */}
      {mostrarAtras && (
        <button
          onClick={() => router.back()}
          className="touch-feedback flex items-center justify-center h-10 w-10 -ml-2 rounded-full text-[#2C2926]"
          aria-label="Volver"
        >
          <Icono nombre="flechaIzquierda" tamaño={22} />
        </button>
      )}

      {/* Contenido central */}
      <div className="flex-1 min-w-0">
        {children ?? (
          <h1 className="text-[17px] font-semibold text-[#2C2926] truncate">
            {titulo}
          </h1>
        )}
      </div>

      {/* Accion derecha */}
      {accionDerecha && (
        <div className="shrink-0">{accionDerecha}</div>
      )}
    </header>
  );
}
