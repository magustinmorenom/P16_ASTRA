/**
 * Cliente HTTP tipado para la API de CosmicEngine.
 *
 * El backend SIEMPRE responde con:
 *   { exito: boolean, datos: T, cache?: boolean }
 *
 * Este cliente:
 * 1. Auto-desenvuelve `datos` — el consumidor recibe T directamente.
 * 2. Inyecta Bearer token en cada request.
 * 3. Si recibe 401 → intenta renovar token → reintenta UNA vez.
 * 4. Extrae mensajes de error del campo `detalle` (no `detail`).
 * 5. Previene renovaciones concurrentes con un mutex.
 */

const BASE_URL = "/api/v1";

/** Forma del envoltorio que devuelve el backend. */
interface RespuestaAPI<T> {
  exito: boolean;
  datos: T;
  cache?: boolean;
  mensaje?: string;
  error?: string;
  detalle?: string;
}

/** Error tipado con código HTTP y detalle del backend. */
export class ErrorAPI extends Error {
  constructor(
    public readonly codigo: number,
    public readonly detalle: string,
    public readonly campo?: string,
  ) {
    super(detalle);
    this.name = "ErrorAPI";
  }
}

class ClienteAPI {
  /** Mutex para evitar renovaciones concurrentes. */
  private renovandoPromesa: Promise<boolean> | null = null;

  private obtenerHeaders(): HeadersInit {
    const token =
      typeof window !== "undefined"
        ? localStorage.getItem("token_acceso")
        : null;
    const headers: HeadersInit = { "Content-Type": "application/json" };
    if (token) headers["Authorization"] = `Bearer ${token}`;
    return headers;
  }

  /** Ejecuta request con refresh automático y devuelve la respuesta cruda. */
  private async ejecutarSolicitud(
    ruta: string,
    opciones?: RequestInit,
  ): Promise<Response> {
    const headers = this.obtenerHeaders();

    let respuesta = await fetch(`${BASE_URL}${ruta}`, {
      ...opciones,
      headers: { ...headers, ...opciones?.headers },
    });

    // 401 → intentar renovar y reintentar una vez.
    // Solo se omite el refresh para rutas que no requieren token activo.
    // /auth/me, /auth/logout, /auth/cambiar-contrasena, etc. SÍ deben reintentar.
    const RUTAS_SIN_TOKEN = ["/auth/login", "/auth/registrar", "/auth/renovar",
      "/auth/solicitar-reset", "/auth/verificar-otp", "/auth/confirmar-reset",
      "/auth/google/"];
    const esRutaSinToken = RUTAS_SIN_TOKEN.some((r) => ruta.startsWith(r));
    if (respuesta.status === 401 && !esRutaSinToken) {
      const renovado = await this.intentarRenovar();
      if (renovado) {
        const headersNuevos = this.obtenerHeaders();
        respuesta = await fetch(`${BASE_URL}${ruta}`, {
          ...opciones,
          headers: { ...headersNuevos, ...opciones?.headers },
        });
      } else {
        this.limpiarTokens();
        throw new ErrorAPI(401, "Sesión expirada. Iniciá sesión nuevamente.");
      }
    }

    if (!respuesta.ok) {
      throw await this.manejarError(respuesta);
    }

    return respuesta;
  }

  /**
   * Ejecuta request y desenvuelve la respuesta.
   * Devuelve `datos` directamente — no el envoltorio.
   */
  private async solicitud<T>(
    ruta: string,
    opciones?: RequestInit,
  ): Promise<T> {
    const respuesta = await this.ejecutarSolicitud(ruta, opciones);

    // Desenvolver: extraer `datos` del envoltorio
    const json = (await respuesta.json()) as RespuestaAPI<T>;

    // El backend siempre envuelve en { exito, datos }.
    // Si tiene `datos`, devolvemos eso. Si no (edge case), devolvemos el json crudo.
    if (json.datos !== undefined) {
      return json.datos;
    }
    return json as unknown as T;
  }

  /** Extrae error legible del body de respuesta. */
  private async manejarError(respuesta: Response): Promise<ErrorAPI> {
    try {
      const body = await respuesta.json();
      // Backend usa `detalle` (español) o `detail` (FastAPI default)
      const mensaje =
        body.detalle || body.detail || body.mensaje || body.error || "Error desconocido";
      return new ErrorAPI(respuesta.status, mensaje);
    } catch {
      return new ErrorAPI(respuesta.status, `Error ${respuesta.status}`);
    }
  }

  /**
   * Renueva el token de acceso. Usa mutex para evitar múltiples
   * renovaciones simultáneas si varios requests fallan a la vez.
   */
  private async intentarRenovar(): Promise<boolean> {
    // Si ya hay una renovación en curso, esperar su resultado
    if (this.renovandoPromesa) {
      return this.renovandoPromesa;
    }

    this.renovandoPromesa = this._renovar();
    try {
      return await this.renovandoPromesa;
    } finally {
      this.renovandoPromesa = null;
    }
  }

  private async _renovar(): Promise<boolean> {
    const tokenRefresco = localStorage.getItem("token_refresco");
    if (!tokenRefresco) return false;

    try {
      const resp = await fetch(`${BASE_URL}/auth/renovar`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token_refresco: tokenRefresco }),
      });
      if (!resp.ok) return false;

      const json = await resp.json();
      // El backend devuelve { exito, datos: { token_acceso, tipo } }
      // NO devuelve token_refresco — el refresh token se mantiene.
      const nuevoToken = json.datos?.token_acceso || json.token_acceso;
      if (nuevoToken) {
        localStorage.setItem("token_acceso", nuevoToken);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }

  private limpiarTokens(): void {
    if (typeof window === "undefined") return;
    localStorage.removeItem("token_acceso");
    localStorage.removeItem("token_refresco");
  }

  // --- Métodos públicos ---

  async get<T>(ruta: string): Promise<T> {
    return this.solicitud<T>(ruta);
  }

  async getBlob(ruta: string): Promise<Blob> {
    const respuesta = await this.ejecutarSolicitud(ruta);
    return respuesta.blob();
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
    return this.solicitud<T>(ruta, { method: "DELETE" });
  }
}

export const clienteApi = new ClienteAPI();
