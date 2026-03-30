import type { MomentoClaveDTO } from "@/lib/tipos";

const ICONO_BLOQUE: Record<string, React.ReactNode> = {
  manana: (
    <svg width="26" height="26" viewBox="0 0 32 32" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 4v4M16 24v4M6.34 6.34l2.83 2.83M22.83 22.83l2.83 2.83M4 16h4M24 16h4M6.34 25.66l2.83-2.83M22.83 9.17l2.83-2.83" />
      <circle cx="16" cy="16" r="5" />
    </svg>
  ),
  tarde: (
    <svg width="26" height="26" viewBox="0 0 32 32" fill="none" stroke="white" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="16" cy="16" r="8" />
    </svg>
  ),
  noche: (
    <svg width="26" height="26" viewBox="0 0 32 32" fill="none" stroke="white" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
      <path d="M26 18.5A10 10 0 0113.5 6a10 10 0 1012.5 12.5z" />
    </svg>
  ),
};

interface MomentosDiaProps {
  momentos: MomentoClaveDTO[];
}

export function MomentosDia({ momentos }: MomentosDiaProps) {
  const ordenBloques = ["manana", "tarde", "noche"] as const;
  const momentosOrdenados = ordenBloques
    .map((b) => momentos.find((m) => m.bloque === b))
    .filter(Boolean) as MomentoClaveDTO[];

  return (
    <div className="flex flex-col justify-between h-full gap-2 p-2.5">
      {momentosOrdenados.map((momento) => (
        <div key={momento.bloque} className="flex items-start gap-2">
          <div className="shrink-0 mt-1.5">
            {ICONO_BLOQUE[momento.bloque] ?? ICONO_BLOQUE.manana}
          </div>
          <div className="rounded-xl backdrop-blur-[21px] bg-white/[0.07] border border-white/[0.12] px-2.5 py-2 flex-1">
            <p className="text-white/90 text-[11px] leading-[1.35]">
              {momento.frase}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
