import { PanelGlass } from "./panel-glass";
import type { LunaInfoDTO } from "@/lib/tipos";

interface LunaPosicionProps {
  luna: LunaInfoDTO;
}

export function LunaPosicion({ luna }: LunaPosicionProps) {
  const texto = luna.significado.trim().toLowerCase().startsWith("luna en")
    ? luna.significado
    : `Luna en ${luna.signo}. ${luna.significado}`;

  return (
    <PanelGlass className="flex items-center gap-3 px-3 py-2">
      {/* Moon icon dorado */}
      <svg
        width="24"
        height="24"
        viewBox="0 0 32 32"
        fill="#B388FF"
        className="shrink-0"
      >
        <path d="M26 18.5A10 10 0 0113.5 6a10 10 0 1012.5 12.5z" />
      </svg>
      <p className="text-white/90 text-[14px] font-medium leading-[1.35] flex-1">
        {texto}
      </p>
    </PanelGlass>
  );
}
