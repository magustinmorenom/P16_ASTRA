"use client";

import { useEffect, useMemo } from "react";

import { Icono } from "@/componentes/ui/icono";
import { Esqueleto } from "@/componentes/ui/esqueleto";
import HeaderMobile from "@/componentes/layouts/header-mobile";
import { precargarAudiosPodcast } from "@/lib/hooks/usar-audio";
import {
  usarPronosticoDiario,
  usarPronosticoSemanal,
  usarPodcastHoy,
  usarGenerarPodcast,
  usarEsMobile,
} from "@/lib/hooks";
import { useStoreUI, type PistaReproduccion } from "@/lib/stores/store-ui";
import { useStoreAuth } from "@/lib/stores/store-auth";
import type { TipoPodcast } from "@/lib/tipos";
import { COPY_PODCAST_WEB } from "@/lib/utilidades/podcast";

// --- Componentes v2 (desktop dark) ---
import { HeroSeccion } from "@/componentes/dashboard-v2/hero-seccion";
import { AreasVidaV2 } from "@/componentes/dashboard-v2/areas-vida-v2";
import { SemanaV2 } from "@/componentes/dashboard-v2/semana-v2";

// ---------------------------------------------------------------------------
// Config visual de podcasts
// ---------------------------------------------------------------------------
const TIPO_CONFIG: Record<
  TipoPodcast,
  {
    etiquetaReproductor: string;
    icono: "sol" | "destello" | "luna";
    gradiente: string;
  }
> = {
  dia: {
    etiquetaReproductor: COPY_PODCAST_WEB.dia.etiquetaReproductor,
    icono: "sol",
    gradiente: "from-violet-500 to-violet-300",
  },
  semana: {
    etiquetaReproductor: COPY_PODCAST_WEB.semana.etiquetaReproductor,
    icono: "destello",
    gradiente: "from-violet-800 to-violet-500",
  },
  mes: {
    etiquetaReproductor: COPY_PODCAST_WEB.mes.etiquetaReproductor,
    icono: "luna",
    gradiente: "from-violet-950 to-violet-800",
  },
};

