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
    accent: "#D4A234",
    fondo: "bg-[#FFF8E8]",
    borde: "border-[#F0DFC0]",
    descripcion: "La parte de vos que quiere irradiar, crear dirección y sostener identidad.",
  },
  {
    key: "luna" as const,
    label: "Luna",
    sublabel: "Emociones",
    accent: "#9575CD",
    fondo: "bg-[#F7F1FF]",
    borde: "border-[#E4D7FB]",
    descripcion: "El clima interno que necesitás para sentir seguridad y procesar lo vivido.",
  },
  {
    key: "ascendente" as const,
    label: "Ascendente",
    sublabel: "Presencia",
    accent: "#5C6BC0",
    fondo: "bg-[#F3F6FF]",
    borde: "border-[#D9E2FF]",
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
    <section className="mb-8">
      <div className="mb-3">
        <div>
          <p className={`${ETIQUETA_CARTA} text-[#7C4DFF]`}>Tu tríada base</p>
          <h2 className="mt-1.5 text-[18px] font-semibold tracking-tight text-[#2C2926]">
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
              className={`${SUPERFICIE_CLARA_CARTA} w-full p-4 text-left transition-transform duration-200 hover:-translate-y-0.5`}
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p
                    className="text-[11px] font-semibold uppercase tracking-[0.16em]"
                    style={{ color: config.accent }}
                  >
                    {config.label}
                  </p>
                  <h3 className="mt-2 text-[18px] font-semibold tracking-tight text-[#2C2926]">
                    {signo}
                  </h3>
                  <p className="mt-2 text-[12px] leading-relaxed text-[#6F6A65]">
                    {config.descripcion}
                  </p>
                </div>

                <div
                  className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border ${config.borde} ${config.fondo}`}
                  style={{ color: config.accent }}
                >
                  <IconoSigno signo={signo} tamaño={24} />
                </div>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                <span
                  className={`rounded-full border ${config.borde} ${config.fondo} px-3 py-1 text-[11px] font-medium`}
                  style={{ color: config.accent }}
                >
                  {config.sublabel}
                </span>
                <span className="rounded-full border border-[#ECE4FA] bg-[#F8F4FF] px-3 py-1 text-[11px] font-medium text-[#5B5560]">
                  {grado.toFixed(1)}°
                  {casa ? ` · Casa ${ROMANO[casa]}` : ""}
                </span>
                <span className="rounded-full border border-[#ECE4FA] bg-white px-3 py-1 text-[11px] font-medium text-[#6F6A65]">
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
