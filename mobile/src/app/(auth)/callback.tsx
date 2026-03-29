import { useEffect } from "react";
import { View, Text, ActivityIndicator } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store";
import { useStoreAuth } from "@/lib/stores/store-auth";
import { usarTema } from "@/lib/hooks/usar-tema";

export default function CallbackScreen() {
  const params = useLocalSearchParams<{
    token_acceso?: string;
    token_refresco?: string;
  }>();
  const router = useRouter();
  const { colores } = usarTema();

  useEffect(() => {
    const procesar = async () => {
      if (params.token_acceso && params.token_refresco) {
        await SecureStore.setItemAsync("access_token", params.token_acceso);
        await SecureStore.setItemAsync("refresh_token", params.token_refresco);
        await useStoreAuth.getState().cargarUsuario();
      }
    };
    procesar();
  }, [params, router]);

  return (
    <View style={{ flex: 1, backgroundColor: colores.fondo, alignItems: "center", justifyContent: "center" }}>
      <ActivityIndicator size="large" color={colores.acento} />
      <Text style={{ color: colores.textoSecundario, marginTop: 16 }}>Procesando...</Text>
    </View>
  );
}
