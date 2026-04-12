"use client";

import { Icono, type NombreIcono } from "@/componentes/ui/icono";
import { IconoFaseLunar } from "@/componentes/ui/icono-fase-lunar";
import { BarraEnergia } from "./barra-energia";
import type { ClimaCosmicoDTO, LunaInfoDTO, NumeroPersonalDTO } from "@/lib/tipos";

interface HeroClimaProps {
  clima: ClimaCosmicoDTO;
  luna: LunaInfoDTO;
  numeroPersonal: NumeroPersonalDTO;
}

const CLIMA_CONFIG: Record<
  string,
  { icono: NombreIcono; etiqueta: string }
> = {
  despejado: { icono: "sol", etiqueta: "Despejado" },
  soleado: { icono: "sol", etiqueta: "Excelente" },
  nublado: { icono: "luna", etiqueta: "Mixto" },
  tormenta: { icono: "rayo", etiqueta: "Intenso" },
  arcoiris: { icono: "estrellaFugaz", etiqueta: "Transformador" },
};

export function HeroClima({ clima, luna, numeroPersonal }: HeroClimaProps) {
  const config = CLIMA_CONFIG[clima.estado] ?? CLIMA_CONFIG.nublado;

  return (
    <div className="rounded-2xl relative overflow-hidden" style={{ minHeight: 240 }}>
      {/* Fondo degradado profundo */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#0f0826] via-[#1a0e3e] to-[#2D1B69]" />

      {/* Orbes decorativos de luz */}
      <div className="absolute -right-8 -top-8 h-44 w-44 rounded-full bg-violet-500/30 blur-3xl" />
      <div className="absolute left-1/4 -bottom-10 h-36 w-36 rounded-full bg-fuchsia-500/20 blur-3xl" />
      <div className="absolute right-1/3 top-1/2 h-20 w-20 rounded-full bg-violet-400/15 blur-2xl" />

      {/* Panel glass interior */}
      <div className="relative z-10 m-3 rounded-xl bg-white/[0.07] backdrop-blur-xl border border-white/[0.12] p-4 sm:p-5">
        {/* Tag de estado + etiqueta */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-white/[0.1] backdrop-blur-md flex items-center justify-center border border-white/[0.08]">
              <Icono nombre={config.icono} tamaño={20} peso="fill" className="text-violet-300" />
            </div>
            <div>
              <p className="text-[15px] font-semibold text-white leading-none">
                {clima.titulo}
              </p>
              <p className="text-[11px] text-violet-300/60 mt-0.5 uppercase tracking-wider font-medium">
                Clima Cósmico
              </p>
            </div>
          </div>
          <span className="px-3 py-1.5 rounded-full text-[11px] font-bold bg-white/[0.1] backdrop-blur-md text-violet-200 border border-white/[0.1]">
            {config.etiqueta}
          </span>
        </div>

        {/* Frase síntesis */}
        <p className="text-[16px] sm:text-[17px] text-white/90 leading-relaxed mb-4">
          {clima.frase_sintesis}
        </p>

        {/* Barras de energía */}
        <div className="flex flex-col gap-2 mb-4">
          <BarraEnergia etiqueta="Energía" valor={clima.energia} />
          <BarraEnergia etiqueta="Claridad" valor={clima.claridad} />
          <BarraEnergia etiqueta="Intuición" valor={clima.intuicion ?? (clima as any).conexion ?? 5} />
        </div>

        {/* Footer: Luna + Número personal */}
        <div className="flex items-center gap-3 pt-3 border-t border-white/[0.08]">
          <span className="flex items-center gap-1.5 text-[12px] text-violet-200/70">
            <IconoFaseLunar fase={luna.fase} tamaño={16} />
            {luna.fase} en {luna.signo}
          </span>
          <span className="h-3.5 w-px bg-white/10" />
          <span className="flex items-center gap-1.5 text-[12px] text-violet-200/70">
            <Icono nombre="numeral" tamaño={13} peso="bold" className="text-violet-300/60" />
            Día personal {numeroPersonal.numero}
          </span>
        </div>
      </div>
    </div>
  );
}
