"use client";

import { useEffect, useState } from "react";

import { useRouter } from "next/navigation";
import { Icono } from "@/componentes/ui/icono";
import { Esqueleto } from "@/componentes/ui/esqueleto";
import { obtenerBlobAudioPodcast, precargarAudiosPodcast } from "@/lib/hooks/usar-audio";
import { useStoreAuth } from "@/lib/stores/store-auth";
import { esPlanPago } from "@/lib/utilidades/planes";
import {
  usarPodcastHoy,
  usarPodcastHistorial,
  usarGenerarPodcast,
} from "@/lib/hooks";
import { useStoreUI, type PistaReproduccion } from "@/lib/stores/store-ui";
import {
  COPY_PODCAST_WEB,
  LIMITE_VISIBLE_HISTORIAL_PODCAST,
} from "@/lib/utilidades/podcast";

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
    etiquetaCard: string;
    etiquetaReproductor: string;
    mensajeCard: string;
    icono: "sol" | "destello" | "luna";
    gradiente: string;
  }
> = {
  dia: {
    ...COPY_PODCAST_WEB.dia,
    icono: "sol",
    gradiente: "from-violet-500 to-violet-300",
  },
  semana: {
    ...COPY_PODCAST_WEB.semana,
    icono: "destello",
    gradiente: "from-violet-800 to-violet-300",
  },
  mes: {
    ...COPY_PODCAST_WEB.mes,
    icono: "luna",
    gradiente: "from-violet-950 to-violet-500",
  },
};

