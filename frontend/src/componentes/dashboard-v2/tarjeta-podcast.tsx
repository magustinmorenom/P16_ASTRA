import { Icono } from "@/componentes/ui/icono";

interface TarjetaPodcastProps {
  nombre: string;
  episodioListo: boolean;
  generando: boolean;
  onReproducir: () => void;
  onGenerar: () => void;
}

export function TarjetaPodcast({
  nombre,
  episodioListo,
  generando,
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

    </div>
  );
}
