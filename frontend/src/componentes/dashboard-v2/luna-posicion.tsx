import { PanelGlass } from "./panel-glass";
import type { LunaInfoDTO } from "@/lib/tipos";

interface LunaPosicionProps {
  luna: LunaInfoDTO;
  compacto?: boolean;
}

const ESTILO_TARJETA_LUNA = {
  background: "var(--shell-panel-suave)",
  borderColor: "var(--shell-borde)",
} as const;

const ESTILO_ICONO_LUNA = {
  background: "var(--shell-superficie-fuerte)",
  borderColor: "var(--shell-chip-borde)",
} as const;

export function LunaPosicion({ luna, compacto = false }: LunaPosicionProps) {
  const texto = luna.significado.trim().toLowerCase().startsWith("luna en")
    ? luna.significado
    : `Luna en ${luna.signo}. ${luna.significado}`;

  if (compacto) {
    return (
      <PanelGlass
        tono="panel"
        className="flex items-center gap-2.5 px-3 py-2.5"
        style={ESTILO_TARJETA_LUNA}
      >
        <div
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border"
          style={ESTILO_ICONO_LUNA}
        >
          <svg width="18" height="18" viewBox="0 0 32 32" fill="var(--color-acento)">
            <path d="M26 18.5A10 10 0 0113.5 6a10 10 0 1012.5 12.5z" />
          </svg>
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-semibold text-[color:var(--shell-texto)]">
            {luna.fase}
          </p>
          <p className="mt-0.5 text-[11px] leading-4 text-[color:var(--shell-texto-secundario)]">
            Luna en {luna.signo}
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
      <div
        className="flex h-[46px] w-[46px] shrink-0 items-center justify-center rounded-[14px] border"
        style={ESTILO_ICONO_LUNA}
      >
        <svg
          width="22"
          height="22"
          viewBox="0 0 32 32"
          fill="var(--color-acento)"
          className="shrink-0"
        >
          <path d="M26 18.5A10 10 0 0113.5 6a10 10 0 1012.5 12.5z" />
        </svg>
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[color:var(--shell-texto-tenue)]">
          Fase lunar
        </p>
        <p className="mt-1 text-[15px] font-semibold leading-tight text-[color:var(--shell-texto)]">
          {luna.fase}
        </p>
        <p className="mt-1 text-[13px] leading-5 text-[color:var(--shell-texto-secundario)]">
          {texto}
        </p>
      </div>
    </PanelGlass>
  );
}
