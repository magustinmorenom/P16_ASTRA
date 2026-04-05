import "../../global.css";

import { useEffect, useState } from "react";
import { Appearance } from "react-native";
import { Stack, useRouter, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import * as SplashScreen from "expo-splash-screen";
import * as Sentry from "@sentry/react-native";
import {
  useFonts,
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from "@expo-google-fonts/inter";
import { useStoreAuth } from "@/lib/stores/store-auth";
import { useStoreTema } from "@/lib/stores/store-tema";
import { IndicadorOffline } from "@/componentes/feedback/indicador-offline";
import { usarNotificaciones } from "@/lib/hooks/usar-notificaciones";
import { usarVersionCheck } from "@/lib/hooks/usar-version-check";

Sentry.init({
  dsn: process.env.EXPO_PUBLIC_SENTRY_DSN ?? "",
  enabled: !__DEV__,
  tracesSampleRate: 0.2,
  sendDefaultPii: false,
});

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      retry: 2,
    },
  },
});

function GuardAuth({ children }: { children: React.ReactNode }) {
  const { usuario, cargando, autenticado } = useStoreAuth();
  const segmentos = useSegments();
  const router = useRouter();
  const [listo, setListo] = useState(false);

  // Registrar push notifications cuando el usuario está autenticado
  usarNotificaciones();

  // Verificar si hay actualización requerida
  usarVersionCheck();

  useEffect(() => {
    useStoreAuth.getState().cargarUsuario().finally(() => setListo(true));
  }, []);

  useEffect(() => {
    if (!listo || cargando) return;

    const enAuth = segmentos[0] === "(auth)";
    const enOnboarding = segmentos[0] === "(onboarding)";

    if (!autenticado && !enAuth) {
      router.replace("/(auth)/login");
    } else if (autenticado && !usuario?.tiene_perfil && !enOnboarding) {
      router.replace("/(onboarding)/bienvenida");
    } else if (autenticado && usuario?.tiene_perfil && (enAuth || enOnboarding)) {
      router.replace("/(tabs)");
    }
  }, [listo, cargando, autenticado, usuario, segmentos, router]);

  useEffect(() => {
    if (listo) {
      SplashScreen.hideAsync();
    }
  }, [listo]);

  return <>{children}</>;
}

function LayoutRaiz() {
  const [fuentesCargadas] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  const colores = useStoreTema((s) => s.colores);
  const esquemaActivo = useStoreTema((s) => s.esquemaActivo);
  const temaCargado = useStoreTema((s) => s.cargado);

  // Cargar preferencia de tema desde SecureStore
  useEffect(() => {
    useStoreTema.getState().cargarPreferencia();
  }, []);

  // Listener para cambio automático del sistema
  useEffect(() => {
    const sub = Appearance.addChangeListener(({ colorScheme }) => {
      useStoreTema.getState().sincronizarSistema(colorScheme);
    });
    return () => sub.remove();
  }, []);

  // Esperar fuentes y tema antes de mostrar
  if (!fuentesCargadas || !temaCargado) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: colores.fondo }}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <StatusBar style={esquemaActivo === "dark" ? "light" : "dark"} />
          <IndicadorOffline />
          <GuardAuth>
            <Stack
              screenOptions={{
                headerShown: false,
                contentStyle: { backgroundColor: colores.fondo },
                animation: "slide_from_right",
              }}
            />
          </GuardAuth>
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

export default Sentry.wrap(LayoutRaiz);
