import { PanelGlass } from "./panel-glass";
import { Icono, type NombreIcono } from "@/componentes/ui/icono";

interface NivelesEnergiaProps {
  energia: number;
  claridad: number;
  fuerza: number;
}

function BarraSegmentos({ etiqueta, valor, icono }: { etiqueta: string; valor: number; icono: NombreIcono }) {
  const segmentos = 10;
  const activos = Math.min(Math.max(Math.round(valor), 0), segmentos);

  return (
    <div
      className="flex items-center gap-2 rounded-[10px] border px-2.5 py-1 backdrop-blur-[21px]"
      style={{
        background: "rgba(255, 255, 255, 0.08)",
        borderColor: "rgba(255, 255, 255, 0.12)",
      }}
    >
      <span className="flex w-[84px] shrink-0 items-center gap-1.5 text-[12px] font-medium text-[color:var(--shell-hero-texto-secundario)]">
        <Icono nombre={icono} tamaño={14} peso="fill" className="text-[color:var(--shell-hero-texto)]" />
        {etiqueta}
      </span>
      <div className="flex gap-[3px] flex-1">
        {Array.from({ length: segmentos }, (_, i) => (
          <div
            key={i}
            className={`h-2 flex-1 rounded-sm ${
              i < activos
                ? "bg-white shadow-[0_0_3.5px_rgba(204,84,255,0.25)]"
                : "bg-white/16"
            }`}
          />
        ))}
      </div>
    </div>
  );
}

export function NivelesEnergia({ energia, claridad, fuerza }: NivelesEnergiaProps) {
  return (
    <PanelGlass tono="hero" className="flex flex-col justify-center gap-1 p-2">
      <BarraSegmentos etiqueta="Intuición" valor={energia} icono="wifi" />
      <BarraSegmentos etiqueta="Claridad" valor={claridad} icono="ojo" />
      <BarraSegmentos etiqueta="Fuerza" valor={fuerza} icono="rayo" />
    </PanelGlass>
  );
}