const TIPOS: TipoPodcast[] = ["dia", "semana", "mes"];
const ESTILO_BOTON_SHELL = {
  borderColor: "var(--shell-borde)",
  background: "var(--shell-superficie)",
  color: "var(--shell-texto-secundario)",
} as const;
const ESTILO_BOTON_SHELL_ACTIVO = {
  borderColor: "var(--shell-borde-fuerte)",
  background: "var(--color-primario)",
  color: "var(--shell-hero-texto)",
  boxShadow: "var(--shell-sombra-suave)",
} as const;
const ESTILO_BADGE_SHELL = {
  borderColor: "var(--shell-chip-borde)",
  background: "var(--shell-chip)",
  color: "var(--color-acento)",
} as const;
const ESTILO_ICONO_PODCAST = {
  borderColor: "var(--shell-chip-borde)",
  background: "var(--shell-superficie-fuerte)",
} as const;

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
  bloqueado,
  autoGenerado = false,
}: {
  tipo: TipoPodcast;
  episodio: PodcastEpisodio | undefined;
  onGenerar: () => void;
  generando: boolean;
  bloqueado: boolean;
  /** Si es true, la card nunca muestra el botón "Generar ahora" porque el
   *  pipeline se dispara automáticamente (ver `banner-podcast-dia.tsx`). */
  autoGenerado?: boolean;
}) {
  const router = useRouter();
  const { setPistaActual, pistaActual } = useStoreUI();
  const config = TIPO_CONFIG[tipo];
  const enReproduccion = episodio && pistaActual?.id === episodio.id;

  const reproducir = () => {
    if (!episodio || episodio.estado !== "listo") return;
    const pista: PistaReproduccion = {
      id: episodio.id,
      titulo: episodio.titulo,
      subtitulo: config.etiquetaReproductor,
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
    <div className="tema-superficie-panel group relative h-full overflow-hidden rounded-[28px] p-6 transition-all duration-300 hover:-translate-y-1">
      <div className="relative flex h-full flex-col gap-6">
        <div className="flex items-start gap-4">
          <div className="relative shrink-0">
            <div
              className="flex h-14 w-14 items-center justify-center rounded-2xl border text-[color:var(--color-acento)] shadow-[var(--shell-sombra-suave)]"
              style={ESTILO_ICONO_PODCAST}
            >
              <Icono
                nombre={config.icono}
                tamaño={24}
                peso="fill"
                className="text-[color:var(--color-acento)]"
              />
            </div>
            {bloqueado && (
              <div className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-gradient-to-br from-[#D4A234] to-[#F0D68A] shadow-sm">
                <Icono nombre="corona" tamaño={10} className="text-white" />
              </div>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-lg font-semibold tracking-[-0.02em] text-[color:var(--shell-texto)]">
              {config.etiquetaCard}
            </p>
            <p className="mt-1 text-sm text-[color:var(--shell-texto-secundario)]">
              {config.mensajeCard}
            </p>
          </div>
        </div>

        {estado === "listo" ? (
          <div className="mt-auto flex items-end justify-between gap-4">
            <span className="text-xs text-[color:var(--shell-texto-secundario)]">
              {duracion} · Listo
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => descargarAudio(episodio!.id, episodio!.titulo)}
                className="flex h-11 w-11 items-center justify-center rounded-2xl border transition-all hover:text-[color:var(--shell-texto)]"
                style={ESTILO_BOTON_SHELL}
                title="Descargar audio"
              >
                <Icono nombre="descarga" tamaño={16} />
              </button>
              <button
                onClick={reproducir}
                className="flex h-11 w-11 items-center justify-center rounded-2xl border transition-all"
                style={enReproduccion ? ESTILO_BOTON_SHELL_ACTIVO : ESTILO_BOTON_SHELL}
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
            <p className="text-sm font-medium text-[color:var(--color-error)]">Error al generar el episodio</p>
            <button
              onClick={onGenerar}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl border px-4 text-sm font-medium transition-all"
              style={ESTILO_BADGE_SHELL}
            >
              <Icono nombre="destello" tamaño={16} peso="fill" />
              Reintentar
            </button>
          </div>
        ) : estaGenerando ? (
          <div className="mt-auto flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2 text-sm text-[color:var(--shell-texto-secundario)]">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-[color:var(--color-acento)] border-t-transparent" />
              <span>
                {estado === "generando_guion"
                  ? "Escribiendo guión..."
                  : "Generando audio..."}
              </span>
            </div>
            <div
              className="inline-flex h-11 items-center justify-center rounded-2xl border px-4 text-sm font-medium"
              style={ESTILO_BOTON_SHELL}
            >
              En preparación
            </div>
          </div>
        ) : autoGenerado ? (
          <div
            className="mt-auto inline-flex h-11 items-center justify-center gap-2 rounded-2xl border px-4 text-sm font-medium"
            style={ESTILO_BOTON_SHELL}
          >
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-[color:var(--color-acento)] border-t-transparent" />
            Preparando tu día…
          </div>
        ) : (
          <button
            onClick={bloqueado ? () => router.push("/suscripcion") : onGenerar}
            className="mt-auto inline-flex h-11 items-center justify-center gap-2 rounded-2xl border px-4 text-sm font-medium transition-all"
            style={bloqueado ? {
              borderColor: "var(--shell-borde)",
              background: "linear-gradient(135deg, #D4A234, #F0D68A)",
              color: "#fff",
            } : ESTILO_BADGE_SHELL}
          >
            <Icono nombre={bloqueado ? "corona" : "destello"} tamaño={16} peso="fill" />
            {bloqueado ? "Desbloquear con Premium" : "Generar ahora"}
          </button>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Header con animación de carga
// ---------------------------------------------------------------------------
function HeaderGenerando({ nombre }: { nombre: string }) {
  return (
    <div className="min-w-0 flex-1">
      <div className="flex items-center gap-2 mb-1">
        <div className="flex items-center gap-[3px]">
          <span
            className="block h-1.5 w-1.5 rounded-full bg-[var(--color-acento)] animate-[chat-soft-pulse_1.2s_ease-in-out_infinite]"
            style={{ animationDelay: "0ms" }}
          />
          <span
            className="block h-1.5 w-1.5 rounded-full bg-[var(--color-acento)] animate-[chat-soft-pulse_1.2s_ease-in-out_infinite]"
            style={{ animationDelay: "200ms" }}
          />
          <span
            className="block h-1.5 w-1.5 rounded-full bg-[var(--color-acento)] animate-[chat-soft-pulse_1.2s_ease-in-out_infinite]"
            style={{ animationDelay: "400ms" }}
          />
        </div>
        <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[color:var(--color-acento)]">
          Preparando
        </p>
      </div>
      <h1 className="text-[17px] font-semibold leading-tight text-[color:var(--shell-texto)]">
        {nombre}, solo un par de minutos
      </h1>
      <p className="mt-1 text-[12px] leading-5 text-[color:var(--shell-texto-tenue)]">
        Estoy conectando todos los puntos de tu perfil con los datos en tiempo real
      </p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Página principal de podcasts
// ---------------------------------------------------------------------------
export default function PaginaPodcast() {
  const generarMutation = usarGenerarPodcast();
  const [historialExpandido, setHistorialExpandido] = useState(false);
  const usuario = useStoreAuth((s) => s.usuario);
  const esPremium = esPlanPago(usuario?.plan_slug);

  const { data: episodiosHoy, isLoading: cargando } =
    usarPodcastHoy(generarMutation.isPending);
  const { data: historial, isLoading: cargandoHistorial } =
    usarPodcastHistorial();
  const { setPistaActual, pistaActual } = useStoreUI();

  const mapaHoy = new Map((episodiosHoy ?? []).map((ep) => [ep.tipo, ep]));

  const estaGenerandoAlguno =
    generarMutation.isPending ||
    (episodiosHoy ?? []).some(
      (ep) => ep.estado === "generando_guion" || ep.estado === "generando_audio",
    );

  const nombreCorto = usuario?.nombre?.split(" ")[0] ?? "";

  useEffect(() => {
    precargarAudiosPodcast([...(episodiosHoy ?? []), ...(historial ?? [])]);
  }, [episodiosHoy, historial]);

  const historialCompleto = historial ?? [];
  const puedeExpandirHistorial =
    historialCompleto.length > LIMITE_VISIBLE_HISTORIAL_PODCAST;
  const historialVisible = historialExpandido
    ? historialCompleto
    : historialCompleto.slice(0, LIMITE_VISIBLE_HISTORIAL_PODCAST);

  return (
    <>
      <HeaderMobile titulo={estaGenerandoAlguno ? undefined : "Podcasts"}>
        {estaGenerandoAlguno ? <HeaderGenerando nombre={nombreCorto} /> : undefined}
      </HeaderMobile>
      <div className="relative overflow-hidden" style={{ background: "var(--shell-fondo)" }}>
        <div
          className="pointer-events-none absolute right-[-120px] top-20 h-80 w-80 rounded-full blur-3xl"
          style={{ background: "var(--shell-glow-2)" }}
        />
        <div
          className="pointer-events-none absolute left-20 top-[420px] h-56 w-56 rounded-full blur-3xl"
          style={{ background: "var(--shell-glow-1)" }}
        />

        <div className="relative mx-auto flex max-w-6xl flex-col gap-10 px-4 py-8 sm:px-6">
          <section className="tema-superficie-panel relative overflow-hidden rounded-[24px] px-6 py-6 sm:px-7 sm:py-7">
            <div
              className="pointer-events-none absolute -right-10 top-[-48px] h-28 w-28 rounded-full blur-3xl"
              style={{ background: "var(--shell-glow-2)" }}
            />
            <div
              className="pointer-events-none absolute bottom-[-48px] left-8 h-24 w-24 rounded-full blur-3xl"
              style={{ background: "var(--shell-glow-1)" }}
            />

            <div className="relative max-w-2xl">
              <div className="flex items-start gap-4">
                <div
                  className="hidden h-14 w-14 shrink-0 items-center justify-center rounded-[18px] border sm:flex"
                  style={ESTILO_ICONO_PODCAST}
                >
                  <Icono
                    nombre="microfono"
                    tamaño={26}
                    peso="fill"
                    className="text-[color:var(--color-acento)]"
                  />
                </div>
                <div>
                  <h1 className="text-[26px] font-semibold tracking-[-0.03em] text-[color:var(--shell-texto)] sm:text-[30px]">
                    Tus Podcasts Cósmicos
                  </h1>
                  <p className="mt-3 max-w-xl text-[14px] leading-6 text-[color:var(--shell-texto-secundario)]">
                    Elegí una escucha breve, semanal o mensual con la misma superficie clara que usamos en Carta Astral y dashboard.
                  </p>
                </div>
              </div>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-[18px] font-semibold tracking-[-0.02em] text-[color:var(--shell-texto)]">
              Elegí tu podcast
            </h2>

            {cargando ? (
              <div className="grid auto-rows-fr grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                {[1, 2, 3].map((i) => (
                  <Esqueleto
                    key={i}
                    className="h-[280px] rounded-[28px] bg-[var(--shell-superficie)]"
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
                    bloqueado={!esPremium}
                    autoGenerado={tipo === "dia"}
                  />
                ))}
              </div>
            )}
          </section>

          <section className="tema-superficie-panel rounded-[24px] px-5 py-5 sm:px-6 sm:py-6">
            <div className="mb-5">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[color:var(--shell-texto-tenue)]">
                  Biblioteca reciente
                </p>
                <h2 className="mt-2 text-[20px] font-semibold tracking-[-0.02em] text-[color:var(--shell-texto)]">
                  Historial
                </h2>
              </div>
            </div>

            {cargandoHistorial ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <Esqueleto
                    key={i}
                    className="h-[88px] rounded-2xl bg-[var(--shell-superficie)]"
                  />
                ))}
              </div>
            ) : !historial || historial.length === 0 ? (
              <div
                className="rounded-[24px] border border-dashed px-6 py-14 text-center"
                style={{
                  borderColor: "var(--shell-borde)",
                  background: "var(--shell-superficie)",
                  color: "var(--shell-texto-secundario)",
                }}
              >
                <Icono
                  nombre="microfono"
                  tamaño={36}
                  className="mx-auto mb-3 opacity-50"
                />
                <p className="text-base font-medium text-[color:var(--shell-texto)]">
                  Aún no tenés episodios generados
                </p>
                <p className="mt-2 text-sm leading-6 text-[color:var(--shell-texto-secundario)]">
                  Tu historial va a aparecer acá apenas generes tu primer podcast.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {historialVisible.map((ep) => {
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
                          subtitulo: `${config.etiquetaReproductor} — ${ep.fecha}`,
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
                            subtitulo: `${config.etiquetaReproductor} — ${ep.fecha}`,
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
                      className="flex w-full items-center gap-4 rounded-[24px] border px-4 py-4 text-left transition-all duration-200"
                      style={
                        enReproduccion
                          ? {
                              borderColor: "var(--shell-borde-fuerte)",
                              background: "var(--shell-chip)",
                              boxShadow: "var(--shell-sombra-suave)",
                            }
                          : {
                              borderColor: "var(--shell-borde)",
                              background: "var(--shell-superficie)",
                            }
                      }
                    >
                      <div
                        className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border shadow-[var(--shell-sombra-suave)]"
                        style={ESTILO_ICONO_PODCAST}
                      >
                        <Icono
                          nombre={enReproduccion ? "pausar" : "reproducir"}
                          tamaño={18}
                          peso="fill"
                          className="text-[color:var(--color-acento)]"
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-base font-medium leading-6 text-[color:var(--shell-texto)]">
                            {ep.titulo}
                          </p>
                        </div>
                        <p className="mt-1 text-sm text-[color:var(--shell-texto-secundario)]">
                          {ep.fecha} · {formatearDuracionMinutos(ep.duracion_segundos)}
                        </p>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          descargarAudio(ep.id, ep.titulo);
                        }}
                        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border transition-all hover:text-[color:var(--shell-texto)]"
                        style={ESTILO_BOTON_SHELL}
                        title="Descargar audio"
                      >
                        <Icono nombre="descarga" tamaño={16} />
                      </button>
                    </div>
                  );
                })}

                {puedeExpandirHistorial && (
                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={() => setHistorialExpandido((estado) => !estado)}
                      className="inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition-all hover:text-[color:var(--shell-texto)]"
                      style={ESTILO_BOTON_SHELL}
                    >
                      {historialExpandido ? "Ver menos" : "Ver más"}
                    </button>
                  </div>
                )}
              </div>
            )}
          </section>
        </div>
      </div>
    </>
  );
}
