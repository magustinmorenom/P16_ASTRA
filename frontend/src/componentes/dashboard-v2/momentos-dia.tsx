import type { MomentoClaveDTO } from "@/lib/tipos";

const ICONO_BLOQUE: Record<string, React.ReactNode> = {
  manana: (
    <svg width="24" height="24" viewBox="0 0 36 36" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 26c0-6.627 5.373-12 12-12s12 5.373 12 12" />
      <path d="M18 18V8" />
      <path d="M13 12l5-4 5 4" />
      <line x1="4" y1="26" x2="32" y2="26" />
    </svg>
  ),
  tarde: (
    <svg width="24" height="24" viewBox="0 0 36 36" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="18" cy="18" r="5" />
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
    <svg width="24" height="24" viewBox="0 0 36 36" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M28 20a11 11 0 01-14.8-14.8A12 12 0 1028 20z" />
    </svg>
  ),
};

interface MomentosDiaProps {
  momentos: MomentoClaveDTO[];
  expandido?: boolean;
  preparando?: boolean;
}

const ETIQUETA_BLOQUE: Record<string, string> = {
  manana: "Mañana",
  tarde: "Tarde",
  noche: "Noche",
};

const HORARIO_BLOQUE: Record<string, string> = {
  manana: "6 – 12h",
  tarde: "12 – 19h",
  noche: "19 – 6h",
};

const ESTILO_TARJETA_MOMENTOS = {
  background: "var(--shell-superficie)",
  border: "1px solid var(--shell-borde)",
  boxShadow: "none",
  backdropFilter: "none",
} as const;

export function MomentosDia({ momentos, expandido = false, preparando = false }: MomentosDiaProps) {
  const ordenBloques = ["manana", "tarde", "noche"] as const;
  const momentosOrdenados = ordenBloques
    .map((b) => momentos.find((m) => m.bloque === b))
    .filter(Boolean) as MomentoClaveDTO[];

  // Si no hay momentos o todos están sin accionables y el podcast se está generando,
  // mostrar estado "preparando"
  const sinAccionables =
    momentosOrdenados.length === 0 ||
    momentosOrdenados.every((m) => !m.accionables || m.accionables.length === 0);

  if (preparando && sinAccionables) {
    return (
      <div
        className={`flex w-full flex-col items-center justify-center overflow-hidden rounded-[18px] px-4 py-6 text-center ${
          expandido ? "lg:h-full" : ""
        }`}
        style={ESTILO_TARJETA_MOMENTOS}
      >
        <div className="mb-3 flex h-8 w-8 items-center justify-center">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-[color:var(--color-acento)] border-t-transparent" />
        </div>
        <p className="text-[12px] font-medium leading-[1.5] text-[color:var(--shell-texto-secundario)]">
          Astra está preparando las claves de tu día
        </p>
      </div>
    );
  }

  return (
    <div
      className={`flex w-full flex-col overflow-hidden divide-y divide-[var(--shell-borde)] rounded-[18px] ${
        expandido ? "lg:h-full" : ""
      }`}
      style={ESTILO_TARJETA_MOMENTOS}
    >
      {momentosOrdenados.map((momento) => {
        const accionables = momento.accionables ?? [];

        return (
          <div
            key={momento.bloque}
            className={`flex gap-2.5 px-3 py-2.5 ${
              expandido ? "lg:flex-1 lg:py-2" : ""
            }`}
          >
            <div className="flex h-6 w-6 shrink-0 items-center justify-center text-[color:var(--color-acento)] mt-0.5">
              {ICONO_BLOQUE[momento.bloque] ?? ICONO_BLOQUE.manana}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-baseline gap-2">
                <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[color:var(--color-acento)]">
                  {ETIQUETA_BLOQUE[momento.bloque] ?? "Mañana"}
                </p>
                <span className="text-[9px] text-[color:var(--shell-texto-tenue)]">
                  {HORARIO_BLOQUE[momento.bloque]}
                </span>
              </div>
              {accionables.length > 0 ? (
                <ul className="mt-1 flex flex-col gap-0.5">
                  {accionables.map((accion, idx) => (
                    <li
                      key={idx}
                      className="flex items-start gap-1.5 text-[11px] leading-[1.4] text-[color:var(--shell-texto)]"
                    >
                      <span className="mt-[5px] h-1 w-1 shrink-0 rounded-full bg-[var(--color-acento)]" />
                      <span>{accion}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-0.5 text-[11px] font-medium leading-[1.35] text-[color:var(--shell-texto)]">
                  {momento.frase}
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
