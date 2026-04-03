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
  const estiloBotonRueda = {
    borderColor: "var(--shell-chip-borde)",
    background: "var(--shell-chip)",
    color: "var(--shell-texto)",
  } as const;

  return (
    <section>
      <div className={`${SUPERFICIE_OSCURA_CARTA} px-5 py-5 sm:px-6 sm:py-6`}>
        <div
          className="absolute -right-10 top-[-48px] h-28 w-28 rounded-full blur-3xl"
          style={{ background: "var(--shell-glow-2)" }}
        />
        <div
          className="absolute bottom-[-48px] left-8 h-24 w-24 rounded-full blur-3xl"
          style={{ background: "var(--shell-glow-1)" }}
        />

        <div className="relative z-10">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
            <div className="min-w-0 flex-1">
              <div className="flex items-start gap-3">
                <div className="hidden h-11 w-11 shrink-0 items-center justify-center rounded-[16px] bg-gradient-to-br from-[#7C4DFF] via-[#9C6DFF] to-[#B388FF] shadow-[0_14px_32px_rgba(34,12,72,0.36)] sm:flex">
                  <IconoAstral nombre="astrologia" tamaño={22} className="text-white" />
                </div>

                <div className="min-w-0">
                  <h1 className="text-[18px] font-semibold tracking-[-0.04em] text-[color:var(--shell-texto)] sm:text-[22px]">
                    {primerNombre}, tu tríada base.
                  </h1>
                  <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-[13px]">
                    <div className="flex items-baseline gap-2">
                      <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[color:var(--shell-texto-tenue)]">
                        Sol
                      </span>
                      <span className="font-semibold text-[color:var(--shell-texto)]">{sol?.signo ?? "—"}</span>
                    </div>
                    <div className="hidden h-4 w-px sm:block" style={{ background: "var(--shell-hero-borde)" }} />
                    <div className="flex items-baseline gap-2">
                      <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[color:var(--shell-texto-tenue)]">
                        Luna
                      </span>
                      <span className="font-semibold text-[color:var(--shell-texto)]">{luna?.signo ?? "—"}</span>
                    </div>
                    <div className="hidden h-4 w-px sm:block" style={{ background: "var(--shell-hero-borde)" }} />
                    <div className="flex items-baseline gap-2">
                      <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[color:var(--shell-texto-tenue)]">
                        Asc
                      </span>
                      <span className="font-semibold text-[color:var(--shell-texto)]">{datos.ascendente.signo}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={onAbrirRueda}
              className="inline-flex items-center gap-2 self-start rounded-full border px-4 py-2 text-[12px] font-semibold transition-colors hover:text-[color:var(--shell-texto)]"
              style={estiloBotonRueda}
            >
              <Icono nombre="planeta" tamaño={18} peso="fill" />
              Rueda natal
            </button>
          </div>

          <p className="mt-3 max-w-3xl text-[12px] leading-5 text-[color:var(--shell-texto-secundario)]">
            Leé la tríada y abrí solo el punto técnico que necesites.
          </p>
        </div>
      </div>
    </section>
  );
}
