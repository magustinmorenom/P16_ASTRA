import Constants from "expo-constants";
import * as SecureStore from "expo-secure-store";

interface RespuestaApi<T> {
  exito: boolean;
  datos: T;
  cache?: boolean;
  mensaje?: string | null;
  error?: string | null;
  detalle?: string | null;
}

export class ErrorApi extends Error {
  constructor(
    public readonly codigo: number,
    public readonly detalle: string,
  ) {
    super(detalle);
    this.name = "ErrorApi";
  }
}

function limpiarBarraFinal(valor: string): string {
  return valor.replace(/\/+$/, "");
}

function normalizarBaseUrl(valor: string): string {
  const base = limpiarBarraFinal(valor);
  return base.endsWith("/api/v1") ? base : `${base}/api/v1`;
}

function resolverBaseUrlApi(): string {
  const basePublica = process.env.EXPO_PUBLIC_API_URL?.trim();
  if (basePublica) {
    return normalizarBaseUrl(basePublica);
  }

  if (!__DEV__) {
    return "https://theastra.xyz/api/v1";
  }

  const hostUri = Constants.expoConfig?.hostUri ?? "";
  const ip = hostUri.split(":")[0];

  if (ip) {
    return `http://${ip}:8000/api/v1`;
  }

  return "http://localhost:8000/api/v1";
}

export const API_BASE_URL = resolverBaseUrlApi();

export function construirUrlApi(ruta: string): string {
  return `${API_BASE_URL}${ruta.startsWith("/") ? ruta : `/${ruta}`}`;
}

class ClienteApi {
  private renovandoPromesa: Promise<boolean> | null = null;

  private async obtenerHeaders(extra?: HeadersInit): Promise<Headers> {
    const headers = new Headers(extra);
    headers.set("Content-Type", "application/json");

    const token = await SecureStore.getItemAsync("access_token");
    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    }

    return headers;
  }

  private async ejecutarSolicitud(
    ruta: string,
    opciones?: RequestInit,
    permitirReintento = true,
  ): Promise<Response> {
    let respuesta = await fetch(construirUrlApi(ruta), {
      ...opciones,
      headers: await this.obtenerHeaders(opciones?.headers),
    });

    const esRutaAuth = ruta.startsWith("/auth/");
    if (
      permitirReintento &&
      respuesta.status === 401 &&
      !esRutaAuth
    ) {
      const renovado = await this.intentarRenovar();
      if (renovado) {
        respuesta = await this.ejecutarSolicitud(ruta, opciones, false);
      } else {
        await this.limpiarSesion();
        throw new ErrorApi(401, "Sesión expirada. Iniciá sesión nuevamente.");
      }
    }

    if (!respuesta.ok) {
      throw await this.manejarError(respuesta);
    }

    return respuesta;
  }

  private async solicitud<T>(ruta: string, opciones?: RequestInit): Promise<T> {
    const respuesta = await this.ejecutarSolicitud(ruta, opciones);
    const json = (await respuesta.json()) as RespuestaApi<T>;

    if ("exito" in json && json.exito === false) {
      throw new ErrorApi(
        respuesta.status >= 400 ? respuesta.status : 400,
        json.detalle ?? json.mensaje ?? json.error ?? "Error desconocido",
      );
    }

    if (json.datos !== undefined) {
      return json.datos;
    }

    return json as T;
  }

  private async manejarError(respuesta: Response): Promise<ErrorApi> {
    try {
      const body = await respuesta.json();
      const mensaje =
        body.detalle ??
        body.detail ??
        body.mensaje ??
        body.error ??
        `Error ${respuesta.status}`;
      return new ErrorApi(respuesta.status, mensaje);
    } catch {
      return new ErrorApi(respuesta.status, `Error ${respuesta.status}`);
    }
  }

  private async intentarRenovar(): Promise<boolean> {
    if (this.renovandoPromesa) {
      return this.renovandoPromesa;
    }

    this.renovandoPromesa = this.renovarToken();
    try {
      return await this.renovandoPromesa;
    } finally {
      this.renovandoPromesa = null;
    }
  }

  private async renovarToken(): Promise<boolean> {
    const tokenRefresco = await SecureStore.getItemAsync("refresh_token");
    if (!tokenRefresco) {
      return false;
    }

    try {
      const respuesta = await fetch(construirUrlApi("/auth/renovar"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token_refresco: tokenRefresco }),
      });

      if (!respuesta.ok) {
        return false;
      }

      const json = (await respuesta.json()) as RespuestaApi<{
        token_acceso: string;
        tipo: string;
      }>;
      const tokenAcceso = json.datos?.token_acceso;

      if (!tokenAcceso) {
        return false;
      }

      await SecureStore.setItemAsync("access_token", tokenAcceso);
      return true;
    } catch {
      return false;
    }
  }

  private async limpiarSesion(): Promise<void> {
    await SecureStore.deleteItemAsync("access_token");
    await SecureStore.deleteItemAsync("refresh_token");

    try {
      const { useStoreAuth } = require("@/lib/stores/store-auth");
      await useStoreAuth.getState().cerrarSesion();
    } catch {
      // Evitar que una limpieza de sesión falle por dependencias circulares.
    }
  }

  async get<T>(ruta: string): Promise<T> {
    return this.solicitud<T>(ruta);
  }

  async post<T>(ruta: string, datos?: unknown): Promise<T> {
    return this.solicitud<T>(ruta, {
      method: "POST",
      body: datos ? JSON.stringify(datos) : undefined,
    });
  }

  async put<T>(ruta: string, datos?: unknown): Promise<T> {
    return this.solicitud<T>(ruta, {
      method: "PUT",
      body: datos ? JSON.stringify(datos) : undefined,
    });
  }

  async delete<T>(ruta: string): Promise<T> {
    return this.solicitud<T>(ruta, {
      method: "DELETE",
    });
  }
}

export const clienteApi = new ClienteApi();
