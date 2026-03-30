import { PanelGlass } from "./panel-glass";

interface MensajeClaveProps {
  nombreUsuario: string;
  titulo: string;
  fraseSintesis: string;
}

export function MensajeClave({ nombreUsuario, titulo, fraseSintesis }: MensajeClaveProps) {
  return (
    <div className="rounded-[10px] bg-[#190223] px-4 py-5 flex flex-col gap-2.5">
      <h2 className="text-white/90 text-[22px] font-normal leading-snug">
        {nombreUsuario}, {titulo}
      </h2>
      <PanelGlass className="px-4 py-3">
        <p className="text-white/90 text-[11px] leading-relaxed">
          {fraseSintesis}
        </p>
      </PanelGlass>
    </div>
  );
}
