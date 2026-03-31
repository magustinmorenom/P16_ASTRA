"use client";

import { Icono } from "@/componentes/ui/icono";
import { IconoAstral } from "@/componentes/ui/icono-astral";
import {
  ETIQUETA_CARTA,
  SUPERFICIE_CLARA_CARTA,
  SUPERFICIE_OSCURA_CARTA,
} from "@/componentes/carta-natal/estilos";
import { generarEsencia } from "@/lib/utilidades/interpretaciones-natal";
import type { CartaNatal } from "@/lib/tipos";

interface HeroCartaProps {
  datos: CartaNatal;
  onAbrirRueda: () => void;
  onNuevoCalculo?: () => void;
}

export function HeroCarta({
  datos,
  onAbrirRueda,
  onNuevoCalculo,
}: HeroCartaProps) {
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
    <section className="mb-6 lg:mb-7">
      <div className={`${SUPERFICIE_OSCURA_CARTA} p-5 lg:p-6`}>
        <div className="absolute -right-10 top-6 h-32 w-32 rounded-full bg-[#B388FF]/14 blur-3xl" />
        <div className="absolute left-0 top-8 h-24 w-24 rounded-full bg-[#7C4DFF]/12 blur-3xl" />

        <div className="relative z-10 grid gap-5 xl:grid-cols-[1.2fr_0.8fr] xl:items-start">
          <div>
            <p className={`${ETIQUETA_CARTA} text-violet-200/72`}>
              Lectura natal
            </p>

            <div className="mt-3 flex items-start gap-3">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-white/12 bg-white/[0.08] text-[#D4A234] backdrop-blur-xl">
                <IconoAstral nombre="astrologia" tamaño={24} />
              </div>

              <div className="min-w-0">
                <h1 className="text-[26px] font-semibold tracking-[-0.02em] text-white lg:text-[30px]">
                  Carta Astral
                </h1>
                <p className="mt-1 text-[13px] leading-relaxed text-violet-100/66">
                  {datos.nombre} · {datos.fecha_nacimiento} · {datos.ciudad}, {datos.pais}
                </p>
              </div>
            </div>

            <p className="mt-4 max-w-2xl text-[14px] leading-relaxed text-violet-100/74">
              Una lectura más sobria y útil: empezá por la tríada, seguí por los
              planetas que más pesan y abrí la rueda sólo cuando quieras mirar el mapa completo.
            </p>

            {esencia && (
              <p className="mt-3 text-[14px] font-medium italic text-[#F4E7C3]">
                &ldquo;{esencia}&rdquo;
              </p>
            )}

            <div className="mt-4 flex flex-wrap gap-2">
              {resumen.map((item) => (
                <div
                  key={item.etiqueta}
                  className="rounded-full border border-white/10 bg-white/[0.08] px-3 py-1.5 backdrop-blur-md"
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

            <div className="mt-5 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={onAbrirRueda}
                className="inline-flex items-center gap-2 rounded-full border border-white/14 bg-white/[0.08] px-4 py-2 text-[13px] font-medium text-white transition-colors hover:bg-white/[0.14]"
              >
                <Icono nombre="ojo" tamaño={16} />
                Ver rueda natal
              </button>

              {onNuevoCalculo && (
                <button
                  type="button"
                  onClick={onNuevoCalculo}
                  className="inline-flex items-center rounded-full border border-white/10 bg-transparent px-4 py-2 text-[13px] font-medium text-violet-100/74 transition-colors hover:bg-white/[0.06] hover:text-white"
                >
                  Nuevo cálculo
                </button>
              )}
            </div>
          </div>

          <div className={`${SUPERFICIE_CLARA_CARTA} p-4`}>
            <p className={`${ETIQUETA_CARTA} text-[#7C4DFF]`}>
              Vista inicial
            </p>
            <h2 className="mt-2 text-[17px] font-semibold tracking-tight text-[#2C2926]">
              Lo importante primero
            </h2>

            <div className="mt-4 grid gap-2.5">
              {[
                {
                  titulo: "Tríada",
                  detalle: "Tu tono central: identidad, emoción y presencia.",
                },
                {
                  titulo: "Planetas",
                  detalle: "Dónde se concentra el peso simbólico de la carta.",
                },
                {
                  titulo: "Aspectos y casas",
                  detalle: "Cómo se relacionan las energías y en qué escenarios se juegan.",
                },
              ].map((item) => (
                <div
                  key={item.titulo}
                  className="rounded-[20px] border border-[#E9E1F7] bg-white/88 px-4 py-3"
                >
                  <p className="text-[13px] font-semibold text-[#2C2926]">
                    {item.titulo}
                  </p>
                  <p className="mt-1 text-[12px] leading-relaxed text-[#6F6A65]">
                    {item.detalle}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
