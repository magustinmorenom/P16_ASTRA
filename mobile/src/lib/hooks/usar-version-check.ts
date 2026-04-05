import { useEffect, useState } from "react";
import { Alert, Linking, Platform } from "react-native";
import Constants from "expo-constants";
import { API_BASE_URL } from "@/lib/api/cliente";

interface VersionInfo {
  version_minima: string;
  version_actual: string;
  url_store?: string;
}

function compararVersiones(local: string, minima: string): boolean {
  const partsLocal = local.split(".").map(Number);
  const partsMinima = minima.split(".").map(Number);

  for (let i = 0; i < 3; i++) {
    const l = partsLocal[i] ?? 0;
    const m = partsMinima[i] ?? 0;
    if (l < m) return false;
    if (l > m) return true;
  }
  return true; // iguales → ok
}

/**
 * Verifica si hay una versión mínima requerida por el backend.
 * Si la versión local es menor, muestra alerta para actualizar.
 */
export function usarVersionCheck() {
  const [requiereUpdate, setRequiereUpdate] = useState(false);

  useEffect(() => {
    verificarVersion();
  }, []);

  async function verificarVersion() {
    try {
      const versionLocal = Constants.expoConfig?.version ?? "1.0.0";

      const resp = await fetch(`${API_BASE_URL}/health`, {
        headers: { "X-App-Version": versionLocal, "X-Platform": Platform.OS },
      });

      if (!resp.ok) return;

      const data = await resp.json();

      // Si el backend devuelve version_minima, verificar
      if (data.version_minima) {
        const info = data as VersionInfo;
        const cumple = compararVersiones(versionLocal, info.version_minima);

        if (!cumple) {
          setRequiereUpdate(true);
          Alert.alert(
            "Actualización necesaria",
            "Hay una nueva versión de ASTRA disponible. Actualizá para seguir usando la app.",
            [
              {
                text: "Actualizar",
                onPress: () => {
                  const url =
                    info.url_store ??
                    (Platform.OS === "ios"
                      ? "https://apps.apple.com/app/astra/id0000000000"
                      : "https://play.google.com/store/apps/details?id=com.odintech.astra");
                  Linking.openURL(url);
                },
              },
            ],
            { cancelable: false },
          );
        }
      }
    } catch {
      // Silenciar — si no hay red, no bloquear la app
    }
  }

  return { requiereUpdate };
}
