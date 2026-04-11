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
import { COPY_PODCAST_WEB } from "@/lib/utilidades/podcast";
import { esPlanPago, obtenerEtiquetaPlan } from "@/lib/utilidades/planes";

interface ContextoRuta {
  etiqueta: string;
  titulo: string;
  descripcion: string;
  icono: NombreIcono;
}

/**
 * Notificación que se muestra en el centro del navbar.
 *
 * El navbar funciona como un centro de notificaciones de prioridad: en cada
 * render se elige UNA notificación según el estado global (generación de
 * podcast, pista activa, alerta cósmica, pronóstico, contexto de ruta).
 *
 * El campo `id` se usa como `key` en el render para forzar la animación de
 * fade-in cuando cambia la notificación.
 */
interface NotificacionCentral {
  id: string;
  etiqueta?: string;
  titulo: string;
  descripcion?: string;
  icono: NombreIcono;
  /** Tono visual del icono. Sólo paleta ASTRA permitida (sin naranjas). */
  tono: "violeta" | "rojo" | "esmeralda";
  /** Muestra dots pulsantes junto al icono. Útil para estados "en proceso". */
  pulso?: boolean;
  /** Acción opcional inline (CTA a la derecha). */
  accion?: {
    etiqueta: string;
    icono: NombreIcono;
    onClick: () => void;
    cargando?: boolean;
    variante?: "primario" | "secundario";
  };
}

// ─── Persistencia local del estado "listo" del podcast del día ───
// Usamos localStorage por fecha para no volver a mostrar el aviso "listo"
// si el usuario refresca durante el mismo día (evita notificaciones repetidas).

function fechaHoyLocal(): string {
  const ahora = new Date();
  const y = ahora.getFullYear();
  const m = String(ahora.getMonth() + 1).padStart(2, "0");
  const d = String(ahora.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function claveListoVisto(fecha: string) {
  return `astra:navbar_podcast_listo_visto:${fecha}`;
}

function leerFlag(clave: string): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(clave) === "1";
  } catch {
    return false;
  }
}

function escribirFlag(clave: string) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(clave, "1");
  } catch {
    // ignorar (private mode, quota, etc.)
  }
}

const CONFIG_TIPO_PODCAST: Record<
  TipoPodcast,
  { icono: "sol" | "destello" | "luna"; gradiente: string }
