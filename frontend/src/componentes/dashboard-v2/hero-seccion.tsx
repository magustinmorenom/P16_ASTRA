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
import { PerlasDia } from "./perlas-dia";
import { ResumenPersonalUnificado } from "./resumen-personal-unificado";

interface HeroSeccionProps {
  fecha: Date;
  nombreUsuario: string;
  momentos: MomentoClaveDTO[];
  numero: NumeroPersonalDTO;
  luna: LunaInfoDTO;
  energia: number;
  claridad: number;
  intuicion: number;
  podcastListo: boolean;
  podcastGenerando: boolean;
  podcastReproduciendo: boolean;
  onReproducirPodcast: () => void;
  onGenerarPodcast: () => void;
  onLeerDia?: () => void;
}

export function HeroSeccion({
  fecha,
  nombreUsuario,
  momentos,
  numero,
  luna,
  energia,
  claridad,
  intuicion,
  podcastListo,
  podcastGenerando,
  podcastReproduciendo,
  onReproducirPodcast,
  onGenerarPodcast,
  onLeerDia,
}: HeroSeccionProps) {
  const estadoPodcast = podcastGenerando
    ? "Preparando el audio del día"
    : podcastReproduciendo
      ? "Estás escuchando tu audio del día"
      : podcastListo
        ? "Tu audio del día ya está listo"
        : "Tu audio del día todavía no fue generado";
  const estiloPanelResumen = {
    background: "var(--shell-superficie-fuerte)",
    borderColor: "var(--shell-borde)",
    boxShadow: "var(--shell-sombra-suave)",
    backdropFilter: "none",
  } as const;
  const estiloBotonPrincipal = {
    borderColor: "var(--shell-borde-fuerte)",
    background: "var(--shell-gradiente-acento-suave)",
    color: "var(--shell-texto)",
    boxShadow: "none",
  } as const;
  const estiloIconoBotonPrincipal = {
    borderColor: "var(--shell-borde-fuerte)",
    background: "var(--shell-superficie)",
  } as const;
  const estiloBotonSecundario = {
    borderColor: "var(--shell-borde)",
    background: "var(--shell-superficie-suave)",
    color: "var(--shell-texto-secundario)",
    boxShadow: "none",
  } as const;

  return (
    <section
      className="tema-superficie-panel relative overflow-visible rounded-[24px] px-4 py-4 sm:px-5 sm:py-5 lg:px-6 lg:py-6"
      style={estiloPanelResumen}
    >
      <div className="relative z-10 grid grid-cols-1 gap-0 lg:grid-cols-[minmax(240px,1.12fr)_minmax(220px,0.92fr)_minmax(280px,1fr)] lg:items-stretch">
        <div
          className="border-b pb-4 lg:flex lg:h-full lg:flex-col lg:border-b-0 lg:border-r lg:pb-0 lg:pr-5"
          style={{ borderColor: "var(--shell-borde)" }}
        >
          <div className="flex h-full flex-col gap-5">
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

            {/* Perlas del día — recordatorios íntimos generados por IA, encima del CTA del podcast */}
            <PerlasDia />

            <div className="mt-auto flex flex-col items-start gap-2.5 pb-0.5 lg:pt-2">
              <button
                onClick={podcastListo ? onReproducirPodcast : onGenerarPodcast}
                disabled={podcastGenerando}
                className="flex min-h-[38px] max-w-full items-center gap-2 rounded-full border px-3.5 py-1.5 text-[11px] font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-70"
                style={estiloBotonPrincipal}
                aria-label={
                  podcastGenerando
                    ? "Generando podcast del día"
                    : podcastReproduciendo
                      ? "Pausar podcast del día"
                      : podcastListo
                        ? "Reproducir podcast del día"
                        : "Generar podcast del día"
                }
              >
                <span
                  className="flex h-6 w-6 items-center justify-center rounded-full border"
                  style={estiloIconoBotonPrincipal}
                >
                  {podcastGenerando ? (
                    <div
                      className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-[color:var(--color-acento)] border-t-transparent"
                    />
                  ) : (
                    <Icono
                      nombre={
                        podcastReproduciendo
                          ? "pausar"
                          : podcastListo
                            ? "reproducir"
                            : "destello"
                      }
                      tamaño={12}
                      peso="fill"
                      className="text-[color:var(--color-acento)]"
                    />
                  )}
                </span>
                <span>
                  {podcastGenerando
                    ? "Astra está generando tu podcast Hoy"
                    : podcastReproduciendo
                      ? "Pausar"
                      : podcastListo
                        ? "Escuchar ahora"
                        : "Generar audio de hoy"}
                </span>
              </button>

              {podcastListo && onLeerDia && (
                <button
                  onClick={onLeerDia}
                  className="flex min-h-[38px] max-w-full items-center gap-2 rounded-full border px-3.5 py-1.5 text-[11px] font-medium transition-colors hover:text-[color:var(--shell-texto)]"
                  style={estiloBotonSecundario}
                >
                  <Icono nombre="articulo" tamaño={13} peso="fill" />
                  <span>Lee tu día</span>
                </button>
              )}

            </div>
          </div>
        </div>

        <div
          className="min-w-0 border-b py-3.5 lg:flex lg:h-full lg:border-b-0 lg:border-r lg:px-4 lg:py-0 lg:pl-4 lg:pr-4"
          style={{ borderColor: "var(--shell-borde)" }}
        >
          <MomentosDia momentos={momentos} expandido />
        </div>

        <div className="grid grid-cols-1 gap-2.5 pt-3.5 sm:grid-cols-3 lg:hidden">
          <NumeroDelDia numero={numero} />
          <LunaPosicion luna={luna} />
          <NivelesEnergia energia={energia} claridad={claridad} intuicion={intuicion} />
        </div>

        <div className="hidden lg:block lg:min-w-0 lg:pl-4">
          <ResumenPersonalUnificado
            numero={numero}
            luna={luna}
            energia={energia}
            claridad={claridad}
            intuicion={intuicion}
          />
        </div>
      </div>
    </section>
  );
}
