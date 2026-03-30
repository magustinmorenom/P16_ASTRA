"use client";

import { PanelGlass } from "./panel-glass";
import { Icono } from "@/componentes/ui/icono";
import type { DiaSemanalDTO } from "@/lib/tipos";

const DIAS_SEMANA = ["DOM", "LUN", "MAR", "MIÉ", "JUE", "VIE", "SÁB"] as const;

function obtenerDiaSemana(fechaStr: string): string {
  const fecha = new Date(fechaStr + "T12:00:00");
  return DIAS_SEMANA[fecha.getDay()];
}

function obtenerDiaMes(fechaStr: string): number {
  return new Date(fechaStr + "T12:00:00").getDate();
}

interface SemanaV2Props {
  semana: DiaSemanalDTO[];
  onGenerarPodcastSemana: () => void;
  generandoPodcast: boolean;
}

export function SemanaV2({
  semana,
  onGenerarPodcastSemana,
  generandoPodcast,
}: SemanaV2Props) {
  const primero = semana[0];
  const ultimo = semana[semana.length - 1];
  const rangoTexto = primero && ultimo
    ? `${obtenerDiaMes(primero.fecha)} - ${obtenerDiaMes(ultimo.fecha)}`
    : "";

  return (
    <div className="flex flex-col gap-3">
      <h2 className="text-white text-[24px] font-normal">Tu semana...</h2>

      <div className="rounded-[10px] overflow-hidden bg-gradient-to-b from-[#361b34] to-[#7b45dc] p-2.5 flex flex-col gap-2.5">
        {/* Day cards row — scroll horizontal, cards angostas */}
        <div className="flex gap-2 overflow-x-auto pb-1 scroll-sutil-dark">
          {semana.map((dia) => {
            const diaSem = obtenerDiaSemana(dia.fecha);
            const diaMes = obtenerDiaMes(dia.fecha);
            const hoy = new Date().toISOString().split("T")[0] === dia.fecha;

            return (
              <PanelGlass
                key={dia.fecha}
                className={`flex items-start gap-2 p-2 w-[148px] min-w-[148px] shrink-0 ${
                  hoy ? "ring-1 ring-white/30" : ""
                }`}
              >
                {/* Date pill */}
                <div className="rounded-lg backdrop-blur-[21px] bg-white/[0.07] border border-white/[0.12] px-1.5 py-1.5 flex flex-col items-center justify-center gap-0.5 shrink-0 min-w-[36px]">
                  <span className="text-white/90 text-[10px] text-center leading-tight">
                    {diaSem}
                  </span>
                  <span className="text-[#f8f6ff] font-[family-name:var(--font-inria)] text-[20px] leading-none">
                    {diaMes}
                  </span>
                </div>
                {/* Frase — se quiebra en hasta 3 líneas */}
                <p className="text-white/90 text-[10px] leading-[1.4] flex-1 line-clamp-3">
                  {dia.frase_corta}
                </p>
              </PanelGlass>
            );
          })}
        </div>

        {/* Divider */}
        <div className="h-px bg-white/15" />

        {/* Acciones */}
        <div className="flex gap-2.5">
          {/* Generar podcast semanal */}
          <button
            onClick={onGenerarPodcastSemana}
            disabled={generandoPodcast}
            className="flex-1 rounded-2xl overflow-hidden relative"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-[#0f0826] via-[#1a0e3e] to-[#2d1b69]" />
            <div className="relative flex items-center gap-2 px-4 py-2.5">
              <span className="h-[33px] w-[36px] rounded-xl bg-white/10 border border-white/[0.08] flex items-center justify-center shrink-0">
                {generandoPodcast ? (
                  <div className="h-3 w-3 animate-spin rounded-full border-2 border-white border-t-transparent" />
                ) : (
                  <Icono nombre="destello" tamaño={16} peso="fill" className="text-white" />
                )}
              </span>
              <span className="text-[#f8f6ff]/60 text-[11px] font-medium tracking-[2px] text-center uppercase flex-1">
                Genera podcast de tu semana {rangoTexto}
              </span>
            </div>
          </button>

          {/* Ver siguiente semana */}
          <button className="rounded-2xl bg-black/20 flex items-center gap-2 px-5 py-2.5 shrink-0">
            <Icono nombre="flecha" tamaño={14} className="text-white" />
            <span className="text-white text-[14px]">Ver mi siguiente semana</span>
          </button>
        </div>
      </div>
    </div>
  );
}
