import { PanelGlass } from "./panel-glass";

interface NivelesEnergiaProps {
  energia: number;
  claridad: number;
  fuerza: number;
}

function BarraSegmentos({ etiqueta, valor }: { etiqueta: string; valor: number }) {
  const segmentos = 10;
  const activos = Math.min(Math.max(Math.round(valor), 0), segmentos);

  return (
    <div className="flex items-center gap-2 px-2.5 py-1 rounded-xl backdrop-blur-[21px] bg-white/[0.07] border border-white/[0.12]">
      <span className="text-white/90 text-[10px] w-[58px] text-center shrink-0">
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
      <BarraSegmentos etiqueta="Intuición" valor={energia} />
      <BarraSegmentos etiqueta="Claridad" valor={claridad} />
      <BarraSegmentos etiqueta="Fuerza" valor={fuerza} />
    </PanelGlass>
  );
}
