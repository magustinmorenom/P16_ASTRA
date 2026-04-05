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
      ? `${colores.secundario}33`
      : variante === "dorado"
      ? `${colores.advertencia}33`
      : variante === "acento"
      ? `${colores.acento}33`
      : colores.borde;

  const envolturaStyle: ViewStyle = {
    borderRadius: 16,
    borderWidth: 1,
    borderColor,
    ...style,
  };

  const fondoBase =
    variante === "default"
      ? esOscuro
        ? "rgba(255,255,255,0.04)"
        : "rgba(255,255,255,0.82)"
      : variante === "violeta"
      ? esOscuro
        ? "rgba(124,77,255,0.12)"
        : "rgba(124,77,255,0.08)"
      : variante === "dorado"
      ? esOscuro
        ? "rgba(217,107,131,0.12)"
        : "rgba(217,107,131,0.08)"
      : esOscuro
      ? "rgba(192,132,252,0.12)"
      : "rgba(124,77,255,0.08)";

  const contenidoStyle: ViewStyle = {
    borderRadius: 15,
    overflow: "hidden",
  };

  if (vidrio && Platform.OS === "ios") {
    const tinteBg =
      variante === "default"
        ? esOscuro
          ? "rgba(255,255,255,0.04)"
          : "rgba(255,255,255,0.58)"
        : variante === "violeta"
        ? esOscuro
          ? "rgba(167, 139, 250, 0.08)"
          : "rgba(124, 77, 255, 0.06)"
        : variante === "dorado"
        ? esOscuro
          ? "rgba(243, 154, 169, 0.08)"
          : "rgba(217, 107, 131, 0.06)"
        : esOscuro
        ? "rgba(192, 132, 252, 0.08)"
        : "rgba(124, 77, 255, 0.06)";

    return (
      <View style={envolturaStyle}>
        <BlurView
          intensity={26}
          tint={esOscuro ? "dark" : "light"}
          style={contenidoStyle}
        >
          <View style={{ backgroundColor: tinteBg, padding: paddingValues[padding] }}>
            {children}
          </View>
        </BlurView>
      </View>
    );
  }

  return (
    <View style={envolturaStyle}>
      <View
        style={[
          contenidoStyle,
          { backgroundColor: fondoBase, padding: paddingValues[padding] },
        ]}
      >
        {children}
      </View>
    </View>
  );
}
