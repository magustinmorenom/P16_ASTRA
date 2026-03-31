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
      <div className="absolute inset-0 bg-gradient-to-r from-[#2D1B69] via-[#4A2D8C] to-[#7C4DFF]" />

      {/* Orbes decorativos */}
      <div className="absolute right-0 top-0 h-32 w-32 rounded-full bg-[#B388FF]/20 blur-3xl pointer-events-none" />
      <div className="absolute -left-8 -bottom-8 h-28 w-28 rounded-full bg-fuchsia-500/15 blur-3xl pointer-events-none" />

      {/* Contenido */}
      <div className="relative flex items-center gap-4 px-5 py-4">
        {/* Icono grande con numero */}
        <div className="h-[52px] w-[52px] rounded-xl backdrop-blur-[21px] bg-white/[0.10] border border-white/[0.15] flex items-center justify-center shrink-0">
          {numeroPersonal ? (
            <span className="text-white font-[family-name:var(--font-inria)] text-[26px] font-light leading-none">
              {numeroPersonal}
            </span>
          ) : (
            <Icono nombre="numeral" tamaño={24} peso="bold" className="text-white" />
          )}
        </div>

        {/* Texto */}
        <div className="flex-1 min-w-0">
          <p className="text-white text-[16px] font-semibold leading-snug">
            {titulo}
          </p>
          <p className="text-white/50 text-[13px] leading-snug mt-0.5">
            {descripcionFinal}
          </p>
        </div>

        {mostrarAccion && (
          <div className="h-9 w-9 rounded-full bg-white/[0.10] border border-white/[0.10] flex items-center justify-center shrink-0 group-hover:bg-white/[0.20] transition-colors">
            <Icono nombre="flecha" tamaño={16} className="text-white" />
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
