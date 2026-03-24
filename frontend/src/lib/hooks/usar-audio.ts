/**
 * Hook compartido para gestionar el elemento <audio> del reproductor.
 *
 * Extrae la logica de audio de reproductor-cosmico.tsx para que
 * tanto el reproductor desktop como el mini-reproductor mobile
 * puedan compartir la misma instancia de audio.
 */

"use client";

import { useRef, useEffect, useCallback, useState } from "react";
import { useStoreUI } from "@/lib/stores/store-ui";
import { clienteApi } from "@/lib/api/cliente";

export function usarAudio() {
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
  const manejarSeek = useCallback(
    (valor: number) => {
      setProgreso(valor);
      if (audioRef.current && tieneAudio) {
        audioRef.current.currentTime = valor;
      }
    },
    [setProgreso, tieneAudio]
  );

  // Cerrar reproductor completamente
  const manejarCerrar = useCallback(() => {
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
      miniReproductorExpandido: false,
    });
  }, []);

  // Porcentaje de progreso
  const porcentaje =
    pistaActual && pistaActual.duracionSegundos > 0
      ? (progresoSegundos / pistaActual.duracionSegundos) * 100
      : 0;

  return {
    audioRef,
    audioUrl,
    tieneAudio,
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
  };
}