> = {
  dia: {
    icono: "sol",
    gradiente: "from-violet-500 to-violet-300",
  },
  semana: {
    icono: "destello",
    gradiente: "from-violet-800 to-violet-500",
  },
  mes: {
    icono: "luna",
    gradiente: "from-violet-950 to-violet-800",
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
    titulo: COPY_PODCAST_WEB.dia.etiquetaReproductor,
    icono: "sol",
    gradiente: "from-violet-500 to-violet-300",
  },
  semana: {
    titulo: COPY_PODCAST_WEB.semana.etiquetaReproductor,
    icono: "destello",
    gradiente: "from-violet-800 to-violet-500",
  },
  mes: {
    titulo: COPY_PODCAST_WEB.mes.etiquetaReproductor,
    icono: "luna",
    gradiente: "from-violet-950 to-violet-500",
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

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { usuario, cerrarSesion } = useStoreAuth();
  const {
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
  const estadoEpisodioDia = episodioDelDia?.estado;
  const esGenerandoDia =
    estadoEpisodioDia === "generando_guion" ||
    estadoEpisodioDia === "generando_audio";
  const esListoDia = estadoEpisodioDia === "listo";
  const esErrorDia = estadoEpisodioDia === "error";
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

  // ─── Tracking del ciclo generando → listo / error del podcast del día ───
  // Replicamos la lógica que vivía en BannerPodcastDia para que ahora la
  // notificación del centro del navbar haga las veces de banner.
  const fechaHoy = fechaHoyLocal();
  const vioGenerandoRef = useRef(false);
  const [mostrarListoNotif, setMostrarListoNotif] = useState(false);
  const [listoVistoSesion, setListoVistoSesion] = useState<boolean>(() =>
    leerFlag(claveListoVisto(fechaHoy))
  );
  const [ocultarErrorNotif, setOcultarErrorNotif] = useState(false);

  useEffect(() => {
    if (esGenerandoDia) {
      vioGenerandoRef.current = true;
      setMostrarListoNotif(false);
    }
  }, [esGenerandoDia]);

  useEffect(() => {
    if (esListoDia && vioGenerandoRef.current && !listoVistoSesion) {
      setMostrarListoNotif(true);
      escribirFlag(claveListoVisto(fechaHoy));
      setListoVistoSesion(true);

      const id = window.setTimeout(() => setMostrarListoNotif(false), 8000);
      return () => window.clearTimeout(id);
    }
    return undefined;
  }, [esListoDia, listoVistoSesion, fechaHoy]);

  useEffect(() => {
    if (esErrorDia) {
      setOcultarErrorNotif(false);
      const id = window.setTimeout(() => setOcultarErrorNotif(true), 15000);
      return () => window.clearTimeout(id);
    }
    return undefined;
  }, [esErrorDia]);

  const nombreCorto = nombreUsuario.split(" ")[0] || nombreUsuario;

  // ─── Notificación central (sistema de prioridades) ───
  // Orden de prioridad (más alta primero):
  //   1. Podcast del día generándose  → mensaje "preparando tu día" + dots
  //   2. Podcast del día con error    → CTA "Reintentar"
  //   3. Podcast del día recién listo → CTA "Escuchar" (auto-hide a 8s)
  //   4. Pista activa en el reproductor
  //   5. Alerta cósmica destacada
  //   6. Pronóstico del día (clima del cielo)
  //   7. Contexto de ruta (fallback)
  const reproducirEpisodioDia = () => {
    if (!episodioDelDia || episodioDelDia.estado !== "listo") return;
    const config = CONFIG_TIPO_PODCAST[episodioDelDia.tipo];
    const pista: PistaReproduccion = {
      id: episodioDelDia.id,
      titulo: episodioDelDia.titulo,
      subtitulo: COPY_PODCAST_WEB[episodioDelDia.tipo].etiquetaReproductor,
      tipo: "podcast",
      duracionSegundos: episodioDelDia.duracion_segundos ?? 0,
      icono: config.icono,
      gradiente: config.gradiente,
      url: episodioDelDia.url_audio,
      segmentos: episodioDelDia.segmentos,
    };
    setPistaActual(pista);
    setMostrarListoNotif(false);
  };

  const reintentarPodcastDia = () => {
    generarPodcast.mutate("dia");
    setOcultarErrorNotif(true);
  };

  const notificacionCentral = useMemo<NotificacionCentral>(() => {
    // 1. Podcast del día en generación (sólo Premium)
    if (esGenerandoDia && esPremium) {
      return {
        id: `gen-${estadoEpisodioDia}`,
        etiqueta:
          estadoEpisodioDia === "generando_guion"
            ? "Escribiendo guión"
            : "Generando audio",
        titulo: `Hola ${nombreCorto}, hoy es un nuevo día`,
        descripcion: "Estoy preparando tu lectura del día. Llega en segundos.",
        icono: "sol",
        tono: "violeta",
        pulso: true,
      };
    }

    // 2. Podcast del día con error
    if (esErrorDia && esPremium && !ocultarErrorNotif) {
      return {
        id: "podcast-error",
        etiqueta: "No pude preparar tu día",
        titulo: "Algo falló en la generación",
        descripcion: "Podés reintentar o seguir navegando.",
        icono: "destello",
        tono: "rojo",
        accion: {
          etiqueta: "Reintentar",
          icono: "destello",
          onClick: reintentarPodcastDia,
          cargando: generarPodcast.isPending,
        },
      };
    }

    // 3. Podcast del día listo (transición desde generando)
    if (mostrarListoNotif && esListoDia && episodioDelDia) {
      return {
        id: `listo-${episodioDelDia.id}`,
        etiqueta: "Tu día está listo",
        titulo: `${nombreCorto}, tu podcast del día ya está`,
        descripcion: "Tocá Escuchar para empezar tu lectura.",
        icono: "sol",
        tono: "esmeralda",
        accion: {
          etiqueta: "Escuchar",
          icono: "reproducir",
          onClick: reproducirEpisodioDia,
        },
      };
    }

    // 4. Pista activa en el reproductor
    if (pistaActual) {
      return {
        id: `pista-${pistaActual.id}`,
        etiqueta: reproduciendo ? "Ahora suena" : "Listo para continuar",
        titulo: pistaActual.titulo,
        descripcion: `${formatearDuracion(progresoSegundos)} / ${formatearDuracion(pistaActual.duracionSegundos)}`,
        icono: pistaActual.tipo === "podcast" ? "microfono" : "chat",
        tono: "violeta",
      };
    }

    // 5. Alerta cósmica destacada
    if (alertaDestacada) {
      return {
        id: `alerta-${alertaDestacada.titulo}`,
        etiqueta: "Atención cósmica",
        titulo: alertaDestacada.titulo,
        descripcion: alertaDestacada.descripcion,
        icono: "rayo",
        tono: "rojo",
      };
    }

    // 6. Pronóstico diario
    if (pronosticoDiario) {
      return {
        id: "pronostico",
        etiqueta: `Luna en ${pronosticoDiario.luna.signo} · Energía ${pronosticoDiario.clima.energia}/10`,
        titulo: pronosticoDiario.clima.titulo,
        descripcion: pronosticoDiario.clima.frase_sintesis,
        icono: "destello",
        tono: "violeta",
      };
    }

    // 7. Fallback: contexto de ruta
    return {
      id: `ruta-${pathname}`,
      etiqueta: contextoRuta.etiqueta,
      titulo: contextoRuta.titulo,
      descripcion: contextoRuta.descripcion,
      icono: contextoRuta.icono,
      tono: "violeta",
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    esGenerandoDia,
    esErrorDia,
    esListoDia,
    estadoEpisodioDia,
    mostrarListoNotif,
    ocultarErrorNotif,
    episodioDelDia,
    esPremium,
    nombreCorto,
    pistaActual,
    reproduciendo,
    progresoSegundos,
    alertaDestacada,
    pronosticoDiario,
    pathname,
    contextoRuta.etiqueta,
    contextoRuta.titulo,
    contextoRuta.descripcion,
    contextoRuta.icono,
    generarPodcast.isPending,
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
      subtitulo: COPY_PODCAST_WEB[episodio.tipo].etiquetaReproductor,
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

    // El podcast del DÍA se auto-genera en el primer login del día (ver
    // `banner-podcast-dia.tsx` + `servicio_podcast_bootstrap.py`). No se
    // dispara manualmente desde el menú — simplemente llevamos al usuario
    // a la página de podcasts para que espere la generación.
    if (tipo === "dia") {
      router.push("/podcast");
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
    <nav
      className="relative z-40 shrink-0 overflow-visible border-b"
      style={{
        borderColor: "var(--shell-borde)",
        background: "var(--shell-navbar)",
        boxShadow: "var(--shell-sombra-suave)",
      }}
    >
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(circle_at_18%_0%, var(--shell-glow-2), transparent 28%), radial-gradient(circle_at_78%_20%, var(--shell-glow-1), transparent 22%)",
        }}
      />

      <div className="relative mx-auto flex h-[70px] items-center justify-between gap-4 px-4 lg:px-6">
        <div className="flex min-w-0 items-center gap-3">
          <Link href="/dashboard" className="flex shrink-0 items-center">
            <Image
              src="/img/logo-astra-blanco.png"
              alt="ASTRA"
              width={84}
              height={24}
              className="h-6 w-auto"
              style={{ filter: "var(--shell-logo-filter, none)" }}
              priority
            />
          </Link>

          <div className="hidden min-w-0 xl:flex xl:flex-col">
            <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[color:var(--color-acento)]">
              {contextoRuta.etiqueta}
            </span>
            <p className="text-[14px] font-semibold leading-tight text-[color:var(--shell-texto)]">
              {contextoRuta.titulo}
            </p>
          </div>
        </div>

        <div className="min-w-0 flex-1">
          <div className="mx-auto flex max-w-[860px] items-center px-3">
            <CentroNotificaciones notificacion={notificacionCentral} />
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
              className="btn-podcast-menu relative z-10 flex items-center gap-2 rounded-full border px-4 py-2 text-[12px] font-semibold transition-all duration-200"
              style={{
                borderColor: "var(--shell-borde)",
                background: "var(--shell-superficie)",
                color: "var(--shell-texto)",
              }}
            >
              <span
                className="flex h-7 w-7 items-center justify-center rounded-full border"
                style={{
                  borderColor: "var(--shell-borde)",
                  background: "var(--shell-superficie-suave)",
                }}
              >
                <Icono nombre={iconoAccionRapida} tamaño={14} peso="fill" />
              </span>
              <span className="sr-only">{etiquetaAccionRapida}</span>
              <Icono
                nombre={menuPodcastsAbierto ? "caretArriba" : "caretAbajo"}
                tamaño={14}
              />
            </button>

            <span className="btn-podcast-menu-aura pointer-events-none absolute inset-0 z-0 rounded-full" />
            <span className="btn-podcast-menu-orbita pointer-events-none absolute -inset-1 z-0 rounded-full border border-violet-300/0" />
            <span className="btn-podcast-menu-destello pointer-events-none absolute -right-1.5 -top-1.5 z-20 flex h-5 w-5 items-center justify-center rounded-full bg-violet-300/10 text-shell-badge-acento opacity-0">
              <Icono nombre="destello" tamaño={10} peso="fill" />
            </span>

            {menuPodcastsAbierto && (
              <div
                role="menu"
                aria-label="Opciones de podcasts"
                className="absolute right-0 top-full z-[70] mt-3 w-[312px] rounded-[24px] border p-2.5 backdrop-blur-2xl"
                style={{
                  borderColor: "var(--shell-borde)",
                  background: "var(--shell-panel)",
                  boxShadow: "var(--shell-sombra-fuerte)",
                }}
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
                      ? `${config.titulo} en preparación`
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
                            ? "border-violet-300/22 tema-gradiente-acento-suave shadow-[var(--shell-sombra-suave)]"
                          : "border-shell-borde bg-transparent"
                        } disabled:cursor-not-allowed disabled:opacity-80`}
                      >
                        <div
                          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-[18px] bg-gradient-to-br ${config.gradiente} shadow-[var(--shell-sombra-suave)] ring-1 ring-shell-borde`}
                        >
                          {estaGenerando ? (
                            <div className="h-4 w-4 animate-spin rounded-full border-2 border-shell-hero-texto/80 border-t-transparent" />
                          ) : (
                            <Icono
                              nombre={config.icono}
                              tamaño={18}
                              peso="fill"
                              className="text-shell-hero-texto/92"
                            />
                          )}
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <p className="text-[12px] font-semibold leading-5 text-[color:var(--shell-texto)]">
                              {config.titulo}
                            </p>
                            {estaListo && (
                              <span className="flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500">
                                <Icono nombre="check" tamaño={10} className="text-white" />
                              </span>
                            )}
                          </div>
                          <p className="mt-1 text-[11px] leading-5 text-[color:var(--shell-texto-secundario)]">
                            {detalle}
                          </p>
                        </div>

                        <span
                          aria-label={accionAria}
                          title={accionAria}
                          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full border transition-colors ${
                            estaActivo
                              ? "border-violet-300/28 bg-violet-500/18 text-shell-hero-texto"
                            : "border-shell-borde bg-shell-superficie text-shell-texto-secundario"
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
            className="hidden items-center gap-2 rounded-full border px-3 py-2 text-[11px] font-medium transition-colors 2xl:flex"
            style={{
              borderColor: "var(--shell-borde)",
              background: "var(--shell-superficie)",
              color: "var(--shell-texto-secundario)",
            }}
          >
            <span
              className={`h-2 w-2 rounded-full ${
                esPremium ? "bg-shell-badge-acento" : "bg-violet-300"
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
              className="relative flex h-10 w-10 items-center justify-center rounded-full border bg-gradient-to-br from-violet-500 to-violet-700 text-xs font-bold text-shell-hero-texto shadow-[var(--shell-sombra-suave)]"
              style={{ borderColor: "var(--shell-borde-fuerte)" }}
              aria-label="Menu de usuario"
            >
              {inicialesUsuario}
              {esPremium && (
                <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-shell-badge-acento text-[8px] text-shell-badge-acento-texto">
                  <Icono nombre="corona" tamaño={10} />
                </span>
              )}
            </button>

            {menuUsuarioAbierto && (
              <div
                className="absolute right-0 top-full z-[70] mt-3 w-64 rounded-[24px] border p-2 backdrop-blur-2xl"
                style={{
                  borderColor: "var(--shell-borde)",
                  background: "var(--shell-panel)",
                  boxShadow: "var(--shell-sombra-fuerte)",
                }}
              >
                {usuario && (
                  <div
                    className="rounded-[18px] border px-4 py-3"
                    style={{
                      borderColor: "var(--shell-borde)",
                      background: "var(--shell-superficie)",
                    }}
                  >
                    <div className="mb-2 flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold leading-tight text-[color:var(--shell-texto)]">
                          {nombreUsuario}
                        </p>
                        <p className="mt-1 break-all text-xs leading-5 text-[color:var(--shell-texto-secundario)]">
                          {usuario.email}
                        </p>
                      </div>
                      <span
                        className={`shrink-0 rounded-full border px-2.5 py-1 text-[10px] font-semibold ${
                          esPremium
                            ? "border-shell-badge-violeta-borde bg-shell-badge-violeta-fondo text-shell-badge-violeta-texto"
                            : "border-shell-borde bg-shell-superficie-suave text-shell-texto-secundario"
                        }`}
                      >
                        {esPremium ? etiquetaPlan : "Free"}
                      </span>
                    </div>


                  </div>
                )}

                <div className="mt-2 flex flex-col gap-1">
                  <Link
                    href="/perfil"
                    onClick={() => setMenuUsuarioAbierto(false)}
                    className="flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm transition-colors hover:bg-[var(--shell-chip-hover)] hover:text-[color:var(--shell-texto)]"
                    style={{ color: "var(--shell-texto-secundario)" }}
                  >
                    <Icono nombre="usuario" tamaño={16} />
                    Mi perfil
                  </Link>

                  <Link
                    href="/suscripcion"
                    onClick={() => setMenuUsuarioAbierto(false)}
                    className="flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm transition-colors hover:bg-[var(--shell-chip-hover)] hover:text-[color:var(--shell-texto)]"
                    style={{ color: "var(--shell-texto-secundario)" }}
                  >
                    <Icono nombre="corona" tamaño={16} />
                    Suscripción
                  </Link>



                  {usuario?.rol === "admin" && (
                    <Link
                      href="/admin"
                      onClick={() => setMenuUsuarioAbierto(false)}
                      className="flex items-center gap-3 rounded-2xl bg-peligro-suave px-3 py-2.5 text-sm font-medium text-peligro transition-colors hover:bg-peligro-suave hover:text-peligro-hover"
                    >
                      <Icono nombre="escudo" tamaño={16} />
                      Backoffice
                    </Link>
                  )}

                  <button
                    onClick={manejarCerrarSesion}
                    className="mt-1 flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-sm text-peligro-texto transition-colors hover:bg-peligro-suave hover:text-peligro-texto-hover"
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

// ─────────────────────────────────────────────────────────────────
// Centro de notificaciones (caja central del navbar)
// ─────────────────────────────────────────────────────────────────

/**
 * Texto que se desliza horizontalmente cuando no entra completo en su
 * contenedor (estilo "marquee"). Si el texto entra entero, queda estático.
 *
 * Estrategia (lógica invertida para ser robusta):
 *   1. El marquee arranca por DEFAULT vía CSS puro (`.animate-marquee`).
 *   2. Siempre se renderizan dos copias del texto: el track tiene
 *      `width: max-content`, y el keyframe desplaza -50%, dejando la
 *      segunda copia exactamente donde estaba la primera = loop seamless.
 *   3. JS mide el ancho real de UNA copia vs el contenedor. Si entra
 *      completo, agrega `.is-paused` para frenar la animación y resetear
 *      el transform a 0. Si la medición falla por cualquier motivo, el
 *      marquee igual funciona — degradación graceful.
 *   4. Re-mide en mount, tras `fonts.ready`, y en cada resize del
 *      contenedor.
 */
function TextoDeslizante({
  texto,
  className,
}: {
  texto: string;
  className?: string;
}) {
  const refContenedor = useRef<HTMLDivElement>(null);
  // Ref a la primera copia (la "canónica") para medir su ancho real.
  const refCopiaCanonica = useRef<HTMLSpanElement>(null);
  // Por defecto el marquee corre — solo lo pausamos si confirmamos que entra.
  const [pausado, setPausado] = useState(false);

  useEffect(() => {
    let cancelado = false;
    let rafId = 0;

    const medir = () => {
      if (cancelado) return;
      const contenedor = refContenedor.current;
      const copia = refCopiaCanonica.current;
      if (!contenedor || !copia) return;

      const anchoContenedor = contenedor.clientWidth;
      // offsetWidth incluye el padding-right de separación entre copias;
      // restamos 48px (el padding) para obtener el ancho real del texto.
      const anchoTexto = copia.offsetWidth - 48;

      // +4px de tolerancia para evitar rebotes por redondeo subpíxel.
      const entraCompleto = anchoTexto <= anchoContenedor - 4;
      setPausado((prev) => (prev === entraCompleto ? prev : entraCompleto));
    };

    // Medir varias veces durante los primeros ms para cubrir layouts tardíos
    // (font swap, hidratación, flex pendientes). El costo es mínimo.
    const programar = () => {
      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(medir);
    };

    programar();
    const t1 = window.setTimeout(programar, 50);
    const t2 = window.setTimeout(programar, 250);
    const t3 = window.setTimeout(programar, 800);

    if (typeof document !== "undefined" && document.fonts?.ready) {
      document.fonts.ready.then(() => {
        if (!cancelado) programar();
      }).catch(() => { /* ignorar */ });
    }

    const observer = new ResizeObserver(() => programar());
    if (refContenedor.current) observer.observe(refContenedor.current);

    return () => {
      cancelado = true;
      cancelAnimationFrame(rafId);
      window.clearTimeout(t1);
      window.clearTimeout(t2);
      window.clearTimeout(t3);
      observer.disconnect();
    };
  }, [texto]);

  return (
    <div ref={refContenedor} className={`overflow-hidden ${className ?? ""}`}>
      <div
        className={`flex w-max animate-marquee whitespace-nowrap ${
          pausado ? "is-paused" : ""
        }`}
      >
        <span
          ref={refCopiaCanonica}
          className="shrink-0"
          style={{ paddingRight: "3rem" }}
        >
          {texto}
        </span>
        <span
          aria-hidden="true"
          className="shrink-0"
          style={{ paddingRight: "3rem" }}
        >
          {texto}
        </span>
      </div>
    </div>
  );
}

/**
 * Caja central compacta que muestra UNA notificación a la vez.
 *
 * Layout fijo (no crece verticalmente):
 *   [icono 36px] [etiqueta + título + descripción] [acción opcional]
 *
 * Cada cambio de notificación se anima con fade-in mediante `key={id}`.
 * Sin overflow del navbar (alto fijo ≈ 54px dentro de los 70px del nav).
 */
function CentroNotificaciones({
  notificacion,
}: {
  notificacion: NotificacionCentral;
}) {
  const tonoEstilos = obtenerEstilosTono(notificacion.tono);

  return (
    <div
      key={notificacion.id}
      role="status"
      aria-live="polite"
      className="animate-banner-in flex h-[54px] w-full min-w-0 items-center gap-3 rounded-[14px] border px-3"
      style={{
        background: "var(--shell-superficie-suave)",
        borderColor: "var(--shell-borde)",
        boxShadow: "var(--shell-sombra-suave)",
      }}
    >
      {/* Icono + dots de pulso opcional */}
      <div className="flex shrink-0 items-center gap-1.5">
        <span
          className="relative flex h-9 w-9 items-center justify-center rounded-[12px] border"
          style={{
            background: tonoEstilos.iconoFondo,
            borderColor: tonoEstilos.iconoBorde,
            boxShadow: tonoEstilos.iconoGlow,
          }}
        >
          <Icono
            nombre={notificacion.icono}
            tamaño={16}
            peso="fill"
            className="text-white"
          />
        </span>

        {notificacion.pulso && (
          <span
            className="hidden items-center gap-[3px] sm:flex"
            aria-hidden="true"
          >
            {[0, 200, 400].map((delay) => (
              <span
                key={delay}
                className="block h-1 w-1 rounded-full animate-chat-soft-pulse"
                style={{
                  background: tonoEstilos.acento,
                  animationDelay: `${delay}ms`,
                }}
              />
            ))}
          </span>
        )}
      </div>

      {/* Texto: etiqueta + título + descripción (todo en 1 linea cada uno) */}
      <div className="min-w-0 flex-1">
        {notificacion.etiqueta && (
          <p
            className="truncate text-[10px] font-semibold uppercase leading-tight tracking-[0.14em]"
            style={{ color: tonoEstilos.acento }}
          >
            {notificacion.etiqueta}
          </p>
        )}
        <p
          className={`truncate text-[13px] font-semibold leading-tight ${
            notificacion.pulso ? "banner-shimmer-texto" : ""
          } text-[color:var(--shell-texto)]`}
        >
          {notificacion.titulo}
        </p>
        {notificacion.descripcion && (
          <TextoDeslizante
            texto={notificacion.descripcion}
            className="mt-0.5 text-[11px] leading-4 text-[color:var(--shell-texto-secundario)]"
          />
        )}
      </div>

      {/* Acción inline opcional */}
      {notificacion.accion && (
        <button
          type="button"
          onClick={notificacion.accion.onClick}
          disabled={notificacion.accion.cargando}
          className="inline-flex h-8 shrink-0 items-center gap-1.5 rounded-full px-3.5 text-[11px] font-semibold transition-all duration-200 hover:-translate-y-[1px] disabled:cursor-not-allowed disabled:opacity-60"
          style={{
            color: "#fff",
            background: tonoEstilos.accionFondo,
            boxShadow: tonoEstilos.accionGlow,
          }}
        >
          {notificacion.accion.cargando ? (
            <span className="block h-3 w-3 animate-spin rounded-full border-2 border-white/80 border-t-transparent" />
          ) : (
            <Icono
              nombre={notificacion.accion.icono}
              tamaño={12}
              peso="fill"
            />
          )}
          {notificacion.accion.etiqueta}
        </button>
      )}
    </div>
  );
}

/**
 * Mapea el tono de la notificación a tokens de color de la paleta ASTRA.
 *
 * Nunca usar naranjas/amber — sólo violeta, rojo (errores) y esmeralda
 * (éxito), tal como define la guía visual del proyecto.
 */
function obtenerEstilosTono(tono: NotificacionCentral["tono"]) {
  switch (tono) {
    case "rojo":
      return {
        acento: "var(--color-error)",
        iconoFondo:
          "linear-gradient(135deg, color-mix(in srgb, var(--color-error) 90%, transparent), color-mix(in srgb, var(--color-error) 60%, transparent))",
        iconoBorde:
          "color-mix(in srgb, var(--color-error) 35%, transparent)",
        iconoGlow:
          "0 4px 14px color-mix(in srgb, var(--color-error) 30%, transparent)",
        accionFondo:
          "linear-gradient(135deg, var(--color-error), color-mix(in srgb, var(--color-error) 70%, black))",
        accionGlow: "0 6px 16px -6px var(--color-error)",
      };
    case "esmeralda":
      return {
        acento: "var(--color-exito)",
        iconoFondo:
          "linear-gradient(135deg, color-mix(in srgb, var(--color-exito) 90%, transparent), color-mix(in srgb, var(--color-exito) 60%, transparent))",
        iconoBorde:
          "color-mix(in srgb, var(--color-exito) 35%, transparent)",
        iconoGlow:
          "0 4px 14px color-mix(in srgb, var(--color-exito) 30%, transparent)",
        accionFondo:
          "linear-gradient(135deg, var(--color-violet-500), var(--color-violet-700))",
        accionGlow: "0 6px 16px -6px var(--shell-glow-1)",
      };
    case "violeta":
    default:
      return {
        acento: "var(--color-acento)",
        iconoFondo:
          "linear-gradient(135deg, var(--color-violet-500), var(--color-violet-300))",
        iconoBorde: "var(--shell-chip-borde)",
        iconoGlow: "0 4px 14px var(--shell-glow-1)",
        accionFondo:
          "linear-gradient(135deg, var(--color-violet-500), var(--color-violet-700))",
        accionGlow: "0 6px 16px -6px var(--shell-glow-1)",
      };
  }
}
