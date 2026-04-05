"use client";

import { Icono } from "@/componentes/ui/icono";
import { useStoreUI } from "@/lib/stores/store-ui";
import { usarAudio } from "@/lib/hooks/usar-audio";

function formatearTiempo(segundos: number): string {
  const min = Math.floor(segundos / 60);
  const seg = Math.floor(segundos % 60);
  return `${min}:${seg.toString().padStart(2, "0")}`;
}

export default function MiniReproductor() {
  const { miniReproductorExpandido, toggleMiniReproductor } = useStoreUI();

  const {
    audioRef,
    audioUrl,
    tieneAudio,
    cargandoAudio,
    pistaActual,
    reproduciendo,
    progresoSegundos,
    porcentaje,
    volumen,
    silenciado,
    toggleReproduccion,
    setVolumen,
    toggleSilencio,
    manejarSeek,
    manejarCerrar,
    handleTimeUpdate,
    handleEnded,
  } = usarAudio();

  if (!pistaActual) return null;

  const mostrandoCarga = cargandoAudio && !tieneAudio;

  return (
    <>
      {tieneAudio && (
        <audio
          ref={audioRef}
          src={audioUrl!}
          autoPlay={reproduciendo}
          onTimeUpdate={handleTimeUpdate}
          onEnded={handleEnded}
          preload="auto"
        />
      )}

      <div
        className="fixed left-0 right-0 z-40"
        style={{
          bottom: "calc(var(--tab-bar-height) + env(safe-area-inset-bottom, 0px))",
          background: "var(--shell-reproductor)",
          borderTop: "1px solid var(--shell-borde)",
        }}
      >
        <div className="relative h-[2px]" style={{ background: "var(--shell-borde)" }}>
          <div
            className="absolute left-0 top-0 h-full transition-[width] duration-300"
            style={{
              width: `${porcentaje}%`,
              background: "var(--color-primario)",
            }}
          />
        </div>

        <div className="flex min-h-[62px] items-center gap-3 px-3 py-2">
          <button
            onClick={toggleMiniReproductor}
            className="touch-feedback flex min-w-0 flex-1 items-center gap-3"
          >
            <div
              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br ${pistaActual.gradiente}`}
            >
              <Icono
                nombre={pistaActual.icono}
                tamaño={18}
                peso="fill"
                className="text-white/80"
              />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium leading-tight text-[color:var(--shell-texto)]">
                {pistaActual.titulo}
              </p>
              <p className="mt-0.5 text-[11px] leading-4 text-[color:var(--color-acento)]">
                {pistaActual.subtitulo}
              </p>
            </div>
          </button>

          <button
            onClick={toggleReproduccion}
            disabled={mostrandoCarga}
            className="touch-feedback flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white"
          >
            {mostrandoCarga ? (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-[color:var(--color-violet-950)] border-t-transparent" />
            ) : (
              <Icono
                nombre={reproduciendo ? "pausar" : "reproducir"}
                tamaño={18}
                peso="fill"
                className="text-[color:var(--color-violet-950)]"
              />
            )}
          </button>

          <button
            onClick={manejarCerrar}
            className="shrink-0 p-1 text-[color:var(--color-acento)]"
          >
            <Icono nombre="x" tamaño={16} />
          </button>
        </div>
      </div>

      {miniReproductorExpandido && (
        <div
          className="fixed inset-0 z-[100] flex flex-col animate-slide-up"
          style={{ background: "var(--shell-fondo-profundo)" }}
        >
          <div style={{ paddingTop: "env(safe-area-inset-top, 0px)" }} />

          <div className="flex items-center justify-between px-5 py-3">
            <button
              onClick={toggleMiniReproductor}
              className="touch-feedback flex h-10 w-10 items-center justify-center text-[color:var(--shell-texto-secundario)]"
            >
              <Icono nombre="flechaIzquierda" tamaño={22} />
            </button>
            <span className="text-xs font-medium uppercase tracking-wider text-[color:var(--color-acento)]">
              Reproduciendo
            </span>
            <div className="w-10" />
          </div>

          <div className="flex flex-1 items-center justify-center px-12">
            <div
              className={`flex aspect-square w-full max-w-[300px] items-center justify-center rounded-[24px] bg-gradient-to-br ${pistaActual.gradiente} shadow-[var(--shell-sombra-fuerte)]`}
            >
              <Icono
                nombre={pistaActual.icono}
                tamaño={80}
                peso="fill"
                className="text-white/60"
              />
            </div>
          </div>

          <div className="mb-4 px-8">
            <p className="text-[18px] font-semibold leading-tight text-[color:var(--shell-texto)]">
              {pistaActual.titulo}
            </p>
            <p className="mt-1 text-sm leading-5 text-[color:var(--color-acento)]">
              {pistaActual.subtitulo}
            </p>
          </div>

          <div className="mb-2 px-8">
            <div className="relative h-1.5 rounded-full" style={{ background: "var(--shell-borde)" }}>
              <div
                className="absolute left-0 top-0 h-full rounded-full"
                style={{
                  width: `${porcentaje}%`,
                  background: "var(--color-primario)",
                }}
              />
              <input
                type="range"
                min={0}
                max={pistaActual.duracionSegundos}
                value={progresoSegundos}
                onChange={(evento) => manejarSeek(Number(evento.target.value))}
                className="absolute inset-0 w-full cursor-pointer opacity-0"
              />
            </div>
            <div className="mt-1.5 flex justify-between">
              <span className="text-[11px] tabular-nums text-[color:var(--color-acento)]">
                {formatearTiempo(progresoSegundos)}
              </span>
              <span className="text-[11px] tabular-nums text-[color:var(--color-acento)]">
                {formatearTiempo(pistaActual.duracionSegundos)}
              </span>
            </div>
          </div>

          <div className="flex items-center justify-center gap-8 py-6">
            <button className="transition-colors text-[color:var(--color-acento)] hover:text-[color:var(--shell-texto)]">
              <Icono nombre="retroceder" tamaño={28} peso="fill" />
            </button>
            <button
              onClick={toggleReproduccion}
              disabled={mostrandoCarga}
              className="touch-feedback flex h-16 w-16 items-center justify-center rounded-full bg-white"
            >
              {mostrandoCarga ? (
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-[color:var(--color-violet-950)] border-t-transparent" />
              ) : (
                <Icono
                  nombre={reproduciendo ? "pausar" : "reproducir"}
                  tamaño={28}
                  peso="fill"
                  className="text-[color:var(--color-violet-950)]"
                />
              )}
            </button>
            <button className="transition-colors text-[color:var(--color-acento)] hover:text-[color:var(--shell-texto)]">
              <Icono nombre="avanzar" tamaño={28} peso="fill" />
            </button>
          </div>

          <div className="flex items-center gap-3 px-8 pb-4">
            <button
              onClick={toggleSilencio}
              className="shrink-0 text-[color:var(--color-acento)]"
            >
              <Icono
                nombre={silenciado ? "volumenMudo" : "volumenAlto"}
                tamaño={18}
              />
            </button>
            <div className="group relative h-1 flex-1">
              <div
                className="absolute inset-0 rounded-full"
                style={{ background: "var(--shell-borde)" }}
              />
              <div
                className="absolute left-0 top-0 h-full rounded-full"
                style={{
                  width: `${silenciado ? 0 : volumen}%`,
                  background: "var(--color-acento)",
                }}
              />
              <input
                type="range"
                min={0}
                max={100}
                value={silenciado ? 0 : volumen}
                onChange={(evento) => setVolumen(Number(evento.target.value))}
                className="absolute inset-0 w-full cursor-pointer opacity-0"
              />
            </div>
          </div>

          <div style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }} />
        </div>
      )}
    </>
  );
}

