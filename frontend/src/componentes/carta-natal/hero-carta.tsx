"use client";

import RuedaZodiacal from "@/componentes/visualizaciones/rueda-zodiacal";
import { IconoAstral } from "@/componentes/ui/icono-astral";
import { generarEsencia } from "@/lib/utilidades/interpretaciones-natal";
import type { CartaNatal, Planeta } from "@/lib/tipos";

interface HeroCartaProps {
  datos: CartaNatal;
  onPlanetaClick: (p: Planeta) => void;
}

export function HeroCarta({ datos, onPlanetaClick }: HeroCartaProps) {
  const sol = datos.planetas.find((p) => p.nombre === "Sol");
  const luna = datos.planetas.find((p) => p.nombre === "Luna");
  const esencia =
    sol && luna
      ? generarEsencia(sol.signo, luna.signo, datos.ascendente.signo)
      : null;

  return (
    <section className="mb-8">
      {/* Rueda natal */}
      <div className="bg-white rounded-2xl p-4 lg:p-6 mb-5 max-w-[640px] mx-auto">
        <RuedaZodiacal
          planetas={datos.planetas}
          casas={datos.casas}
          aspectos={datos.aspectos}
          claro
          onPlanetaClick={onPlanetaClick}
        />
      </div>

      {/* Identidad */}
      <div className="text-center">
        <div className="flex items-center justify-center gap-2 mb-2">
          <IconoAstral nombre="astrologia" tamaño={22} className="text-[#7C4DFF]" />
          <h1 className="text-[22px] font-bold text-[#2C2926] tracking-tight">
            Carta Natal de {datos.nombre}
          </h1>
        </div>
        <p className="text-[13px] text-[#8A8580]">
          {datos.fecha_nacimiento} · {datos.hora_nacimiento} · {datos.ciudad}, {datos.pais}
        </p>
        {esencia && (
          <p className="mt-2 text-[14px] font-medium text-[#7C4DFF] italic">
            &ldquo;{esencia}&rdquo;
          </p>
        )}
      </div>
    </section>
  );
}
