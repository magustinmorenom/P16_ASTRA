import { View, type ViewStyle } from "react-native";
import { BlurView } from "expo-blur";
import { Platform } from "react-native";
import { usarTema } from "@/lib/hooks/usar-tema";

interface TarjetaProps {
  children: React.ReactNode;
  variante?: "default" | "violeta" | "dorado" | "acento";
  padding?: "sm" | "md" | "lg";
  vidrio?: boolean;
  className?: string;
  style?: ViewStyle;
}

const paddingValues = {
  sm: 12,
  md: 16,
  lg: 20,
};

export function Tarjeta({
  children,
  variante = "default",
  padding = "md",
  vidrio = true,
  className,
  style,
}: TarjetaProps) {
  const { colores, esOscuro } = usarTema();

  const borderColor =
    variante === "violeta"
      ? colores.secundario + "4D" // /30
      : variante === "dorado"
      ? colores.advertencia + "4D"
      : variante === "acento"
      ? colores.acento + "4D"
      : colores.borde;

  const baseStyle: ViewStyle = {
    borderRadius: 16,
    padding: paddingValues[padding],
    borderWidth: 1,
    borderColor,
    overflow: "hidden",
    ...style,
  };

  // Glass effect para iOS
  if (vidrio && Platform.OS === "ios") {
    const tinteBg =
      variante === "default"
        ? colores.vidrioOverlay
        : variante === "violeta"
        ? (esOscuro ? "rgba(167, 139, 250, 0.08)" : "rgba(124, 77, 255, 0.06)")
        : variante === "dorado"
        ? (esOscuro ? "rgba(251, 191, 36, 0.08)" : "rgba(217, 119, 6, 0.06)")
        : (esOscuro ? "rgba(192, 132, 252, 0.08)" : "rgba(124, 77, 255, 0.06)");

    return (
      <BlurView
        intensity={30}
        tint={esOscuro ? "dark" : "light"}
        style={baseStyle}
      >
        <View style={{ backgroundColor: tinteBg, margin: -16, padding: paddingValues[padding] }}>
          {children}
        </View>
      </BlurView>
    );
  }

  // Fallback sólido (Android + vidrio=false)
  const bgColor =
    variante === "default"
      ? colores.fondoSecundario
      : colores.superficie;

  return (
    <View style={[baseStyle, { backgroundColor: bgColor }]}>
      {children}
    </View>
  );
}
