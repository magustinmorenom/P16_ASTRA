import { View, Platform, type ViewStyle } from "react-native";
import { BlurView } from "expo-blur";
import { usarTema } from "@/lib/hooks/usar-tema";
import { cn } from "@/lib/utilidades/cn";

interface VistaVidrioProps {
  children: React.ReactNode;
  intensidad?: number;
  sinBorde?: boolean;
  className?: string;
  style?: ViewStyle;
}

export function VistaVidrio({
  children,
  intensidad = 40,
  sinBorde = false,
  className,
  style,
}: VistaVidrioProps) {
  const { colores, esOscuro } = usarTema();

  // Android no soporta BlurView nativo bien — fallback semi-transparente
  if (Platform.OS === "android") {
    return (
      <View
        className={cn("overflow-hidden", className)}
        style={[
          {
            backgroundColor: colores.vidrioFondo,
            borderWidth: sinBorde ? 0 : 1,
            borderColor: colores.vidrioBorde,
          },
          style,
        ]}
      >
        {children}
      </View>
    );
  }

  return (
    <BlurView
      intensity={intensidad}
      tint={esOscuro ? "dark" : "light"}
      className={cn("overflow-hidden", className)}
      style={style}
    >
      <View
        style={{
          backgroundColor: colores.vidrioOverlay,
          borderWidth: sinBorde ? 0 : 1,
          borderColor: colores.vidrioBorde,
          flex: 1,
        }}
      >
        {children}
      </View>
    </BlurView>
  );
}
