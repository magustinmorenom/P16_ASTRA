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
  const estadoPodcast = podcastGenerando
    ? "Preparando el audio del día"
    : podcastListo
      ? "Tu audio del día ya está listo"
      : "Tu audio del día todavía no fue generado";

  return (
    <div className="overflow-hidden rounded-[24px] border border-white/[0.08] bg-[radial-gradient(circle_at_top_left,rgba(179,136,255,0.16),transparent_28%),linear-gradient(180deg,#2a1742_0%,#180923_100%)] shadow-[0_24px_64px_rgba(8,2,22,0.34)]">
      <div className="flex flex-col gap-0 lg:grid lg:min-h-[236px] lg:grid-cols-[minmax(220px,1.25fr)_minmax(220px,1fr)_minmax(250px,1.15fr)]">
        <div className="border-b border-white/[0.06] p-4 lg:border-b-0 lg:border-r">
          <div className="flex items-start gap-4">
            <TarjetaFecha fecha={fecha} />
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-violet-200/58">
                Centro diario
              </p>
              <p className="mt-2 text-[18px] font-semibold leading-tight text-white">
                {nombreUsuario}, seguí con lo importante.
              </p>
              <p className="mt-2 text-[13px] leading-6 text-white/62">
                {estadoPodcast}
              </p>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-3">
            <button
              onClick={podcastListo ? onReproducirPodcast : onGenerarPodcast}
              disabled={podcastGenerando}
              className="flex items-center gap-2 rounded-full border border-[#B388FF]/18 bg-[#7C4DFF]/14 px-4 py-2 text-[12px] font-medium text-white transition-colors hover:bg-[#7C4DFF]/18 disabled:cursor-not-allowed disabled:opacity-70"
            >
              <span className="flex h-7 w-7 items-center justify-center rounded-full border border-white/[0.08] bg-white/[0.08]">
                {podcastGenerando ? (
                  <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/80 border-t-transparent" />
                ) : (
                  <Icono
                    nombre={podcastListo ? "reproducir" : "destello"}
                    tamaño={12}
                    peso="fill"
                    className="text-white"
                  />
                )}
              </span>
              <span>{podcastGenerando ? "Generando audio" : podcastListo ? "Escuchar ahora" : "Generar audio"}</span>
            </button>

            <button
              onClick={onGenerarPodcast}
              disabled={podcastGenerando}
              className="flex items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.04] px-3.5 py-2 text-[12px] font-medium text-white/74 transition-colors hover:bg-white/[0.08] hover:text-white disabled:cursor-not-allowed disabled:opacity-70"
            >
              <Icono nombre="destello" tamaño={14} peso="fill" />
              <span>Mañana {obtenerFechaManana(fecha)}</span>
            </button>
          </div>
        </div>

        <div className="border-b border-white/[0.06] p-3 lg:border-b-0 lg:border-r">
          <MomentosDia momentos={momentos} />
        </div>

        <div className="flex flex-row justify-center gap-1.5 overflow-x-auto p-3 lg:flex-col lg:pl-1.5">
          <NumeroDelDia numero={numero} />
          <LunaPosicion luna={luna} />
          <NivelesEnergia energia={energia} claridad={claridad} fuerza={fuerza} />
        </div>
      </div>
    </div>
  );
}
