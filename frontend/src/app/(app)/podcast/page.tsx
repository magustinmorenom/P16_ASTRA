"use client";

import { useEffect } from "react";

import { Icono } from "@/componentes/ui/icono";
import { Esqueleto } from "@/componentes/ui/esqueleto";
import { BloqueoPremium } from "@/componentes/ui/bloqueo-premium";
import { obtenerBlobAudioPodcast, precargarAudiosPodcast } from "@/lib/hooks/usar-audio";
import {
  usarPodcastHoy,
  usarPodcastHistorial,
  usarGenerarPodcast,
} from "@/lib/hooks";
import { useStoreUI, type PistaReproduccion } from "@/lib/stores/store-ui";

import type { PodcastEpisodio, TipoPodcast } from "@/lib/tipos";
import HeaderMobile from "@/componentes/layouts/header-mobile";

/** Descarga el audio de un episodio vía fetch autenticado. */
async function descargarAudio(episodioId: string, titulo: string) {
  try {
    const blob = await obtenerBlobAudioPodcast(episodioId);
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${titulo.replace(/[^a-zA-Z0-9áéíóúñÁÉÍÓÚÑ ]/g, "")}.mp3`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  } catch {
    // silenciar error
  }
}

// ---------------------------------------------------------------------------
// Config visual por tipo
// ---------------------------------------------------------------------------
const TIPO_CONFIG: Record<
  TipoPodcast,
  {
    etiqueta: string;
    icono: "sol" | "destello" | "luna";
    gradiente: string;
    desc: string;
  }
> = {
  dia: {
    etiqueta: "Tu Día",
    icono: "sol",
    gradiente: "from-[#7C4DFF] to-[#D4A234]",
    desc: "Momento Clave de tu Día",
  },
  semana: {
    etiqueta: "Tu Semana",
    icono: "destello",
    gradiente: "from-[#4A2D8C] to-[#B388FF]",
    desc: "Tu Semana Cósmica",
  },
  mes: {
    etiqueta: "Tu Mes",
    icono: "luna",
    gradiente: "from-[#2D1B69] to-[#7C4DFF]",
    desc: "Tu Mes Cósmico",
  },
};

const TIPOS: TipoPodcast[] = ["dia", "semana", "mes"];

function formatearDuracionMinutos(segundos?: number | null) {
  return `${Math.max(1, Math.floor((segundos ?? 0) / 60))} min`;
}

// ---------------------------------------------------------------------------
// Card de episodio on-demand
// ---------------------------------------------------------------------------
function CardEpisodio({
  tipo,
  episodio,
  onGenerar,
  generando,
}: {
  tipo: TipoPodcast;
  episodio: PodcastEpisodio | undefined;
  onGenerar: () => void;
  generando: boolean;
}) {
  const { setPistaActual, pistaActual } = useStoreUI();
  const config = TIPO_CONFIG[tipo];
  const enReproduccion = episodio && pistaActual?.id === episodio.id;

  const reproducir = () => {
    if (!episodio || episodio.estado !== "listo") return;
    const pista: PistaReproduccion = {
      id: episodio.id,
      titulo: episodio.titulo,
      subtitulo: `Podcast ${config.etiqueta}`,
      tipo: "podcast",
      duracionSegundos: episodio.duracion_segundos ?? 0,
      icono: config.icono,
      gradiente: config.gradiente,
      url: episodio.url_audio,
      segmentos: episodio.segmentos,
    };
    setPistaActual(pista);
  };

  const estado = episodio?.estado;
  const estaGenerando =
    generando || estado === "generando_guion" || estado === "generando_audio";
  const duracion = formatearDuracionMinutos(episodio?.duracion_segundos);

  return (
    <div className="group relative h-full overflow-hidden rounded-[28px] border border-white/[0.12] bg-[linear-gradient(180deg,rgba(255,255,255,0.1),rgba(255,255,255,0.04))] p-6 shadow-[0_18px_45px_rgba(8,3,20,0.24)] transition-all duration-300 hover:-translate-y-1 hover:border-[#B388FF]/35 hover:shadow-[0_24px_60px_rgba(18,4,38,0.42)]">
      <div
        className={`pointer-events-none absolute inset-x-6 top-0 h-24 bg-gradient-to-r ${config.gradiente} opacity-20 blur-3xl transition-opacity duration-300 group-hover:opacity-30`}
      />

      <div className="relative flex h-full flex-col gap-6">
        <div className="flex items-start gap-4">
          <div
            className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br ${config.gradiente} shadow-[0_12px_30px_rgba(26,10,54,0.35)] ring-1 ring-white/15`}
          >
            <Icono
              nombre={config.icono}
              tamaño={24}
              peso="fill"
              className="text-white/90"
            />
          </div>
          <div className="min-w-0 flex-1">
            <span className="mb-3 inline-flex items-center rounded-full border border-white/10 bg-white/[0.08] px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-white/70">
              {config.etiqueta}
            </span>
            <p className="text-lg font-semibold tracking-[-0.02em] text-white">
              {episodio?.titulo ?? config.desc}
            </p>
            <p className="mt-1 text-sm leading-6 text-white/62">{config.desc}</p>
          </div>
        </div>

        {estado === "listo" ? (
          <div className="mt-auto flex items-end justify-between gap-4">
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="rounded-full border border-white/10 bg-white/[0.08] px-3 py-1.5 font-medium text-white/72">
                {duracion}
              </span>
              <span className="rounded-full border border-[#B388FF]/25 bg-[#7C4DFF]/12 px-3 py-1.5 font-medium text-[#E7D8FF]">
                Disponible ahora
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => descargarAudio(episodio!.id, episodio!.titulo)}
                className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.08] text-white/76 transition-all hover:border-[#B388FF]/30 hover:bg-white/[0.14] hover:text-white"
                title="Descargar audio"
              >
                <Icono nombre="descarga" tamaño={16} />
              </button>
              <button
                onClick={reproducir}
                className={`flex h-11 w-11 items-center justify-center rounded-2xl border transition-all ${
                  enReproduccion
                    ? "border-[#B388FF]/50 bg-[#7C4DFF] text-white shadow-[0_10px_24px_rgba(124,77,255,0.38)]"
                    : "border-white/10 bg-white/[0.08] text-white/80 hover:border-[#B388FF]/35 hover:bg-[#7C4DFF] hover:text-white"
                }`}
                title={enReproduccion ? "Pausar audio" : "Reproducir audio"}
              >
                <Icono
                  nombre={enReproduccion ? "pausar" : "reproducir"}
                  tamaño={18}
                  peso="fill"
                />
              </button>
            </div>
          </div>
        ) : estado === "error" ? (
          <div className="mt-auto flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm font-medium text-[#F2B5B5]">Error al generar el episodio</p>
            <button
              onClick={onGenerar}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl border border-[#B388FF]/25 bg-[#7C4DFF]/14 px-4 text-sm font-medium text-[#EBDDFF] transition-all hover:border-[#B388FF]/40 hover:bg-[#7C4DFF]/22"
            >
              <Icono nombre="destello" tamaño={16} peso="fill" />
              Reintentar
            </button>
          </div>
        ) : estaGenerando ? (
          <div className="mt-auto flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2 text-sm text-white/68">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-[#B388FF] border-t-transparent" />
              <span>
                {estado === "generando_guion"
                  ? "Escribiendo guión..."
                  : "Generando audio..."}
              </span>
            </div>
            <div className="inline-flex h-11 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.06] px-4 text-sm font-medium text-white/50">
              En preparación
            </div>
          </div>
        ) : (
          <button
            onClick={onGenerar}
            className="mt-auto inline-flex h-11 items-center justify-center gap-2 rounded-2xl border border-[#B388FF]/25 bg-[#7C4DFF]/14 px-4 text-sm font-medium text-[#EBDDFF] transition-all hover:border-[#B388FF]/40 hover:bg-[#7C4DFF]/22 hover:text-white"
          >
            <Icono nombre="destello" tamaño={16} peso="fill" />
            Generar ahora
          </button>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Página principal de podcasts
// ---------------------------------------------------------------------------
export default function PaginaPodcast() {
  const generarMutation = usarGenerarPodcast();

  // Polling rápido si hay algún episodio generándose
  const hayGenerando = generarMutation.isPending;

  const { data: episodiosHoy, isLoading: cargando } =
    usarPodcastHoy(hayGenerando);
  const { data: historial, isLoading: cargandoHistorial } =
    usarPodcastHistorial();
  const { setPistaActual, pistaActual } = useStoreUI();

  const mapaHoy = new Map((episodiosHoy ?? []).map((ep) => [ep.tipo, ep]));
  // Activar polling rápido también si hay episodios en proceso
  const hayEnProceso = (episodiosHoy ?? []).some(
    (ep) => ep.estado === "generando_guion" || ep.estado === "generando_audio"
  );
  usarPodcastHoy(hayEnProceso);

  useEffect(() => {
    precargarAudiosPodcast([...(episodiosHoy ?? []), ...(historial ?? [])]);
  }, [episodiosHoy, historial]);

  return (
    <>
      <HeaderMobile titulo="Podcasts" />
      <div className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-72 bg-[radial-gradient(circle_at_top_left,rgba(124,77,255,0.26),transparent_48%)]" />
        <div className="pointer-events-none absolute right-[-120px] top-20 h-80 w-80 rounded-full bg-[#B388FF]/10 blur-3xl" />
        <div className="pointer-events-none absolute left-20 top-[420px] h-56 w-56 rounded-full bg-[#7C4DFF]/10 blur-3xl" />

        <div className="relative mx-auto flex max-w-6xl flex-col gap-10 px-4 py-8 sm:px-6">
          <section className="relative overflow-hidden rounded-[32px] border border-white/[0.08] bg-[radial-gradient(circle_at_top_left,rgba(179,136,255,0.2),transparent_32%),linear-gradient(135deg,rgba(45,27,105,0.96),rgba(22,1,27,0.98))] px-6 py-7 shadow-[0_24px_70px_rgba(8,2,22,0.38)] sm:px-8 sm:py-8">
            <div className="pointer-events-none absolute -right-12 top-[-72px] h-44 w-44 rounded-full bg-[#B388FF]/18 blur-3xl" />
            <div className="pointer-events-none absolute bottom-[-64px] left-10 h-36 w-36 rounded-full bg-[#7C4DFF]/16 blur-3xl" />

            <div className="relative max-w-2xl">
              <span className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.08] px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-white/72">
                <Icono nombre="microfono" tamaño={14} />
                Cabina cósmica
              </span>
              <div className="flex items-start gap-4">
                <div className="hidden h-16 w-16 shrink-0 items-center justify-center rounded-[24px] bg-gradient-to-br from-[#7C4DFF] via-[#9C6DFF] to-[#D4A234] shadow-[0_18px_40px_rgba(34,12,72,0.45)] sm:flex">
                  <Icono
                    nombre="microfono"
                    tamaño={30}
                    peso="fill"
                    className="text-white"
                  />
                </div>
                <div>
                  <h1 className="text-3xl font-semibold tracking-[-0.03em] text-white sm:text-4xl">
                    Tus Podcasts Cósmicos
                  </h1>
                  <p className="mt-3 max-w-xl text-base leading-7 text-white/68 sm:text-lg">
                    Una cabina clara y enfocada para escuchar tu día, tu semana y tu mes sin ruido visual ni pasos de más.
                  </p>
                </div>
              </div>
            </div>
          </section>

          <section className="space-y-4">
            <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-white/46">
                  Escuchas disponibles
                </p>
                <h2 className="mt-2 text-2xl font-semibold tracking-[-0.02em] text-white">
                  Elegí el período que querés activar
                </h2>
              </div>
              <p className="max-w-md text-sm leading-6 text-white/52">
                Las tres tarjetas siguen el mismo sistema visual para que la acción principal siempre sea evidente.
              </p>
            </div>

            <BloqueoPremium mensaje="Los podcasts cósmicos son exclusivos del plan Premium">
              {cargando ? (
                <div className="grid auto-rows-fr grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {[1, 2, 3].map((i) => (
                    <Esqueleto
                      key={i}
                      className="h-[280px] rounded-[28px] bg-white/[0.06]"
                    />
                  ))}
                </div>
              ) : (
                <div className="grid auto-rows-fr grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {TIPOS.map((tipo) => (
                    <CardEpisodio
                      key={tipo}
                      tipo={tipo}
                      episodio={mapaHoy.get(tipo)}
                      onGenerar={() => generarMutation.mutate(tipo)}
                      generando={
                        generarMutation.isPending &&
                        generarMutation.variables === tipo
                      }
                    />
                  ))}
                </div>
              )}
            </BloqueoPremium>
          </section>

          <section className="rounded-[30px] border border-white/[0.08] bg-white/[0.04] px-5 py-5 shadow-[0_18px_40px_rgba(8,3,20,0.22)] backdrop-blur-xl sm:px-6 sm:py-6">
            <div className="mb-5 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-white/46">
                  Biblioteca reciente
                </p>
                <h2 className="mt-2 text-2xl font-semibold tracking-[-0.02em] text-white">
                  Historial
                </h2>
              </div>
              <p className="max-w-md text-sm leading-6 text-white/52">
                Tu archivo de escuchas queda más visible y con mejor contraste para volver a cualquier episodio sin buscar de más.
              </p>
            </div>

            {cargandoHistorial ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <Esqueleto
                    key={i}
                    className="h-[88px] rounded-2xl bg-white/[0.06]"
                  />
                ))}
              </div>
            ) : !historial || historial.length === 0 ? (
              <div className="rounded-[24px] border border-dashed border-white/12 bg-black/10 px-6 py-14 text-center text-white/56">
                <Icono
                  nombre="microfono"
                  tamaño={36}
                  className="mx-auto mb-3 opacity-50"
                />
                <p className="text-base font-medium text-white/74">
                  Aún no tenés episodios generados
                </p>
                <p className="mt-2 text-sm leading-6 text-white/52">
                  Tu historial va a aparecer acá apenas generes tu primer podcast.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {historial.map((ep) => {
                  const config = TIPO_CONFIG[ep.tipo] ?? TIPO_CONFIG.dia;
                  const enReproduccion = pistaActual?.id === ep.id;

                  return (
                    <div
                      key={ep.id}
                      role="button"
                      tabIndex={0}
                      onClick={() => {
                        const pista: PistaReproduccion = {
                          id: ep.id,
                          titulo: ep.titulo,
                          subtitulo: `Podcast ${config.etiqueta} — ${ep.fecha}`,
                          tipo: "podcast",
                          duracionSegundos: ep.duracion_segundos ?? 0,
                          icono: config.icono,
                          gradiente: config.gradiente,
                          url: ep.url_audio,
                          segmentos: ep.segmentos,
                        };
                        setPistaActual(pista);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          const pista: PistaReproduccion = {
                            id: ep.id,
                            titulo: ep.titulo,
                            subtitulo: `Podcast ${config.etiqueta} — ${ep.fecha}`,
                            tipo: "podcast",
                            duracionSegundos: ep.duracion_segundos ?? 0,
                            icono: config.icono,
                            gradiente: config.gradiente,
                            url: ep.url_audio,
                            segmentos: ep.segmentos,
                          };
                          setPistaActual(pista);
                        }
                      }}
                      className={`flex w-full items-center gap-4 rounded-[24px] border px-4 py-4 text-left transition-all duration-200 ${
                        enReproduccion
                          ? "border-[#B388FF]/35 bg-[#7C4DFF]/14 shadow-[0_12px_24px_rgba(124,77,255,0.16)]"
                          : "border-white/[0.08] bg-black/10 hover:border-white/15 hover:bg-white/[0.05]"
                      }`}
                    >
                      <div
                        className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br ${config.gradiente} shadow-[0_12px_28px_rgba(22,8,40,0.3)]`}
                      >
                        <Icono
                          nombre={enReproduccion ? "pausar" : "reproducir"}
                          tamaño={18}
                          peso="fill"
                          className="text-white/88"
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="truncate text-base font-medium text-white">
                            {ep.titulo}
                          </p>
                          <span className="rounded-full border border-white/10 bg-white/[0.06] px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-white/54">
                            {config.etiqueta}
                          </span>
                        </div>
                        <p className="mt-1 text-sm text-white/56">
                          {ep.fecha} · {formatearDuracionMinutos(ep.duracion_segundos)}
                        </p>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          descargarAudio(ep.id, ep.titulo);
                        }}
                        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.06] text-white/70 transition-all hover:border-[#B388FF]/30 hover:bg-white/[0.12] hover:text-white"
                        title="Descargar audio"
                      >
                        <Icono nombre="descarga" tamaño={16} />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </div>
      </div>
    </>
  );
}
