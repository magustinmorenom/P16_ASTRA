import { View, Text, TextInput, type TextInputProps } from "react-native";
import { forwardRef } from "react";
import { usarTema } from "@/lib/hooks/usar-tema";

interface InputProps extends TextInputProps {
  etiqueta?: string;
  error?: string;
  icono?: React.ReactNode;
  containerClassName?: string;
}

export const Input = forwardRef<TextInput, InputProps>(
  ({ etiqueta, error, icono, containerClassName, className, style, ...props }, ref) => {
    const { colores } = usarTema();

    return (
      <View style={{ marginBottom: 16 }}>
        {etiqueta && (
          <Text
            style={{
              color: colores.textoSecundario,
              fontSize: 11,
              fontFamily: "Inter_500Medium",
              marginBottom: 6,
              textTransform: "uppercase",
              letterSpacing: 1,
            }}
          >
            {etiqueta}
          </Text>
        )}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            backgroundColor: colores.superficie,
            borderWidth: 1,
            borderColor: colores.borde,
            borderRadius: 12,
            paddingHorizontal: 16,
          }}
        >
          {icono && <View style={{ marginRight: 8 }}>{icono}</View>}
          <TextInput
            ref={ref}
            placeholderTextColor={colores.textoMuted}
            style={[
              {
                flex: 1,
                color: colores.primario,
                fontSize: 16,
                fontFamily: "Inter_400Regular",
                paddingVertical: 12,
              },
              style,
            ]}
            {...props}
          />
        </View>
        {error && (
          <Text
            style={{
              color: colores.error,
              fontSize: 12,
              marginTop: 4,
            }}
          >
            {error}
          </Text>
        )}
      </View>
    );
  }
);

Input.displayName = "Input";
