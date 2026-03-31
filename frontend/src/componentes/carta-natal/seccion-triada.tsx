"use client";

import { IconoSigno } from "@/componentes/ui/icono-astral";
import { ETIQUETA_CARTA, SUPERFICIE_CLARA_CARTA } from "@/componentes/carta-natal/estilos";
import { ROMANO, ELEMENTO_SIGNO } from "@/lib/utilidades/interpretaciones-natal";
import type { Planeta, PuntoSensible } from "@/lib/tipos";

interface SeccionTriadaProps {
  sol: Planeta;
  luna: Planeta;
  ascendente: PuntoSensible;
  onSeleccionar: (tipo: "sol" | "luna" | "ascendente") => void;
}

const TRIADA_CONFIG = [
  {
    key: "sol" as const,
    label: "Sol",
    sublabel: "Esencia",
    gradiente: "from-[#7C4DFF] via-[#9C6DFF] to-[#B388FF]",
    descripcion: "La parte de vos que quiere irradiar, crear dirección y sostener identidad.",
  },
  {
    key: "luna" as const,
    label: "Luna",
    sublabel: "Emociones",
    gradiente: "from-[#4A2D8C] via-[#7C4DFF] to-[#B388FF]",
    descripcion: "El clima interno que necesitás para sentir seguridad y procesar lo vivido.",
  },
  {
    key: "ascendente" as const,
    label: "Ascendente",
    sublabel: "Presencia",
    gradiente: "from-[#2D1B69] via-[#5C6BC0] to-[#8C9EFF]",
    descripcion: "La entrada a tu carta: cómo abrís campo, interpretás y empezás a moverte.",
  },
];

export function SeccionTriada({ sol, luna, ascendente, onSeleccionar }: SeccionTriadaProps) {
  const items = [
    { config: TRIADA_CONFIG[0], signo: sol.signo, grado: sol.grado_en_signo, casa: sol.casa },
    { config: TRIADA_CONFIG[1], signo: luna.signo, grado: luna.grado_en_signo, casa: luna.casa },
    { config: TRIADA_CONFIG[2], signo: ascendente.signo, grado: ascendente.grado_en_signo, casa: null },
  ];

  return (
    <section className="mb-7">
      <div className="mb-3">
        <div>
          <p className={`${ETIQUETA_CARTA} text-violet-200/72`}>Tu tríada base</p>
          <h2 className="mt-1.5 text-[18px] font-semibold tracking-tight text-white">
            Sol, Luna y Ascendente
          </h2>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        {items.map(({ config, signo, grado, casa }) => {
          const elemento = ELEMENTO_SIGNO[signo] || "";
          return (
            <button
              key={config.key}
              onClick={() => onSeleccionar(config.key)}
              className={`${SUPERFICIE_CLARA_CARTA} w-full p-3.5 text-left transition-all duration-200 hover:-translate-y-0.5 hover:border-white/15`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-violet-200/72">
                    {config.label}
                  </p>
                  <h3 className="mt-1.5 text-[17px] font-semibold tracking-tight text-white">
                    {signo}
                  </h3>
                  <p className="mt-1 text-[12px] text-white/56">
                    {config.sublabel}
                  </p>
                </div>

                <div
                  className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br ${config.gradiente} text-white shadow-[0_12px_30px_rgba(26,10,54,0.35)] ring-1 ring-white/15`}
                >
                  <IconoSigno signo={signo} tamaño={20} />
                </div>
              </div>

              <div className="mt-3 flex flex-wrap gap-2">
                <span className="rounded-full border border-white/10 bg-white/[0.08] px-2.5 py-1 text-[11px] font-medium text-white/78">
                  {grado.toFixed(1)}°
                  {casa ? ` · Casa ${ROMANO[casa]}` : ""}
                </span>
                <span className="rounded-full border border-white/10 bg-white/[0.06] px-2.5 py-1 text-[11px] font-medium text-white/64">
                  {elemento}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}
