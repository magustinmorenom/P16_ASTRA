import { View, Text, Pressable, Platform } from "react-native";
import { BlurView } from "expo-blur";
import { Play, Pause, X } from "phosphor-react-native";
import { useStoreUI } from "@/lib/stores/store-ui";
import { usarAudioNativo } from "@/lib/hooks/usar-audio-nativo";
import { usarTema } from "@/lib/hooks/usar-tema";
import { ReproductorCompleto } from "./reproductor-completo";

export function MiniReproductor() {
  const { miniReproductorExpandido, toggleMiniReproductor } = useStoreUI();
  const {
    pistaActual,
    reproduciendo,
    porcentaje,
    descargandoAudio,
    progresoDescarga,
    errorAudio,
    toggleReproduccion,
    manejarCerrar,
  } = usarAudioNativo();
  const { colores, esOscuro } = usarTema();

  if (!pistaActual) return null;

  if (miniReproductorExpandido) {
    return <ReproductorCompleto />;
  }

  const contenido = (
    <>
      {/* Progress bar */}
      <View style={{ height: 2, backgroundColor: colores.borde }}>
        <View
          style={{
            height: "100%",
            backgroundColor: colores.acento,
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
            backgroundColor: colores.acento + "33",
            alignItems: "center",
            justifyContent: "center",
            marginRight: 12,
          }}
        >
          <Text style={{ color: colores.acento, fontSize: 12, fontFamily: "Inter_700Bold" }}>
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
                style={{ color: colores.primario, fontSize: 14, fontFamily: "Inter_600SemiBold" }}
              >
                {pistaActual.titulo}
              </Text>
              <Text
                numberOfLines={1}
                style={{ color: colores.textoMuted, fontSize: 12 }}
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
            <Play size={24} color={colores.textoMuted} weight="fill" />
          </View>
        ) : (
          <Pressable
            onPress={toggleReproduccion}
            accessibilityRole="button"
            accessibilityLabel={reproduciendo ? "Pausar" : "Reproducir"}
            style={{ marginRight: 12, padding: 4 }}
          >
            {reproduciendo ? (
              <Pause size={24} color={colores.primario} weight="fill" />
            ) : (
              <Play size={24} color={colores.primario} weight="fill" />
            )}
          </Pressable>
        )}

        <Pressable
          onPress={manejarCerrar}
          accessibilityRole="button"
          accessibilityLabel="Cerrar reproductor"
          style={{ padding: 4 }}
        >
          <X size={20} color={colores.textoMuted} />
        </Pressable>
      </Pressable>
    </>
  );

  // Glass en iOS
  if (Platform.OS === "ios") {
    return (
      <BlurView
        intensity={50}
        tint={esOscuro ? "dark" : "light"}
        style={{
          position: "absolute",
          bottom: 85,
          left: 0,
          right: 0,
          borderTopWidth: 1,
          borderTopColor: colores.vidrioBorde,
        }}
      >
        <View style={{ backgroundColor: colores.vidrioOverlay }}>
          {contenido}
        </View>
      </BlurView>
    );
  }

  return (
    <View
      style={{
        position: "absolute",
        bottom: 85,
        left: 0,
        right: 0,
        backgroundColor: colores.fondoSecundario,
        borderTopWidth: 1,
        borderTopColor: colores.borde,
      }}
    >
      {contenido}
    </View>
  );
}
