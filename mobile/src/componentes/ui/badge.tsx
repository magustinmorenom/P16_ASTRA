import { View, Text } from "react-native";
import { usarTema } from "@/lib/hooks/usar-tema";

interface BadgeProps {
  children: React.ReactNode;
  variante?: "default" | "exito" | "advertencia" | "error" | "info";
  className?: string;
}

export function Badge({ children, variante = "default", className }: BadgeProps) {
  const { colores } = usarTema();

  const bgMap = {
    default: colores.superficie,
    exito: colores.exito + "33",
    advertencia: colores.advertencia + "33",
    error: colores.error + "33",
    info: colores.acento + "33",
  };

  const textMap = {
    default: colores.textoSecundario,
    exito: colores.exito,
    advertencia: colores.advertencia,
    error: colores.error,
    info: colores.acento,
  };

  return (
    <View
      style={{
        backgroundColor: bgMap[variante],
        borderRadius: 999,
        paddingHorizontal: 10,
        paddingVertical: 4,
        alignSelf: "flex-start",
        borderWidth: 1,
        borderColor:
          variante === "default" ? colores.borde : `${textMap[variante]}22`,
      }}
    >
      <Text
        style={{
          fontSize: 11,
          fontFamily: "Inter_600SemiBold",
          color: textMap[variante],
          letterSpacing: 0.2,
        }}
      >
        {children}
      </Text>
    </View>
  );
}
