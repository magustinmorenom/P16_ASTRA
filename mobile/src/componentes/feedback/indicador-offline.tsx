import { useEffect, useState } from "react";
import { View, Text } from "react-native";
import * as Network from "expo-network";
import { WifiSlash } from "phosphor-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { usarTema } from "@/lib/hooks/usar-tema";

export function IndicadorOffline() {
  const [conectado, setConectado] = useState(true);
  const insets = useSafeAreaInsets();
  const { colores } = usarTema();

  useEffect(() => {
    let montado = true;

    const verificar = async () => {
      try {
        const estado = await Network.getNetworkStateAsync();
        if (montado) {
          setConectado(estado.isConnected ?? true);
        }
      } catch {
        // Asumir conectado si falla la verificacion
      }
    };

    // Verificar al montar
    verificar();

    // Verificar periodicamente cada 5 segundos
    const intervalo = setInterval(verificar, 5000);

    return () => {
      montado = false;
      clearInterval(intervalo);
    };
  }, []);

  if (conectado) return null;

  return (
    <View
      accessibilityRole="alert"
      accessibilityLiveRegion="assertive"
      accessibilityLabel="Sin conexión a internet"
      style={{
        position: "absolute",
        top: insets.top,
        left: 0,
        right: 0,
        zIndex: 9999,
        backgroundColor: colores.error,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        paddingVertical: 8,
        paddingHorizontal: 16,
        gap: 8,
      }}
    >
      <WifiSlash size={16} color="#FFFFFF" weight="bold" />
      <Text
        style={{
          color: "#FFFFFF",
          fontSize: 13,
          fontFamily: "Inter_600SemiBold",
        }}
      >
        Sin conexion a internet
      </Text>
    </View>
  );
}
