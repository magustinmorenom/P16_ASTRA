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
    <section className="divide-y divide-[var(--shell-borde)]">
      {items.map(({ config, signo, grado, casa }, idx) => {
          const elemento = ELEMENTO_SIGNO[signo] || "";
          return (
            <button
              key={config.key}
              onClick={() => onSeleccionar(config.key)}
              className={`group flex w-full items-center gap-3 px-3 py-3 text-left transition-all duration-200 ${
                idx === 0 ? "" : ""
              } hover:bg-[var(--shell-superficie-suave)]`}
            >
              <div
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-[16px] bg-gradient-to-br ${config.gradiente} text-white shadow-[0_12px_30px_rgba(26,10,54,0.32)] ring-1 ring-white/15`}
              >
                <IconoSigno signo={signo} tamaño={18} />
              </div>

              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[color:var(--shell-texto-tenue)]">
                  {config.sublabel}
                </p>
                <div className="mt-1 flex items-center gap-2">
                  <span className="text-[14px] font-semibold tracking-tight text-[color:var(--shell-texto)]">
                    {config.label}
                  </span>
                  <span className="text-[13px] text-[color:var(--shell-texto-tenue)]">·</span>
                  <span className="text-[14px] font-medium text-[color:var(--shell-texto-secundario)]">
                    {signo}
                  </span>
                </div>
                <p className="mt-1.5 text-[11px] text-[color:var(--shell-texto-tenue)]">
                  {grado.toFixed(1)}°{casa ? ` · Casa ${ROMANO[casa]}` : ""} · {elemento}
                </p>
              </div>

              <span className="text-[color:var(--shell-texto-tenue)] transition-colors group-hover:text-[color:var(--shell-texto-secundario)]">
                <span className="text-base">›</span>
              </span>
            </button>
          );
        })}
    </section>
  );
}
