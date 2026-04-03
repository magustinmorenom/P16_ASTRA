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
  const { colores, esOscuro } = usarTema();
  const factor = intensidad === "hero" ? 1 : 0.78;

  return (
    <View style={{ flex: 1, backgroundColor: colores.fondo }}>
      <LinearGradient
        colors={colores.gradienteFondo}
        style={{ position: "absolute", top: 0, right: 0, bottom: 0, left: 0 }}
      />

      <View
        pointerEvents="none"
        style={{
          position: "absolute",
          top: -120,
          right: -32,
          width: 280,
          height: 280,
          borderRadius: 140,
          backgroundColor: esOscuro
            ? `rgba(192, 132, 252, ${0.18 * factor})`
            : `rgba(124, 77, 255, ${0.11 * factor})`,
        }}
      />

      <View
        pointerEvents="none"
        style={{
          position: "absolute",
          top: 180,
          left: -84,
          width: 220,
          height: 220,
          borderRadius: 110,
          backgroundColor: esOscuro
            ? `rgba(76, 29, 149, ${0.28 * factor})`
            : `rgba(91, 33, 182, ${0.08 * factor})`,
        }}
      />

      <View
        pointerEvents="none"
        style={{
          position: "absolute",
          bottom: -120,
          right: -48,
          width: 260,
          height: 260,
          borderRadius: 130,
          backgroundColor: esOscuro
            ? `rgba(168, 85, 247, ${0.16 * factor})`
            : `rgba(196, 132, 252, ${0.12 * factor})`,
        }}
      />

      <View
        pointerEvents="none"
        style={{
          position: "absolute",
          top: 126,
          right: 18,
          width: 124,
          height: 124,
          borderRadius: 62,
          borderWidth: 1,
          borderColor: esOscuro ? "rgba(255,255,255,0.07)" : "rgba(124,77,255,0.1)",
        }}
      />

      <View style={{ flex: 1 }}>{children}</View>
    </View>
  );
}
