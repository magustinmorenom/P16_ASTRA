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
    <div className="tema-superficie-hero rounded-[20px]">
      <div className="flex flex-col gap-0 lg:grid lg:grid-cols-[minmax(240px,1.2fr)_minmax(250px,1fr)_minmax(290px,1.08fr)]">
        <div
          className="border-b p-4 lg:border-b-0 lg:border-r lg:p-5"
          style={{ borderColor: "var(--shell-hero-borde)" }}
        >
          <div className="flex flex-col gap-6 pb-2">
            <div className="flex items-start gap-4">
              <TarjetaFecha fecha={fecha} />
              <div className="min-w-0 flex-1">
                <p className="tema-hero-titulo text-[18px] font-semibold leading-tight">
                  {nombreUsuario}, seguí con lo importante.
                </p>
                <p className="tema-hero-secundario mt-2 text-[13px] leading-6">
                  {estadoPodcast}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 pb-1">
              <button
                onClick={podcastListo ? onReproducirPodcast : onGenerarPodcast}
                disabled={podcastGenerando}
                className="flex items-center gap-2 rounded-full border px-4 py-2 text-[12px] font-medium text-[color:var(--shell-hero-texto)] transition-colors disabled:cursor-not-allowed disabled:opacity-70"
                style={{
                  borderColor: "rgba(255, 255, 255, 0.12)",
                  background: "rgba(255, 255, 255, 0.08)",
                }}
              >
                <span
                  className="flex h-7 w-7 items-center justify-center rounded-full border"
                  style={{
                    borderColor: "rgba(255, 255, 255, 0.12)",
                    background: "rgba(255, 255, 255, 0.08)",
                  }}
                >
                  {podcastGenerando ? (
                    <div
                      className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-t-transparent"
                      style={{ borderColor: "rgba(248, 246, 255, 0.8)" }}
                    />
                  ) : (
                    <Icono
                      nombre={podcastListo ? "reproducir" : "destello"}
                      tamaño={12}
                      peso="fill"
                      className="text-[color:var(--shell-hero-texto)]"
                    />
                  )}
                </span>
                <span>{podcastGenerando ? "Generando audio" : podcastListo ? "Escuchar ahora" : "Generar audio de hoy"}</span>
              </button>

              <button
                onClick={onGenerarPodcast}
                disabled={podcastGenerando}
                className="flex items-center gap-2 rounded-full border px-4 py-2 text-[12px] font-medium text-[color:var(--shell-hero-texto-secundario)] transition-colors hover:text-[color:var(--shell-hero-texto)] disabled:cursor-not-allowed disabled:opacity-70"
                style={{
                  borderColor: "rgba(255, 255, 255, 0.1)",
                  background: "rgba(255, 255, 255, 0.04)",
                }}
              >
                <Icono nombre="destello" tamaño={14} peso="fill" />
                <span>Generar audio para mañana · {obtenerFechaManana(fecha)}</span>
              </button>
            </div>
          </div>
        </div>

        <div
          className="flex border-b p-3 lg:border-b-0 lg:border-r lg:p-4 lg:pb-5"
          style={{ borderColor: "var(--shell-hero-borde)" }}
        >
          <MomentosDia momentos={momentos} />
        </div>

        <div className="flex flex-row justify-center gap-2 overflow-x-auto p-3 lg:flex-col lg:justify-start lg:gap-2.5 lg:p-4 lg:pb-5">
          <NumeroDelDia numero={numero} />
          <LunaPosicion luna={luna} />
          <NivelesEnergia energia={energia} claridad={claridad} fuerza={fuerza} />
        </div>
      </div>
    </div>
  );
}
