"use client";

import { useEffect, useMemo, useState, useRef, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";

import { Icono } from "@/componentes/ui/icono";
import { IconoFaseLunar } from "@/componentes/ui/icono-fase-lunar";
import { Esqueleto } from "@/componentes/ui/esqueleto";
import HeaderMobile from "@/componentes/layouts/header-mobile";
import { precargarAudiosPodcast } from "@/lib/hooks/usar-audio";
import {
  usarPronosticoDiario,
  usarPronosticoSemanal,
  usarPronosticoSemanaSiguiente,
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
import { GraficaTendencia } from "@/componentes/dashboard-v2/grafica-tendencia";

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
  const queryClient = useQueryClient();

  const {
    data: pronosticoDiario,
    isLoading: cargandoPronostico,
    error: errorPronostico,
    refetch: reintentarPronostico,
  } = usarPronosticoDiario();

  const { data: pronosticoSemanal, isLoading: cargandoSemanal } =
    usarPronosticoSemanal();

  // Siguientes 2 semanas (para gráfica de tendencia 15 días)
  const { fechaSiguienteSemana, fechaTerceraSemana } = useMemo(() => {
    const hoy = new Date();
    const diff = (7 - hoy.getDay() + 1) % 7 || 7;
    const lunes1 = new Date(hoy);
    lunes1.setDate(hoy.getDate() + diff);
    const lunes2 = new Date(lunes1);
    lunes2.setDate(lunes1.getDate() + 7);
    return {
      fechaSiguienteSemana: lunes1.toISOString().split("T")[0],
      fechaTerceraSemana: lunes2.toISOString().split("T")[0],
    };
  }, []);

  const { data: pronosticoSiguiente } =
    usarPronosticoSemanaSiguiente(fechaSiguienteSemana);
  const { data: pronosticoTercera } =
    usarPronosticoSemanaSiguiente(fechaTerceraSemana);

  const hoyISO = useMemo(() => new Date().toISOString().split("T")[0], []);

  const datosTendencia = useMemo(() => {
    const todas = [
      ...(pronosticoSemanal?.semana ?? []),
      ...(pronosticoSiguiente?.semana ?? []),
      ...(pronosticoTercera?.semana ?? []),
    ];
    const idxHoy = todas.findIndex((d) => d.fecha === hoyISO);
    const inicio = Math.max(0, idxHoy);
    return todas.slice(inicio, inicio + 15);
  }, [pronosticoSemanal, pronosticoSiguiente, pronosticoTercera, hoyISO]);

  const { data: episodiosHoy } = usarPodcastHoy(generarMutation.isPending);

  const { setPistaActual, pistaActual, reproduciendo, toggleReproduccion, mostrarToast } = useStoreUI();

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

  // Auto-trigger: si el pronóstico cargó pero no existe podcast del día,
  // disparar la generación una sola vez por sesión para que los accionables
  // del pronóstico se enriquezcan con los del podcast.
  const autoGeneracionDisparada = useRef(false);
  useEffect(() => {
    if (autoGeneracionDisparada.current) return;
    if (!autenticado || !pronosticoDiario) return;
    if (!episodiosHoy) return; // esperar a que cargue la lista
    if (generarMutation.isPending) return;

    const epDiaActual = episodiosHoy.find((ep) => ep.tipo === "dia");
    const necesitaGenerar = !epDiaActual || epDiaActual.estado === "error";

    if (necesitaGenerar) {
      autoGeneracionDisparada.current = true;
      generarMutation.mutate("dia");
    }
  }, [autenticado, pronosticoDiario, episodiosHoy, generarMutation]);

  // Cuando el podcast del día transiciona a "listo", invalidar el pronóstico
  // para que el backend re-inyecte los accionables reales del podcast.
  const estadoEpDiaPrevio = useRef<string | null>(null);
  useEffect(() => {
    const epDiaActual = (episodiosHoy ?? []).find((ep) => ep.tipo === "dia");
    const estadoActual = epDiaActual?.estado ?? null;
    const esTransicionAListo =
      estadoActual === "listo" &&
      (estadoEpDiaPrevio.current === null ||
        estadoEpDiaPrevio.current !== "listo");
    if (esTransicionAListo) {
      queryClient.invalidateQueries({ queryKey: ["pronostico"] });
    }
    estadoEpDiaPrevio.current = estadoActual;
  }, [episodiosHoy, queryClient]);

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
    epDia?.estado !== "listo" &&
    ((generarMutation.isPending && generarMutation.variables === "dia") ||
      epDia?.estado === "generando_guion" ||
      epDia?.estado === "generando_audio");
  const podcastDiaReproduciendo =
    !!epDia && pistaActual?.id === epDia.id && reproduciendo;

  // Safety net: si el pronóstico cargó con accionables vacíos pero el podcast
  // ya está listo, forzar re-fetch una vez para que el backend inyecte las
  // acciones reales del podcast.
  const revalidacionAccionablesDisparada = useRef(false);
  useEffect(() => {
    if (revalidacionAccionablesDisparada.current) return;
    if (!pronosticoDiario || !podcastDiaListo) return;

    const todosVacios = pronosticoDiario.momentos.every(
      (m) => !m.accionables || m.accionables.length === 0,
    );
    if (todosVacios) {
      revalidacionAccionablesDisparada.current = true;
      queryClient.invalidateQueries({ queryKey: ["pronostico"] });
    }
  }, [pronosticoDiario, podcastDiaListo, queryClient]);

  const [modalLectura, setModalLectura] = useState(false);
  const modalLecturaRef = useRef<HTMLDivElement>(null);

  const cerrarModalLectura = useCallback((e: MouseEvent) => {
    if (modalLecturaRef.current && !modalLecturaRef.current.contains(e.target as Node)) {
      setModalLectura(false);
    }
  }, []);

  useEffect(() => {
    if (!modalLectura) return;
    document.addEventListener("mousedown", cerrarModalLectura);
    return () => document.removeEventListener("mousedown", cerrarModalLectura);
  }, [modalLectura, cerrarModalLectura]);

  const podcastSemanaGenerando =
    (generarMutation.isPending && generarMutation.variables === "semana") ||
    mapaEpisodios.get("semana")?.estado === "generando_guion" ||
    mapaEpisodios.get("semana")?.estado === "generando_audio";

  // =========================================================================
  // DASHBOARD UNIFICADO — dark ciruela (mobile + desktop)
  // =========================================================================

  // Header mobile
  const metasHeaderMobile = [
    pronosticoDiario
      ? { icono: "wifi" as const, texto: `Energía ${pronosticoDiario.clima.energia}/10` }
      : { icono: "destello" as const, texto: "Pronóstico pendiente", tono: "rojo" as const },
    pronosticoDiario
      ? {
          icono: "luna" as const,
          texto: `Luna en ${pronosticoDiario.luna.signo}`,
          iconoCustom: (
            <IconoFaseLunar fase={pronosticoDiario.luna.fase} tamaño={14} />
          ),
        }
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
              aria-label={
                podcastDiaReproduciendo
                  ? "Pausar podcast del día"
                  : podcastDiaListo
                    ? "Reproducir podcast del día"
                    : "Generar podcast del día"
              }
            >
              {podcastDiaGenerando ? (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-[color:var(--color-acento)] border-t-transparent" />
              ) : (
                <Icono
                  nombre={
                    podcastDiaReproduciendo
                      ? "pausar"
                      : podcastDiaListo
                        ? "reproducir"
                        : "microfono"
                  }
                  tamaño={18}
                  peso="fill"
                />
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
              intuicion={pronosticoDiario.clima.intuicion ?? (pronosticoDiario.clima as any).conexion ?? 5}
              podcastListo={podcastDiaListo}
              podcastGenerando={podcastDiaGenerando ?? false}
              podcastReproduciendo={podcastDiaReproduciendo}
              accionablesPreparando={!podcastDiaListo}
              onReproducirPodcast={() => manejarPlayPodcast("dia")}
              onGenerarPodcast={() => generarMutation.mutate("dia")}
              onLeerDia={podcastDiaListo ? () => setModalLectura(true) : undefined}
            />

            {/* 2. Áreas de Vida */}
            <AreasVidaV2 areas={pronosticoDiario.areas} />

            {/* 3. Tendencia Cósmica — gráfica 15 días */}
            {datosTendencia.length >= 3 && (
              <GraficaTendencia datos={datosTendencia} fechaHoy={hoyISO} />
            )}
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

      {/* Modal Lectura del día */}
      {modalLectura && epDia?.guion_md && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center"
          style={{ background: "var(--shell-overlay)" }}
        >
          <div
            ref={modalLecturaRef}
            className="relative mx-4 max-h-[80vh] w-full max-w-[560px] overflow-hidden rounded-[24px] border backdrop-blur-2xl"
            style={{
              borderColor: "var(--shell-borde)",
              background: "var(--shell-panel)",
              boxShadow: "var(--shell-sombra-fuerte)",
            }}
          >
            <div className="flex items-center justify-between border-b px-6 py-4" style={{ borderColor: "var(--shell-borde)" }}>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[color:var(--color-acento)]">
                  Tu lectura del día
                </p>
                <h3 className="mt-1 text-[18px] font-semibold text-[color:var(--shell-texto)]">
                  {epDia.titulo}
                </h3>
              </div>
              <button
                onClick={() => setModalLectura(false)}
                className="flex h-8 w-8 items-center justify-center rounded-full transition-colors text-[color:var(--shell-texto-tenue)] hover:text-[color:var(--shell-texto)]"
                style={{ background: "var(--shell-superficie-suave)" }}
              >
                <Icono nombre="x" tamaño={18} />
              </button>
            </div>
            <div className="overflow-y-auto px-6 py-5" style={{ maxHeight: "calc(80vh - 80px)" }}>
              {epDia.guion_md.split("\n\n").map((parrafo, idx) => (
                <p
                  key={idx}
                  className="mb-4 text-[14px] leading-[1.7] text-[color:var(--shell-texto-secundario)] last:mb-0"
                >
                  {parrafo}
                </p>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
