"use client";

import { useMemo } from "react";

import { Icono } from "@/componentes/ui/icono";
import { Esqueleto } from "@/componentes/ui/esqueleto";
import HeaderMobile from "@/componentes/layouts/header-mobile";
import { usarTransitos, usarPodcastHoy, usarGenerarPodcast } from "@/lib/hooks";
import { useStoreUI, type PistaReproduccion } from "@/lib/stores/store-ui";
import { useStoreAuth } from "@/lib/stores/store-auth";
import type { PodcastEpisodio, TipoPodcast } from "@/lib/tipos";

// ---------------------------------------------------------------------------
// Colores por planeta para transitos rapidos
// ---------------------------------------------------------------------------
const COLORES_PLANETA: Record<string, string> = {
  Sol: "#D4A234",
  Luna: "#B388FF",
  Mercurio: "#E57373",
  Venus: "#4CAF50",
  Marte: "#EF5350",
  Jupiter: "#FF9800",
  Saturno: "#78909C",
};

// ---------------------------------------------------------------------------
// Config visual de podcasts por tipo
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
    gradiente: "from-[#7C4DFF] to-[#D4A234]",
  },
  semana: {
    etiqueta: "Tu Semana Cósmica",
    subtitulo: "Energías y tránsitos clave de tu semana",
    icono: "destello",
    gradiente: "from-[#4A2D8C] to-[#B388FF]",
  },
  mes: {
    etiqueta: "Tu Mes Cósmico",
    subtitulo: "Resumen mensual profundo con las claves de tu ciclo",
    icono: "luna",
    gradiente: "from-[#2D1B69] to-[#7C4DFF]",
  },
};

const TIPOS: TipoPodcast[] = ["dia", "semana", "mes"];

