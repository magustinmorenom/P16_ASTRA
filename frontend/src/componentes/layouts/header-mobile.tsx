"use client";

import { useRouter } from "next/navigation";

import { Icono, type NombreIcono } from "@/componentes/ui/icono";
import { cn } from "@/lib/utilidades/cn";

interface MetaHeaderMobile {
  icono: NombreIcono;
  texto: string;
  tono?: "violeta" | "oro" | "verde" | "rojo";
}

interface HeaderMobileProps {
  /** Titulo de la pagina */
  titulo?: string;
  /** Texto breve superior para jerarquia */
  etiqueta?: string;
  /** Subtitulo descriptivo */
  subtitulo?: string;
  /** Mostrar boton de retroceso */
  mostrarAtras?: boolean;
  /** Fondo transparente (para paginas inmersivas con gradient hero) */
  transparente?: boolean;
  /** Elemento a la derecha del header (ej: icono settings) */
  accionDerecha?: React.ReactNode;
  /** Metadatos utiles en chips */
  metas?: MetaHeaderMobile[];
  /** Contenido custom en lugar de titulo */
  children?: React.ReactNode;
}

function obtenerClasesMeta(tono: MetaHeaderMobile["tono"] = "violeta"): string {
  switch (tono) {
    case "oro":
      return "border-[#D4A234]/20 bg-[#D4A234]/10 text-[#7A5A08]";
    case "verde":
      return "border-emerald-300/40 bg-emerald-50 text-emerald-700";
    case "rojo":
      return "border-rose-200/60 bg-rose-50 text-rose-700";
    default:
      return "border-violet-200/70 bg-violet-50/90 text-violet-700";
  }
}

export default function HeaderMobile({
  titulo,
  etiqueta,
  subtitulo,
  mostrarAtras = false,
  transparente = false,
  accionDerecha,
  metas = [],
  children,
}: HeaderMobileProps) {
  const router = useRouter();

  return (
    <header
      className={cn("sticky top-0 z-30 lg:hidden")}
      style={{ paddingTop: "env(safe-area-inset-top, 0px)" }}
    >
      <div className="px-4 pb-3 pt-3">
        <div
          className={cn(
            "overflow-hidden rounded-[28px] border shadow-[0_12px_32px_rgba(76,45,140,0.12)] backdrop-blur-xl",
            transparente
              ? "border-white/20 bg-white/[0.12]"
              : "border-white/55 bg-[linear-gradient(180deg,rgba(255,255,255,0.9),rgba(250,247,255,0.82))]"
          )}
        >
          <div className="relative px-3.5 py-3.5">
            <div className="flex items-start gap-3">
              {mostrarAtras && (
                <button
                  onClick={() => router.back()}
                  className={cn(
                    "mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border transition-colors",
                    transparente
                      ? "border-white/20 bg-white/[0.08] text-white"
                      : "border-[#E9E0FF] bg-white/80 text-[#4A2D8C]"
                  )}
                  aria-label="Volver"
                >
                  <Icono nombre="flechaIzquierda" tamaño={20} />
                </button>
              )}

              <div className="min-w-0 flex-1">
                {children ?? (
                  <>
                    {etiqueta && (
                      <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.24em] text-[#7C4DFF]/60">
                        {etiqueta}
                      </p>
                    )}
                    <h1 className="truncate text-[18px] font-semibold text-[#2C2926]">
                      {titulo}
                    </h1>
                    {subtitulo && (
                      <p className="mt-1 text-[12px] leading-relaxed text-[#6E6782]">
                        {subtitulo}
                      </p>
                    )}
                  </>
                )}
              </div>

              {accionDerecha && <div className="shrink-0">{accionDerecha}</div>}
            </div>

            {metas.length > 0 && (
              <div className="-mx-0.5 mt-3 flex gap-2 overflow-x-auto px-0.5 pb-0.5">
                {metas.map((meta) => (
                  <div
                    key={`${meta.icono}-${meta.texto}`}
                    className={cn(
                      "flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-[11px] font-medium",
                      obtenerClasesMeta(meta.tono)
                    )}
                  >
                    <Icono nombre={meta.icono} tamaño={13} />
                    <span>{meta.texto}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
