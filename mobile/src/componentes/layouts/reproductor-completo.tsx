import { View, Text, Pressable } from "react-native";
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
    volumen,
    silenciado,
    toggleReproduccion,
    setVolumen,
    toggleSilencio,
    manejarSeek,
    manejarCerrar,
  } = usarAudioNativo();
  const { colores } = usarTema();

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

      {/* Cover */}
      <View style={{ alignItems: "center", justifyContent: "center", flex: 1 }}>
        <View
          style={{
            width: 256,
            height: 256,
            borderRadius: 24,
            backgroundColor: colores.acento + "1A",
            borderWidth: 1,
            borderColor: colores.acento + "4D",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 32,
          }}
        >
          <Text style={{ color: colores.acento, fontSize: 64, fontFamily: "Inter_700Bold" }}>
            {pistaActual.tipo === "podcast" ? "P" : "L"}
          </Text>
        </View>

        {/* Titulo */}
        <Text
          style={{
            color: colores.primario,
            fontSize: 20,
            fontFamily: "Inter_700Bold",
            textAlign: "center",
            paddingHorizontal: 32,
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
      </View>

      {/* Controles */}
      <View style={{ paddingHorizontal: 24, paddingBottom: insets.bottom + 20 }}>
        {/* Progress */}
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
            style={{
              backgroundColor: colores.acento,
              borderRadius: 32,
              width: 64,
              height: 64,
              alignItems: "center",
              justifyContent: "center",
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
