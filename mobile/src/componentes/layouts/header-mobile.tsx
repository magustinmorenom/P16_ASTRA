import { View, Text, Pressable, Platform } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BlurView } from "expo-blur";
import { ArrowLeft } from "phosphor-react-native";
import { usarTema } from "@/lib/hooks/usar-tema";

interface HeaderMobileProps {
  titulo?: string;
  mostrarAtras?: boolean;
  accionDerecha?: React.ReactNode;
  children?: React.ReactNode;
}

export function HeaderMobile({
  titulo,
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
          justifyContent: "space-between",
          paddingHorizontal: 16,
          height: 56,
        }}
      >
        <View style={{ width: 40 }}>
          {mostrarAtras && (
            <Pressable onPress={() => router.back()} style={{ padding: 4 }}>
              <ArrowLeft size={24} color={colores.primario} />
            </Pressable>
          )}
        </View>

        {titulo && (
          <Text
            style={{
              color: colores.primario,
              fontFamily: "Inter_600SemiBold",
              fontSize: 18,
              flex: 1,
              textAlign: "center",
            }}
          >
            {titulo}
          </Text>
        )}

        <View style={{ width: 40, alignItems: "flex-end" }}>{accionDerecha}</View>
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
        backgroundColor: colores.fondo + "E6",
        borderBottomWidth: 1,
        borderBottomColor: colores.borde,
      }}
    >
      {contenido}
    </View>
  );
}
