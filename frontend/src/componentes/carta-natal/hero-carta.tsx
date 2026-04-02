"use client";

import { Icono } from "@/componentes/ui/icono";
import { IconoAstral } from "@/componentes/ui/icono-astral";
import { SUPERFICIE_OSCURA_CARTA } from "@/componentes/carta-natal/estilos";
import type { CartaNatal } from "@/lib/tipos";

interface HeroCartaProps {
  datos: CartaNatal;
  onAbrirRueda: () => void;
}

export function HeroCarta({ datos, onAbrirRueda }: HeroCartaProps) {
  const sol = datos.planetas.find((planeta) => planeta.nombre === "Sol");
  const luna = datos.planetas.find((planeta) => planeta.nombre === "Luna");
  const primerNombre = datos.nombre.trim().split(/\s+/)[0] || "Tu carta";

  return (
    <section>
      <div className={`${SUPERFICIE_OSCURA_CARTA} px-5 py-5 sm:px-6 sm:py-6`}>
        <div className="absolute -right-10 top-[-48px] h-28 w-28 rounded-full bg-[#B388FF]/14 blur-3xl" />
        <div className="absolute bottom-[-48px] left-8 h-24 w-24 rounded-full bg-[#7C4DFF]/12 blur-3xl" />

        <div className="relative z-10">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
            <div className="min-w-0 flex-1">
              <div className="flex items-start gap-3">
                <div className="hidden h-12 w-12 shrink-0 items-center justify-center rounded-[18px] bg-gradient-to-br from-[#7C4DFF] via-[#9C6DFF] to-[#B388FF] shadow-[0_14px_32px_rgba(34,12,72,0.36)] sm:flex">
                  <IconoAstral nombre="astrologia" tamaño={22} className="text-white" />
                </div>

                <div className="min-w-0">
                  <h1 className="text-[20px] font-semibold tracking-[-0.04em] text-white sm:text-[24px]">
                    {primerNombre}, tu tríada base.
                  </h1>
                  <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-[13px]">
                    <div className="flex items-baseline gap-2">
                      <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-violet-200/56">
                        Sol
                      </span>
                      <span className="font-semibold text-white">{sol?.signo ?? "—"}</span>
                    </div>
                    <div className="hidden h-4 w-px bg-white/10 sm:block" />
                    <div className="flex items-baseline gap-2">
                      <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-violet-200/56">
                        Luna
                      </span>
                      <span className="font-semibold text-white">{luna?.signo ?? "—"}</span>
                    </div>
                    <div className="hidden h-4 w-px bg-white/10 sm:block" />
                    <div className="flex items-baseline gap-2">
                      <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-violet-200/56">
                        Asc
                      </span>
                      <span className="font-semibold text-white">{datos.ascendente.signo}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={onAbrirRueda}
              className="inline-flex items-center gap-2 self-start rounded-full border border-[#B388FF]/55 bg-gradient-to-r from-[#6C2BFF]/62 via-[#7C4DFF]/52 to-[#B388FF]/38 px-4 py-2 text-[12px] font-semibold text-white transition-all hover:border-[#D9C2FF]/70 hover:from-[#7C4DFF]/78 hover:via-[#8F63FF]/68 hover:to-[#B388FF]/48 hover:shadow-[0_10px_28px_rgba(124,77,255,0.32)]"
            >
              <Icono nombre="planeta" tamaño={18} peso="fill" />
              Rueda natal
            </button>
          </div>

          <p className="mt-4 max-w-3xl text-[12px] leading-6 text-white/54">
            Leé la tríada y abrí sólo el punto técnico que necesites.
          </p>
        </div>
      </div>
    </section>
  );
}
