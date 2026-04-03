"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

import { Icono, type NombreIcono } from "@/componentes/ui/icono";
import {
  usarMiPerfil,
  usarGenerarPodcast,
  usarPodcastHoy,
  usarPronosticoDiario,
} from "@/lib/hooks";
import { useStoreAuth } from "@/lib/stores/store-auth";
import {
  useStoreUI,
  type PistaReproduccion,
} from "@/lib/stores/store-ui";
import type { PodcastEpisodio, TipoPodcast } from "@/lib/tipos";
import { esPlanPago, obtenerEtiquetaPlan } from "@/lib/utilidades/planes";

interface ContextoRuta {
  etiqueta: string;
  titulo: string;
  descripcion: string;
  icono: NombreIcono;
}

interface EstadoCabecera {
  etiqueta?: string;
  titulo: string;
  descripcion?: string;
  meta?: string;
  icono: NombreIcono;
  tonoIcono: "violeta" | "rojo";
}

const CONFIG_TIPO_PODCAST: Record<
  TipoPodcast,
  { icono: "sol" | "destello" | "luna"; gradiente: string }
> = {
  dia: {
    icono: "sol",
    gradiente: "from-[#7C4DFF] to-[#B388FF]",
  },
  semana: {
    icono: "destello",
    gradiente: "from-[#4A2D8C] to-[#7C4DFF]",
  },
  mes: {
    icono: "luna",
    gradiente: "from-[#2D1B69] to-[#4A2D8C]",
  },
};

const TIPOS_MENU_PODCAST: TipoPodcast[] = ["dia", "semana", "mes"];

const CONFIG_MENU_PODCAST: Record<
  TipoPodcast,
  {
    titulo: string;
    icono: "sol" | "destello" | "luna";
    gradiente: string;
  }
> = {
  dia: {
    titulo: "Día de hoy",
    icono: "sol",
    gradiente: "from-[#7C4DFF] to-[#B388FF]",
  },
  semana: {
    titulo: "Tu semana cósmica",
    icono: "destello",
    gradiente: "from-[#4A2D8C] to-[#7C4DFF]",
  },
  mes: {
    titulo: "Tu mes cósmico",
    icono: "luna",
    gradiente: "from-[#2D1B69] to-[#7C4DFF]",
  },
};

const CONTEXTOS_RUTA: Array<{
  coincide: (pathname: string) => boolean;
  contexto: ContextoRuta;
}> = [
  {
    coincide: (pathname) => pathname === "/dashboard",
    contexto: {
      etiqueta: "Centro diario",
      titulo: "Resumen personal",
      descripcion: "Pronóstico, ritmo y acción inmediata",
      icono: "destello",
    },
  },
  {
    coincide: (pathname) => pathname.startsWith("/podcast"),
    contexto: {
      etiqueta: "Audio guiado",
      titulo: "Podcasts personalizados",
      descripcion: "Escuchá tus lecturas por día, semana o mes",
      icono: "microfono",
    },
  },
  {
    coincide: (pathname) => pathname.startsWith("/carta-natal"),
    contexto: {
      etiqueta: "Mapa base",
      titulo: "Carta astral",
      descripcion: "Planetas, casas y aspectos de origen",
      icono: "estrella",
    },
  },
  {
    coincide: (pathname) => pathname.startsWith("/diseno-humano"),
    contexto: {
      etiqueta: "Arquitectura energética",
      titulo: "Diseño humano",
      descripcion: "Centros, canales y autoridad interna",
      icono: "hexagono",
    },
  },
  {
    coincide: (pathname) => pathname.startsWith("/numerologia"),
    contexto: {
      etiqueta: "Clave vibracional",
      titulo: "Numerología",
      descripcion: "Tus ciclos, senderos y números personales",
      icono: "numeral",
    },
  },
  {
    coincide: (pathname) => pathname.startsWith("/transitos"),
    contexto: {
      etiqueta: "Tiempo real",
      titulo: "Tránsitos planetarios",
      descripcion: "Lo que se mueve ahora sobre tu carta",
      icono: "planeta",
    },
  },
  {
    coincide: (pathname) => pathname.startsWith("/calendario-cosmico"),
    contexto: {
      etiqueta: "Ritmo del cielo",
      titulo: "Calendario cósmico",
      descripcion: "Observá tus ventanas favorables del mes",
      icono: "calendario",
    },
  },
  {
    coincide: (pathname) => pathname.startsWith("/retorno-solar"),
    contexto: {
      etiqueta: "Ciclo anual",
      titulo: "Revolución solar",
      descripcion: "El tono de tu año y sus aprendizajes",
      icono: "retornoSolar",
    },
  },
  {
    coincide: (pathname) => pathname.startsWith("/suscripcion"),
    contexto: {
      etiqueta: "Plan y beneficios",
      titulo: "Suscripción",
      descripcion: "Tu acceso actual y próximos pasos",
      icono: "corona",
    },
  },
  {
    coincide: (pathname) => pathname.startsWith("/perfil"),
    contexto: {
      etiqueta: "Identidad ASTRA",
      titulo: "Mi perfil",
      descripcion: "Tus datos, cuenta y configuración",
      icono: "usuario",
    },
  },
  {
    coincide: (pathname) => pathname.startsWith("/descubrir"),
    contexto: {
      etiqueta: "Explorar",
      titulo: "Descubrir",
      descripcion: "Accedé rápido a todos tus módulos",
      icono: "brujula",
    },
  },
];

