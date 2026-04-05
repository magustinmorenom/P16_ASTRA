import { Icono } from "@/componentes/ui/icono";

interface TarjetaPodcastProps {
  nombre: string;
  episodioListo: boolean;
  generando: boolean;
  fechaManana: string;
  onReproducir: () => void;
  onGenerar: () => void;
}

export function TarjetaPodcast({
  nombre,
  episodioListo,
  generando,
  fechaManana,
  onReproducir,
  onGenerar,
}: TarjetaPodcastProps) {
  return (
    <div className="flex flex-col gap-2">
      {/* Fila superior: Fecha (izq) + Podcast info (der) — contenedor unificado */}
      <div className="rounded-2xl backdrop-blur-[21px] p-3 flex items-center gap-4" style={{ background: "var(--shell-hero-superficie)", borderWidth: 1, borderColor: "var(--shell-hero-borde-sutil)" }}>
        {/* Burbuja podcast info */}
        <div className="flex-1 flex flex-col gap-2.5">
          <div className="rounded-xl px-3.5 py-2.5" style={{ background: "var(--shell-hero-superficie)", borderWidth: 1, borderColor: "var(--shell-hero-borde-sutil)" }}>
            <p className="text-[12px] font-normal leading-[1.17] text-[color:var(--shell-hero-texto-secundario)]">
              Hola {nombre}! Tu podcast de hoy {episodioListo ? "esta listo" : "está pendiente"}
            </p>
          </div>

          {/* Botón reproducir */}
          <button
            onClick={episodioListo ? onReproducir : onGenerar}
            disabled={generando}
            className="btn-reproducir flex items-center gap-2 rounded-full border px-3.5 py-1.5 self-start cursor-pointer"
            style={{ background: "rgba(26,16,53,0.8)", borderColor: "var(--shell-hero-borde-sutil)" }}
          >
            <span className="btn-reproducir-icono h-[20px] w-[20px] rounded-full flex items-center justify-center shrink-0 transition-all duration-300" style={{ background: "var(--shell-hero-superficie)" }}>
              {generando ? (
                <div className="h-2.5 w-2.5 animate-spin rounded-full border-[1.5px] border-[var(--shell-hero-texto)] border-t-transparent" />
              ) : (
                <Icono
                  nombre={episodioListo ? "reproducir" : "destello"}
                  tamaño={10}
                  peso="fill"
                  className="text-[color:var(--shell-hero-texto)]"
                />
              )}
            </span>
            <span className="btn-reproducir-dot h-[5px] w-[5px] rounded-full bg-[color:var(--color-acento)] shrink-0" />
            <span className="btn-reproducir-texto text-[10px] font-medium tracking-[1px] uppercase text-[color:var(--shell-hero-texto-tenue)] transition-colors duration-300">
              {generando ? "Generando..." : "Reproducir"}
            </span>
          </button>
        </div>
      </div>

      {/* Card genera para mañana */}
      <button
        onClick={onGenerar}
        disabled={generando}
        className="rounded-2xl overflow-hidden relative w-full text-left"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-violet-950/80 via-violet-900/70 to-violet-800/60" />
        <div className="absolute -right-6 -top-6 h-28 w-28 rounded-full bg-violet-500/25 blur-[40px] pointer-events-none" />
        <div className="relative flex items-center gap-3 px-4 py-3">
          <span className="h-[32px] w-[32px] rounded-lg flex items-center justify-center shrink-0" style={{ background: "var(--shell-hero-superficie)", borderWidth: 1, borderColor: "var(--shell-hero-borde-sutil)" }}>
            <Icono nombre="destello" tamaño={14} peso="fill" className="text-[color:var(--shell-hero-texto)]" />
          </span>
          <p className="flex-1 text-center text-[10px] font-medium uppercase leading-[1.45] tracking-[1.5px] text-[color:var(--shell-hero-texto-tenue)]">
            Prepara tu día{"\n"}genera podcast{"\n"}para mañana
          </p>
          <div className="rounded-xl backdrop-blur-[21px] px-3 py-2" style={{ background: "var(--shell-hero-superficie)", borderWidth: 1, borderColor: "var(--shell-hero-borde-sutil)" }}>
            <span className="font-[family-name:var(--font-inria)] text-[16px] font-bold tracking-wide whitespace-nowrap text-[color:var(--shell-hero-texto)]">
              {fechaManana}
            </span>
          </div>
        </div>
      </button>
    </div>
  );
}
