import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Tarjeta } from "@/componentes/ui/tarjeta";
import { Badge } from "@/componentes/ui/badge";
import { IconoAstral } from "@/componentes/ui/icono-astral";
import { usarTema } from "@/lib/hooks/usar-tema";
import { FondoCosmico } from "./fondo-cosmico";

interface PistaAcceso {
  icono: string;
  texto: string;
}

interface ShellAccesoProps {
  insignia: string;
  titulo: string;
  descripcion: string;
  pistas?: PistaAcceso[];
  children: React.ReactNode;
  pie?: React.ReactNode;
  intensidad?: "suave" | "hero";
}

export function ShellAcceso({
  insignia,
  titulo,
  descripcion,
  pistas = [],
  children,
  pie,
  intensidad = "hero",
}: ShellAccesoProps) {
  const insets = useSafeAreaInsets();
  const { colores, esOscuro } = usarTema();

  return (
    <FondoCosmico intensidad={intensidad}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={{
            flexGrow: 1,
            paddingTop: insets.top + 28,
            paddingBottom: insets.bottom + 28,
            paddingHorizontal: 20,
          }}
          keyboardShouldPersistTaps="handled"
        >
          <View style={{ marginBottom: 28 }}>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 12,
                marginBottom: 20,
              }}
            >
              <View
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 22,
                  backgroundColor: esOscuro
                    ? "rgba(255,255,255,0.08)"
                    : "rgba(255,255,255,0.72)",
                  borderWidth: 1,
                  borderColor: colores.vidrioBorde,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <IconoAstral nombre="astrologia" tamaño={20} />
              </View>
              <Badge variante="info">{insignia}</Badge>
            </View>

            <Text
              style={{
                color: colores.textoSecundario,
                fontSize: 12,
                fontFamily: "Inter_600SemiBold",
                textTransform: "uppercase",
                letterSpacing: 3.2,
                marginBottom: 12,
              }}
            >
              ASTRA
            </Text>

            <Text
              accessibilityRole="header"
              style={{
                color: colores.primario,
                fontSize: 30,
                lineHeight: 36,
                fontFamily: "Inter_700Bold",
              }}
            >
              {titulo}
            </Text>

            <Text
              style={{
                color: colores.textoSecundario,
                fontSize: 15,
                lineHeight: 22,
                marginTop: 12,
                maxWidth: 520,
              }}
            >
              {descripcion}
            </Text>

            {pistas.length > 0 ? (
              <View style={{ gap: 10, marginTop: 20 }}>
                {pistas.map((pista) => (
                  <View
                    key={pista.texto}
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      borderRadius: 16,
                      paddingHorizontal: 14,
                      paddingVertical: 12,
                      borderWidth: 1,
                      borderColor: colores.vidrioBorde,
                      backgroundColor: esOscuro
                        ? "rgba(255,255,255,0.05)"
                        : "rgba(255,255,255,0.68)",
                    }}
                  >
                    <IconoAstral nombre={pista.icono} tamaño={18} />
                    <Text
                      style={{
                        flex: 1,
                        marginLeft: 10,
                        color: colores.primario,
                        fontSize: 13,
                        lineHeight: 19,
                        fontFamily: "Inter_500Medium",
                      }}
                    >
                      {pista.texto}
                    </Text>
                  </View>
                ))}
              </View>
            ) : null}
          </View>

          <Tarjeta style={{ marginBottom: 16 }}>{children}</Tarjeta>

          {pie ? <View>{pie}</View> : null}
        </ScrollView>
      </KeyboardAvoidingView>
    </FondoCosmico>
  );
}
