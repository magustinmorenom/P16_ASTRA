import { View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { usarTema } from "@/lib/hooks/usar-tema";

interface FondoCosmicoProps {
  children: React.ReactNode;
  intensidad?: "suave" | "hero";
}

export function FondoCosmico({
  children,
  intensidad = "suave",
}: FondoCosmicoProps) {
  const { colores } = usarTema();

  return (
    <View style={{ flex: 1, backgroundColor: colores.fondo }}>
      <LinearGradient
        colors={colores.gradienteFondo}
        style={{ position: "absolute", top: 0, right: 0, bottom: 0, left: 0 }}
      />
      <View style={{ flex: 1 }}>{children}</View>
    </View>
  );
}
