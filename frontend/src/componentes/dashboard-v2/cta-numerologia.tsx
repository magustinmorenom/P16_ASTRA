"use client";

import Link from "next/link";
import { Icono } from "@/componentes/ui/icono";

interface CtaNumerologiaProps {
  numeroPersonal?: number;
  titulo?: string;
  descripcion?: string;
  ruta?: string | null;
  mostrarAccion?: boolean;
}

export function CtaNumerologia({
  numeroPersonal,
  titulo = "Ver mi Carta Numerológica",
  descripcion,
  ruta = "/numerologia",
  mostrarAccion = true,
}: CtaNumerologiaProps) {
  const descripcionFinal =
    descripcion ??
    (numeroPersonal
      ? `Tu número personal hoy es ${numeroPersonal}`
      : "Descubrí tu mapa numerológico completo");

  const clasesBase = [
    "group block rounded-[10px] relative overflow-hidden transition-all duration-300",
    ruta ? "hover:scale-[1.005]" : "",
  ]
    .filter(Boolean)
    .join(" ");

  const contenido = (
    <>
      {/* Fondo gradiente */}
      <div className="absolute inset-0 bg-gradient-to-r from-violet-950 via-violet-800 to-violet-500" />

      {/* Orbes decorativos */}
      <div className="absolute right-0 top-0 h-32 w-32 rounded-full bg-violet-300/20 blur-3xl pointer-events-none" />
      <div className="absolute -left-8 -bottom-8 h-28 w-28 rounded-full bg-fuchsia-500/15 blur-3xl pointer-events-none" />

      {/* Contenido */}
      <div className="relative flex items-center gap-4 px-5 py-4">
        {/* Icono grande con numero */}
        <div className="h-[52px] w-[52px] rounded-xl backdrop-blur-[21px] flex items-center justify-center shrink-0" style={{ background: "var(--shell-hero-superficie)", borderWidth: 1, borderColor: "var(--shell-hero-superficie-fuerte)" }}>
          {numeroPersonal ? (
            <span className="font-[family-name:var(--font-inria)] text-[26px] font-light leading-none text-[color:var(--shell-hero-texto)]">
              {numeroPersonal}
            </span>
          ) : (
            <Icono nombre="numeral" tamaño={24} peso="bold" className="text-[color:var(--shell-hero-texto)]" />
          )}
        </div>

        {/* Texto */}
        <div className="flex-1 min-w-0">
          <p className="text-[16px] font-semibold leading-snug text-[color:var(--shell-hero-texto)]">
            {titulo}
          </p>
          <p className="mt-0.5 text-[13px] leading-snug text-[color:var(--shell-hero-texto-tenue)]">
            {descripcionFinal}
          </p>
        </div>

        {mostrarAccion && (
          <div className="h-9 w-9 rounded-full flex items-center justify-center shrink-0 transition-colors" style={{ background: "var(--shell-hero-superficie)", borderWidth: 1, borderColor: "var(--shell-hero-borde-sutil)" }}>
            <Icono nombre="flecha" tamaño={16} className="text-[color:var(--shell-hero-texto)]" />
          </div>
        )}
      </div>
    </>
  );

  if (!ruta) {
    return <div className={clasesBase}>{contenido}</div>;
  }

  return (
    <Link href={ruta} className={clasesBase}>
      {contenido}
    </Link>
  );
}
