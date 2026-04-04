import { PanelGlass } from "./panel-glass";
import type { NumeroPersonalDTO } from "@/lib/tipos";

interface NumeroDelDiaProps {
  numero: NumeroPersonalDTO;
  compacto?: boolean;
}

const ESTILO_TARJETA_NUMERO = {
  background: "rgba(255, 255, 255, 0.82)",
  borderColor: "var(--shell-borde-fuerte)",
  boxShadow: "0 8px 18px rgba(93, 53, 167, 0.05)",
  backdropFilter: "none",
} as const;

const ESTILO_PLACA_NUMERO = {
  background: "rgba(255, 255, 255, 0.94)",
  borderColor: "var(--shell-chip-borde)",
  boxShadow: "none",
} as const;

export function NumeroDelDia({ numero, compacto = false }: NumeroDelDiaProps) {
  if (compacto) {
    return (
      <PanelGlass
        tono="panel"
        className="flex items-center gap-2.5 px-3 py-2.5"
        style={ESTILO_TARJETA_NUMERO}
      >
        <div
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border"
          style={ESTILO_PLACA_NUMERO}
        >
          <span className="font-[family-name:var(--font-inria)] text-[20px] font-normal leading-none text-[color:var(--color-acento)]">
            {numero.numero}
          </span>
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-semibold text-[color:var(--shell-texto)]">
            Número del día
          </p>
          <p className="mt-0.5 text-[11px] leading-4 text-[color:var(--shell-texto-secundario)] line-clamp-2">
            {numero.descripcion}
          </p>
        </div>
      </PanelGlass>
    );
  }

  return (
    <PanelGlass
      tono="panel"
      className="flex items-center gap-3 px-3.5 py-3"
      style={ESTILO_TARJETA_NUMERO}
    >
      <div
        className="flex min-h-[66px] min-w-[72px] shrink-0 flex-col items-center justify-center rounded-[14px] border px-3 py-2"
        style={ESTILO_PLACA_NUMERO}
      >
        <span className="text-[9px] font-semibold uppercase tracking-[0.18em] text-[color:var(--shell-texto-tenue)]">
          Hoy
        </span>
        <span className="mt-1 font-[family-name:var(--font-inria)] text-[30px] font-normal leading-none text-[color:var(--color-acento)]">
          {numero.numero}
        </span>
      </div>

      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[color:var(--shell-texto-tenue)]">
          Número del día
        </p>
        <p className="mt-1 text-[15px] font-semibold leading-tight text-[color:var(--shell-texto)]">
          Tu pulso del día
        </p>
        <p className="mt-1 text-[13px] leading-5 text-[color:var(--shell-texto-secundario)]">
          {numero.descripcion}
        </p>
      </div>
    </PanelGlass>
  );
}
