import { useEffect, useRef } from "react";
import { View, Text, Pressable, ScrollView } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  Play,
  Pause,
  X,
  CaretDown,
  SpeakerHigh,
  SpeakerSlash,
} from "phosphor-react-native";
import Slider from "@react-native-community/slider";
import { useStoreUI } from "@/lib/stores/store-ui";
import { usarAudioNativo } from "@/lib/hooks/usar-audio-nativo";
import { usarTema } from "@/lib/hooks/usar-tema";

function formatearTiempo(seg: number): string {
  const m = Math.floor(seg / 60);
  const s = Math.floor(seg % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
}

export function ReproductorCompleto() {
  const insets = useSafeAreaInsets();
  const { toggleMiniReproductor } = useStoreUI();
  const {
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
  } = usarAudioNativo();
  const { colores } = usarTema();
  const scrollRef = useRef<ScrollView>(null);
  const offsetsSegmentos = useRef<Record<number, number>>({});
  const segmentos = pistaActual?.segmentos ?? [];

  useEffect(() => {
    if (!segmentos.length) return;
    const offset = offsetsSegmentos.current[Math.min(segmentoActual, segmentos.length - 1)];
    if (typeof offset !== "number") return;

    scrollRef.current?.scrollTo({
      y: Math.max(offset - 120, 0),
      animated: true,
    });
  }, [segmentoActual, segmentos.length]);

  if (!pistaActual) return null;

  return (
    <View
      style={{
        position: "absolute",
        top: 0,
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: colores.fondo,
        zIndex: 50,
        paddingTop: insets.top,
      }}
    >
      {/* Header */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          paddingHorizontal: 16,
          paddingVertical: 12,
        }}
      >
        <Pressable onPress={toggleMiniReproductor} style={{ padding: 8 }}>
          <CaretDown size={24} color={colores.primario} />
        </Pressable>
        <Text
          style={{
            color: colores.textoSecundario,
            fontSize: 11,
            textTransform: "uppercase",
            letterSpacing: 1.5,
            fontFamily: "Inter_500Medium",
          }}
        >
          Reproduciendo
        </Text>
        <Pressable onPress={manejarCerrar} style={{ padding: 8 }}>
          <X size={20} color={colores.textoMuted} />
        </Pressable>
      </View>

      <View style={{ alignItems: "center", paddingHorizontal: 32, paddingTop: 8 }}>
        <View
          style={{
            width: 188,
            height: 188,
            borderRadius: 24,
            backgroundColor: colores.acento + "1A",
            borderWidth: 1,
            borderColor: colores.acento + "4D",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 24,
          }}
        >
          <Text style={{ color: colores.acento, fontSize: 56, fontFamily: "Inter_700Bold" }}>
            {pistaActual.tipo === "podcast" ? "P" : "L"}
          </Text>
        </View>

        <Text
          style={{
            color: colores.primario,
            fontSize: 20,
            fontFamily: "Inter_700Bold",
            textAlign: "center",
          }}
        >
          {pistaActual.titulo}
        </Text>
        <Text
          style={{
            color: colores.textoSecundario,
            fontSize: 14,
            marginTop: 4,
            fontFamily: "Inter_400Regular",
          }}
        >
          {pistaActual.subtitulo}
        </Text>

        {errorAudio && (
          <View
            style={{
              marginTop: 12,
              backgroundColor: `${colores.error}18`,
              borderRadius: 10,
              paddingHorizontal: 14,
              paddingVertical: 8,
              borderWidth: 1,
              borderColor: `${colores.error}40`,
            }}
          >
            <Text style={{ color: colores.error, fontSize: 13, textAlign: "center" }}>
              {errorAudio}
            </Text>
          </View>
        )}

        {descargandoAudio && (
          <View style={{ marginTop: 12, alignItems: "center" }}>
            <Text
              style={{
                color: colores.acento,
                fontSize: 13,
                fontFamily: "Inter_600SemiBold",
              }}
            >
              Descargando {progresoDescarga}%...
            </Text>
            <View
              style={{
                width: 160,
                height: 3,
                borderRadius: 2,
                backgroundColor: colores.borde,
                marginTop: 6,
              }}
            >
              <View
                style={{
                  width: `${progresoDescarga}%`,
                  height: 3,
                  borderRadius: 2,
                  backgroundColor: colores.acento,
                }}
              />
            </View>
          </View>
        )}
      </View>

      {segmentos.length > 0 ? (
        <View
          style={{
            flex: 1,
            minHeight: 0,
            marginTop: 24,
            paddingHorizontal: 24,
          }}
        >
          <Text
            style={{
              color: colores.textoSecundario,
              fontSize: 11,
              textTransform: "uppercase",
              letterSpacing: 1.1,
              fontFamily: "Inter_600SemiBold",
            }}
          >
            Texto en reproducción
          </Text>
          <Text
            style={{
              color: colores.textoMuted,
              fontSize: 12,
              marginTop: 6,
              marginBottom: 14,
            }}
          >
            Tocá una línea para saltar a ese momento.
          </Text>

          <ScrollView
            ref={scrollRef}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 12 }}
          >
            {segmentos.map((segmento, index) => {
              const activo =
                index === segmentoActual || (index === 0 && progresoSegundos === 0);

              return (
                <Pressable
                  key={`${segmento.inicio_seg}-${index}`}
                  onPress={() => manejarSeek(segmento.inicio_seg)}
                  onLayout={(event) => {
                    offsetsSegmentos.current[index] = event.nativeEvent.layout.y;
                  }}
                  style={{
                    borderRadius: 18,
                    paddingHorizontal: 16,
                    paddingVertical: 14,
                    marginBottom: 10,
                    backgroundColor: activo ? `${colores.acento}16` : colores.superficie,
                    borderWidth: 1,
                    borderColor: activo ? `${colores.acento}42` : colores.borde,
                  }}
                >
                  <Text
                    style={{
                      color: activo ? colores.primario : colores.textoSecundario,
                      fontSize: activo ? 20 : 15,
                      lineHeight: activo ? 28 : 22,
                      fontFamily: activo ? "Inter_700Bold" : "Inter_400Regular",
                    }}
                  >
                    {segmento.texto}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>
      ) : (
        <View
          style={{
            flex: 1,
            alignItems: "center",
            justifyContent: "center",
            paddingHorizontal: 32,
          }}
        >
          <Text
            style={{
              color: colores.textoSecundario,
              fontSize: 14,
              lineHeight: 21,
              textAlign: "center",
            }}
          >
            El texto del episodio se va a mostrar acá cuando el audio tenga segmentos listos.
          </Text>
        </View>
      )}

      <View style={{ paddingHorizontal: 24, paddingTop: 24, paddingBottom: insets.bottom + 20 }}>
        <Slider
          minimumValue={0}
          maximumValue={pistaActual.duracionSegundos}
          value={progresoSegundos}
          onSlidingComplete={manejarSeek}
          minimumTrackTintColor={colores.acento}
          maximumTrackTintColor={colores.borde}
          thumbTintColor={colores.acento}
        />
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            marginTop: 4,
            marginBottom: 24,
          }}
        >
          <Text style={{ color: colores.textoMuted, fontSize: 11 }}>
            {formatearTiempo(progresoSegundos)}
          </Text>
          <Text style={{ color: colores.textoMuted, fontSize: 11 }}>
            {formatearTiempo(pistaActual.duracionSegundos)}
          </Text>
        </View>

        {/* Play/Pause */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 24,
          }}
        >
          <Pressable
            onPress={toggleReproduccion}
            disabled={descargandoAudio}
            style={{
              backgroundColor: descargandoAudio ? colores.borde : colores.acento,
              borderRadius: 32,
              width: 64,
              height: 64,
              alignItems: "center",
              justifyContent: "center",
              opacity: descargandoAudio ? 0.5 : 1,
            }}
          >
            {reproduciendo ? (
              <Pause size={32} color="white" weight="fill" />
            ) : (
              <Play size={32} color="white" weight="fill" />
            )}
          </Pressable>
        </View>

        {/* Volumen */}
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <Pressable onPress={toggleSilencio} style={{ marginRight: 12 }}>
            {silenciado ? (
              <SpeakerSlash size={20} color={colores.textoMuted} />
            ) : (
              <SpeakerHigh size={20} color={colores.textoSecundario} />
            )}
          </Pressable>
          <Slider
            style={{ flex: 1 }}
            minimumValue={0}
            maximumValue={100}
            value={volumen}
            onValueChange={(v) => setVolumen(Math.round(v))}
            minimumTrackTintColor={colores.secundario}
            maximumTrackTintColor={colores.borde}
            thumbTintColor={colores.secundario}
          />
        </View>
      </View>
    </View>
  );
}