// ---------------------------------------------------------------------------
// Componente principal: Dashboard
// ---------------------------------------------------------------------------
export default function PaginaDashboard() {
  const { usuario } = useStoreAuth();
  const { data: transitos, isLoading: cargandoTransitos } = usarTransitos();
  const generarMutation = usarGenerarPodcast();

  // Polling rápido si hay episodios generándose
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

  const lunaTransito = transitos?.planetas?.find(
    (p: { nombre: string }) => p.nombre === "Luna"
  );

  const mapaEpisodios = useMemo(
    () => new Map((episodiosHoy ?? []).map((ep) => [ep.tipo, ep])),
    [episodiosHoy]
  );

  // Polling rápido si hay episodios en proceso
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

  return (
    <div className="flex flex-col lg:flex-row h-full min-h-0 lg:overflow-hidden">
      {/* Header mobile — saludo personalizado */}
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

      {/* ================================================================ */}
      {/* Panel Central                                                     */}
      {/* ================================================================ */}
      <section className="flex-1 scroll-sutil bg-[#FAFAFA] p-5 lg:p-[28px_32px] flex flex-col gap-6">
        {/* Header desktop */}
        <div className="hidden lg:flex items-center justify-between">
          <h1 className="text-[22px] font-semibold text-[#2C2926] tracking-tight">
            Influencias Cósmicas de Hoy
          </h1>
          <p className="text-[13px] text-[#8A8580] capitalize hidden sm:block">
            {fechaHoy}
          </p>
        </div>

        {/* --- Hero Lunar --- */}
        <div className="rounded-[20px] min-h-[160px] shrink-0 bg-gradient-to-b from-[#2D1B69] via-[#4A2D8C] to-[#7C4DFF] px-6 sm:px-8 py-7 flex items-center justify-between overflow-hidden">
          <div className="flex-1 min-w-0 mr-6">
            <p className="text-violet-300 text-[11px] font-semibold tracking-widest uppercase mb-2">
              Tránsito Lunar
            </p>
            {cargandoTransitos ? (
              <Esqueleto className="h-7 w-48 bg-white/20" />
            ) : lunaTransito ? (
              <>
                <h2 className="text-white text-[26px] font-light leading-tight">
                  Luna en {lunaTransito.signo} —{" "}
                  {Math.floor(lunaTransito.grado_en_signo)}°
                </h2>
                <p className="text-violet-300/80 text-sm mt-2 hidden sm:block">
                  La Luna transita por {lunaTransito.signo}, influyendo en las
                  emociones y la intuición del momento.
                </p>
              </>
            ) : (
              <h2 className="text-white text-[26px] font-light">
                Cargando datos lunares...
              </h2>
            )}
          </div>

          <div className="h-24 w-24 rounded-full bg-white/[0.08] items-center justify-center shrink-0 hidden sm:flex">
            <Icono
              nombre="luna"
              tamaño={48}
              peso="fill"
              className="text-[#F0D68A]"
            />
          </div>
        </div>

        {/* --- Podcasts y Lecturas --- */}
        <div>
          <h2 className="text-lg font-bold text-[#2C2926] mb-4">
            Podcasts y Lecturas
          </h2>
          <div className="flex flex-col gap-4">
            {cargandoPodcasts
              ? [1, 2, 3].map((i) => (
                  <Esqueleto key={i} className="h-[88px] rounded-[16px]" />
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
                      className="bg-white rounded-[16px] p-3.5 flex items-center gap-3.5 group"
                    >
                      {/* Cover con boton play */}
                      <button
                        onClick={() => manejarPlayPodcast(tipo)}
                        className="relative h-[72px] w-[72px] shrink-0 rounded-xl overflow-hidden"
                        disabled={
                          estado === "generando" || estaGenerandoEste
                        }
                      >
                        <div
                          className={`absolute inset-0 bg-gradient-to-br ${config.gradiente} flex items-center justify-center`}
                        >
                          {estado === "generando" || estaGenerandoEste ? (
                            <div className="h-6 w-6 animate-spin rounded-full border-2 border-white border-t-transparent" />
                          ) : (
                            <Icono
                              nombre={config.icono}
                              tamaño={28}
                              peso="fill"
                              className="text-white/80 group-hover:opacity-0 transition-opacity"
                            />
                          )}
                        </div>
                        {estado !== "generando" && !estaGenerandoEste && (
                          <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity">
                            <div className="h-10 w-10 rounded-full bg-white flex items-center justify-center">
                              <Icono
                                nombre={
                                  estado === "listo"
                                    ? estaReproduciendo
                                      ? "pausar"
                                      : "reproducir"
                                    : "destello"
                                }
                                tamaño={18}
                                peso="fill"
                                className="text-[#1A1128]"
                              />
                            </div>
                          </div>
                        )}
                      </button>

                      <div className="flex-1 min-w-0 flex flex-col gap-1.5">
                        <p className="text-[15px] font-semibold text-[#2C2926] leading-tight">
                          {ep?.titulo ?? config.etiqueta}
                        </p>
                        <p className="text-xs text-[#8A8580] leading-snug">
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
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] px-2 py-0.5 rounded-full font-medium bg-violet-100 text-violet-600">
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

        {/* --- Tránsitos Rápidos --- */}
        <div>
          <h2 className="text-lg font-semibold text-[#2C2926] mb-3">
            Tránsitos Rápidos
          </h2>
          <div className="flex flex-col gap-3">
            {cargandoTransitos ? (
              <>
                <Esqueleto className="h-11 w-full rounded-xl" />
                <Esqueleto className="h-11 w-full rounded-xl" />
                <Esqueleto className="h-11 w-full rounded-xl" />
                <Esqueleto className="h-11 w-full rounded-xl" />
              </>
            ) : transitos?.planetas ? (
              transitos.planetas
                .slice(0, 4)
                .map(
                  (p: {
                    nombre: string;
                    grado_en_signo: number;
                    signo: string;
                  }) => (
                    <div
                      key={p.nombre}
                      className="flex items-center justify-between bg-[#F5F0FF] rounded-xl px-4 py-3"
                    >
                      <div className="flex items-center gap-2">
                        <div
                          className="h-2 w-2 rounded-full shrink-0"
                          style={{
                            backgroundColor:
                              COLORES_PLANETA[p.nombre] ?? "#9E9E9E",
                          }}
                        />
                        <span className="text-[13px] font-medium text-[#2C2926]">
                          {p.nombre}
                        </span>
                      </div>
                      <span className="text-xs text-[#4A2D8C]">
                        {Math.floor(p.grado_en_signo)}° {p.signo}
                      </span>
                    </div>
                  )
                )
            ) : (
              <p className="text-sm text-[#8A8580]">
                No hay datos de tránsitos disponibles.
              </p>
            )}
          </div>
        </div>
      </section>

      {/* ================================================================ */}
      {/* Panel Derecho                                                     */}
      {/* ================================================================ */}
      <aside className="hidden lg:flex w-[300px] flex-shrink-0 bg-white flex-col border-l border-[#E8E4E0]/40 scroll-sutil">
        {/* --- Info Panel --- */}
        <div className="p-6 shrink-0">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-[15px] font-semibold text-[#2C2926]">
              Detalle del Tránsito
            </h3>
            <button className="text-[#8A8580] hover:text-[#2C2926] transition-colors">
              <Icono nombre="x" tamaño={18} />
            </button>
          </div>

          <div className="h-px bg-[#E8E4E0] mb-5" />

          <div className="flex flex-col gap-4">
            <div>
              <p className="text-[11px] font-semibold text-[#7C4DFF] uppercase tracking-wider mb-1.5">
                Mercurio Retrógrado en Aries
              </p>
              <p className="text-[13px] text-[#2C2926] leading-relaxed">
                Mercurio retrógrado en Aries afecta directamente tu Casa 5
                natal. Esto genera revisiones en proyectos creativos, relaciones
                románticas y la expresión personal.
              </p>
            </div>

            <div>
              <p className="text-[11px] font-semibold text-[#B8860B] uppercase tracking-wider mb-1.5">
                Impacto en tu Diseño Humano
              </p>
              <p className="text-[13px] text-[#2C2926] leading-relaxed">
                Como Generadora Sacral 2/4, este tránsito activa tu Puerta 12
                (Canal de la Prudencia). Tu autoridad sacral te pide esperar
                antes de comprometerte.
              </p>
            </div>

            <div>
              <p className="text-[11px] font-semibold text-[#4A2D8C] uppercase tracking-wider mb-1.5">
                Resonancia Numerológica
              </p>
              <p className="text-[13px] text-[#2C2926] leading-relaxed">
                Día personal 5 (cambio + libertad) en un año 9 (cierre). La
                vibración del 5 te empuja a moverte, pero el 9 te pide soltar.
              </p>
            </div>
          </div>
        </div>

        {/* --- Chat IA --- */}
        <div className="bg-[#F5F0FF] flex flex-col border-t border-[#E8E4E0]/40 shrink-0">
          {/* Header chat */}
          <div className="px-6 py-4 bg-white border-b border-[#E8E4E0]/40">
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-full bg-gradient-to-b from-[#7C4DFF] to-[#2D1B69] flex items-center justify-center">
                <Icono
                  nombre="destello"
                  tamaño={16}
                  peso="fill"
                  className="text-[#F0D68A]"
                />
              </div>
              <div>
                <p className="text-sm font-semibold text-[#2C2926]">
                  ASTRA AI
                </p>
                <p className="text-[11px] text-[#8A8580]">
                  Tu guía cósmica personal
                </p>
              </div>
            </div>
          </div>

          {/* Mensajes */}
          <div className="px-6 py-4 flex flex-col gap-4">
            <div className="flex gap-2.5">
              <div className="h-7 w-7 rounded-full bg-[#7C4DFF] flex items-center justify-center shrink-0 mt-0.5">
                <Icono
                  nombre="destello"
                  tamaño={14}
                  peso="fill"
                  className="text-[#F0D68A]"
                />
              </div>
              <div className="flex-1 min-w-0">
                <div className="bg-white rounded-[4px_14px_14px_14px] px-4 py-3 shadow-[0_1px_4px_rgba(0,0,0,0.04)]">
                  <p className="text-[13px] text-[#2C2926] leading-relaxed">
                    ¡Hola! Soy tu asistente cósmico. Puedo ayudarte a
                    interpretar tu carta natal, tránsitos y diseño humano. ¿En
                    qué te puedo ayudar hoy?
                  </p>
                </div>
                <p className="text-[10px] text-[#B3ADA7] mt-1 ml-1">
                  ASTRA AI
                </p>
              </div>
            </div>

            <div className="flex justify-end">
              <div className="max-w-[80%]">
                <div className="bg-[#7C4DFF] rounded-[14px_4px_14px_14px] px-4 py-3">
                  <p className="text-[13px] text-white leading-relaxed">
                    ¿Qué significa tener Luna en mi signo ascendente?
                  </p>
                </div>
              </div>
            </div>

            <div className="flex gap-2.5">
              <div className="h-7 w-7 rounded-full bg-[#7C4DFF] flex items-center justify-center shrink-0 mt-0.5">
                <Icono
                  nombre="destello"
                  tamaño={14}
                  peso="fill"
                  className="text-[#F0D68A]"
                />
              </div>
              <div className="flex-1 min-w-0">
                <div className="bg-white rounded-[4px_14px_14px_14px] px-4 py-3 shadow-[0_1px_4px_rgba(0,0,0,0.04)]">
                  <p className="text-[13px] text-[#2C2926] leading-relaxed">
                    Cuando la Luna transita por tu signo ascendente, se
                    intensifica tu sensibilidad emocional y la manera en que los
                    demás te perciben. Es un momento ideal para la
                    autorreflexión.
                  </p>
                </div>
                <p className="text-[10px] text-[#B3ADA7] mt-1 ml-1">
                  ASTRA AI
                </p>
              </div>
            </div>
          </div>

          {/* Input chat */}
          <div className="px-6 py-4 bg-white border-t border-[#E8E4E0]/40">
            <div className="flex items-center gap-2.5">
              <div className="flex-1 h-10 px-3.5 rounded-xl bg-[#F5F0FF] flex items-center">
                <span className="text-[13px] text-[#8A8580]">
                  Preguntale algo a ASTRA AI...
                </span>
              </div>
              <button className="h-10 w-10 rounded-xl bg-[#7C4DFF] flex items-center justify-center text-white shrink-0">
                <Icono nombre="enviarMensaje" tamaño={18} />
              </button>
            </div>
          </div>
        </div>
      </aside>
    </div>
  );
}
