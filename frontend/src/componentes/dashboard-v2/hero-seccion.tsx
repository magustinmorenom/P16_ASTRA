import type {
  MomentoClaveDTO,
  NumeroPersonalDTO,
  LunaInfoDTO,
} from "@/lib/tipos";
import { Icono } from "@/componentes/ui/icono";
import { TarjetaFecha } from "./tarjeta-fecha";
import { MomentosDia } from "./momentos-dia";
import { NumeroDelDia } from "./numero-del-dia";
import { LunaPosicion } from "./luna-posicion";
import { NivelesEnergia } from "./niveles-energia";

interface HeroSeccionProps {
  fecha: Date;
  nombreUsuario: string;
  momentos: MomentoClaveDTO[];
  numero: NumeroPersonalDTO;
  luna: LunaInfoDTO;
  energia: number;
  claridad: number;
  fuerza: number;
  podcastListo: boolean;
  podcastGenerando: boolean;
  onReproducirPodcast: () => void;
  onGenerarPodcast: () => void;
}

const DIAS_CORTOS = ["DOM", "LUN", "MAR", "MIÉ", "JUE", "VIE", "SÁB"] as const;

function obtenerFechaManana(fecha: Date): string {
  const manana = new Date(fecha);
  manana.setDate(manana.getDate() + 1);
  const dia = DIAS_CORTOS[manana.getDay()];
  return `${dia} ${manana.getDate()}`;
}

export function HeroSeccion({
  fecha,
  nombreUsuario,
  momentos,
  numero,
  luna,
  energia,
  claridad,
  fuerza,
  podcastListo,
  podcastGenerando,
  onReproducirPodcast,
  onGenerarPodcast,
}: HeroSeccionProps) {
  return (
    <div className="rounded-[10px] bg-gradient-to-b from-[#382954] to-[#6a4f99]">
      {/* Fila superior: 3 columnas */}
      <div className="grid grid-cols-[minmax(180px,1.2fr)_minmax(190px,1fr)_minmax(260px,1.4fr)] gap-0 min-h-[240px]">
        {/* Columna izquierda — Fecha + Podcast */}
        <div className="p-4 flex flex-col gap-2">
          {/* Contenedor unificado: Fecha (izq) + Info podcast (der) */}
          <div className="rounded-2xl backdrop-blur-[21px] bg-white/[0.07] border border-white/[0.10] p-3 flex items-center gap-4">
            <TarjetaFecha fecha={fecha} />
            <div className="flex-1 flex flex-col gap-2.5">
              <div className="rounded-xl bg-white/[0.08] border border-white/[0.10] px-3.5 py-2.5">
                <p className="text-white/90 text-[12px] leading-[1.17] font-normal">
                  Hola {nombreUsuario}! Tu podcast de hoy {podcastListo ? "esta listo" : "está pendiente"}
                </p>
              </div>
              <button
                onClick={podcastListo ? onReproducirPodcast : onGenerarPodcast}
                disabled={podcastGenerando}
                className="btn-reproducir flex items-center justify-center gap-2 rounded-full bg-[#1a1035]/80 border border-white/[0.08] px-3.5 py-1.5 cursor-pointer"
              >
                <span className="btn-reproducir-icono h-[20px] w-[20px] rounded-full bg-white/10 flex items-center justify-center shrink-0 transition-all duration-300">
                  {podcastGenerando ? (
                    <div className="h-2.5 w-2.5 animate-spin rounded-full border-[1.5px] border-white border-t-transparent" />
                  ) : (
                    <Icono
                      nombre={podcastListo ? "reproducir" : "destello"}
                      tamaño={10}
                      peso="fill"
                      className="text-white"
                    />
                  )}
                </span>
                <span className="btn-reproducir-dot h-[5px] w-[5px] rounded-full bg-[#00c220] shrink-0" />
                <span className="btn-reproducir-texto text-[#f8f6ff]/60 text-[10px] font-medium tracking-[1px] uppercase transition-colors duration-300">
                  {podcastGenerando ? "Generando..." : "Reproducir"}
                </span>
              </button>
            </div>
          </div>

          {/* Botón genera podcast para mañana */}
          <button
            onClick={onGenerarPodcast}
            disabled={podcastGenerando}
            className="rounded-2xl overflow-hidden relative w-full text-left"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-[#1a0e3e]/80 via-[#2d1b69]/70 to-[#382954]/60" />
            <div className="absolute -right-6 -top-6 h-28 w-28 rounded-full bg-violet-500/25 blur-[40px] pointer-events-none" />
            <div className="relative flex items-center gap-3 px-4 py-3">
              <span className="h-[32px] w-[32px] rounded-lg bg-white/10 border border-white/[0.08] flex items-center justify-center shrink-0">
                <Icono nombre="destello" tamaño={14} peso="fill" className="text-white" />
              </span>
              <p className="text-[#f8f6ff]/60 text-[10px] font-medium tracking-[1.5px] text-center uppercase leading-[1.45] flex-1">
                Prepara tu día{"\n"}genera podcast{"\n"}para mañana
              </p>
              <div className="rounded-xl backdrop-blur-[21px] bg-white/[0.07] border border-white/[0.10] px-3 py-2">
                <span className="text-[#f8f6ff] font-[family-name:var(--font-inria)] text-[16px] font-bold tracking-wide whitespace-nowrap">
                  {obtenerFechaManana(fecha)}
                </span>
              </div>
            </div>
          </button>
        </div>

        {/* Columna central — Momentos del día */}
        <div className="rounded-[17px] bg-gradient-to-b from-[#9b8227] to-[#6a4f99] m-3 mr-1.5 self-stretch">
          <MomentosDia momentos={momentos} />
        </div>

        {/* Columna derecha — Número + Luna + Niveles */}
        <div className="p-3 pl-1.5 flex flex-col gap-1.5 justify-center">
          <NumeroDelDia numero={numero} />
          <LunaPosicion luna={luna} />
          <NivelesEnergia energia={energia} claridad={claridad} fuerza={fuerza} />
        </div>
      </div>
    </div>
  );
}
