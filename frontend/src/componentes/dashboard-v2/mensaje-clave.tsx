import { PanelGlass } from "./panel-glass";

interface MensajeClaveProps {
  nombreUsuario: string;
  titulo: string;
  fraseSintesis: string;
}

export function MensajeClave({ nombreUsuario, titulo, fraseSintesis }: MensajeClaveProps) {
  return (
    <div className="rounded-[10px] bg-gradient-to-br from-violet-950 via-violet-900/80 to-violet-800 px-5 py-5 flex flex-col gap-3 relative overflow-hidden">
      {/* Orbe decorativo */}
      <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-violet-500/15 blur-3xl pointer-events-none" />
      <h2 className="tema-hero-titulo relative text-[22px] font-normal leading-snug">
        {nombreUsuario}, {titulo}
      </h2>
      <PanelGlass className="relative px-4 py-3">
        <p className="text-[14px] font-medium leading-[1.45] text-[color:var(--shell-hero-texto-secundario)]">
          {fraseSintesis}
        </p>
      </PanelGlass>
    </div>
  );
}
