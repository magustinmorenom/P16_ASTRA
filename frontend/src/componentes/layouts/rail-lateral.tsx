"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

import { Icono } from "@/componentes/ui/icono";
import { cn } from "@/lib/utilidades/cn";

interface RailLateralProps {
  children: ReactNode;
  etiqueta: string;
  titulo: string;
  subtitulo?: string;
  onCerrar?: () => void;
  className?: string;
  cuerpoClassName?: string;
  modo?: "fijo" | "overlay";
  visible?: boolean;
  montado?: boolean;
  claveContenido?: string;
}

const ESTILO_BASE =
  "flex flex-col text-white backdrop-blur-2xl bg-[#1A1128]/76 border-l border-white/10 shadow-[-8px_0_32px_rgba(124,77,255,0.08)]";

function CabeceraRail({
  etiqueta,
  titulo,
  subtitulo,
  onCerrar,
}: Pick<RailLateralProps, "etiqueta" | "titulo" | "subtitulo" | "onCerrar">) {
  return (
    <div className="flex items-start justify-between gap-3 border-b border-white/8 px-5 py-4">
      <div className="min-w-0">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#B388FF]">
          {etiqueta}
        </p>
        <p className="mt-1 text-[18px] font-semibold tracking-tight text-[#F5F0FF]">
          {titulo}
        </p>
        {subtitulo ? (
          <p className="mt-1 text-[12px] leading-relaxed text-[#F5F0FF]/62">
            {subtitulo}
          </p>
        ) : null}
      </div>

      {onCerrar ? (
        <button
          type="button"
          onClick={onCerrar}
          className="mt-0.5 shrink-0 text-[#B388FF]/60 transition-colors hover:text-[#F5F0FF]"
          title="Cerrar panel"
        >
          <Icono nombre="x" tamaño={18} />
        </button>
      ) : null}
    </div>
  );
}

export function RailLateral({
  children,
  etiqueta,
  titulo,
  subtitulo,
  onCerrar,
  className,
  cuerpoClassName,
  modo = "fijo",
  visible = true,
  montado = true,
  claveContenido,
}: RailLateralProps) {
  const [contenidoRenderizado, setContenidoRenderizado] = useState({
    clave: claveContenido,
    etiqueta,
    titulo,
    subtitulo,
    children,
  });
  const [contenidoVisible, setContenidoVisible] = useState(true);
  const primeraRenderizacion = useRef(true);

  useEffect(() => {
    if (!claveContenido) {
      return;
    }

    if (primeraRenderizacion.current) {
      primeraRenderizacion.current = false;
      return;
    }

    if (contenidoRenderizado.clave === claveContenido) {
      return;
    }

    const frameSalida = window.requestAnimationFrame(() => {
      setContenidoVisible(false);
    });

    const timeout = window.setTimeout(() => {
      setContenidoRenderizado({
        clave: claveContenido,
        etiqueta,
        titulo,
        subtitulo,
        children,
      });
      requestAnimationFrame(() => setContenidoVisible(true));
    }, 160);

    return () => {
      window.cancelAnimationFrame(frameSalida);
      window.clearTimeout(timeout);
    };
  }, [children, claveContenido, contenidoRenderizado.clave, etiqueta, subtitulo, titulo]);

  if (!visible) return null;

  const contenidoActivo =
    claveContenido && contenidoRenderizado.clave !== claveContenido
      ? contenidoRenderizado
      : {
          etiqueta,
          titulo,
          subtitulo,
          children,
        };

  const cuerpo = (
    <div
      className={cn(
        "flex min-h-0 flex-1 flex-col transition-[opacity,transform] duration-200 ease-out",
        contenidoVisible ? "translate-y-0 opacity-100" : "translate-y-1 opacity-0",
      )}
    >
      <CabeceraRail
        etiqueta={contenidoActivo.etiqueta}
        titulo={contenidoActivo.titulo}
        subtitulo={contenidoActivo.subtitulo}
        onCerrar={onCerrar}
      />
      <div className={cn("flex-1 overflow-y-auto scroll-sutil px-5 py-5", cuerpoClassName)}>
        {contenidoActivo.children}
      </div>
    </div>
  );

  if (modo === "overlay") {
    return (
      <div className="pointer-events-none fixed inset-0 z-50 hidden lg:block">
        <div
          onClick={onCerrar}
          className={cn(
            "pointer-events-auto absolute inset-0 bg-black/20 transition-opacity duration-350",
            montado ? "opacity-100" : "opacity-0",
          )}
        />

        <aside
          className={cn(
            "pointer-events-auto absolute inset-y-0 right-0 w-[360px] transition-all duration-350 ease-[cubic-bezier(0.25,0.1,0.25,1)]",
            ESTILO_BASE,
            montado ? "translate-x-0 opacity-100" : "translate-x-full opacity-0",
            className,
          )}
        >
          {cuerpo}
        </aside>
      </div>
    );
  }

  return (
    <aside className={cn("hidden h-full min-h-0 shrink-0 lg:flex lg:w-[352px] xl:w-[372px]", ESTILO_BASE, className)}>
      {cuerpo}
    </aside>
  );
}
