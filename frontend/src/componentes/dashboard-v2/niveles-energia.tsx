import { PanelGlass } from "./panel-glass";
import { Icono, type NombreIcono } from "@/componentes/ui/icono";

interface NivelesEnergiaProps {
  energia: number;
  claridad: number;
  fuerza: number;
  compacto?: boolean;
}

const ESTILO_TARJETA_NIVELES = {
  background: "var(--shell-superficie)",
  borderColor: "var(--shell-borde)",
  boxShadow: "none",
  backdropFilter: "none",
} as const;

const ESTILO_BARRA_NIVEL = {
  background: "var(--shell-superficie-fuerte)",
  borderColor: "var(--shell-borde)",
} as const;

function BarraSegmentos({ etiqueta, valor, icono }: { etiqueta: string; valor: number; icono: NombreIcono }) {
  const segmentos = 10;
  const activos = Math.min(Math.max(Math.round(valor), 0), segmentos);

  return (
    <div
      className="grid grid-cols-[92px_minmax(0,1fr)_38px] items-center gap-2 rounded-[12px] border px-3 py-2"
      style={ESTILO_BARRA_NIVEL}
    >
      <span className="flex shrink-0 items-center gap-1.5 text-[12px] font-medium text-[color:var(--shell-texto-secundario)]">
        <Icono nombre={icono} tamaño={14} peso="fill" className="text-[color:var(--color-acento)]" />
        {etiqueta}
      </span>
      <div className="flex gap-[3px]">
        {Array.from({ length: segmentos }, (_, i) => (
          <div
            key={i}
            className={`h-2 flex-1 rounded-sm ${
              i < activos
                ? "bg-[var(--color-acento)]"
                : "bg-[var(--shell-chip)]"
            }`}
          />
        ))}
      </div>
      <span className="text-right text-[12px] font-semibold text-[color:var(--shell-texto)]">
        {activos}/10
      </span>
    </div>
  );
}

export function NivelesEnergia({
  energia,
  claridad,
  fuerza,
  compacto = false,
}: NivelesEnergiaProps) {
  if (compacto) {
    return (
      <PanelGlass
        tono="panel"
        className="flex items-center justify-between gap-1 px-3 py-2"
        style={ESTILO_TARJETA_NIVELES}
      >
        {([
          { etiqueta: "Intuición", valor: fuerza, icono: "wifi" as const },
          { etiqueta: "Claridad", valor: claridad, icono: "ojo" as const },
          { etiqueta: "Energía", valor: energia, icono: "rayo" as const },
        ]).map((item) => (
          <div key={item.etiqueta} className="flex items-center gap-1.5">
            <Icono nombre={item.icono} tamaño={12} peso="fill" className="text-[color:var(--color-acento)]" />
            <span className="text-[11px] text-[color:var(--shell-texto-tenue)]">{item.etiqueta.slice(0, 3)}</span>
            <span className="text-[12px] font-semibold text-[color:var(--shell-texto)]">{Math.round(item.valor)}</span>
          </div>
        ))}
      </PanelGlass>
    );
  }

  return (
    <PanelGlass
      tono="panel"
      className="flex flex-col justify-center gap-2 p-2.5"
      style={ESTILO_TARJETA_NIVELES}
    >
      <BarraSegmentos etiqueta="Intuición" valor={fuerza} icono="wifi" />
      <BarraSegmentos etiqueta="Claridad" valor={claridad} icono="ojo" />
      <BarraSegmentos etiqueta="Energía" valor={energia} icono="rayo" />
    </PanelGlass>
  );
}
