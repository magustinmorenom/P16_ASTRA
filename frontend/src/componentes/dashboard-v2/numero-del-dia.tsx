import { PanelGlass } from "./panel-glass";
import type { NumeroPersonalDTO } from "@/lib/tipos";

interface NumeroDelDiaProps {
  numero: NumeroPersonalDTO;
}

export function NumeroDelDia({ numero }: NumeroDelDiaProps) {
  return (
    <PanelGlass className="flex items-center gap-3 px-3 py-2.5">
      <div className="rounded-xl backdrop-blur-[21px] bg-white/[0.07] border border-white/[0.12] h-[41px] w-[49px] flex items-center justify-center shrink-0">
        <span className="text-[#f8f6ff] font-[family-name:var(--font-inria)] text-[24px] font-normal">
          {numero.numero}
        </span>
      </div>
      <p className="text-white/90 text-[14px] font-medium leading-[1.35] flex-1">
        {numero.descripcion}
      </p>
    </PanelGlass>
  );
}
