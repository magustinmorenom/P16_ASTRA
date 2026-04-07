import { useEffect, useRef, useState } from "react";
import { View, Text, Pressable, ScrollView } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  Play,
  Pause,
  CaretDown,
  Rewind,
  FastForward,
  SpeakerHigh,
  SpeakerSlash,
  Microphone,
} from "phosphor-react-native";
import Slider from "@react-native-community/slider";
import { useStoreUI, type PistaReproduccion } from "@/lib/stores/store-ui";
import { usarTema } from "@/lib/hooks/usar-tema";

interface AudioContextProps {
  pistaActual: PistaReproduccion | null;
  reproduciendo: boolean;
  progresoSegundos: number;
  segmentoActual: number;
  volumen: number;
  silenciado: boolean;
  descargandoAudio: boolean;
  progresoDescarga: number;
  errorAudio: string | null;
  toggleReproduccion: () => void;
  setVolumen: (v: number) => void;
  toggleSilencio: () => void;
  manejarSeek: (v: number) => void;
  manejarCerrar: () => void;
}

export function ReproductorCompleto({
  pistaActual,
  reproduciendo,
  progresoSegundos,
  segmentoActual,
  volumen,
  silenciado,
  descargandoAudio,
  progresoDescarga,
  errorAudio,
  toggleReproduccion,
  setVolumen,
  toggleSilencio,
  manejarSeek,
  manejarCerrar,
}: AudioContextProps) {
  const insets = useSafeAreaInsets();
  const { toggleMiniReproductor } = useStoreUI();
  const { esOscuro } = usarTema();
  const scrollRef = useRef<ScrollView>(null);
  const offsetsSegmentos = useRef<Record<number, number>>({});
  const segmentos = pistaActual?.segmentos ?? [];

  const [isScrollingText, setIsScrollingText] = useState(false);
  const timerScrollRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!segmentos.length || isScrollingText) return;
    const idx = Math.min(segmentoActual, segmentos.length - 1);
    const offset = offsetsSegmentos.current[idx];
    if (typeof offset !== "number") return;

    scrollRef.current?.scrollTo({
      y: Math.max(offset - 160, 0),
      animated: true,
    });
  }, [segmentoActual, segmentos.length]);

  if (!pistaActual) return null;

  const duracion = pistaActual.duracionSegundos || 1;

  return (
    <View
      style={{
        position: "absolute",
        top: 0,
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 50,
      }}
    >
      <LinearGradient
        colors={
          esOscuro
            ? ["#1a1128", "#120e20", "#0a0816"]
            : ["#2D1B69", "#1a1128", "#0f0a1e"]
        }
        style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}
      />

      {/* Header */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          paddingHorizontal: 20,
          paddingTop: insets.top + 8,
          paddingBottom: 8,
        }}
      >
        <Pressable
          onPress={toggleMiniReproductor}
          accessibilityRole="button"
          accessibilityLabel="Minimizar reproductor"
          hitSlop={12}
          style={{ padding: 4 }}
        >
          <CaretDown size={24} color="rgba(255,255,255,0.7)" />
        </Pressable>

        <Text
          style={{
            color: "rgba(255,255,255,0.5)",
            fontSize: 11,
            fontFamily: "Inter_600SemiBold",
            textTransform: "uppercase",
            letterSpacing: 1.8,
          }}
        >
          {pistaActual.subtitulo}
        </Text>

        <View style={{ width: 32 }} />
      </View>

      {/* Lyrics */}
      {segmentos.length > 0 ? (
        <ScrollView
          ref={scrollRef}
          style={{ flex: 1 }}
          contentContainerStyle={{
            paddingHorizontal: 24,
            paddingTop: 40,
            paddingBottom: 40,
          }}
          showsVerticalScrollIndicator={false}
          onScrollBeginDrag={() => {
            setIsScrollingText(true);
            if (timerScrollRef.current) clearTimeout(timerScrollRef.current);
          }}
          onScrollEndDrag={() => {
            timerScrollRef.current = setTimeout(() => setIsScrollingText(false), 3000);
          }}
          onMomentumScrollEnd={() => {
            if (timerScrollRef.current) clearTimeout(timerScrollRef.current);
            timerScrollRef.current = setTimeout(() => setIsScrollingText(false), 3000);
          }}
        >
          {segmentos.map((segmento, index) => {
            const activo =
              index === segmentoActual || (index === 0 && progresoSegundos === 0);
            const pasado = index < segmentoActual;

            return (
              <Pressable
                key={`${segmento.inicio_seg}-${index}`}
                onPress={() => manejarSeek(segmento.inicio_seg)}
                onLayout={(event) => {
                  offsetsSegmentos.current[index] = event.nativeEvent.layout.y;
                }}
                style={{ marginBottom: 16 }}
              >
                <Text
                  style={{
                    color: activo
                      ? "#FFFFFF"
                      : pasado
                      ? "rgba(255,255,255,0.25)"
                      : "rgba(255,255,255,0.4)",
                    fontSize: activo ? 24 : 18,
                    lineHeight: activo ? 34 : 26,
                    fontFamily: activo ? "Inter_700Bold" : "Inter_500Medium",
                  }}
                >
                  {segmento.texto}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      ) : (
        <View
          style={{
            flex: 1,
            alignItems: "center",
            justifyContent: "center",
            paddingHorizontal: 40,
          }}
        >
          <View
            style={{
              width: 200,
              height: 200,
              borderRadius: 20,
              backgroundColor: "rgba(124,77,255,0.15)",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: 32,
            }}
          >
            <Microphone size={72} color="#B388FF" weight="duotone" />
          </View>
          <Text
            style={{
              color: "#FFFFFF",
              fontSize: 22,
              fontFamily: "Inter_700Bold",
              textAlign: "center",
            }}
          >
            {pistaActual.titulo}
          </Text>
          {errorAudio && (
            <Text
              style={{
                color: "#f87171",
                fontSize: 13,
                textAlign: "center",
                marginTop: 12,
              }}
            >
              {errorAudio}
            </Text>
          )}
          {descargandoAudio && (
            <Text
              style={{
                color: "#c084fc",
                fontSize: 13,
                fontFamily: "Inter_600SemiBold",
                marginTop: 12,
              }}
            >
              Descargando {progresoDescarga}%
            </Text>
          )}
        </View>
      )}

      {/* Controles */}
      <View
        style={{
          paddingHorizontal: 24,
          paddingBottom: insets.bottom + 16,
        }}
      >
        <Text
          numberOfLines={1}
          style={{
            color: "#FFFFFF",
            fontSize: 16,
            fontFamily: "Inter_700Bold",
            marginBottom: 4,
          }}
        >
          {pistaActual.titulo}
        </Text>
        <Text
          style={{
            color: "rgba(255,255,255,0.5)",
            fontSize: 12,
            fontFamily: "Inter_400Regular",
            marginBottom: 16,
          }}
        >
          ASTRA
        </Text>

        {/* Play controls */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            gap: 32,
            marginBottom: 20,
          }}
        >
          <Pressable
            onPress={() => manejarSeek(Math.max(progresoSegundos - 10, 0))}
            accessibilityRole="button"
            accessibilityLabel="Retroceder 10 segundos"
            hitSlop={12}
          >
            <Rewind size={28} color="rgba(255,255,255,0.7)" weight="fill" />
          </Pressable>

          <Pressable
            onPress={toggleReproduccion}
            disabled={descargandoAudio}
            accessibilityRole="button"
            accessibilityLabel={reproduciendo ? "Pausar" : "Reproducir"}
            style={{
              width: 64,
              height: 64,
              borderRadius: 32,
              backgroundColor: "#FFFFFF",
              alignItems: "center",
              justifyContent: "center",
              opacity: descargandoAudio ? 0.4 : 1,
            }}
          >
            {reproduciendo ? (
              <Pause size={28} color="#1a1128" weight="fill" />
            ) : (
              <Play size={28} color="#1a1128" weight="fill" style={{ marginLeft: 3 }} />
            )}
          </Pressable>

          <Pressable
            onPress={() => manejarSeek(Math.min(progresoSegundos + 10, duracion))}
            accessibilityRole="button"
            accessibilityLabel="Avanzar 10 segundos"
            hitSlop={12}
          >
            <FastForward size={28} color="rgba(255,255,255,0.7)" weight="fill" />
          </Pressable>
        </View>

        {/* Volume */}
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <Pressable
            onPress={toggleSilencio}
            accessibilityRole="button"
            accessibilityLabel={silenciado ? "Activar sonido" : "Silenciar"}
            hitSlop={8}
            style={{ marginRight: 10 }}
          >
            {silenciado ? (
              <SpeakerSlash size={18} color="rgba(255,255,255,0.4)" />
            ) : (
              <SpeakerHigh size={18} color="rgba(255,255,255,0.5)" />
            )}
          </Pressable>
          <Slider
            style={{ flex: 1, height: 20 }}
            minimumValue={0}
            maximumValue={100}
            value={volumen}
            onValueChange={(v) => setVolumen(Math.round(v))}
            minimumTrackTintColor="rgba(255,255,255,0.7)"
            maximumTrackTintColor="rgba(255,255,255,0.15)"
            thumbTintColor="#FFFFFF"
          />
        </View>
      </View>
    </View>
  );
}
