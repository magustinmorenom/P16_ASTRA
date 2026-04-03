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
  titulo?: string;
  etiqueta?: string;
  subtitulo?: string;
  mostrarAtras?: boolean;
  transparente?: boolean;
  accionDerecha?: React.ReactNode;
  metas?: MetaHeaderMobile[];
  children?: React.ReactNode;
}

function obtenerClasesMeta(tono: MetaHeaderMobile["tono"] = "violeta"): string {
  switch (tono) {
    case "oro":
      return "border-[var(--shell-chip-borde)] bg-[var(--shell-chip)] text-[color:var(--color-acento)]";
    case "verde":
      return "border-emerald-400/25 bg-emerald-400/10 text-emerald-300";
    case "rojo":
      return "border-rose-400/25 bg-rose-400/10 text-rose-300";
    default:
      return "border-[var(--shell-chip-borde)] bg-[var(--shell-chip)] text-[color:var(--color-acento)]";
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
      style={{ paddingTop: "calc(env(safe-area-inset-top, 0px) + 6px)" }}
    >
      <div className="px-4 pb-4 pt-2">
        <div
          className={cn(
            "overflow-hidden rounded-[24px] border shadow-[0_12px_32px_rgba(10,4,25,0.4)] backdrop-blur-xl",
            transparente
              ? "border-[var(--shell-borde)] bg-[var(--shell-superficie)]"
              : "border-[var(--shell-borde)] bg-[var(--shell-navbar)]"
          )}
        >
          <div className="relative px-3.5 py-4">
            <div className="flex items-start gap-3">
              {mostrarAtras && (
                <button
                  onClick={() => router.back()}
                  className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border transition-colors"
                  style={{
                    borderColor: "var(--shell-borde)",
                    background: "var(--shell-superficie)",
                    color: "var(--shell-texto-secundario)",
                  }}
                  aria-label="Volver"
                >
                  <Icono nombre="flechaIzquierda" tamaño={20} />
                </button>
              )}

              <div className="min-w-0 flex-1">
                {children ?? (
                  <>
                    {etiqueta && (
                      <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.24em] text-[color:var(--color-acento)]">
                        {etiqueta}
                      </p>
                    )}
                    <h1 className="text-[17px] font-semibold leading-tight text-[color:var(--shell-texto)]">
                      {titulo}
                    </h1>
                    {subtitulo && (
                      <p className="mt-1 text-[12px] leading-5 text-[color:var(--shell-texto-tenue)]">
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
                      "flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-[11px] font-medium whitespace-nowrap",
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
