import { PanelGlass } from "./panel-glass";
import type { NumeroPersonalDTO } from "@/lib/tipos";

interface NumeroDelDiaProps {
  numero: NumeroPersonalDTO;
}

export function NumeroDelDia({ numero }: NumeroDelDiaProps) {
  return (
    <PanelGlass tono="hero" className="flex items-center gap-3 px-3 py-2">
      <div
        className="flex h-[38px] w-[46px] shrink-0 items-center justify-center rounded-[10px] border backdrop-blur-[21px]"
        style={{
          background: "var(--shell-hero-superficie)",
          borderColor: "var(--shell-hero-superficie-fuerte)",
        }}
      >
        <span className="font-[family-name:var(--font-inria)] text-[22px] font-normal text-[color:var(--shell-texto-inverso)]">
          {numero.numero}
        </span>
      </div>
      <p className="flex-1 text-[14px] font-medium leading-[1.35] text-[color:var(--shell-hero-texto-secundario)]">
        {numero.descripcion}
      </p>
    </PanelGlass>
  );
}
