"use client";

import { Icono } from "@/componentes/ui/icono";
import { IconoAstral } from "@/componentes/ui/icono-astral";
import {
  ETIQUETA_CARTA,
  SUPERFICIE_OSCURA_CARTA,
} from "@/componentes/carta-natal/estilos";
import { generarEsencia } from "@/lib/utilidades/interpretaciones-natal";
import type { CartaNatal } from "@/lib/tipos";

interface HeroCartaProps {
  datos: CartaNatal;
  onAbrirRueda: () => void;
}

export function HeroCarta({ datos, onAbrirRueda }: HeroCartaProps) {
  const sol = datos.planetas.find((planeta) => planeta.nombre === "Sol");
  const luna = datos.planetas.find((planeta) => planeta.nombre === "Luna");
  const esencia =
    sol && luna
      ? generarEsencia(sol.signo, luna.signo, datos.ascendente.signo)
      : null;

  const resumen = [
    { etiqueta: "Sol", valor: sol?.signo ?? "—" },
    { etiqueta: "Luna", valor: luna?.signo ?? "—" },
    { etiqueta: "Asc", valor: datos.ascendente.signo },
  ];

  return (
    <section className="mb-5 lg:mb-6">
      <div className={`${SUPERFICIE_OSCURA_CARTA} px-5 py-4 sm:px-6 sm:py-4`}>
        <div className="absolute -right-10 top-[-48px] h-28 w-28 rounded-full bg-[#B388FF]/14 blur-3xl" />
        <div className="absolute bottom-[-48px] left-8 h-24 w-24 rounded-full bg-[#7C4DFF]/12 blur-3xl" />

        <div className="relative z-10">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
            <div className="min-w-0 flex-1">
              <p className={`${ETIQUETA_CARTA} text-violet-200/72`}>
                Lectura natal
              </p>

              <div className="mt-3 flex items-start gap-3">
                <div className="hidden h-12 w-12 shrink-0 items-center justify-center rounded-[18px] bg-gradient-to-br from-[#7C4DFF] via-[#9C6DFF] to-[#B388FF] shadow-[0_14px_32px_rgba(34,12,72,0.36)] sm:flex">
                  <IconoAstral nombre="astrologia" tamaño={24} className="text-white" />
                </div>

                <div className="min-w-0">
                  <h1 className="text-[24px] font-semibold tracking-[-0.04em] text-white sm:text-[28px]">
                    Carta Astral
                  </h1>
                  <p className="mt-1 text-[11px] uppercase tracking-[0.16em] text-white/46 sm:text-[12px]">
                    {datos.nombre} · {datos.fecha_nacimiento} · {datos.ciudad}, {datos.pais}
                  </p>

                  {esencia ? (
                    <p className="mt-3 max-w-3xl text-[14px] leading-6 text-white/74">
                      {esencia}.
                    </p>
                  ) : null}
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={onAbrirRueda}
              className="inline-flex items-center gap-2 self-start rounded-full border border-white/10 bg-white/[0.08] px-4 py-2 text-sm font-medium text-white/82 transition-colors hover:bg-white/[0.14]"
            >
              <Icono nombre="ojo" tamaño={16} />
              Ver rueda natal
            </button>
          </div>

          <div className="mt-4 flex flex-wrap gap-2.5">
            {resumen.map((item) => (
              <div
                key={item.etiqueta}
                className="rounded-full border border-white/10 bg-white/[0.08] px-3.5 py-1.5 backdrop-blur-md"
              >
                <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-violet-200/70">
                  {item.etiqueta}
                </span>
                <span className="ml-2 text-[13px] font-medium text-white">
                  {item.valor}
                </span>
              </div>
            ))}
          </div>

          <p className="mt-3 max-w-3xl text-[13px] leading-6 text-white/58">
            Tocá la tríada, los planetas, los aspectos o las casas para ampliar su lectura en el panel derecho.
          </p>
        </div>
      </div>
    </section>
  );
}
