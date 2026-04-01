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

// --- Componentes v1 (mobile) ---
import { HeroClima } from "@/componentes/pronostico/hero-clima";
import { AreasVida } from "@/componentes/pronostico/areas-vida";
import { MomentosClave } from "@/componentes/pronostico/momentos-clave";
import { AlertaCosmica } from "@/componentes/pronostico/alerta-cosmica";
import { VistaSemana } from "@/componentes/pronostico/vista-semana";
import { ConsejoHD } from "@/componentes/pronostico/consejo-hd";

// --- Componentes v2 (desktop dark) ---
import { HeroSeccion } from "@/componentes/dashboard-v2/hero-seccion";
import { MensajeClave } from "@/componentes/dashboard-v2/mensaje-clave";
import { AreasVidaV2 } from "@/componentes/dashboard-v2/areas-vida-v2";
import { SemanaV2 } from "@/componentes/dashboard-v2/semana-v2";

// ---------------------------------------------------------------------------
// Config visual de podcasts
// ---------------------------------------------------------------------------
const TIPO_CONFIG: Record<
  TipoPodcast,
  {
    etiqueta: string;
    subtitulo: string;
    icono: "sol" | "destello" | "luna";
    gradiente: string;
  }
> = {
  dia: {
    etiqueta: "Momento Clave de tu Día",
    subtitulo: "Tu podcast diario para arrancar con claridad cósmica",
    icono: "sol",
    gradiente: "from-[#7C4DFF] to-[#B388FF]",
  },
  semana: {
    etiqueta: "Tu Semana Cósmica",
    subtitulo: "Energías y tránsitos clave de tu semana",
    icono: "destello",
    gradiente: "from-[#4A2D8C] to-[#7C4DFF]",
  },
  mes: {
    etiqueta: "Tu Mes Cósmico",
    subtitulo: "Resumen mensual profundo con las claves de tu ciclo",
    icono: "luna",
    gradiente: "from-[#2D1B69] to-[#4A2D8C]",
  },
};

const TIPOS: TipoPodcast[] = ["dia", "semana", "mes"];

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

  const { data: episodiosHoy, isLoading: cargandoPodcasts } = usarPodcastHoy(
    generarMutation.isPending
  );

  const { setPistaActual, pistaActual, reproduciendo, toggleReproduccion } =
    useStoreUI();

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

  const hayEnProceso = (episodiosHoy ?? []).some(
    (ep) => ep.estado === "generando_guion" || ep.estado === "generando_audio"
  );
  usarPodcastHoy(hayEnProceso);

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
          subtitulo: `Podcast ${config.etiqueta}`,
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

  function obtenerEstadoCard(tipo: TipoPodcast) {
    const ep = mapaEpisodios.get(tipo);
    if (!ep) return "disponible";
    if (ep.estado === "listo") return "listo";
    if (ep.estado === "error") return "error";
    return "generando";
  }

  const nombreSaludo = (usuario?.nombre ?? "Viajero")
    .split(" ")[0]
    .toLowerCase()
    .replace(/^\w/, (c: string) => c.toUpperCase());

  const horaActual = new Date().getHours();
  const saludo =
    horaActual < 12
      ? "Buenos dias"
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
    <div className="flex flex-col h-full min-h-0">
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
              className="flex h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-white/10 text-[#B388FF] transition-colors disabled:cursor-not-allowed disabled:opacity-70"
              aria-label={podcastDiaListo ? "Reproducir podcast del día" : "Generar podcast del día"}
            >
              {podcastDiaGenerando ? (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-[#B388FF] border-t-transparent" />
              ) : (
                <Icono nombre={podcastDiaListo ? "reproducir" : "microfono"} tamaño={18} peso="fill" />
              )}
            </button>
          }
        />
      )}

      {/* Contenido principal — dark theme unificado */}
      <section className="flex-1 scroll-sutil-dark p-4 lg:p-6 flex flex-col gap-4 lg:gap-6">
        {/* ---- PRONÓSTICO ---- */}
        {cargandoPronostico ? (
          <div className="flex flex-col gap-3 lg:gap-4">
            <Esqueleto className="h-[200px] lg:h-[268px] rounded-[10px] !bg-white/5" />
            <Esqueleto className="h-[140px] lg:h-[180px] rounded-[10px] !bg-white/5" />
            <Esqueleto className="h-[100px] lg:h-[120px] rounded-[10px] !bg-white/5" />
          </div>
        ) : errorPronostico || !pronosticoDiario ? (
          <div className="rounded-[10px] relative overflow-hidden" style={{ minHeight: 200 }}>
            <div className="absolute inset-0 bg-gradient-to-br from-[#0f0826] via-[#1a0e3e] to-[#2D1B69]" />
            <div className="absolute -right-8 -top-8 h-44 w-44 rounded-full bg-violet-500/30 blur-3xl" />
            <div className="absolute left-1/4 -bottom-10 h-36 w-36 rounded-full bg-fuchsia-500/20 blur-3xl" />
            <div className="relative z-10 m-3 lg:m-4 rounded-xl bg-white/[0.07] backdrop-blur-xl border border-white/[0.12] p-4 lg:p-5">
              <p className="text-violet-300/60 text-[11px] font-semibold tracking-widest uppercase mb-2">
                Pronóstico Cósmico
              </p>
              <p className="text-white text-[16px] lg:text-[18px] font-semibold leading-snug mb-2">
                {autenticado
                  ? "No pudimos generar tu pronóstico"
                  : "Iniciá sesión para ver tu pronóstico"}
              </p>
              <p className="text-violet-200/50 text-[13px] lg:text-[14px] mb-4 leading-relaxed">
                {autenticado
                  ? "Asegurate de tener un perfil con tus datos de nacimiento."
                  : "Necesitás un perfil para personalizar tu pronóstico."}
              </p>
              {autenticado && (
                <button
                  onClick={() => reintentarPronostico()}
                  className="px-5 py-2.5 rounded-xl bg-white/[0.1] backdrop-blur-md text-white text-[14px] font-medium hover:bg-white/[0.18] transition-colors border border-white/[0.12]"
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
            />

            {/* 2. Mensaje Clave */}
            <MensajeClave
              nombreUsuario={nombreSaludo}
              titulo={pronosticoDiario.clima.titulo}
              fraseSintesis={pronosticoDiario.clima.frase_sintesis}
            />

            {/* 3. Áreas de Vida */}
            <AreasVidaV2 areas={pronosticoDiario.areas} />
          </>
        )}

        {/* 4. Pronóstico Semanal */}
        {cargandoSemanal ? (
          <Esqueleto className="h-[160px] lg:h-[200px] rounded-[10px] !bg-white/5" />
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
