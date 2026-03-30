/**
 * Hook compartido para gestionar el elemento <audio> del reproductor.
 *
 * Extrae la logica de audio de reproductor-cosmico.tsx para que
 * tanto el reproductor desktop como el mini-reproductor mobile
 * puedan compartir la misma instancia de audio.
 */

"use client";

import { useRef, useEffect, useCallback, useState } from "react";
import { clienteApi } from "@/lib/api/cliente";
import { useStoreUI } from "@/lib/stores/store-ui";
import type { PodcastEpisodio } from "@/lib/tipos";

const cacheAudioPodcast = new Map<string, string>();
const cargasAudioPendientes = new Map<string, Promise<string>>();

async function obtenerUrlAudioPodcast(episodioId: string): Promise<string> {
  const urlCacheada = cacheAudioPodcast.get(episodioId);
  if (urlCacheada) return urlCacheada;

  const cargaPendiente = cargasAudioPendientes.get(episodioId);
  if (cargaPendiente) return cargaPendiente;

  const carga = clienteApi
    .getBlob(`/podcast/audio/${episodioId}`)
    .then((blob) => {
      const url = URL.createObjectURL(blob);
      cacheAudioPodcast.set(episodioId, url);
      cargasAudioPendientes.delete(episodioId);
      return url;
    })
    .catch((error) => {
      cargasAudioPendientes.delete(episodioId);
      throw error;
    });

  cargasAudioPendientes.set(episodioId, carga);
  return carga;
}

export async function obtenerBlobAudioPodcast(episodioId: string): Promise<Blob> {
  return clienteApi.getBlob(`/podcast/audio/${episodioId}`);
}

export function precargarAudiosPodcast(episodios: PodcastEpisodio[]): void {
  episodios
    .filter((episodio) => episodio.estado === "listo" && !!episodio.url_audio)
    .forEach((episodio) => {
      void obtenerUrlAudioPodcast(episodio.id).catch(() => {
        // Si falla la precarga, la reproducción hará un nuevo intento on-demand.
      });
    });
}


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
    mostrarToast,
  } = useStoreUI();

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [cargandoAudio, setCargandoAudio] = useState(false);

  // Obtener audio como blob cuando cambia la pista
  useEffect(() => {
    if (!pistaActual?.url) {
      setAudioUrl(null);
      setCargandoAudio(false);
      return;
    }

    const urlCacheada = cacheAudioPodcast.get(pistaActual.id);
    if (urlCacheada) {
      setAudioUrl(urlCacheada);
      setCargandoAudio(false);
      return;
    }

    setAudioUrl(null);
    setCargandoAudio(true);

    let cancelado = false;

    void obtenerUrlAudioPodcast(pistaActual.id)
      .then((url) => {
        if (cancelado) return;
        setAudioUrl(url);
        setCargandoAudio(false);
      })
      .catch(() => {
        if (cancelado) return;
        setAudioUrl(null);
        setCargandoAudio(false);
        useStoreUI.setState({ reproduciendo: false });
        mostrarToast("error", "No pudimos cargar el audio del podcast.");
      })
      .finally(() => undefined);

    return () => {
      cancelado = true;
    };
  }, [mostrarToast, pistaActual]);

  const tieneAudio = !!audioUrl;

  // Sincronizar play/pause con el elemento audio
  useEffect(() => {
    if (!audioRef.current || !tieneAudio) return;
    if (reproduciendo) {
      audioRef.current.play().catch(() => {
        useStoreUI.setState({ reproduciendo: false });
        mostrarToast("info", "El audio ya está listo. Presioná play nuevamente.");
      });
    } else {
      audioRef.current.pause();
    }
  }, [reproduciendo, tieneAudio, mostrarToast]);

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
  };
}
