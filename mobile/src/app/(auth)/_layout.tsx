import { Stack } from "expo-router";
import { usarTema } from "@/lib/hooks/usar-tema";

export default function LayoutAuth() {
  const { colores } = usarTema();

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colores.fondo },
        animation: "slide_from_right",
      }}
    />
  );
}
