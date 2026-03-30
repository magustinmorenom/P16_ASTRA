import type {
  MomentoClaveDTO,
  NumeroPersonalDTO,
  LunaInfoDTO,
} from "@/lib/tipos";
import { TarjetaFecha } from "./tarjeta-fecha";
import { TarjetaPodcast } from "./tarjeta-podcast";
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
          <TarjetaFecha fecha={fecha} />
          <TarjetaPodcast
            nombre={nombreUsuario}
            episodioListo={podcastListo}
            generando={podcastGenerando}
            fechaManana={obtenerFechaManana(fecha)}
            onReproducir={onReproducirPodcast}
            onGenerar={onGenerarPodcast}
          />
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
