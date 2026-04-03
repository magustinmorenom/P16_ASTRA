import { View, Text, Pressable, Platform } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BlurView } from "expo-blur";
import { ArrowLeft } from "phosphor-react-native";
import { usarTema } from "@/lib/hooks/usar-tema";

interface HeaderMobileProps {
  titulo?: string;
  subtitulo?: string;
  mostrarAtras?: boolean;
  accionDerecha?: React.ReactNode;
  children?: React.ReactNode;
}

export function HeaderMobile({
  titulo,
  subtitulo,
  mostrarAtras = true,
  accionDerecha,
  children,
}: HeaderMobileProps) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colores, esOscuro } = usarTema();

  const contenido = (
    <>
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          paddingHorizontal: 16,
          minHeight: 60,
          paddingBottom: 10,
        }}
      >
        <View style={{ width: 68, justifyContent: "center" }}>
          {mostrarAtras && (
            <Pressable onPress={() => router.back()} style={{ padding: 4 }}>
              <ArrowLeft size={24} color={colores.primario} />
            </Pressable>
          )}
        </View>

        <View style={{ flex: 1, alignItems: "center", paddingHorizontal: 8 }}>
          {titulo ? (
            <Text
              numberOfLines={1}
              style={{
                color: colores.primario,
                fontFamily: "Inter_600SemiBold",
                fontSize: 18,
                textAlign: "center",
              }}
            >
              {titulo}
            </Text>
          ) : null}
          {subtitulo ? (
            <Text
              numberOfLines={1}
              style={{
                color: colores.textoSecundario,
                fontFamily: "Inter_400Regular",
                fontSize: 12,
                marginTop: 2,
                textAlign: "center",
              }}
            >
              {subtitulo}
            </Text>
          ) : null}
        </View>

        <View style={{ width: 68, alignItems: "flex-end" }}>{accionDerecha}</View>
      </View>
      {children}
    </>
  );

  // Glass header en iOS
  if (Platform.OS === "ios") {
    return (
      <BlurView
        intensity={40}
        tint={esOscuro ? "dark" : "light"}
        style={{
          paddingTop: insets.top,
          borderBottomWidth: 1,
          borderBottomColor: colores.vidrioBorde,
        }}
      >
        <View style={{ backgroundColor: colores.vidrioOverlay }}>
          {contenido}
        </View>
      </BlurView>
    );
  }

  // Android fallback
  return (
    <View
      style={{
        paddingTop: insets.top,
        backgroundColor: `${colores.fondo}F2`,
        borderBottomWidth: 1,
        borderBottomColor: colores.vidrioBorde,
      }}
    >
      {contenido}
    </View>
  );
}
