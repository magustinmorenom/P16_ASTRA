"use client";

import { Icono } from "@/componentes/ui/icono";
import { useStoreUI } from "@/lib/stores/store-ui";
import { usarAudio } from "@/lib/hooks/usar-audio";

function formatearTiempo(segundos: number): string {
  const min = Math.floor(segundos / 60);
  const seg = Math.floor(segundos % 60);
  return `${min}:${seg.toString().padStart(2, "0")}`;
}

// ---------------------------------------------------------------------------
// Mini Reproductor (barra compacta para mobile)
// ---------------------------------------------------------------------------
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
      {/* Audio element */}
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

      {/* ===== Barra compacta ===== */}
      <div
        className="fixed left-0 right-0 z-40 bg-[#1A1128]"
        style={{
          bottom: "calc(var(--tab-bar-height) + env(safe-area-inset-bottom, 0px))",
        }}
      >
        {/* Barra de progreso superior ultra-fina */}
        <div className="h-[2px] bg-white/10 relative">
          <div
            className="absolute left-0 top-0 h-full bg-[#7C4DFF] transition-[width] duration-300"
            style={{ width: `${porcentaje}%` }}
          />
        </div>

        {/* Contenido del mini player */}
        <div className="flex items-center h-[54px] px-3 gap-3">
          {/* Cover — tap para expandir */}
          <button
            onClick={toggleMiniReproductor}
            className="touch-feedback flex items-center gap-3 flex-1 min-w-0"
          >
            <div
              className={`h-10 w-10 shrink-0 rounded-lg bg-gradient-to-br ${pistaActual.gradiente} flex items-center justify-center`}
            >
              <Icono
                nombre={pistaActual.icono}
                tamaño={18}
                peso="fill"
                className="text-white/80"
              />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-[#F5F0FF] truncate">
                {pistaActual.titulo}
              </p>
              <p className="text-[11px] text-[#B388FF] truncate">
                {pistaActual.subtitulo}
              </p>
            </div>
          </button>

          {/* Controles */}
          <button
            onClick={toggleReproduccion}
            disabled={mostrandoCarga}
            className="touch-feedback h-11 w-11 rounded-full bg-white flex items-center justify-center shrink-0"
          >
            {mostrandoCarga ? (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-[#1A1128] border-t-transparent" />
            ) : (
              <Icono
                nombre={reproduciendo ? "pausar" : "reproducir"}
                tamaño={18}
                peso="fill"
                className="text-[#1A1128]"
              />
            )}
          </button>

          <button
            onClick={manejarCerrar}
            className="text-[#B388FF]/60 p-1 shrink-0"
          >
            <Icono nombre="x" tamaño={16} />
          </button>
        </div>
      </div>

      {/* ===== Reproductor expandido (full-screen overlay) ===== */}
      {miniReproductorExpandido && (
        <div className="fixed inset-0 z-[100] bg-[#0F0A1A] flex flex-col animate-slide-up">
          {/* Safe area top */}
          <div style={{ paddingTop: "env(safe-area-inset-top, 0px)" }} />

          {/* Header */}
          <div className="flex items-center justify-between px-5 py-3">
            <button
              onClick={toggleMiniReproductor}
              className="touch-feedback h-10 w-10 flex items-center justify-center text-white/60"
            >
              <Icono nombre="flechaIzquierda" tamaño={22} />
            </button>
            <span className="text-xs text-[#B388FF] font-medium uppercase tracking-wider">
              Reproduciendo
            </span>
            <div className="w-10" /> {/* spacer */}
          </div>

          {/* Cover grande */}
          <div className="flex-1 flex items-center justify-center px-12">
            <div
              className={`w-full max-w-[300px] aspect-square rounded-3xl bg-gradient-to-br ${pistaActual.gradiente} flex items-center justify-center shadow-[0_16px_64px_rgba(124,77,255,0.3)]`}
            >
              <Icono
                nombre={pistaActual.icono}
                tamaño={80}
                peso="fill"
                className="text-white/60"
              />
            </div>
          </div>

          {/* Info */}
          <div className="px-8 mb-4">
            <p className="text-xl font-semibold text-white truncate">
              {pistaActual.titulo}
            </p>
            <p className="text-sm text-[#B388FF] truncate mt-1">
              {pistaActual.subtitulo}
            </p>
          </div>

          {/* Barra de progreso */}
          <div className="px-8 mb-2">
            <div className="relative h-1.5 rounded-full bg-white/15">
              <div
                className="absolute left-0 top-0 h-full rounded-full bg-[#7C4DFF]"
                style={{ width: `${porcentaje}%` }}
              />
              <input
                type="range"
                min={0}
                max={pistaActual.duracionSegundos}
                value={progresoSegundos}
                onChange={(e) => manejarSeek(Number(e.target.value))}
                className="absolute inset-0 w-full opacity-0 cursor-pointer"
              />
            </div>
            <div className="flex justify-between mt-1.5">
              <span className="text-[11px] text-[#B388FF] tabular-nums">
                {formatearTiempo(progresoSegundos)}
              </span>
              <span className="text-[11px] text-[#B388FF] tabular-nums">
                {formatearTiempo(pistaActual.duracionSegundos)}
              </span>
            </div>
          </div>

          {/* Controles grandes */}
          <div className="flex items-center justify-center gap-8 py-6">
            <button className="text-[#B388FF] hover:text-white transition-colors">
              <Icono nombre="retroceder" tamaño={28} peso="fill" />
            </button>
            <button
              onClick={toggleReproduccion}
              disabled={mostrandoCarga}
              className="touch-feedback h-16 w-16 rounded-full bg-white flex items-center justify-center"
            >
              {mostrandoCarga ? (
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#1A1128] border-t-transparent" />
              ) : (
                <Icono
                  nombre={reproduciendo ? "pausar" : "reproducir"}
                  tamaño={28}
                  peso="fill"
                  className="text-[#1A1128]"
                />
              )}
            </button>
            <button className="text-[#B388FF] hover:text-white transition-colors">
              <Icono nombre="avanzar" tamaño={28} peso="fill" />
            </button>
          </div>

          {/* Volumen */}
          <div className="flex items-center gap-3 px-8 pb-4">
            <button
              onClick={toggleSilencio}
              className="text-[#B388FF] shrink-0"
            >
              <Icono
                nombre={silenciado ? "volumenMudo" : "volumenAlto"}
                tamaño={18}
              />
            </button>
            <div className="flex-1 relative h-1 group">
              <div className="absolute inset-0 rounded-full bg-white/15" />
              <div
                className="absolute left-0 top-0 h-full rounded-full bg-[#B388FF]"
                style={{ width: `${silenciado ? 0 : volumen}%` }}
              />
              <input
                type="range"
                min={0}
                max={100}
                value={silenciado ? 0 : volumen}
                onChange={(e) => setVolumen(Number(e.target.value))}
                className="absolute inset-0 w-full opacity-0 cursor-pointer"
              />
            </div>
          </div>

          {/* Safe area bottom */}
          <div style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }} />
        </div>
      )}
    </>
  );
}