// ---------------------------------------------------------------------------
// Dashboard
// ---------------------------------------------------------------------------
export default function PaginaDashboard() {
  const { usuario, autenticado } = useStoreAuth();
  const generarMutation = usarGenerarPodcast();
  const esMobile = usarEsMobile();

  const {
    data: pronosticoDiario,
    isLoading: cargandoPronostico,
    error: errorPronostico,
    refetch: reintentarPronostico,
  } = usarPronosticoDiario();

  const { data: pronosticoSemanal, isLoading: cargandoSemanal } =
    usarPronosticoSemanal();

  const { data: episodiosHoy } = usarPodcastHoy(generarMutation.isPending);

  const { setPistaActual, pistaActual, toggleReproduccion, mostrarToast } = useStoreUI();

  const fechaHoy = useMemo(() => {
    return new Date().toLocaleDateString("es-ES", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  }, []);

  const mapaEpisodios = useMemo(
    () => new Map((episodiosHoy ?? []).map((ep) => [ep.tipo, ep])),
    [episodiosHoy]
  );

  useEffect(() => {
    precargarAudiosPodcast(episodiosHoy ?? []);
  }, [episodiosHoy]);

  function manejarPlayPodcast(tipo: TipoPodcast) {
    const ep = mapaEpisodios.get(tipo);
    const config = TIPO_CONFIG[tipo];

    if (ep && ep.estado === "listo") {
      if (pistaActual?.id === ep.id) {
        toggleReproduccion();
      } else {
        const pista: PistaReproduccion = {
          id: ep.id,
          titulo: ep.titulo,
          subtitulo: config.etiquetaReproductor,
          tipo: "podcast",
          duracionSegundos: ep.duracion_segundos ?? 0,
          icono: config.icono,
          gradiente: config.gradiente,
          url: ep.url_audio,
          segmentos: ep.segmentos,
        };
        setPistaActual(pista);
      }
    } else if (!ep || ep.estado === "error") {
      generarMutation.mutate(tipo);
    }
  }

  const nombreSaludo = (usuario?.nombre ?? "Viajero")
    .split(" ")[0]
    .toLowerCase()
    .replace(/^\w/, (c: string) => c.toUpperCase());

  const horaActual = new Date().getHours();
  const saludo =
    horaActual < 12
      ? "Buenos días"
      : horaActual < 19
        ? "Buenas tardes"
        : "Buenas noches";

  const epDia = mapaEpisodios.get("dia");
  const podcastDiaListo = epDia?.estado === "listo";
  const podcastDiaGenerando =
    (generarMutation.isPending && generarMutation.variables === "dia") ||
    epDia?.estado === "generando_guion" ||
    epDia?.estado === "generando_audio";

  const podcastSemanaGenerando =
    (generarMutation.isPending && generarMutation.variables === "semana") ||
    mapaEpisodios.get("semana")?.estado === "generando_guion" ||
    mapaEpisodios.get("semana")?.estado === "generando_audio";

  function manejarInfoPodcastManana() {
    mostrarToast(
      "info",
      "El audio de mañana se habilita cuando comienza el próximo día."
    );
  }

  // =========================================================================
  // DASHBOARD UNIFICADO — dark ciruela (mobile + desktop)
  // =========================================================================

  // Header mobile
  const metasHeaderMobile = [
    pronosticoDiario
      ? { icono: "wifi" as const, texto: `Energía ${pronosticoDiario.clima.energia}/10` }
      : { icono: "destello" as const, texto: "Pronóstico pendiente", tono: "rojo" as const },
    pronosticoDiario
      ? { icono: "luna" as const, texto: `Luna en ${pronosticoDiario.luna.signo}` }
      : { icono: "calendario" as const, texto: fechaHoy },
    podcastDiaGenerando
      ? { icono: "microfono" as const, texto: "Preparando audio", tono: "oro" as const }
      : podcastDiaListo
        ? { icono: "reproducir" as const, texto: "Podcast listo", tono: "verde" as const }
        : { icono: "destello" as const, texto: "Generar audio" },
  ];

  return (
    <div className="flex min-h-0 flex-col">
      {/* Header solo en mobile */}
      {esMobile && (
        <HeaderMobile
          titulo={`${saludo}, ${nombreSaludo}`}
          subtitulo={
            pronosticoDiario?.clima.frase_sintesis
              ?? "Cargando tu pronóstico personalizado..."
          }
          metas={metasHeaderMobile}
          accionDerecha={
            <button
              onClick={() =>
                podcastDiaListo
                  ? manejarPlayPodcast("dia")
                  : generarMutation.mutate("dia")
              }
              disabled={podcastDiaGenerando}
              className="flex h-10 w-10 items-center justify-center rounded-full border text-[color:var(--color-acento)] transition-colors disabled:cursor-not-allowed disabled:opacity-70"
              style={{
                borderColor: "var(--shell-borde)",
                background: "var(--shell-superficie)",
              }}
              aria-label={podcastDiaListo ? "Reproducir podcast del día" : "Generar podcast del día"}
            >
              {podcastDiaGenerando ? (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-[color:var(--color-acento)] border-t-transparent" />
              ) : (
                <Icono nombre={podcastDiaListo ? "reproducir" : "microfono"} tamaño={18} peso="fill" />
              )}
            </button>
          }
        />
      )}

      {/* Contenido principal — dark theme unificado */}
      <section className="flex flex-col gap-4 px-4 pb-4 pt-2 scroll-sutil-dark [&>*]:shrink-0 lg:gap-6 lg:px-6 lg:pb-6 lg:pt-4">
        {/* ---- PRONÓSTICO ---- */}
        {cargandoPronostico ? (
          <div className="flex flex-col gap-3 lg:gap-4">
            <Esqueleto className="h-[220px] lg:h-[320px] rounded-[10px] !bg-[var(--shell-superficie)]" />
            <Esqueleto className="h-[140px] lg:h-[180px] rounded-[10px] !bg-[var(--shell-superficie)]" />
            <Esqueleto className="h-[100px] lg:h-[120px] rounded-[10px] !bg-[var(--shell-superficie)]" />
          </div>
        ) : errorPronostico || !pronosticoDiario ? (
          <div className="tema-superficie-hero relative overflow-hidden rounded-[10px]" style={{ minHeight: 200 }}>
            <div
              className="absolute -right-8 -top-8 h-44 w-44 rounded-full blur-3xl"
              style={{ background: "var(--shell-glow-2)" }}
            />
            <div
              className="absolute bottom-[-40px] left-1/4 h-36 w-36 rounded-full blur-3xl"
              style={{ background: "var(--shell-glow-1)" }}
            />
            <div className="tema-superficie-panel relative z-10 m-3 p-4 lg:m-4 lg:p-5">
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-widest text-[color:var(--shell-texto-tenue)]">
                Pronóstico Cósmico
              </p>
              <p className="text-[color:var(--shell-texto)] text-[16px] lg:text-[18px] font-semibold leading-snug mb-2">
                {autenticado
                  ? "No pudimos generar tu pronóstico"
                  : "Iniciá sesión para ver tu pronóstico"}
              </p>
              <p className="mb-4 text-[13px] leading-relaxed text-[color:var(--shell-texto-secundario)] lg:text-[14px]">
                {autenticado
                  ? "Asegurate de tener un perfil con tus datos de nacimiento."
                  : "Necesitás un perfil para personalizar tu pronóstico."}
              </p>
              {autenticado && (
                <button
                  onClick={() => reintentarPronostico()}
                  className="rounded-xl border px-5 py-2.5 text-[14px] font-medium text-[color:var(--shell-texto)] transition-colors"
                  style={{
                    borderColor: "var(--shell-borde)",
                    background: "var(--shell-superficie)",
                  }}
                >
                  Reintentar
                </button>
              )}
            </div>
          </div>
        ) : (
          <>
            {/* 1. Hero Section (responsive: stack mobile, 3-col desktop) */}
            <HeroSeccion
              fecha={new Date()}
              nombreUsuario={nombreSaludo}
              momentos={pronosticoDiario.momentos}
              numero={pronosticoDiario.numero_personal}
              luna={pronosticoDiario.luna}
              energia={pronosticoDiario.clima.energia}
              claridad={pronosticoDiario.clima.claridad}
              fuerza={pronosticoDiario.clima.conexion}
              podcastListo={podcastDiaListo}
              podcastGenerando={podcastDiaGenerando ?? false}
              onReproducirPodcast={() => manejarPlayPodcast("dia")}
              onGenerarPodcast={() => generarMutation.mutate("dia")}
              onInformarPodcastManana={manejarInfoPodcastManana}
            />

            {/* 2. Áreas de Vida */}
            <AreasVidaV2 areas={pronosticoDiario.areas} />
          </>
        )}

        {/* 4. Pronóstico Semanal */}
        {cargandoSemanal ? (
          <Esqueleto className="h-[160px] lg:h-[200px] rounded-[10px] !bg-[var(--shell-superficie)]" />
        ) : pronosticoSemanal?.semana ? (
          <SemanaV2
            semana={pronosticoSemanal.semana}
            onGenerarPodcastSemana={() => generarMutation.mutate("semana")}
            generandoPodcast={podcastSemanaGenerando ?? false}
          />
        ) : null}
      </section>
    </div>
  );
}
