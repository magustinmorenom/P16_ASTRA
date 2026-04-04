import type { MomentoClaveDTO } from "@/lib/tipos";

const ICONO_BLOQUE: Record<string, React.ReactNode> = {
  manana: (
    <svg width="30" height="30" viewBox="0 0 36 36" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      {/* Arco horizonte */}
      <path d="M6 26c0-6.627 5.373-12 12-12s12 5.373 12 12" />
      {/* Flecha arriba */}
      <path d="M18 18V8" />
      <path d="M13 12l5-4 5 4" />
      {/* Línea horizonte */}
      <line x1="4" y1="26" x2="32" y2="26" />
    </svg>
  ),
  tarde: (
    <svg width="30" height="30" viewBox="0 0 36 36" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="18" cy="18" r="5" />
      {/* Rayos */}
      <line x1="18" y1="5" x2="18" y2="9" />
      <line x1="18" y1="27" x2="18" y2="31" />
      <line x1="5" y1="18" x2="9" y2="18" />
      <line x1="27" y1="18" x2="31" y2="18" />
      <line x1="8.8" y1="8.8" x2="11.6" y2="11.6" />
      <line x1="24.4" y1="24.4" x2="27.2" y2="27.2" />
      <line x1="8.8" y1="27.2" x2="11.6" y2="24.4" />
      <line x1="24.4" y1="11.6" x2="27.2" y2="8.8" />
    </svg>
  ),
  noche: (
    <svg width="30" height="30" viewBox="0 0 36 36" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M28 20a11 11 0 01-14.8-14.8A12 12 0 1028 20z" />
    </svg>
  ),
};

interface MomentosDiaProps {
  momentos: MomentoClaveDTO[];
  expandido?: boolean;
}

const ETIQUETA_BLOQUE: Record<string, string> = {
  manana: "Mañana",
  tarde: "Tarde",
  noche: "Noche",
};

const ESTILO_TARJETA_MOMENTOS = {
  background: "var(--shell-superficie)",
  border: "1px solid var(--shell-borde)",
  boxShadow: "none",
  backdropFilter: "none",
} as const;

export function MomentosDia({ momentos, expandido = false }: MomentosDiaProps) {
  const ordenBloques = ["manana", "tarde", "noche"] as const;
  const momentosOrdenados = ordenBloques
    .map((b) => momentos.find((m) => m.bloque === b))
    .filter(Boolean) as MomentoClaveDTO[];

  return (
    <div
      className={`flex w-full flex-col overflow-hidden divide-y divide-[var(--shell-borde)] rounded-[18px] ${
        expandido ? "lg:h-full" : ""
      }`}
      style={ESTILO_TARJETA_MOMENTOS}
    >
      {momentosOrdenados.map((momento) => (
        <div
          key={momento.bloque}
          className={`flex items-center gap-2.5 px-3 py-3 ${
            expandido ? "lg:flex-1 lg:py-2.5" : ""
          }`}
        >
          <div className="flex h-8 w-8 shrink-0 items-center justify-center text-[color:var(--color-acento)]">
            {ICONO_BLOQUE[momento.bloque] ?? ICONO_BLOQUE.manana}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[color:var(--shell-texto-tenue)]">
              {ETIQUETA_BLOQUE[momento.bloque] ?? "Mañana"}
            </p>
            <p className="mt-0.5 text-[12px] font-medium leading-[1.35] text-[color:var(--shell-texto)]">
              {momento.frase}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
