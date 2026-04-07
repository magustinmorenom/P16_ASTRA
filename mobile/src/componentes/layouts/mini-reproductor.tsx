import { View, Text, Pressable, Platform } from "react-native";
import { BlurView } from "expo-blur";
import { Play, Pause, X } from "phosphor-react-native";
import { useStoreUI } from "@/lib/stores/store-ui";
import { usarAudioNativo } from "@/lib/hooks/usar-audio-nativo";
import { usarTema } from "@/lib/hooks/usar-tema";
import { ReproductorCompleto } from "./reproductor-completo";

export function MiniReproductor() {
  const { miniReproductorExpandido, toggleMiniReproductor } = useStoreUI();
  const audioContext = usarAudioNativo();
  const {
    pistaActual,
    reproduciendo,
    porcentaje,
    descargandoAudio,
    progresoDescarga,
    errorAudio,
    toggleReproduccion,
    manejarCerrar,
  } = audioContext;

  const { colores, esOscuro } = usarTema();

  if (!pistaActual) return null;

  if (miniReproductorExpandido) {
    return <ReproductorCompleto {...audioContext} />;
  }

  const contenido = (
    <>
      {/* Progress bar */}
      <View style={{ height: 2, backgroundColor: "rgba(255,255,255,0.2)" }}>
        <View
          style={{
            height: "100%",
            backgroundColor: "#FFFFFF",
            width: `${Math.min(porcentaje, 100)}%`,
          }}
        />
      </View>

      <Pressable
        onPress={toggleMiniReproductor}
        accessibilityRole="button"
        accessibilityLabel={`Reproductor: ${pistaActual.titulo}. Tocar para expandir`}
        style={{ flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 12 }}
      >
        {/* Cover placeholder */}
        <View
          style={{
            width: 40,
            height: 40,
            borderRadius: 8,
            backgroundColor: "rgba(255,255,255,0.15)",
            alignItems: "center",
            justifyContent: "center",
            marginRight: 12,
          }}
        >
          <Text style={{ color: "#FFFFFF", fontSize: 12, fontFamily: "Inter_700Bold" }}>
            {pistaActual.tipo === "podcast" ? "P" : "L"}
          </Text>
        </View>

        {/* Info */}
        <View style={{ flex: 1, marginRight: 12 }}>
          {errorAudio ? (
            <Text
              numberOfLines={2}
              style={{ color: "#DC2626", fontSize: 12, fontFamily: "Inter_600SemiBold" }}
            >
              {errorAudio}
            </Text>
          ) : (
            <>
              <Text
                numberOfLines={1}
                style={{ color: "#FFFFFF", fontSize: 14, fontFamily: "Inter_600SemiBold" }}
              >
                {pistaActual.titulo}
              </Text>
              <Text
                numberOfLines={1}
                style={{ color: "rgba(255,255,255,0.7)", fontSize: 12 }}
              >
                {descargandoAudio
                  ? `Descargando ${progresoDescarga}%...`
                  : pistaActual.subtitulo}
              </Text>
            </>
          )}
        </View>

        {/* Controles */}
        {descargandoAudio ? (
          <View style={{ marginRight: 12, padding: 4, opacity: 0.5 }}>
            <Play size={24} color="rgba(255,255,255,0.7)" weight="fill" />
          </View>
        ) : (
          <Pressable
            onPress={toggleReproduccion}
            accessibilityRole="button"
            accessibilityLabel={reproduciendo ? "Pausar" : "Reproducir"}
            style={{ marginRight: 12, padding: 4 }}
          >
            {reproduciendo ? (
              <Pause size={24} color="#FFFFFF" weight="fill" />
            ) : (
              <Play size={24} color="#FFFFFF" weight="fill" />
            )}
          </Pressable>
        )}

        <Pressable
          onPress={manejarCerrar}
          accessibilityRole="button"
          accessibilityLabel="Cerrar reproductor"
          style={{ padding: 4 }}
        >
          <X size={20} color="rgba(255,255,255,0.7)" />
        </Pressable>
      </Pressable>
    </>
  );

  // Glass en iOS
  if (Platform.OS === "ios") {
    return (
      <BlurView
        intensity={90}
        tint="dark"
        style={{
          position: "absolute",
          bottom: 80,
          left: 0,
          right: 0,
          borderTopWidth: 1,
          borderTopColor: "rgba(255,255,255,0.05)",
        }}
      >
        <View style={{ backgroundColor: "rgba(20, 12, 36, 0.95)" }}>
          {contenido}
        </View>
      </BlurView>
    );
  }

  return (
    <View
      style={{
        position: "absolute",
        bottom: 80,
        left: 0,
        right: 0,
        backgroundColor: "#0d0818",
        borderTopWidth: 1,
        borderTopColor: "rgba(255,255,255,0.05)",
      }}
    >
      {contenido}
    </View>
  );
}
