import { View } from "react-native";
import { usarTema } from "@/lib/hooks/usar-tema";

interface SeparadorProps {
  className?: string;
}

export function Separador({ className }: SeparadorProps) {
  const { colores } = usarTema();
  return (
    <View
      style={{
        height: 1,
        backgroundColor: colores.borde,
        marginVertical: 16,
      }}
    />
  );
}
