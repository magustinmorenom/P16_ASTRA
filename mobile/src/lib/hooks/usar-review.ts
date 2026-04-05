import { useEffect } from "react";
import * as StoreReview from "expo-store-review";
import * as SecureStore from "expo-secure-store";

const CLAVE_SESIONES = "astra_sesiones_exitosas";
const CLAVE_REVIEW_PEDIDO = "astra_review_solicitado";
const SESIONES_PARA_REVIEW = 5;

/**
 * Hook que solicita review en el store después de N sesiones exitosas.
 * Solo pide una vez. Se debe usar en la pantalla principal (dashboard).
 */
export function usarReview() {
  useEffect(() => {
    verificarYSolicitarReview();
  }, []);
}

async function verificarYSolicitarReview(): Promise<void> {
  try {
    // Si ya se pidió, no volver a pedir
    const yaPedido = await SecureStore.getItemAsync(CLAVE_REVIEW_PEDIDO);
    if (yaPedido === "true") return;

    // Incrementar contador de sesiones
    const sesionesStr = await SecureStore.getItemAsync(CLAVE_SESIONES);
    const sesiones = sesionesStr ? parseInt(sesionesStr, 10) + 1 : 1;
    await SecureStore.setItemAsync(CLAVE_SESIONES, String(sesiones));

    // Solo pedir después de N sesiones
    if (sesiones < SESIONES_PARA_REVIEW) return;

    // Verificar que el store review está disponible
    const disponible = await StoreReview.isAvailableAsync();
    if (!disponible) return;

    // Solicitar review
    await StoreReview.requestReview();
    await SecureStore.setItemAsync(CLAVE_REVIEW_PEDIDO, "true");
  } catch {
    // Silenciar errores — no es crítico
  }
}
