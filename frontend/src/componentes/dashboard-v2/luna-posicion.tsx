import { PanelGlass } from "./panel-glass";
import { IconoFaseLunar } from "@/componentes/ui/icono-fase-lunar";
import type { LunaInfoDTO } from "@/lib/tipos";

interface LunaPosicionProps {
  luna: LunaInfoDTO;
  compacto?: boolean;
}

const ESTILO_TARJETA_LUNA = {
  background: "rgba(255, 255, 255, 0.82)",
  borderColor: "var(--shell-borde)",
  boxShadow: "0 8px 18px rgba(93, 53, 167, 0.05)",
  backdropFilter: "none",
} as const;

export function LunaPosicion({ luna, compacto = false }: LunaPosicionProps) {
  if (compacto) {
    return (
      <PanelGlass
        tono="panel"
        className="flex items-center gap-2.5 px-3 py-2.5"
        style={ESTILO_TARJETA_LUNA}
      >
        <div className="flex h-10 w-10 shrink-0 items-center justify-center text-[color:var(--color-acento)]">
          <IconoFaseLunar fase={luna.fase} tamaño={20} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-semibold text-[color:var(--shell-texto)]">
            Luna en {luna.signo}
          </p>
          <p className="mt-0.5 text-[11px] leading-4 text-[color:var(--shell-texto-secundario)]">
            {luna.fase}
          </p>
        </div>
      </PanelGlass>
    );
  }

  return (
    <PanelGlass
      tono="panel"
      className="flex items-center gap-3 px-3.5 py-3"
      style={ESTILO_TARJETA_LUNA}
    >
      <div className="flex h-[46px] w-[46px] shrink-0 items-center justify-center text-[color:var(--color-acento)]">
        <IconoFaseLunar fase={luna.fase} tamaño={24} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[color:var(--shell-texto-tenue)]">
          Luna en {luna.signo}
        </p>
        <p className="mt-1 text-[15px] font-semibold leading-tight text-[color:var(--shell-texto)]">
          {luna.fase}
        </p>
      </div>
    </PanelGlass>
  );
}
