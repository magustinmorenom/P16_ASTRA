import { View, Text } from "react-native";
import { usarTema } from "@/lib/hooks/usar-tema";

interface AvatarProps {
  nombre: string;
  tamaño?: "sm" | "md" | "lg";
  className?: string;
}

const tamañoValues = {
  sm: { size: 32, fontSize: 12 },
  md: { size: 48, fontSize: 16 },
  lg: { size: 64, fontSize: 20 },
};

function obtenerIniciales(nombre: string): string {
  return nombre
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export function Avatar({ nombre, tamaño = "md", className }: AvatarProps) {
  const { colores } = usarTema();
  const { size, fontSize } = tamañoValues[tamaño];

  return (
    <View
      accessibilityRole="image"
      accessibilityLabel={`Avatar de ${nombre}`}
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: `${colores.acento}24`,
        borderWidth: 1,
        borderColor: `${colores.acento}30`,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Text
        style={{
          fontFamily: "Inter_700Bold",
          color: colores.acento,
          fontSize,
        }}
      >
        {obtenerIniciales(nombre)}
      </Text>
    </View>
  );
}
