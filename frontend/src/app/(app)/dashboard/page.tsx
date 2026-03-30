"use client";

import { useMemo } from "react";

import { Icono } from "@/componentes/ui/icono";
import { Esqueleto } from "@/componentes/ui/esqueleto";
import HeaderMobile from "@/componentes/layouts/header-mobile";
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
  const { data: _ } = usarPodcastHoy(hayEnProceso);

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

  // =========================================================================
  // DESKTOP — Dashboard V2 (dark theme)
  // =========================================================================
  if (!esMobile) {
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

    return (
      <div className="bg-[#16011b] min-h-full p-6 flex flex-col gap-6">
          {/* ---- PRONÓSTICO ---- */}
          {cargandoPronostico ? (
            <div className="flex flex-col gap-4">
              <Esqueleto className="h-[268px] rounded-[10px] !bg-white/5" />
              <Esqueleto className="h-[180px] rounded-[10px] !bg-white/5" />
              <Esqueleto className="h-[120px] rounded-[10px] !bg-white/5" />
            </div>
          ) : errorPronostico || !pronosticoDiario ? (
            /* Estado de error */
            <div className="rounded-[10px] relative overflow-hidden" style={{ minHeight: 220 }}>
              <div className="absolute inset-0 bg-gradient-to-br from-[#0f0826] via-[#1a0e3e] to-[#2D1B69]" />
              <div className="absolute -right-8 -top-8 h-44 w-44 rounded-full bg-violet-500/30 blur-3xl" />
              <div className="absolute left-1/4 -bottom-10 h-36 w-36 rounded-full bg-fuchsia-500/20 blur-3xl" />
              <div className="relative z-10 m-4 rounded-xl bg-white/[0.07] backdrop-blur-xl border border-white/[0.12] p-5">
                <p className="text-violet-300/60 text-[11px] font-semibold tracking-widest uppercase mb-2">
                  Pronóstico Cósmico
                </p>
                <p className="text-white text-[18px] font-semibold leading-snug mb-2">
                  {autenticado
                    ? "No pudimos generar tu pronóstico"
                    : "Iniciá sesión para ver tu pronóstico"}
                </p>
                <p className="text-violet-200/50 text-[14px] mb-4 leading-relaxed">
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
              {/* 1. Hero Section */}
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
            <Esqueleto className="h-[200px] rounded-[10px] !bg-white/5" />
          ) : pronosticoSemanal?.semana ? (
            <SemanaV2
              semana={pronosticoSemanal.semana}
              onGenerarPodcastSemana={() => generarMutation.mutate("semana")}
              generandoPodcast={podcastSemanaGenerando ?? false}
            />
          ) : null}
      </div>
    );
  }

  // =========================================================================
  // MOBILE — Dashboard V1 (tema claro, sin cambios)
  // =========================================================================
  return (
    <div className="flex flex-col h-full min-h-0">
      {/* Header mobile */}
      <HeaderMobile>
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-full bg-gradient-to-br from-violet-500 to-violet-700 flex items-center justify-center text-white text-xs font-bold shrink-0">
            {nombreSaludo[0]}
          </div>
          <div>
            <p className="text-[15px] font-semibold text-[#2C2926]">
              {saludo}, {nombreSaludo}
            </p>
            <p className="text-[11px] text-[#8A8580] capitalize">{fechaHoy}</p>
          </div>
        </div>
      </HeaderMobile>

      {/* Contenido principal — fondo con orbes decorativos para glass */}
      <section className="flex-1 scroll-sutil relative p-4 lg:p-6 flex flex-col gap-4">
        {/* Fondo base + orbes decorativos */}
        <div className="absolute inset-0 bg-[#F8F6FF] pointer-events-none" />
        <div className="absolute top-0 right-0 w-64 h-64 rounded-full bg-violet-300/15 blur-3xl pointer-events-none" />
        <div className="absolute bottom-1/3 -left-20 w-56 h-56 rounded-full bg-fuchsia-300/10 blur-3xl pointer-events-none" />
        <div className="absolute top-1/2 right-1/4 w-40 h-40 rounded-full bg-violet-400/8 blur-2xl pointer-events-none" />

        {/* Todo el contenido es relative z-10 para estar encima de orbes */}
        <div className="relative z-10 flex flex-col gap-4">
          {/* ---- PRONÓSTICO ---- */}
          {cargandoPronostico ? (
            <div className="flex flex-col gap-3">
              <Esqueleto className="h-[240px] rounded-2xl !bg-gradient-to-r !from-violet-200/30 !via-violet-100/20 !to-violet-200/30" />
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-2">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <Esqueleto key={i} className="h-[70px] rounded-xl !bg-violet-100/30" />
                ))}
              </div>
              <div className="flex gap-2">
                {[1, 2, 3].map((i) => (
                  <Esqueleto key={i} className="h-[65px] flex-1 rounded-xl !bg-violet-100/30" />
                ))}
              </div>
            </div>
          ) : errorPronostico || !pronosticoDiario ? (
            /* Estado de error / sin datos — hero prominente */
            <div className="rounded-2xl relative overflow-hidden" style={{ minHeight: 220 }}>
              <div className="absolute inset-0 bg-gradient-to-br from-[#0f0826] via-[#1a0e3e] to-[#2D1B69]" />
              <div className="absolute -right-8 -top-8 h-44 w-44 rounded-full bg-violet-500/30 blur-3xl" />
              <div className="absolute left-1/4 -bottom-10 h-36 w-36 rounded-full bg-fuchsia-500/20 blur-3xl" />

              <div className="relative z-10 m-3 rounded-xl bg-white/[0.07] backdrop-blur-xl border border-white/[0.12] p-5">
                <p className="text-violet-300/60 text-[11px] font-semibold tracking-widest uppercase mb-2">
                  Pronóstico Cósmico
                </p>
                <p className="text-white text-[18px] font-semibold leading-snug mb-2">
                  {autenticado
                    ? "No pudimos generar tu pronóstico"
                    : "Iniciá sesión para ver tu pronóstico"}
                </p>
                <p className="text-violet-200/50 text-[14px] mb-4 leading-relaxed">
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
              <HeroClima
                clima={pronosticoDiario.clima}
                luna={pronosticoDiario.luna}
                numeroPersonal={pronosticoDiario.numero_personal}
              />
              <AreasVida areas={pronosticoDiario.areas} />
              <MomentosClave momentos={pronosticoDiario.momentos} />
              <AlertaCosmica alertas={pronosticoDiario.alertas} />
            </>
          )}

          {/* Vista semanal */}
          {cargandoSemanal ? (
            <div className="flex gap-1.5 overflow-hidden">
              {[1, 2, 3, 4, 5, 6, 7].map((i) => (
                <Esqueleto key={i} className="h-[110px] min-w-[72px] rounded-xl !bg-violet-100/30" />
              ))}
            </div>
          ) : pronosticoSemanal?.semana ? (
            <VistaSemana semana={pronosticoSemanal.semana} />
          ) : null}

          {/* ---- PODCASTS ---- */}
          <div>
            <h3 className="text-[14px] font-semibold text-[#2C2926] mb-2.5">
              Podcasts y Lecturas
            </h3>
            <div className="flex flex-col gap-2">
              {cargandoPodcasts
                ? [1, 2, 3].map((i) => (
                    <Esqueleto key={i} className="h-[72px] rounded-xl !bg-violet-100/30" />
                  ))
                : TIPOS.map((tipo) => {
                    const ep = mapaEpisodios.get(tipo);
                    const config = TIPO_CONFIG[tipo];
                    const estado = obtenerEstadoCard(tipo);
                    const estaReproduciendo =
                      ep && pistaActual?.id === ep.id && reproduciendo;
                    const estaGenerandoEste =
                      generarMutation.isPending &&
                      generarMutation.variables === tipo;

                    return (
                      <div
                        key={tipo}
                        className="rounded-xl bg-white/70 backdrop-blur-xl border border-white/50 p-2.5 flex items-center gap-3 group shadow-[0_2px_8px_rgba(124,77,255,0.08)]"
                      >
                        <button
                          onClick={() => manejarPlayPodcast(tipo)}
                          className="relative h-[56px] w-[56px] shrink-0 rounded-lg overflow-hidden"
                          disabled={estado === "generando" || estaGenerandoEste}
                        >
                          <div
                            className={`absolute inset-0 bg-gradient-to-br ${config.gradiente} flex items-center justify-center`}
                          >
                            {estado === "generando" || estaGenerandoEste ? (
                              <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                            ) : (
                              <Icono
                                nombre={config.icono}
                                tamaño={22}
                                peso="fill"
                                className="text-white/80 group-hover:opacity-0 transition-opacity"
                              />
                            )}
                          </div>
                          {estado !== "generando" && !estaGenerandoEste && (
                            <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity">
                              <div className="h-8 w-8 rounded-full bg-white flex items-center justify-center">
                                <Icono
                                  nombre={
                                    estado === "listo"
                                      ? estaReproduciendo
                                        ? "pausar"
                                        : "reproducir"
                                      : "destello"
                                  }
                                  tamaño={14}
                                  peso="fill"
                                  className="text-[#1A1128]"
                                />
                              </div>
                            </div>
                          )}
                        </button>

                        <div className="flex-1 min-w-0">
                          <p className="text-[13px] font-semibold text-[#2C2926] leading-tight mb-0.5">
                            {ep?.titulo ?? config.etiqueta}
                          </p>
                          <p className="text-[11px] text-[#8A8580] leading-snug">
                            {estado === "generando" || estaGenerandoEste
                              ? ep?.estado === "generando_audio"
                                ? "Generando audio..."
                                : "Escribiendo guión..."
                              : estado === "error"
                                ? "Error al generar — tocá para reintentar"
                                : estado === "listo"
                                  ? config.subtitulo
                                  : "Tocá para generar tu podcast"}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-[10px] px-2 py-0.5 rounded-full font-medium bg-violet-100/80 text-violet-600">
                              Podcast
                            </span>
                            <span className="text-[10px] text-[#B3ADA7]">
                              {ep?.duracion_segundos
                                ? `${Math.floor(ep.duracion_segundos / 60)} min`
                                : tipo === "dia"
                                  ? "~3 min"
                                  : tipo === "semana"
                                    ? "~5 min"
                                    : "~7 min"}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
            </div>
          </div>

          {/* Consejo HD */}
          {pronosticoDiario?.consejo_hd && (
            <ConsejoHD consejo={pronosticoDiario.consejo_hd} />
          )}
        </div>
      </section>
    </div>
  );
}
