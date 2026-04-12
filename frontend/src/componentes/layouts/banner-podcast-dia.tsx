"use client";

/**
 * Banner del header que refleja la auto-generación del podcast del día.
 *
 * Se monta en `layout-app.tsx`. Reacciona al estado del episodio `dia` que
 * trae `usarPodcastHoy()` (que ya polea cada 5s mientras hay generación):
 *
 *  - `generando_guion` / `generando_audio` → mensaje con shimmer + pulsos
 *  - `listo` (recién terminado) → CTA "Escuchar" + auto-hide a los 8s
 *  - `error` → mensaje discreto + botón "Reintentar"
 *
 * El banner usa `localStorage` con clave por fecha ARG para no volver a
 * mostrar el estado "listo" en la misma sesión del día (si el usuario
 * refresca, no se repite el aviso final).
 */

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import { Icono } from "@/componentes/ui/icono";
import {
  usarPodcastHoy,
  usarGenerarPodcast,
} from "@/lib/hooks/usar-podcast";
import { useStoreAuth } from "@/lib/stores/store-auth";
import { useStoreUI, type PistaReproduccion } from "@/lib/stores/store-ui";
import { esPlanPago } from "@/lib/utilidades/planes";
import { COPY_PODCAST_WEB } from "@/lib/utilidades/podcast";

// ────────────────────────────────────────────────────────────────
// Helpers
// ────────────────────────────────────────────────────────────────

