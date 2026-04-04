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
  const estiloBotonPrincipal = {
    borderColor: "var(--shell-borde)",
    background: "var(--shell-superficie-fuerte)",
    color: "var(--shell-texto)",
  } as const;
  const estiloBotonSecundario = {
    borderColor: "var(--shell-borde)",
    background: "var(--shell-superficie)",
    color: "var(--shell-texto-secundario)",
  } as const;

  return (
    <section className="tema-superficie-panel relative overflow-hidden rounded-[24px] px-4 py-4 sm:px-5 sm:py-5">
      <div
        className="pointer-events-none absolute -right-10 top-[-48px] h-28 w-28 rounded-full blur-3xl"
        style={{ background: "var(--shell-glow-2)" }}
      />
      <div
        className="pointer-events-none absolute bottom-[-48px] left-8 h-24 w-24 rounded-full blur-3xl"
        style={{ background: "var(--shell-glow-1)" }}
      />
      <div className="relative z-10 flex flex-col gap-0 lg:grid lg:grid-cols-[minmax(220px,1.1fr)_minmax(200px,0.9fr)_minmax(0,1fr)] lg:items-stretch">
        <div
          className="border-b pb-4 lg:border-b-0 lg:border-r lg:pb-0 lg:pr-5"
          style={{ borderColor: "var(--shell-borde)" }}
        >
          <div className="flex h-full flex-col justify-between gap-4">
            <div className="flex items-start gap-4">
              <TarjetaFecha fecha={fecha} />
              <div className="min-w-0 flex-1">
                <p className="text-[18px] font-semibold tracking-[-0.03em] leading-tight text-[color:var(--shell-texto)]">
                  {nombreUsuario}, seguí con lo importante.
                </p>
                <p className="mt-2 text-[13px] leading-6 text-[color:var(--shell-texto-secundario)]">
                  {estadoPodcast}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2.5 pb-0.5">
              <button
                onClick={podcastListo ? onReproducirPodcast : onGenerarPodcast}
                disabled={podcastGenerando}
                className="flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-[11px] font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-70"
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
                onClick={onGenerarPodcast}
                disabled={podcastGenerando}
                className="flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-[11px] font-medium transition-colors hover:text-[color:var(--shell-texto)] disabled:cursor-not-allowed disabled:opacity-70"
                style={estiloBotonSecundario}
              >
                <Icono nombre="destello" tamaño={13} peso="fill" />
                <span>Generar audio para mañana · {obtenerFechaManana(fecha)}</span>
              </button>
            </div>
          </div>
        </div>

        <div
          className="flex min-w-0 border-b py-3.5 lg:border-b-0 lg:border-r lg:px-4 lg:py-0 lg:pl-4 lg:pr-4"
          style={{ borderColor: "var(--shell-borde)" }}
        >
          <MomentosDia momentos={momentos} />
        </div>

        <div className="flex flex-row justify-center gap-2 overflow-x-auto pt-3.5 lg:hidden">
          <NumeroDelDia numero={numero} />
          <LunaPosicion luna={luna} />
          <NivelesEnergia energia={energia} claridad={claridad} fuerza={fuerza} />
        </div>

        <div className="hidden lg:flex lg:flex-col lg:justify-center lg:gap-2 lg:pl-4 lg:min-w-0">
          <NumeroDelDia numero={numero} compacto />
          <LunaPosicion luna={luna} compacto />
          <NivelesEnergia energia={energia} claridad={claridad} fuerza={fuerza} compacto />
        </div>
      </div>
    </section>
  );
}
