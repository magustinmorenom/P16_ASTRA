import { useEffect, useRef, useState } from "react";
import { Platform } from "react-native";
import { useRouter } from "expo-router";
import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import Constants from "expo-constants";
import { clienteApi } from "@/lib/api/cliente";
import { useStoreAuth } from "@/lib/stores/store-auth";

// Configurar handler de notificaciones en foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

async function registrarPushToken(): Promise<string | null> {
  if (!Device.isDevice) {
    return null;
  }

  const { status: permisoExistente } =
    await Notifications.getPermissionsAsync();

  let permisoFinal = permisoExistente;

  if (permisoExistente !== "granted") {
    const { status } = await Notifications.requestPermissionsAsync();
    permisoFinal = status;
  }

  if (permisoFinal !== "granted") {
    return null;
  }

  // Android requiere canal
  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("default", {
      name: "ASTRA",
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#7C4DFF",
    });
  }

  const projectId = Constants.expoConfig?.extra?.eas?.projectId;
  const tokenData = await Notifications.getExpoPushTokenAsync({
    projectId,
  });

  return tokenData.data;
}

async function enviarTokenAlBackend(token: string): Promise<void> {
  try {
    await clienteApi.post("/auth/push-token", {
      push_token: token,
      plataforma: Platform.OS,
    });
  } catch {
    // Silenciar — el backend puede no tener este endpoint todavía
  }
}

export function usarNotificaciones() {
  const router = useRouter();
  const autenticado = useStoreAuth((s) => s.autenticado);
  const [permisoOtorgado, setPermisoOtorgado] = useState<boolean | null>(null);
  const listenerNotificacion = useRef<Notifications.EventSubscription | null>(null);
  const listenerRespuesta = useRef<Notifications.EventSubscription | null>(null);

  // Registrar token cuando el usuario está autenticado
  useEffect(() => {
    if (!autenticado) return;

    registrarPushToken().then((token) => {
      if (token) {
        setPermisoOtorgado(true);
        enviarTokenAlBackend(token);
      } else {
        setPermisoOtorgado(false);
      }
    });
  }, [autenticado]);

  // Listeners para notificaciones
  useEffect(() => {
    // Cuando llega una notificación en foreground
    listenerNotificacion.current =
      Notifications.addNotificationReceivedListener((_notificacion) => {
        // Se puede usar para actualizar badges o estado local
      });

    // Cuando el usuario toca la notificación
    listenerRespuesta.current =
      Notifications.addNotificationResponseReceivedListener((respuesta) => {
        const datos = respuesta.notification.request.content.data;

        // Deep linking basado en el tipo de notificación
        if (datos?.pantalla) {
          const pantalla = datos.pantalla as string;
          if (pantalla === "dashboard") {
            router.push("/(tabs)");
          } else if (pantalla === "chat") {
            router.push("/(tabs)/chat");
          } else if (pantalla === "podcast") {
            router.push("/(tabs)/podcast");
          } else if (pantalla === "astral") {
            router.push("/(tabs)/astral");
          }
        }
      });

    return () => {
      listenerNotificacion.current?.remove();
      listenerRespuesta.current?.remove();
    };
  }, [router]);

  return { permisoOtorgado };
}

export async function verificarPermisoNotificaciones(): Promise<boolean> {
  const { status } = await Notifications.getPermissionsAsync();
  return status === "granted";
}

export async function solicitarPermisoNotificaciones(): Promise<boolean> {
  const token = await registrarPushToken();
  if (token) {
    enviarTokenAlBackend(token);
    return true;
  }
  return false;
}
