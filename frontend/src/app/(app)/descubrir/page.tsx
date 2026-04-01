"use client";

import Link from "next/link";
import { Icono, type NombreIcono } from "@/componentes/ui/icono";
import HeaderMobile from "@/componentes/layouts/header-mobile";

// ---------------------------------------------------------------------------
// Cards de descubrimiento
// ---------------------------------------------------------------------------
interface CardDescubrir {
  titulo: string;
  subtitulo: string;
  icono: NombreIcono;
  ruta: string;
  gradiente: string;
  iconoColor: string;
  proximamente?: boolean;
}

const cards: CardDescubrir[] = [
  {
    titulo: "Diseno Humano",
    subtitulo: "Tu mapa energetico y tipo de aura",
    icono: "hexagono",
    ruta: "/diseno-humano",
    gradiente: "from-[#D4A234] to-[#B8860B]",
    iconoColor: "text-white/70",
  },
  {
    titulo: "Numerologia",
    subtitulo: "Los numeros que definen tu camino",
    icono: "numeral",
    ruta: "/numerologia",
    gradiente: "from-[#7C4DFF] to-[#4A2D8C]",
    iconoColor: "text-white/70",
  },
  {
    titulo: "Calendario Cosmico",
    subtitulo: "Lectura diaria de tránsitos y ventanas clave",
    icono: "calendario",
    ruta: "/calendario-cosmico",
    gradiente: "from-[#4A2D8C] to-[#2D1B69]",
    iconoColor: "text-violet-300/70",
    proximamente: true,
  },
  {
    titulo: "Revolución Solar",
    subtitulo: "Tu mapa del nuevo ciclo solar anual",
    icono: "retornoSolar",
    ruta: "/retorno-solar",
    gradiente: "from-[#2D1B69] via-[#4A2D8C] to-[#7C4DFF]",
    iconoColor: "text-white/70",
    proximamente: true,
  },
  {
    titulo: "Transitos en Vivo",
    subtitulo: "Posiciones planetarias ahora mismo",
    icono: "planeta",
    ruta: "/transitos",
    gradiente: "from-[#2D1B69] to-[#0F0A1A]",
    iconoColor: "text-[#B388FF]/70",
  },
  {
    titulo: "Match de Pareja",
    subtitulo: "Compatibilidad cruzando las tres disciplinas",
    icono: "corazon",
    ruta: "/match-pareja",
    gradiente: "from-[#7C4DFF] via-[#C084FC] to-[#E879A8]",
    iconoColor: "text-white/70",
    proximamente: true,
  },
];

// ---------------------------------------------------------------------------
// Componente
// ---------------------------------------------------------------------------
export default function PaginaDescubrir() {
  return (
    <>
      <HeaderMobile titulo="Descubrir" />

      <div className="px-4 pt-2 pb-6">
        {/* Titulo de seccion */}
        <p className="text-sm text-[#8A8580] mb-5">
          Explora las herramientas de autoconocimiento cosmico
        </p>

        {/* Grid de cards */}
        <div className="grid grid-cols-2 gap-3">
          {cards.map((card, idx) => (
            <Link
              key={card.ruta}
              href={card.ruta}
              className={`touch-feedback block rounded-2xl overflow-hidden ${
                idx === cards.length - 1 ? "col-span-2" : ""
              }`}
            >
              <div
                className={`bg-gradient-to-br ${card.gradiente} p-4 ${
                  idx === cards.length - 1 ? "h-[100px]" : "h-[140px]"
                } flex flex-col justify-between relative`}
              >
                {/* Icono decorativo grande en fondo */}
                <div className="absolute -right-2 -bottom-2 opacity-[0.08]">
                  <Icono nombre={card.icono} tamaño={80} peso="fill" className="text-white" />
                </div>

                {/* Icono */}
                <div className="h-10 w-10 rounded-xl bg-white/15 flex items-center justify-center">
                  <Icono
                    nombre={card.icono}
                    tamaño={20}
                    peso="fill"
                    className={card.iconoColor}
                  />
                </div>

                {/* Texto */}
                <div>
                  <p className="text-white text-[15px] font-semibold leading-tight">
                    {card.titulo}
                  </p>
                  <p className="text-white/60 text-[11px] leading-snug mt-0.5">
                    {card.subtitulo}
                  </p>
                </div>

                {/* Flecha */}
                <div className="absolute right-3 top-4 flex items-center gap-2">
                  {card.proximamente && (
                    <span className="rounded-full border border-white/15 bg-black/15 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.14em] text-white/80 backdrop-blur-md">
                      Próximamente
                    </span>
                  )}
                  <Icono nombre="flecha" tamaño={16} className="text-white/30" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </>
  );
}
