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
    <div className="flex items-center gap-2 px-2.5 py-1 rounded-xl backdrop-blur-[21px] bg-white/[0.07] border border-white/[0.12]">
      <span className="flex items-center gap-1.5 text-white/90 text-[13px] font-medium w-[90px] shrink-0">
        <Icono nombre={icono} tamaño={14} peso="fill" className="text-white" />
        {etiqueta}
      </span>
      <div className="flex gap-[3px] flex-1">
        {Array.from({ length: segmentos }, (_, i) => (
          <div
            key={i}
            className={`h-2.5 flex-1 rounded-sm ${
              i < activos
                ? "bg-white shadow-[0_0_3.5px_#cc54ff40]"
                : "bg-[#3a2d5c]/[0.46]"
            }`}
          />
        ))}
      </div>
    </div>
  );
}

export function NivelesEnergia({ energia, claridad, fuerza }: NivelesEnergiaProps) {
  return (
    <PanelGlass className="flex flex-col gap-1 p-2 justify-center">
      <BarraSegmentos etiqueta="Intuición" valor={energia} icono="wifi" />
      <BarraSegmentos etiqueta="Claridad" valor={claridad} icono="ojo" />
      <BarraSegmentos etiqueta="Fuerza" valor={fuerza} icono="rayo" />
    </PanelGlass>
  );
}
