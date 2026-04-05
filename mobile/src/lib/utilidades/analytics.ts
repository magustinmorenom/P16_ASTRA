import { Platform } from "react-native";
import * as SecureStore from "expo-secure-store";
import { API_BASE_URL } from "@/lib/api/cliente";

/**
 * Analytics liviano para ASTRA.
 * Envía eventos al backend de forma fire-and-forget.
 * No bloquea la UI ni lanza errores al usuario.
 */

interface EventoAnalytics {
  evento: string;
  propiedades?: Record<string, string | number | boolean | null>;
  timestamp: string;
  plataforma: string;
}

const cola: EventoAnalytics[] = [];
let timerFlush: ReturnType<typeof setTimeout> | null = null;
const INTERVALO_FLUSH = 10_000; // 10 segundos
const MAX_COLA = 20;

function programarFlush() {
  if (timerFlush) return;
  timerFlush = setTimeout(() => {
    timerFlush = null;
    flush();
  }, INTERVALO_FLUSH);
}

async function flush() {
  if (cola.length === 0) return;

  const eventos = cola.splice(0, MAX_COLA);
  try {
    const token = await SecureStore.getItemAsync("access_token");
    await fetch(`${API_BASE_URL}/analytics/eventos`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ eventos }),
    });
  } catch {
    // Re-encolar si falla (solo una vez)
    cola.unshift(...eventos);
  }
}

/**
 * Registra un evento de analytics.
 * Los eventos se acumulan y envían en batch cada 10 segundos.
 */
export function trackEvento(
  evento: string,
  propiedades?: Record<string, string | number | boolean | null>,
) {
  cola.push({
    evento,
    propiedades,
    timestamp: new Date().toISOString(),
    plataforma: Platform.OS,
  });

  if (cola.length >= MAX_COLA) {
    flush();
  } else {
    programarFlush();
  }
}

/**
 * Registra vista de pantalla.
 */
export function trackPantalla(nombre: string) {
  trackEvento("pantalla_vista", { pantalla: nombre });
}

// Eventos predefinidos
export const Eventos = {
  // Auth
  LOGIN: "login",
  REGISTRO: "registro",
  LOGOUT: "logout",

  // Onboarding
  ONBOARDING_INICIO: "onboarding_inicio",
  ONBOARDING_PASO: "onboarding_paso",
  ONBOARDING_COMPLETO: "onboarding_completo",

  // Features
  CARTA_NATAL_VISTA: "carta_natal_vista",
  CHAT_MENSAJE: "chat_mensaje",
  PODCAST_PLAY: "podcast_play",
  PODCAST_GENERAR: "podcast_generar",
  PRONOSTICO_VISTA: "pronostico_vista",

  // Subscripción
  PLAN_VISTO: "plan_visto",
  SUSCRIPCION_INICIO: "suscripcion_inicio",
  SUSCRIPCION_COMPLETA: "suscripcion_completa",
  SUSCRIPCION_CANCELADA: "suscripcion_cancelada",

  // Engagement
  PDF_DESCARGADO: "pdf_descargado",
  PERFIL_EDITADO: "perfil_editado",
  TEMA_CAMBIADO: "tema_cambiado",
} as const;
