import { useEffect, useCallback, useRef } from "react";
import {
  useAudioPlayer,
  useAudioPlayerStatus,
  setAudioModeAsync,
} from "expo-audio";
import * as FileSystem from "expo-file-system/legacy";
import * as SecureStore from "expo-secure-store";
import { useStoreUI } from "@/lib/stores/store-ui";
import { API_BASE_URL } from "@/lib/api/cliente";

export function usarAudioNativo() {
  const {
    pistaActual,
    reproduciendo,
    progresoSegundos,
    volumen,
    silenciado,
    segmentoActual,
    descargandoAudio,
    progresoDescarga,
    errorAudio,
    toggleReproduccion,
    setProgreso,
    setVolumen,
    toggleSilencio,
    setSegmentoActual,
    setDescargandoAudio,
    setProgresoDescarga,
    setErrorAudio,
  } = useStoreUI();

  const player = useAudioPlayer(null);
  const status = useAudioPlayerStatus(player);
  const ultimoPistaId = useRef<string | null>(null);

  // Configurar modo de audio
  useEffect(() => {
    setAudioModeAsync({
      playsInSilentMode: true,
      shouldPlayInBackground: true,
    });
  }, []);

  // Cargar audio cuando cambia la pista
  useEffect(() => {
    if (!pistaActual?.url || pistaActual.id === ultimoPistaId.current) return;
    ultimoPistaId.current = pistaActual.id;

    const cargarAudio = async () => {
      try {
        setErrorAudio(null);
        setDescargandoAudio(true);
        setProgresoDescarga(0);

        const token = await SecureStore.getItemAsync("access_token");
        const audioUrl = `${API_BASE_URL}/podcast/audio/${pistaActual.id}`;
        
        console.log(`[usarAudioNativo] Iniciando descarga con API legacy: ${audioUrl}`);
        
        const destinoUri = `${FileSystem.cacheDirectory}podcast_${pistaActual.id}.mp3`;

        const result = await FileSystem.downloadAsync(audioUrl, destinoUri, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });

        console.log(`[usarAudioNativo] Descarga API legacy completada: ${result.uri}`);

        setProgresoDescarga(100);
        setDescargandoAudio(false);

        if (result.status !== 200) {
          throw new Error(`HTTP Status ${result.status}`);
        }

        player.replace({ uri: result.uri });
        player.play();
      } catch (error) {
        console.error("[usarAudioNativo] Falló la descarga de audio:", error);
        setDescargandoAudio(false);
        setProgresoDescarga(0);
        setErrorAudio("No se pudo cargar el audio. Verifica tu conexion.");
        useStoreUI.setState({ reproduciendo: false });
      }
    };

    cargarAudio();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pistaActual?.id, pistaActual?.url]);

  // Sincronizar play/pause desde el store
  useEffect(() => {
    if (!ultimoPistaId.current) return;
    if (reproduciendo) {
      player.play();
    } else {
      player.pause();
    }
  }, [reproduciendo, player]);

  // Sincronizar volumen
  useEffect(() => {
    player.volume = silenciado ? 0 : volumen / 100;
  }, [volumen, silenciado, player]);

  // Actualizar progreso desde el status del player
  useEffect(() => {
    if (!status || !pistaActual) return;

    const segundos = status.currentTime;
    if (typeof segundos === "number" && segundos >= 0) {
      setProgreso(segundos);

      // Calcular segmento activo (búsqueda robusta inversa para sortear silencios)
      if (pistaActual.segmentos && pistaActual.segmentos.length > 0) {
        let nuevoIdx = 0;
        for (let i = pistaActual.segmentos.length - 1; i >= 0; i--) {
          if (segundos >= pistaActual.segmentos[i].inicio_seg) {
            nuevoIdx = i;
            break; // Encontramos el último bloque que ya empezó
          }
        }
        if (nuevoIdx !== segmentoActual) {
          setSegmentoActual(nuevoIdx);
        }
      }
    }

    // Detectar fin de reproducción
    if (status.playing === false && status.currentTime >= (status.duration - 0.5) && status.duration > 0) {
      setProgreso(0);
      setSegmentoActual(0);
      useStoreUI.setState({ reproduciendo: false });
    }
  }, [status.currentTime, status.playing, status.duration, pistaActual, segmentoActual, setProgreso, setSegmentoActual]);

  const manejarSeek = useCallback(
    (valor: number) => {
      setProgreso(valor);
      player.seekTo(valor);
    },
    [setProgreso, player]
  );

  const manejarCerrar = useCallback(() => {
    player.pause();
    ultimoPistaId.current = null;
    useStoreUI.setState({
      pistaActual: null,
      reproduciendo: false,
      progresoSegundos: 0,
      segmentoActual: 0,
      miniReproductorExpandido: false,
    });
  }, [player]);

  const porcentaje =
    pistaActual && pistaActual.duracionSegundos > 0
      ? (progresoSegundos / pistaActual.duracionSegundos) * 100
      : 0;

  return {
    pistaActual,
    reproduciendo,
    progresoSegundos,
    volumen,
    silenciado,
    segmentoActual,
    porcentaje,
    descargandoAudio,
    progresoDescarga,
    errorAudio,
    toggleReproduccion,
    setVolumen,
    toggleSilencio,
    manejarSeek,
    manejarCerrar,
  };
}
