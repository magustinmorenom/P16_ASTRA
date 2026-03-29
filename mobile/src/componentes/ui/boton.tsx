import { Text, ActivityIndicator, type ViewStyle } from "react-native";
import { usarTema } from "@/lib/hooks/usar-tema";
import { PresionableAnimado } from "./presionable-animado";

interface BotonProps {
  children: React.ReactNode;
  variante?: "primario" | "secundario" | "fantasma";
  tamaño?: "sm" | "md" | "lg";
  cargando?: boolean;
  disabled?: boolean;
  className?: string;
  onPress?: () => void;
  icono?: React.ReactNode;
  style?: ViewStyle;
}

const tamañoPadding = {
  sm: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  md: { paddingHorizontal: 20, paddingVertical: 12, borderRadius: 12 },
  lg: { paddingHorizontal: 24, paddingVertical: 16, borderRadius: 12 },
};

const textoTamaño = {
  sm: 12,
  md: 14,
  lg: 16,
};

export function Boton({
  children,
  variante = "primario",
  tamaño = "md",
  cargando = false,
  disabled = false,
  className,
  onPress,
  icono,
  style,
}: BotonProps) {
  const { colores } = usarTema();
  const deshabilitado = disabled || cargando;

  const bgColor =
    variante === "primario"
      ? colores.acento
      : variante === "secundario"
      ? colores.superficie
      : "transparent";

  const borderStyle: ViewStyle =
    variante === "secundario"
      ? { borderWidth: 1, borderColor: colores.borde }
      : {};

  return (
    <PresionableAnimado
      onPress={onPress}
      disabled={deshabilitado}
      style={[
        {
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: bgColor,
          opacity: deshabilitado ? 0.5 : 1,
          ...tamañoPadding[tamaño],
          ...borderStyle,
        },
        style,
      ]}
    >
      {cargando ? (
        <ActivityIndicator size="small" color={colores.primario} />
      ) : (
        <>
          {icono}
          <Text
            style={{
              fontFamily: "Inter_600SemiBold",
              color: variante === "primario" ? "#FFFFFF" : colores.primario,
              fontSize: textoTamaño[tamaño],
              marginLeft: icono ? 8 : 0,
            }}
          >
            {children}
          </Text>
        </>
      )}
    </PresionableAnimado>
  );
}
