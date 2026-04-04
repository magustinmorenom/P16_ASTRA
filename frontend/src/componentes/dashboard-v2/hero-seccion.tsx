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
import { ResumenPersonalUnificado } from "./resumen-personal-unificado";

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
  onInformarPodcastManana: () => void;
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
  onInformarPodcastManana,
}: HeroSeccionProps) {
  const estadoPodcast = podcastGenerando
    ? "Preparando el audio del día"
    : podcastListo
      ? "Tu audio del día ya está listo"
      : "Tu audio del día todavía no fue generado";
  const estiloPanelResumen = {
    background: "rgba(255, 255, 255, 0.88)",
    borderColor: "var(--shell-borde)",
    boxShadow: "0 14px 32px rgba(93, 53, 167, 0.05)",
    backdropFilter: "none",
  } as const;
  const estiloBotonPrincipal = {
    borderColor: "var(--shell-borde)",
    background: "rgba(255, 255, 255, 0.96)",
    color: "var(--shell-texto)",
    boxShadow: "0 8px 18px rgba(93, 53, 167, 0.06)",
  } as const;
  const estiloBotonSecundario = {
    borderColor: "var(--shell-borde)",
    background: "rgba(255, 255, 255, 0.8)",
    color: "var(--shell-texto-secundario)",
    boxShadow: "0 6px 14px rgba(93, 53, 167, 0.04)",
  } as const;

  return (
    <section
      className="tema-superficie-panel relative overflow-visible rounded-[24px] px-4 py-4 sm:px-5 sm:py-5 lg:px-6 lg:py-6"
      style={estiloPanelResumen}
    >
      <div className="relative z-10 grid grid-cols-1 gap-0 lg:grid-cols-[minmax(240px,1.12fr)_minmax(220px,0.92fr)_minmax(280px,1fr)] lg:items-start">
        <div
          className="border-b pb-4 lg:self-start lg:border-b-0 lg:border-r lg:pb-0 lg:pr-5"
          style={{ borderColor: "var(--shell-borde)" }}
        >
          <div className="space-y-5">
            <div className="flex items-start gap-4">
              <TarjetaFecha fecha={fecha} />
              <div className="min-w-0 flex-1">
                <p className="break-words text-[18px] font-semibold tracking-[-0.03em] leading-tight text-[color:var(--shell-texto)] lg:text-[20px]">
                  {nombreUsuario}, seguí con lo importante.
                </p>
                <p className="mt-2 text-[13px] leading-6 text-[color:var(--shell-texto-secundario)] lg:mt-3">
                  {estadoPodcast}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2.5 pb-0.5 lg:pt-2">
              <button
                onClick={podcastListo ? onReproducirPodcast : onGenerarPodcast}
                disabled={podcastGenerando}
                className="flex min-h-[38px] items-center gap-2 rounded-full border px-3.5 py-1.5 text-[11px] font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-70"
                style={estiloBotonPrincipal}
              >
                <span
                  className="flex h-6 w-6 items-center justify-center rounded-full border"
                  style={{
                    borderColor: "var(--shell-chip-borde)",
                    background: "var(--shell-chip)",
                  }}
                >
                  {podcastGenerando ? (
                    <div
                      className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-t-transparent"
                      style={{ borderColor: "var(--color-acento)" }}
                    />
                  ) : (
                    <Icono
                      nombre={podcastListo ? "reproducir" : "destello"}
                      tamaño={12}
                      peso="fill"
                      className="text-[color:var(--color-acento)]"
                    />
                  )}
                </span>
                <span>{podcastGenerando ? "Generando audio" : podcastListo ? "Escuchar ahora" : "Generar audio de hoy"}</span>
              </button>

              <button
                onClick={onInformarPodcastManana}
                disabled={podcastGenerando}
                className="flex min-h-[38px] items-center gap-2 rounded-full border px-3.5 py-1.5 text-[11px] font-medium transition-colors hover:text-[color:var(--shell-texto)] disabled:cursor-not-allowed disabled:opacity-70"
                style={estiloBotonSecundario}
              >
                <Icono nombre="destello" tamaño={13} peso="fill" />
                <span>Audio de mañana · {obtenerFechaManana(fecha)}</span>
              </button>
            </div>
          </div>
        </div>

        <div
          className="min-w-0 border-b py-3.5 lg:self-start lg:border-b-0 lg:border-r lg:px-4 lg:py-0 lg:pl-4 lg:pr-4"
          style={{ borderColor: "var(--shell-borde)" }}
        >
          <MomentosDia momentos={momentos} />
        </div>

        <div className="grid grid-cols-1 gap-2.5 pt-3.5 sm:grid-cols-3 lg:hidden">
          <NumeroDelDia numero={numero} />
          <LunaPosicion luna={luna} />
          <NivelesEnergia energia={energia} claridad={claridad} fuerza={fuerza} />
        </div>

        <div className="hidden lg:block lg:min-w-0 lg:self-start lg:pl-4">
          <ResumenPersonalUnificado
            numero={numero}
            luna={luna}
            energia={energia}
            claridad={claridad}
            fuerza={fuerza}
          />
        </div>
      </div>
    </section>
  );
}
