import { Linking } from "react-native";
import { File as ArchivoExpo, Paths } from "expo-file-system";
import * as SecureStore from "expo-secure-store";
import { construirUrlApi } from "@/lib/api/cliente";

export async function descargarYAbrirDocumentoProtegido(
  rutaApi: string,
  nombreArchivo: string,
): Promise<string> {
  const token = await SecureStore.getItemAsync("access_token");
  if (!token) {
    throw new Error("Necesitás iniciar sesión nuevamente.");
  }

  const destino = new ArchivoExpo(Paths.cache, nombreArchivo);

  await ArchivoExpo.downloadFileAsync(construirUrlApi(rutaApi), destino, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const pudoAbrir = await Linking.openURL(destino.uri).catch(() => false);
  if (!pudoAbrir) {
    throw new Error("No se pudo abrir el documento descargado.");
  }

  return destino.uri;
}
