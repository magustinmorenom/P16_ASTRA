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
    accent: "#D4A234",
    bgFrom: "from-amber-50",
    bgTo: "to-amber-100/30",
    border: "border-amber-200/60",
  },
  {
    key: "luna" as const,
    label: "Luna",
    sublabel: "Emociones",
    accent: "#9575CD",
    bgFrom: "from-violet-50",
    bgTo: "to-violet-100/30",
    border: "border-violet-200/60",
  },
  {
    key: "ascendente" as const,
    label: "Ascendente",
    sublabel: "Máscara",
    accent: "#5C6BC0",
    bgFrom: "from-indigo-50",
    bgTo: "to-indigo-100/30",
    border: "border-indigo-200/60",
  },
];

export function SeccionTriada({ sol, luna, ascendente, onSeleccionar }: SeccionTriadaProps) {
  const items = [
    { config: TRIADA_CONFIG[0], signo: sol.signo, grado: sol.grado_en_signo, casa: sol.casa },
    { config: TRIADA_CONFIG[1], signo: luna.signo, grado: luna.grado_en_signo, casa: luna.casa },
    { config: TRIADA_CONFIG[2], signo: ascendente.signo, grado: ascendente.grado_en_signo, casa: null },
  ];

  return (
    <section className="mb-8">
      <h2 className="text-[15px] font-semibold text-[#2C2926] mb-3">La Tríada Principal</h2>
      <div className="grid grid-cols-3 gap-3">
        {items.map(({ config, signo, grado, casa }) => {
          const elemento = ELEMENTO_SIGNO[signo] || "";
          return (
            <button
              key={config.key}
              onClick={() => onSeleccionar(config.key)}
              className={`
                bg-gradient-to-b ${config.bgFrom} ${config.bgTo}
                border ${config.border} rounded-2xl p-4 text-center
                hover:shadow-md transition-shadow cursor-pointer
              `}
            >
              <div className="flex justify-center mb-2">
                <div
                  className="h-12 w-12 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: `${config.accent}20`, border: `2px solid ${config.accent}`, color: config.accent }}
                >
                  <IconoSigno signo={signo} tamaño={24} />
                </div>
              </div>
              <p className="text-[11px] font-medium uppercase tracking-wider" style={{ color: config.accent }}>
                {config.label}
              </p>
              <p className="text-[15px] font-bold text-[#2C2926] mt-0.5">{signo}</p>
              <p className="text-[12px] text-[#8A8580] mt-0.5">
                {grado.toFixed(1)}°{casa ? ` · Casa ${ROMANO[casa]}` : ""}
              </p>
              <p className="text-[11px] text-[#B3ADA7] mt-1">{elemento} · {config.sublabel}</p>
            </button>
          );
        })}
      </div>
    </section>
  );
}
