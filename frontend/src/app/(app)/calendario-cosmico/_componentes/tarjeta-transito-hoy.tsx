"use client";

import { IconoSigno } from "@/componentes/ui/icono-astral";
import { Esqueleto } from "@/componentes/ui/esqueleto";
import type { TransitosDia } from "@/lib/tipos";

function formatearGrado(grado: number): string {
  const entero = Math.floor(grado);
  const minutos = Math.floor((grado - entero) * 60);
  return `${entero}°${minutos.toString().padStart(2, "0")}'`;
}

export function TarjetaTransitoHoy({
  datos,
  cargando,
}: {
  datos: TransitosDia | undefined;
  cargando: boolean;
}) {
  if (cargando) {
    return (
      <div className="rounded-[20px] bg-gradient-to-b from-violet-950 via-violet-800 to-violet-500 p-5">
        <Esqueleto className="h-5 w-36 bg-white/20 mb-4" />
        <div className="flex flex-wrap gap-2">
          {Array.from({ length: 11 }).map((_, i) => (
            <Esqueleto key={i} className="h-[52px] w-[100px] rounded-xl bg-white/10" />
          ))}
        </div>
      </div>
    );
  }

  if (!datos) return null;

  return (
    <div className="rounded-[20px] bg-gradient-to-b from-violet-950 via-violet-800 to-violet-500 p-5">
      <p className="text-violet-300 text-[11px] font-semibold tracking-widest uppercase mb-3">
        Tránsitos de Hoy
      </p>

      <div className="flex flex-wrap gap-2">
        {datos.planetas.map((planeta) => (
          <div
            key={planeta.nombre}
            className="flex items-center gap-2 rounded-xl bg-white/[0.08] px-3 py-2"
          >
            <IconoSigno
              signo={planeta.signo}
              tamaño={18}
              className="text-violet-300"
            />
            <div className="flex flex-col">
              <span className="text-[12px] font-semibold text-white leading-tight">
                {planeta.nombre}
              </span>
              <span className="text-[10px] text-violet-300 leading-tight">
                {planeta.signo} {formatearGrado(planeta.grado_en_signo)}
              </span>
            </div>
            {planeta.retrogrado && (
              <span className="text-[11px] text-red-300 font-bold ml-0.5">R</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
