"use client";

import { useRef, useEffect, useCallback, useState } from "react";
import { useStoreUI } from "@/lib/stores/store-ui";
import { Icono } from "@/componentes/ui/icono";
import { clienteApi } from "@/lib/api/cliente";

function formatearTiempo(segundos: number): string {
  const min = Math.floor(segundos / 60);
  const seg = Math.floor(segundos % 60);
  return `${min}:${seg.toString().padStart(2, "0")}`;
}

export default function ReproductorCosmico() {
  const {
    pistaActual,
    reproduciendo,
    progresoSegundos,
    volumen,
    silenciado,
    segmentoActual,
    toggleReproduccion,
    setProgreso,
    setVolumen,
    toggleSilencio,
    setSegmentoActual,
  } = useStoreUI();

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const ultimoPistaId = useRef<string | null>(null);

  // Obtener URL presigned cuando cambia la pista
  useEffect(() => {
    if (!pistaActual?.url || pistaActual.id === ultimoPistaId.current) return;
    ultimoPistaId.current = pistaActual.id;
    setAudioUrl(null);

    clienteApi
      .get<{ url: string }>(`/podcast/audio/${pistaActual.id}`)
      .then((data) => setAudioUrl(data.url))
      .catch(() => setAudioUrl(null));
  }, [pistaActual?.id, pistaActual?.url]);

  const tieneAudio = !!audioUrl;

  // Sincronizar play/pause con el elemento audio
  useEffect(() => {
    if (!audioRef.current || !tieneAudio) return;
    if (reproduciendo) {
      audioRef.current.play().catch(() => {});
    } else {
      audioRef.current.pause();
    }
  }, [reproduciendo, tieneAudio]);

  // Sincronizar volumen
  useEffect(() => {
    if (!audioRef.current) return;
    audioRef.current.volume = silenciado ? 0 : volumen / 100;
  }, [volumen, silenciado]);

  // Manejar timeUpdate del audio
  const handleTimeUpdate = useCallback(() => {
    if (!audioRef.current) return;
    const tiempo = audioRef.current.currentTime;
    setProgreso(tiempo);

    // Calcular segmento activo
    if (pistaActual?.segmentos) {
      const idx = pistaActual.segmentos.findIndex(
        (s) => tiempo >= s.inicio_seg && tiempo < s.fin_seg
      );
      if (idx !== -1 && idx !== segmentoActual) {
        setSegmentoActual(idx);
      }
    }
  }, [pistaActual, segmentoActual, setProgreso, setSegmentoActual]);

  // Manejar fin del audio
  const handleEnded = useCallback(() => {
    setProgreso(0);
    setSegmentoActual(0);
    useStoreUI.setState({ reproduciendo: false });
  }, [setProgreso, setSegmentoActual]);

  // Manejar seek en la barra de progreso
  const handleSeek = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const valor = Number(e.target.value);
      setProgreso(valor);
      if (audioRef.current && tieneAudio) {
        audioRef.current.currentTime = valor;
      }
    },
    [setProgreso, tieneAudio]
  );

  if (!pistaActual) {
    return null;
  }

  const porcentaje =
    pistaActual.duracionSegundos > 0
      ? (progresoSegundos / pistaActual.duracionSegundos) * 100
      : 0;

  return (
    <footer className="fixed bottom-0 left-0 right-0 z-50 h-[80px] bg-[#1A1128] flex items-center px-4 lg:px-6 gap-4">
      {/* Audio element oculto — usa URL presigned de MinIO */}
      {tieneAudio && (
        <audio
          ref={audioRef}
          src={audioUrl}
          onTimeUpdate={handleTimeUpdate}
          onEnded={handleEnded}
          preload="auto"
        />
      )}

      {/* Izquierda: Cover + info + cerrar */}
      <div className="flex items-center gap-3 w-[25%] min-w-0">
        <button
          onClick={() => {
            if (audioRef.current) {
              audioRef.current.pause();
              audioRef.current.src = "";
            }
            setAudioUrl(null);
            ultimoPistaId.current = null;
            useStoreUI.setState({
              pistaActual: null,
              reproduciendo: false,
              progresoSegundos: 0,
              segmentoActual: 0,
            });
          }}
          className="text-[#B388FF]/60 hover:text-[#F5F0FF] transition-colors shrink-0"
          title="Cerrar reproductor"
        >
          <Icono nombre="x" tamaño={16} />
        </button>
        <div
          className={`h-14 w-14 shrink-0 rounded-lg bg-gradient-to-br ${pistaActual.gradiente} flex items-center justify-center`}
        >
          <Icono
            nombre={pistaActual.icono}
            tamaño={24}
            peso="fill"
            className="text-white/80"
          />
        </div>
        <div className="min-w-0 hidden sm:block">
          <p className="text-sm font-medium text-[#F5F0FF] truncate">
            {pistaActual.titulo}
          </p>
          <p className="text-xs text-[#B388FF] truncate">
            {pistaActual.subtitulo}
          </p>
        </div>
      </div>

      {/* Centro: Controles + barra progreso */}
      <div className="flex-1 flex flex-col items-center gap-1 max-w-[50%]">
        {/* Controles */}
        <div className="flex items-center gap-3 sm:gap-4">
          <button className="hidden sm:block text-[#B388FF] hover:text-white transition-colors">
            <Icono nombre="aleatorio" tamaño={16} />
          </button>
          <button className="text-[#B388FF] hover:text-white transition-colors">
            <Icono nombre="retroceder" tamaño={20} peso="fill" />
          </button>
          <button
            onClick={toggleReproduccion}
            className="h-10 w-10 sm:h-11 sm:w-11 rounded-full bg-white flex items-center justify-center hover:scale-105 transition-transform"
          >
            <Icono
              nombre={reproduciendo ? "pausar" : "reproducir"}
              tamaño={20}
              peso="fill"
              className="text-[#1A1128]"
            />
          </button>
          <button className="text-[#B388FF] hover:text-white transition-colors">
            <Icono nombre="avanzar" tamaño={20} peso="fill" />
          </button>
          <button className="hidden sm:block text-[#B388FF] hover:text-white transition-colors">
            <Icono nombre="repetir" tamaño={16} />
          </button>
        </div>

        {/* Barra de progreso */}
        <div className="flex items-center gap-2 w-full max-w-md">
          <span className="text-[10px] text-[#B388FF] w-8 text-right tabular-nums">
            {formatearTiempo(progresoSegundos)}
          </span>
          <div className="flex-1 relative h-1 group">
            <div className="absolute inset-0 rounded-full bg-white/20" />
            <div
              className="absolute left-0 top-0 h-full rounded-full bg-[#7C4DFF] group-hover:bg-[#B388FF] transition-colors"
              style={{ width: `${porcentaje}%` }}
            />
            <input
              type="range"
              min={0}
              max={pistaActual.duracionSegundos}
              value={progresoSegundos}
              onChange={handleSeek}
              className="absolute inset-0 w-full opacity-0 cursor-pointer"
            />
          </div>
          <span className="text-[10px] text-[#B388FF] w-8 tabular-nums">
            {formatearTiempo(pistaActual.duracionSegundos)}
          </span>
        </div>
      </div>

      {/* Derecha: cola, volumen, expandir */}
      <div className="hidden sm:flex items-center gap-3 w-[25%] justify-end">
        <button className="text-[#B388FF] hover:text-white transition-colors">
          <Icono nombre="cola" tamaño={18} />
        </button>
        <button
          onClick={toggleSilencio}
          className="text-[#B388FF] hover:text-white transition-colors"
        >
          <Icono
            nombre={silenciado ? "volumenMudo" : "volumenAlto"}
            tamaño={18}
          />
        </button>
        <div className="relative w-20 h-1 group">
          <div className="absolute inset-0 rounded-full bg-white/20" />
          <div
            className="absolute left-0 top-0 h-full rounded-full bg-[#B388FF] group-hover:bg-white transition-colors"
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
        <button className="text-[#B388FF] hover:text-white transition-colors">
          <Icono nombre="expandir" tamaño={18} />
        </button>
      </div>
    </footer>
  );
}