function obtenerContextoRuta(pathname: string): ContextoRuta {
  return (
    CONTEXTOS_RUTA.find((item) => item.coincide(pathname))?.contexto ?? {
      etiqueta: "Experiencia ASTRA",
      titulo: "Tu espacio personal",
      descripcion: "Herramientas, guía y seguimiento",
      icono: "destello",
    }
  );
}

function formatearNombre(nombre: string): string {
  return nombre
    .toLowerCase()
    .replace(/\b\w/g, (caracter: string) => caracter.toUpperCase());
}

function formatearDuracion(segundos: number): string {
  const total = Math.max(0, Math.floor(segundos));
  const minutos = Math.floor(total / 60);
  const resto = total % 60;
  return `${minutos}:${resto.toString().padStart(2, "0")}`;
}

function obtenerClasesIcono(tono: EstadoCabecera["tonoIcono"]): string {
  switch (tono) {
    case "rojo":
      return "border-[#E57373]/20 bg-[#E57373]/12 text-[#FFC7C7]";
    default:
      return "border-[#B388FF]/20 bg-[#7C4DFF]/16 text-[#E8DAFF]";
  }
}

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { usuario, cerrarSesion } = useStoreAuth();
  const {
    sidebarColapsado,
    toggleSidebarColapsado,
    pistaActual,
    reproduciendo,
    progresoSegundos,
    setPistaActual,
    toggleReproduccion,
  } = useStoreUI();

  const { data: perfil } = usarMiPerfil();
  const { data: pronosticoDiario } = usarPronosticoDiario();
  const { data: episodiosHoy = [] } = usarPodcastHoy(true);
  const generarPodcast = usarGenerarPodcast();

  const [menuUsuarioAbierto, setMenuUsuarioAbierto] = useState(false);
  const [menuPodcastsAbierto, setMenuPodcastsAbierto] = useState(false);
  const refMenuUsuario = useRef<HTMLDivElement>(null);
  const refMenuPodcasts = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function manejarClickFuera(evento: MouseEvent) {
      const target = evento.target as Node;

      if (
        refMenuUsuario.current &&
        !refMenuUsuario.current.contains(target)
      ) {
        setMenuUsuarioAbierto(false);
      }

      if (
        refMenuPodcasts.current &&
        !refMenuPodcasts.current.contains(target)
      ) {
        setMenuPodcastsAbierto(false);
      }
    }

    document.addEventListener("mousedown", manejarClickFuera);
    return () => document.removeEventListener("mousedown", manejarClickFuera);
  }, []);

  const nombreRaw = perfil?.nombre ?? usuario?.nombre ?? "Usuario";
  const nombreUsuario = formatearNombre(nombreRaw);
  const etiquetaPlan = obtenerEtiquetaPlan(usuario?.plan_slug, usuario?.plan_nombre);
  const esPremium = esPlanPago(usuario?.plan_slug);
  const contextoRuta = useMemo(() => obtenerContextoRuta(pathname), [pathname]);

  const mapaEpisodios = useMemo(
    () => new Map(episodiosHoy.map((episodio) => [episodio.tipo, episodio])),
    [episodiosHoy]
  );

  const episodioDelDia = mapaEpisodios.get("dia");
  const hayPodcastEnProceso =
    generarPodcast.isPending ||
    episodiosHoy.some(
      (episodio) =>
        episodio.estado === "generando_guion" ||
        episodio.estado === "generando_audio"
    );

  const alertaDestacada = useMemo(() => {
    return (
      pronosticoDiario?.alertas.find((alerta) => alerta.urgencia === "alta") ??
      pronosticoDiario?.alertas.find((alerta) => alerta.urgencia === "media") ??
      null
    );
  }, [pronosticoDiario]);

  const estadoPodcast =
    pistaActual?.tipo === "podcast"
      ? reproduciendo
        ? "Reproduciendo ahora"
        : "Listo para continuar"
      : episodioDelDia?.estado === "listo"
        ? "Podcast diario listo"
        : hayPodcastEnProceso
          ? "Audio en preparación"
          : "Abrí tu audio del día";

  const estadoCabecera = useMemo<EstadoCabecera>(() => {
    if (pistaActual) {
      return {
        etiqueta: reproduciendo ? "Ahora suena" : "Listo para continuar",
        titulo: pistaActual.titulo,
        descripcion: pistaActual.subtitulo,
        meta: `${formatearDuracion(progresoSegundos)} / ${formatearDuracion(
          pistaActual.duracionSegundos
        )} · Audio activo`,
        icono: pistaActual.tipo === "podcast" ? "microfono" : "chat",
        tonoIcono: "violeta",
      };
    }

    if (alertaDestacada) {
      return {
        etiqueta: "Atención cósmica",
        titulo: alertaDestacada.titulo,
        descripcion: alertaDestacada.descripcion,
        meta: `Urgencia ${alertaDestacada.urgencia} · Energía ${pronosticoDiario?.clima.energia ?? 0}/10`,
        icono: "rayo",
        tonoIcono: "rojo",
      };
    }

    if (pronosticoDiario) {
      return {
        titulo: pronosticoDiario.clima.titulo,
        descripcion: pronosticoDiario.clima.frase_sintesis,
        meta: `Luna en ${pronosticoDiario.luna.signo} · Energía ${pronosticoDiario.clima.energia}/10 · ${estadoPodcast}`,
        icono: "destello",
        tonoIcono: "violeta",
      };
    }

    return {
      etiqueta: contextoRuta.etiqueta,
      titulo: contextoRuta.titulo,
      descripcion: contextoRuta.descripcion,
      icono: contextoRuta.icono,
      tonoIcono: "violeta",
      meta: `${nombreUsuario} · ${esPremium ? etiquetaPlan : "Plan Free"} · ${estadoPodcast}`,
    };
  }, [
    alertaDestacada,
    contextoRuta.descripcion,
    contextoRuta.icono,
    estadoPodcast,
    nombreUsuario,
    pistaActual,
    progresoSegundos,
    pronosticoDiario,
    reproduciendo,
    contextoRuta.etiqueta,
    contextoRuta.titulo,
    etiquetaPlan,
    esPremium,
  ]);

  const inicialesUsuario = (usuario?.nombre ?? "U")
    .split(" ")
    .map((parte) => parte[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  function reproducirEpisodio(episodio: PodcastEpisodio) {
    const config = CONFIG_TIPO_PODCAST[episodio.tipo];
    const pista: PistaReproduccion = {
      id: episodio.id,
      titulo: episodio.titulo,
      subtitulo:
        episodio.tipo === "dia"
          ? "Podcast diario"
          : episodio.tipo === "semana"
            ? "Podcast semanal"
            : "Podcast mensual",
      tipo: "podcast",
      duracionSegundos: episodio.duracion_segundos ?? 0,
      icono: config.icono,
      gradiente: config.gradiente,
      url: episodio.url_audio,
      segmentos: episodio.segmentos,
    };
    setPistaActual(pista);
  }

  function manejarSeleccionPodcast(tipo: TipoPodcast) {
    const episodio = mapaEpisodios.get(tipo);
    const estaGenerando =
      (generarPodcast.isPending && generarPodcast.variables === tipo) ||
      episodio?.estado === "generando_guion" ||
      episodio?.estado === "generando_audio";

    if (estaGenerando) {
      return;
    }

    setMenuPodcastsAbierto(false);

    if (episodio?.estado === "listo") {
      if (pistaActual?.tipo === "podcast" && pistaActual.id === episodio.id) {
        toggleReproduccion();
        return;
      }

      reproducirEpisodio(episodio);
      return;
    }

    if (!esPremium) {
      router.push("/suscripcion");
      return;
    }

    generarPodcast.mutate(tipo);
  }

  function manejarCerrarSesion() {
    cerrarSesion();
    setMenuUsuarioAbierto(false);
    router.push("/login");
  }

  const etiquetaAccionRapida = hayPodcastEnProceso
    ? "Preparando audio"
    : pistaActual?.tipo === "podcast" || episodioDelDia?.estado === "listo"
      ? "Escuchar"
      : esPremium
        ? "Podcasts"
        : "Podcasts premium";

  const iconoAccionRapida: NombreIcono = hayPodcastEnProceso
    ? "destello"
    : pistaActual?.tipo === "podcast" || episodioDelDia?.estado === "listo"
      ? "reproducir"
      : "microfono";

  return (
    <nav className="relative z-40 shrink-0 overflow-visible border-b border-white/[0.08] bg-[linear-gradient(180deg,#2A1247_0%,#17041F_100%)]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_0%,rgba(179,136,255,0.24),transparent_28%),radial-gradient(circle_at_78%_20%,rgba(212,162,52,0.08),transparent_22%)]" />

      <div className="relative mx-auto flex h-[78px] items-center justify-between gap-4 px-4 lg:px-6">
        <div className="flex min-w-0 items-center gap-3">
          <Link href="/dashboard" className="flex shrink-0 items-center">
            <Image
              src="/img/logo-astra-blanco.png"
              alt="ASTRA"
              width={84}
              height={24}
              className="h-6 w-auto"
              priority
            />
          </Link>

          <button
            onClick={toggleSidebarColapsado}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/[0.08] bg-white/[0.06] text-white transition-colors hover:bg-white/[0.12]"
            aria-label={sidebarColapsado ? "Expandir sidebar" : "Colapsar sidebar"}
          >
            <Icono nombre="menu" tamaño={18} />
          </button>

          <div className="hidden min-w-0 xl:flex xl:flex-col">
            <span className="text-[10px] font-semibold uppercase tracking-[0.24em] text-violet-200/55">
              {contextoRuta.etiqueta}
            </span>
            <p className="text-[14px] font-semibold leading-tight text-white/94">
              {contextoRuta.titulo}
            </p>
          </div>
        </div>

        <div className="min-w-0 flex-1">
          <div className="mx-auto flex max-w-[860px] items-center gap-3 rounded-[24px] border border-white/[0.08] bg-[linear-gradient(135deg,rgba(255,255,255,0.1),rgba(255,255,255,0.04))] px-4 py-3 shadow-[0_18px_40px_rgba(8,3,20,0.22)] backdrop-blur-xl">
            <div
              className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-[18px] border ${obtenerClasesIcono(
                estadoCabecera.tonoIcono
              )}`}
            >
              <Icono nombre={estadoCabecera.icono} tamaño={20} peso="fill" />
            </div>

            <div className="min-w-0 flex-1">
              {estadoCabecera.etiqueta && (
                <div className="mb-0.5 flex items-center gap-2">
                  <span className="text-[10px] font-semibold uppercase tracking-[0.22em] text-violet-200/58">
                    {estadoCabecera.etiqueta}
                  </span>
                </div>
              )}

              <p className="text-[15px] font-semibold leading-tight text-white/96">
                {estadoCabecera.titulo}
              </p>
              {estadoCabecera.descripcion && (
                <p className="mt-1 text-[12px] leading-5 text-white/56">
                  {estadoCabecera.descripcion}
                </p>
              )}
              {estadoCabecera.meta && (
                <p className="mt-1 text-[11px] leading-5 text-violet-100/56">
                  {estadoCabecera.meta}
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <div className="relative z-50 hidden xl:block" ref={refMenuPodcasts}>
            <button
              type="button"
              onClick={() => {
                setMenuUsuarioAbierto(false);
                setMenuPodcastsAbierto((estado) => !estado);
              }}
              aria-label="Abrir menú de podcasts"
              aria-haspopup="menu"
              aria-expanded={menuPodcastsAbierto}
              aria-busy={hayPodcastEnProceso}
              data-podcast-generando={hayPodcastEnProceso ? "true" : "false"}
              className="btn-podcast-menu relative z-10 flex items-center gap-2 rounded-full border border-white/[0.1] bg-white/[0.06] px-4 py-2 text-[12px] font-semibold text-white/88 transition-all duration-200 hover:border-[#B388FF]/28 hover:bg-[#7C4DFF]/14"
            >
              <span className="flex h-7 w-7 items-center justify-center rounded-full border border-white/[0.08] bg-white/[0.08]">
                <Icono nombre={iconoAccionRapida} tamaño={14} peso="fill" />
              </span>
              <span className="sr-only">{etiquetaAccionRapida}</span>
              <Icono
                nombre={menuPodcastsAbierto ? "caretArriba" : "caretAbajo"}
                tamaño={14}
              />
            </button>

            <span className="btn-podcast-menu-aura pointer-events-none absolute inset-0 z-0 rounded-full" />
            <span className="btn-podcast-menu-orbita pointer-events-none absolute -inset-1 z-0 rounded-full border border-[#B388FF]/0" />
            <span className="btn-podcast-menu-destello pointer-events-none absolute -right-1.5 -top-1.5 z-20 flex h-5 w-5 items-center justify-center rounded-full bg-[#B388FF]/10 text-[#EADFFF] opacity-0">
              <Icono nombre="destello" tamaño={10} peso="fill" />
            </span>

            {menuPodcastsAbierto && (
              <div
                role="menu"
                aria-label="Opciones de podcasts"
                className="absolute right-0 top-full z-[70] mt-3 w-[312px] rounded-[24px] border border-white/[0.08] bg-[#1B0B2C]/95 p-2.5 shadow-[0_26px_70px_rgba(8,2,20,0.45)] backdrop-blur-2xl"
              >
                <div className="flex flex-col gap-1.5">
                  {TIPOS_MENU_PODCAST.map((tipo) => {
                    const config = CONFIG_MENU_PODCAST[tipo];
                    const episodio = mapaEpisodios.get(tipo);
                    const estaGenerando =
                      (generarPodcast.isPending && generarPodcast.variables === tipo) ||
                      episodio?.estado === "generando_guion" ||
                      episodio?.estado === "generando_audio";
                    const estaListo = episodio?.estado === "listo";
                    const estaActivo =
                      !!episodio &&
                      pistaActual?.tipo === "podcast" &&
                      pistaActual.id === episodio.id;
                    const requierePremium = !esPremium && !estaListo;

                    const detalle = estaGenerando
                      ? episodio?.estado === "generando_audio"
                        ? "Generando audio..."
                        : "Escribiendo guión..."
                      : estaListo
                        ? `${formatearDuracion(episodio?.duracion_segundos ?? 0)} · ${
                            estaActivo
                              ? reproduciendo
                                ? "Sonando ahora"
                                : "Listo para continuar"
                              : "Disponible ahora"
                          }`
                      : requierePremium
                        ? "Plan pago"
                        : episodio?.estado === "error"
                          ? "Error al generar"
                          : "Sin generar";

                    const accionIcono: NombreIcono = estaGenerando
                      ? "destello"
                      : estaListo
                        ? estaActivo
                          ? reproduciendo
                            ? "pausar"
                            : "reproducir"
                          : "reproducir"
                        : requierePremium
                          ? "corona"
                          : episodio?.estado === "error"
                            ? "destello"
                            : "destello";

                    const accionAria = estaGenerando
                      ? `Podcast ${config.titulo} en preparación`
                      : estaListo
                        ? estaActivo
                          ? reproduciendo
                            ? `Pausar ${config.titulo}`
                            : `Continuar ${config.titulo}`
                          : `Escuchar ${config.titulo}`
                        : requierePremium
                          ? `Ver plan para ${config.titulo}`
                          : episodio?.estado === "error"
                            ? `Reintentar ${config.titulo}`
                            : `Generar ${config.titulo}`;

                    return (
                      <button
                        key={tipo}
                        type="button"
                        role="menuitem"
                        onClick={() => manejarSeleccionPodcast(tipo)}
                        disabled={estaGenerando}
                        className={`group/item flex items-center gap-3 rounded-[20px] border px-3 py-2.5 text-left transition-all duration-200 ${
                          estaActivo
                            ? "border-[#B388FF]/22 bg-[linear-gradient(135deg,rgba(124,77,255,0.22),rgba(179,136,255,0.08))] shadow-[0_12px_28px_rgba(20,8,42,0.26)]"
                            : "border-white/[0.08] bg-black/10 hover:border-white/15 hover:bg-white/[0.05]"
                        } disabled:cursor-not-allowed disabled:opacity-80`}
                      >
                        <div
                          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-[18px] bg-gradient-to-br ${config.gradiente} shadow-[0_12px_28px_rgba(18,4,38,0.28)] ring-1 ring-white/15`}
                        >
                          {estaGenerando ? (
                            <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/80 border-t-transparent" />
                          ) : (
                            <Icono
                              nombre={config.icono}
                              tamaño={18}
                              peso="fill"
                              className="text-white/92"
                            />
                          )}
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <p className="text-[12px] font-semibold leading-5 text-white/94">
                              {config.titulo}
                            </p>
                            {estaListo && (
                              <span className="rounded-full border border-[#B388FF]/20 bg-[#7C4DFF]/12 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.18em] text-[#E7DAFF]">
                                Listo
                              </span>
                            )}
                          </div>
                          <p className="mt-1 text-[11px] leading-5 text-white/68">
                            {detalle}
                          </p>
                        </div>

                        <span
                          aria-label={accionAria}
                          title={accionAria}
                          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full border transition-colors ${
                            estaActivo
                              ? "border-[#B388FF]/28 bg-[#7C4DFF]/18 text-white"
                              : "border-white/[0.08] bg-white/[0.06] text-white/78 group-hover/item:border-[#B388FF]/18 group-hover/item:text-white"
                          }`}
                        >
                          <Icono
                            nombre={accionIcono}
                            tamaño={15}
                            peso="fill"
                          />
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          <Link
            href="/suscripcion"
            className="hidden items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.04] px-3 py-2 text-[11px] font-medium text-white/76 transition-colors hover:border-white/[0.14] hover:text-white 2xl:flex"
          >
            <span
              className={`h-2 w-2 rounded-full ${
                esPremium ? "bg-[#D8C0FF]" : "bg-[#B388FF]"
              }`}
            />
            {esPremium ? `${etiquetaPlan} activo` : "Plan Free"}
          </Link>

          <div className="relative z-50" ref={refMenuUsuario}>
            <button
              onClick={() => {
                setMenuPodcastsAbierto(false);
                setMenuUsuarioAbierto(!menuUsuarioAbierto);
              }}
              className="relative flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-gradient-to-br from-violet-500 to-violet-700 text-xs font-bold text-white shadow-[0_10px_24px_rgba(32,10,74,0.3)]"
              aria-label="Menu de usuario"
            >
              {inicialesUsuario}
              {esPremium && (
                <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-[#D8C0FF] text-[8px] text-[#3E1A74]">
                  <Icono nombre="corona" tamaño={10} />
                </span>
              )}
            </button>

            {menuUsuarioAbierto && (
              <div className="absolute right-0 top-full z-[70] mt-3 w-64 rounded-[24px] border border-white/[0.08] bg-[#1B0B2C]/95 p-2 shadow-[0_26px_70px_rgba(8,2,20,0.45)] backdrop-blur-2xl">
                {usuario && (
                  <div className="rounded-[18px] border border-white/[0.08] bg-white/[0.04] px-4 py-3">
                    <div className="mb-2 flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold leading-tight text-white">
                          {nombreUsuario}
                        </p>
                        <p className="mt-1 break-all text-xs leading-5 text-white/54">
                          {usuario.email}
                        </p>
                      </div>
                      <span
                        className={`shrink-0 rounded-full border px-2.5 py-1 text-[10px] font-semibold ${
                          esPremium
                            ? "border-[#B388FF]/25 bg-[#B388FF]/12 text-[#E7DAFF]"
                            : "border-white/[0.08] bg-white/[0.05] text-white/70"
                        }`}
                      >
                        {esPremium ? etiquetaPlan : "Free"}
                      </span>
                    </div>

                    {estadoCabecera.descripcion && (
                      <p className="text-[11px] leading-relaxed text-white/58">
                        {estadoCabecera.descripcion}
                      </p>
                    )}
                  </div>
                )}

                <div className="mt-2 flex flex-col gap-1">
                  <Link
                    href="/perfil"
                    onClick={() => setMenuUsuarioAbierto(false)}
                    className="flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm text-white/72 transition-colors hover:bg-white/[0.06] hover:text-white"
                  >
                    <Icono nombre="usuario" tamaño={16} />
                    Mi perfil
                  </Link>

                  <Link
                    href="/suscripcion"
                    onClick={() => setMenuUsuarioAbierto(false)}
                    className="flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm text-white/72 transition-colors hover:bg-white/[0.06] hover:text-white"
                  >
                    <Icono nombre="corona" tamaño={16} />
                    Suscripción
                  </Link>

                  <Link
                    href="/podcast"
                    onClick={() => setMenuUsuarioAbierto(false)}
                    className="flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm text-white/72 transition-colors hover:bg-white/[0.06] hover:text-white"
                  >
                    <Icono nombre="microfono" tamaño={16} />
                    Podcasts
                  </Link>

                  <button
                    onClick={manejarCerrarSesion}
                    className="mt-1 flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-sm text-[#F3B1B1] transition-colors hover:bg-[#E57373]/10 hover:text-[#FFD7D7]"
                  >
                    <Icono nombre="salir" tamaño={16} />
                    Cerrar sesión
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
