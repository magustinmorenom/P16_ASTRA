import { Icono, type NombreIcono } from "@/componentes/ui/icono";
import { IconoFaseLunar } from "@/componentes/ui/icono-fase-lunar";
import type { LunaInfoDTO, NumeroPersonalDTO } from "@/lib/tipos";
import { PanelGlass } from "./panel-glass";

interface ResumenPersonalUnificadoProps {
  numero: NumeroPersonalDTO;
  luna: LunaInfoDTO;
  energia: number;
  claridad: number;
  fuerza: number;
}

const ESTILO_CONTENEDOR = {
  background: "var(--shell-superficie)",
  borderColor: "var(--shell-borde)",
  boxShadow: "none",
  backdropFilter: "none",
} as const;

function BarraEscala({ valor }: { valor: number }) {
  const segmentos = 10;
  const activos = Math.min(Math.max(Math.round(valor), 0), segmentos);

  return (
    <div className="flex gap-[3px]">
      {Array.from({ length: segmentos }, (_, indice) => (
        <div
          key={indice}
          className={`h-1.5 flex-1 rounded-full ${
            indice < activos ? "bg-[var(--color-acento)]" : "bg-[var(--shell-chip)]"
          }`}
        />
      ))}
    </div>
  );
}

function FilaMetrica({
  etiqueta,
  valor,
  icono,
}: {
  etiqueta: string;
  valor: number;
  icono: NombreIcono;
}) {
  const valorRedondeado = Math.min(Math.max(Math.round(valor), 0), 10);

  return (
    <div className="grid grid-cols-[106px_minmax(0,1fr)_34px] items-center gap-3 px-4 py-3">
      <span className="flex items-center gap-1.5 text-[12px] font-medium text-[color:var(--shell-texto-secundario)]">
        <Icono nombre={icono} tamaño={13} peso="fill" className="text-[color:var(--color-acento)]" />
        {etiqueta}
      </span>
      <BarraEscala valor={valorRedondeado} />
      <span className="text-right text-[12px] font-semibold text-[color:var(--shell-texto)]">
        {valorRedondeado}
      </span>
    </div>
  );
}

export function ResumenPersonalUnificado({
  numero,
  luna,
  energia,
  claridad,
  fuerza,
}: ResumenPersonalUnificadoProps) {
  return (
    <PanelGlass
      tono="panel"
      className="flex w-full flex-col overflow-hidden rounded-[18px]"
      style={ESTILO_CONTENEDOR}
    >
      <div className="grid grid-cols-[54px_minmax(0,1fr)] gap-3 px-4 py-3.5">
        <span className="font-[family-name:var(--font-inria)] text-[34px] leading-none text-[color:var(--color-acento)]">
          {numero.numero}
        </span>
        <div className="min-w-0">
          <p className="text-[15px] font-semibold leading-tight text-[color:var(--shell-texto)]">
            Número del día
          </p>
          <p className="mt-1 text-[13px] leading-5 text-[color:var(--shell-texto-secundario)] line-clamp-2">
            {numero.descripcion}
          </p>
        </div>
      </div>

      <div className="border-t border-[var(--shell-borde)]" />

      <div className="grid grid-cols-[54px_minmax(0,1fr)] gap-3 px-4 py-3.5">
        <div className="flex items-start justify-center pt-0.5 text-[color:var(--color-acento)]">
          <IconoFaseLunar fase={luna.fase} tamaño={24} />
        </div>
        <div className="min-w-0">
          <p className="text-[15px] font-semibold leading-tight text-[color:var(--shell-texto)]">
            Luna en {luna.signo}
          </p>
          <p className="mt-1 text-[13px] leading-5 text-[color:var(--shell-texto-secundario)]">
            {luna.fase}
          </p>
        </div>
      </div>

      <div className="border-t border-[var(--shell-borde)]" />

      <div className="flex flex-col">
        <FilaMetrica etiqueta="Intuición" valor={fuerza} icono="wifi" />
        <div className="border-t border-[var(--shell-borde)]" />
        <FilaMetrica etiqueta="Claridad" valor={claridad} icono="ojo" />
        <div className="border-t border-[var(--shell-borde)]" />
        <FilaMetrica etiqueta="Energía" valor={energia} icono="rayo" />
      </div>
    </PanelGlass>
  );
}
