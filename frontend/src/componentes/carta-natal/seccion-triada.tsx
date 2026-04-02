"use client";

import { IconoSigno } from "@/componentes/ui/icono-astral";
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
  },
  {
    key: "luna" as const,
    label: "Luna",
    sublabel: "Emociones",
    gradiente: "from-[#4A2D8C] via-[#7C4DFF] to-[#B388FF]",
  },
  {
    key: "ascendente" as const,
    label: "Ascendente",
    sublabel: "Presencia",
    gradiente: "from-[#2D1B69] via-[#5C6BC0] to-[#8C9EFF]",
  },
];

export function SeccionTriada({ sol, luna, ascendente, onSeleccionar }: SeccionTriadaProps) {
  const items = [
    { config: TRIADA_CONFIG[0], signo: sol.signo, grado: sol.grado_en_signo, casa: sol.casa },
    { config: TRIADA_CONFIG[1], signo: luna.signo, grado: luna.grado_en_signo, casa: luna.casa },
    { config: TRIADA_CONFIG[2], signo: ascendente.signo, grado: ascendente.grado_en_signo, casa: null },
  ];

  return (
    <section className="divide-y divide-white/[0.06]">
      {items.map(({ config, signo, grado, casa }, idx) => {
          const elemento = ELEMENTO_SIGNO[signo] || "";
          return (
            <button
              key={config.key}
              onClick={() => onSeleccionar(config.key)}
              className={`group flex w-full items-center gap-3 px-3 py-3 text-left transition-all duration-200 ${
                idx === 0 ? "" : ""
              } hover:bg-white/[0.04]`}
            >
              <div
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-[16px] bg-gradient-to-br ${config.gradiente} text-white shadow-[0_12px_30px_rgba(26,10,54,0.32)] ring-1 ring-white/15`}
              >
                <IconoSigno signo={signo} tamaño={18} />
              </div>

              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-violet-200/66">
                  {config.sublabel}
                </p>
                <div className="mt-1 flex items-center gap-2">
                  <span className="text-[14px] font-semibold tracking-tight text-white">
                    {config.label}
                  </span>
                  <span className="text-[13px] text-white/30">·</span>
                  <span className="text-[14px] font-medium text-white/82">
                    {signo}
                  </span>
                </div>
                <p className="mt-1.5 text-[11px] text-white/52">
                  {grado.toFixed(1)}°{casa ? ` · Casa ${ROMANO[casa]}` : ""} · {elemento}
                </p>
              </div>

              <span className="text-white/26 transition-colors group-hover:text-white/52">
                <span className="text-base">›</span>
              </span>
            </button>
          );
        })}
    </section>
  );
}