/** Fecha de hoy en formato `YYYY-MM-DD` usando la hora local del navegador. */
function fechaHoyLocal(): string {
  const ahora = new Date();
  const y = ahora.getFullYear();
  const m = String(ahora.getMonth() + 1).padStart(2, "0");
  const d = String(ahora.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/** Clave de localStorage para marcar que ya vimos el banner "listo" de hoy. */
function claveListoVisto(fecha: string) {
  return `astra:podcast_banner_listo_visto:${fecha}`;
}

/** Clave de localStorage para marcar descarte manual del banner de hoy. */
function claveDescartado(fecha: string) {
  return `astra:podcast_banner_descartado:${fecha}`;
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

// ────────────────────────────────────────────────────────────────
// Componente
// ────────────────────────────────────────────────────────────────

export default function BannerPodcastDia() {
  const router = useRouter();
  const usuario = useStoreAuth((s) => s.usuario);
  const esPremium = esPlanPago(usuario?.plan_slug);

  const { data: episodios } = usarPodcastHoy(true);
  const generarMutation = usarGenerarPodcast();
  const { setPistaActual } = useStoreUI();

  const episodioDia = useMemo(
    () => (episodios ?? []).find((ep) => ep.tipo === "dia"),
    [episodios],
  );

  const fechaHoy = fechaHoyLocal();
  const [descartadoSesion, setDescartadoSesion] = useState<boolean>(() =>
    leerFlag(claveDescartado(fechaHoy)),
  );
  const [listoVistoSesion, setListoVistoSesion] = useState<boolean>(() =>
    leerFlag(claveListoVisto(fechaHoy)),
  );
  // Marcamos si en este montaje vimos alguna vez el estado "generando",
  // para decidir si mostrar la transición "listo" o no (si ya entraba listo
  // de antes, no molestamos).
  const vioGenerandoRef = useRef(false);
  const [mostrarListo, setMostrarListo] = useState(false);

  const estado = episodioDia?.estado;
  const esGenerando =
    estado === "generando_guion" || estado === "generando_audio";
  const esListo = estado === "listo";
  const esError = estado === "error";

  // Track del ciclo generando → listo
  useEffect(() => {
    if (esGenerando) {
      vioGenerandoRef.current = true;
      setMostrarListo(false);
    }
  }, [esGenerando]);

  useEffect(() => {
    if (esListo && vioGenerandoRef.current && !listoVistoSesion) {
      setMostrarListo(true);
      escribirFlag(claveListoVisto(fechaHoy));
      setListoVistoSesion(true);

      // Auto-hide del banner listo a los 8s.
      const id = window.setTimeout(() => setMostrarListo(false), 8000);
      return () => window.clearTimeout(id);
    }
    return undefined;
  }, [esListo, listoVistoSesion, fechaHoy]);

  // Auto-hide del banner de error tras 15s si el usuario no interactúa.
  const [ocultarError, setOcultarError] = useState(false);
  useEffect(() => {
    if (esError) {
      setOcultarError(false);
      const id = window.setTimeout(() => setOcultarError(true), 15000);
      return () => window.clearTimeout(id);
    }
    return undefined;
  }, [esError]);

  // Reglas de visibilidad
  if (!usuario || !esPremium || !usuario.tiene_perfil) return null;
  if (descartadoSesion) return null;

  const mostrarGenerando = esGenerando;
  const mostrarFinalListo = mostrarListo && esListo;
  const mostrarFinalError = esError && !ocultarError;

  if (!mostrarGenerando && !mostrarFinalListo && !mostrarFinalError) {
    return null;
  }

  // ─ Acciones ─
  const nombreCorto = usuario.nombre?.split(" ")[0] ?? "";

  const reproducir = () => {
    if (!episodioDia || episodioDia.estado !== "listo") return;
    const copy = COPY_PODCAST_WEB.dia;
    const pista: PistaReproduccion = {
      id: episodioDia.id,
      titulo: episodioDia.titulo,
      subtitulo: copy.etiquetaReproductor,
      tipo: "podcast",
      duracionSegundos: episodioDia.duracion_segundos ?? 0,
      icono: "sol",
      gradiente: "from-violet-500 to-violet-300",
      url: episodioDia.url_audio,
      segmentos: episodioDia.segmentos,
    };
    setPistaActual(pista);
    setMostrarListo(false);
  };

  const reintentar = () => {
    generarMutation.mutate("dia");
    setOcultarError(true);
  };

  const descartar = () => {
    escribirFlag(claveDescartado(fechaHoy));
    setDescartadoSesion(true);
  };

  const irAPodcast = () => {
    router.push("/podcast");
  };

  // ─ Render ─
  return (
    <div
      role="status"
      aria-live="polite"
      data-no-explicable="true"
      className="animate-banner-in relative z-30 w-full border-b"
      style={{
        borderColor: "var(--shell-borde)",
        background:
          "linear-gradient(90deg, var(--shell-superficie-suave) 0%, var(--shell-chip) 50%, var(--shell-superficie-suave) 100%)",
        backdropFilter: "blur(12px)",
      }}
    >
      {/* Glow sutil de fondo */}
      <div
        className="pointer-events-none absolute left-1/2 top-0 h-16 w-[420px] -translate-x-1/2 blur-3xl"
        style={{ background: "var(--shell-glow-1)" }}
      />

      <div className="relative mx-auto flex max-w-6xl items-center gap-3 px-4 py-3 sm:gap-4 sm:py-3.5">
        {/* Icono con dots pulsantes en generando */}
        <div className="flex shrink-0 items-center gap-2">
          <div
            className="relative flex h-9 w-9 items-center justify-center rounded-2xl border"
            style={{
              borderColor: "var(--shell-chip-borde)",
              background:
                "linear-gradient(135deg, var(--color-violet-500), var(--color-violet-300))",
              boxShadow: "0 4px 16px var(--shell-glow-1)",
            }}
          >
            <Icono
              nombre={mostrarFinalListo ? "reproducir" : "sol"}
              tamaño={18}
              peso="fill"
              className="text-white"
            />
          </div>
          {mostrarGenerando && (
            <div className="hidden items-center gap-[3px] sm:flex">
              {[0, 200, 400].map((delay) => (
                <span
                  key={delay}
                  className="block h-1.5 w-1.5 rounded-full animate-chat-soft-pulse"
                  style={{
                    background: "var(--color-acento)",
                    animationDelay: `${delay}ms`,
                  }}
                />
              ))}
            </div>
          )}
        </div>

        {/* Mensaje principal */}
        <div className="min-w-0 flex-1">
          {mostrarGenerando && (
            <>
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[color:var(--color-acento)]">
                {estado === "generando_guion"
                  ? "Escribiendo guión"
                  : "Generando audio"}
              </p>
              <p className="mt-0.5 truncate text-[14px] font-medium leading-tight sm:text-[15px]">
                {/* Emoji 👋 pedido explícitamente por producto — no remover */}
                <span className="banner-shimmer-texto font-semibold">
                  Hola {nombreCorto} 👋, hoy es un nuevo día!
                </span>{" "}
                <span className="text-[color:var(--shell-texto-secundario)]">
                  Te estoy preparando tu día.
                </span>
              </p>
            </>
          )}

          {mostrarFinalListo && (
            <>
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[color:var(--color-acento)]">
                Tu día está listo
              </p>
              <p className="mt-0.5 truncate text-[14px] font-medium leading-tight text-[color:var(--shell-texto)] sm:text-[15px]">
                {nombreCorto}, tu podcast del día ya está para escuchar.
              </p>
            </>
          )}

          {mostrarFinalError && (
            <>
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[color:var(--color-error)]">
                No pude preparar tu día
              </p>
              <p className="mt-0.5 truncate text-[14px] font-medium leading-tight text-[color:var(--shell-texto-secundario)] sm:text-[15px]">
                Algo falló en la generación. Podés reintentar o seguir navegando.
              </p>
            </>
          )}
        </div>

        {/* Acciones derecha */}
        <div className="flex shrink-0 items-center gap-2">
          {mostrarFinalListo && (
            <button
              type="button"
              onClick={reproducir}
              className="inline-flex h-9 items-center gap-2 rounded-full px-4 text-[13px] font-semibold transition-all hover:-translate-y-[1px]"
              style={{
                color: "#fff",
                background:
                  "linear-gradient(135deg, var(--color-violet-500), var(--color-violet-700))",
                boxShadow: "0 8px 20px -6px var(--shell-glow-1)",
              }}
            >
              <Icono nombre="reproducir" tamaño={14} peso="fill" />
              Escuchar
            </button>
          )}

          {mostrarGenerando && (
            <button
              type="button"
              onClick={irAPodcast}
              className="hidden h-9 items-center gap-2 rounded-full border px-3.5 text-[12px] font-medium transition-all sm:inline-flex"
              style={{
                borderColor: "var(--shell-borde)",
                background: "var(--shell-superficie)",
                color: "var(--shell-texto-secundario)",
              }}
            >
              Ver detalle
            </button>
          )}

          {mostrarFinalError && (
            <button
              type="button"
              onClick={reintentar}
              disabled={generarMutation.isPending}
              className="inline-flex h-9 items-center gap-2 rounded-full border px-3.5 text-[12px] font-medium transition-all disabled:opacity-60"
              style={{
                borderColor: "var(--shell-chip-borde)",
                background: "var(--shell-chip)",
                color: "var(--color-acento)",
              }}
            >
              <Icono nombre="destello" tamaño={14} peso="fill" />
              Reintentar
            </button>
          )}

          <button
            type="button"
            onClick={descartar}
            aria-label="Ocultar aviso"
            className="flex h-8 w-8 items-center justify-center rounded-full transition-colors hover:text-[color:var(--shell-texto)]"
            style={{ color: "var(--shell-texto-tenue)" }}
          >
            <Icono nombre="x" tamaño={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
