"use client";

import { Icono } from "@/componentes/ui/icono";
import { usarAudio } from "@/lib/hooks/usar-audio";

function formatearTiempo(segundos: number): string {
  const min = Math.floor(segundos / 60);
  const seg = Math.floor(segundos % 60);
  return `${min}:${seg.toString().padStart(2, "0")}`;
}

export default function ReproductorCosmico() {
  const {
    audioRef,
    audioUrl,
    tieneAudio,
    cargandoAudio,
    pistaActual,
    reproduciendo,
    progresoSegundos,
    volumen,
    silenciado,
    porcentaje,
    toggleReproduccion,
    setVolumen,
    toggleSilencio,
    manejarSeek,
    manejarCerrar,
    handleTimeUpdate,
    handleEnded,
  } = usarAudio();

  if (!pistaActual) {
    return null;
  }

  const mostrandoCarga = cargandoAudio && !tieneAudio;

  return (
    <footer
      className="fixed bottom-0 left-0 right-0 z-50 flex h-[84px] items-center gap-4 px-4 lg:px-6"
      style={{
        background: "var(--shell-reproductor)",
        borderTop: "1px solid var(--shell-borde)",
      }}
    >
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

      <div className="flex min-w-0 w-[25%] items-center gap-3">
        <button
          onClick={manejarCerrar}
          className="shrink-0 transition-colors text-[color:var(--color-acento)] hover:text-[color:var(--shell-texto)]"
          title="Cerrar reproductor"
        >
          <Icono nombre="x" tamaño={16} />
        </button>
        <div
          className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br ${pistaActual.gradiente}`}
        >
          <Icono
            nombre={pistaActual.icono}
            tamaño={24}
            peso="fill"
            className="text-white/80"
          />
        </div>
        <div className="hidden min-w-0 sm:block">
          <p className="text-sm font-medium leading-tight text-[color:var(--shell-texto)]">
            {pistaActual.titulo}
          </p>
          <p className="mt-1 text-xs leading-5 text-[color:var(--color-acento)]">
            {pistaActual.subtitulo}
          </p>
        </div>
      </div>

      <div className="flex max-w-[50%] flex-1 flex-col items-center gap-1">
        <div className="flex items-center gap-3 sm:gap-4">
          <button className="hidden transition-colors sm:block text-[color:var(--color-acento)] hover:text-[color:var(--shell-texto)]">
            <Icono nombre="aleatorio" tamaño={16} />
          </button>
          <button className="transition-colors text-[color:var(--color-acento)] hover:text-[color:var(--shell-texto)]">
            <Icono nombre="retroceder" tamaño={20} peso="fill" />
          </button>
          <button
            onClick={toggleReproduccion}
            disabled={mostrandoCarga}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-white transition-transform hover:scale-105 sm:h-11 sm:w-11"
          >
            {mostrandoCarga ? (
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-[color:var(--color-violet-950)] border-t-transparent" />
            ) : (
              <Icono
                nombre={reproduciendo ? "pausar" : "reproducir"}
                tamaño={20}
                peso="fill"
                className="text-[color:var(--color-violet-950)]"
              />
            )}
          </button>
          <button className="transition-colors text-[color:var(--color-acento)] hover:text-[color:var(--shell-texto)]">
            <Icono nombre="avanzar" tamaño={20} peso="fill" />
          </button>
          <button className="hidden transition-colors sm:block text-[color:var(--color-acento)] hover:text-[color:var(--shell-texto)]">
            <Icono nombre="repetir" tamaño={16} />
          </button>
        </div>

        <div className="flex w-full max-w-md items-center gap-2">
          <span className="w-8 text-right text-[10px] tabular-nums text-[color:var(--color-acento)]">
            {formatearTiempo(progresoSegundos)}
          </span>
          <div className="group relative h-1 flex-1">
            <div
              className="absolute inset-0 rounded-full"
              style={{ background: "var(--shell-borde)" }}
            />
            <div
              className="absolute left-0 top-0 h-full rounded-full transition-colors"
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
          <span className="w-8 text-[10px] tabular-nums text-[color:var(--color-acento)]">
            {formatearTiempo(pistaActual.duracionSegundos)}
          </span>
        </div>
      </div>

      <div className="hidden w-[25%] items-center justify-end gap-3 sm:flex">
        <button className="transition-colors text-[color:var(--color-acento)] hover:text-[color:var(--shell-texto)]">
          <Icono nombre="cola" tamaño={18} />
        </button>
        <button
          onClick={toggleSilencio}
          className="transition-colors text-[color:var(--color-acento)] hover:text-[color:var(--shell-texto)]"
        >
          <Icono
            nombre={silenciado ? "volumenMudo" : "volumenAlto"}
            tamaño={18}
          />
        </button>
        <div className="group relative h-1 w-20">
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
        <button className="transition-colors text-[color:var(--color-acento)] hover:text-[color:var(--shell-texto)]">
          <Icono nombre="expandir" tamaño={18} />
        </button>
      </div>
    </footer>
  );
}

