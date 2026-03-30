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
    <div className="flex flex-col gap-1.5">
      {/* Card podcast listo / pendiente */}
      <div className="rounded-xl backdrop-blur-[21px] bg-white/[0.07] border border-white/[0.12] p-2.5">
        <p className="text-white/90 text-[11px] leading-snug mb-1.5">
          Hola {nombre}! Tu podcast de hoy {episodioListo ? "está listo" : "está pendiente"}
        </p>
        <button
          onClick={episodioListo ? onReproducir : onGenerar}
          disabled={generando}
          className="flex items-center gap-1.5 group"
        >
          <span className="h-[22px] w-[22px] rounded-lg bg-white/10 border border-white/[0.08] flex items-center justify-center shrink-0">
            {generando ? (
              <div className="h-2.5 w-2.5 animate-spin rounded-full border-[1.5px] border-white border-t-transparent" />
            ) : (
              <Icono
                nombre={episodioListo ? "reproducir" : "destello"}
                tamaño={10}
                peso="fill"
                className="text-white"
              />
            )}
          </span>
          <span className="h-[4px] w-[4px] rounded-full bg-[#008516] shrink-0" />
          <span className="text-[#f8f6ff]/60 text-[9px] font-medium tracking-[1px] uppercase">
            {generando ? "Generando..." : "Reproducir"}
          </span>
        </button>
      </div>

      {/* Card genera para mañana */}
      <div className="rounded-xl overflow-hidden relative">
        <div className="absolute inset-0 bg-gradient-to-br from-[#0f0826]/22 via-[#1a0e3e]/34 to-[#2d1b69]/38" />
        <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-violet-500/30 blur-[42px] pointer-events-none" />
        <div className="relative flex items-center gap-2 px-3 py-2">
          <button
            onClick={onGenerar}
            disabled={generando}
            className="shrink-0"
          >
            <span className="h-[28px] w-[28px] rounded-lg bg-white/10 border border-white/[0.08] flex items-center justify-center">
              <Icono nombre="destello" tamaño={13} peso="fill" className="text-white" />
            </span>
          </button>
          <p className="text-[#f8f6ff]/60 text-[9px] font-medium tracking-[1.5px] text-center uppercase leading-relaxed flex-1">
            Prepara tu día genera podcast para mañana
          </p>
          <div className="rounded-lg backdrop-blur-[21px] bg-white/[0.07] border border-white/[0.12] px-2.5 py-1.5">
            <span className="text-[#f8f6ff] font-[family-name:var(--font-inria)] text-[12px] font-bold tracking-wide whitespace-nowrap">
              {fechaManana}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
