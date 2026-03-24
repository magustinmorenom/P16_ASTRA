/**
 * Hook para detectar si el viewport es mobile (< 1024px).
 * Usa useSyncExternalStore para evitar hydration mismatch.
 */

import { useSyncExternalStore } from "react";

const MOBILE_QUERY = "(max-width: 1023px)";

function subscribe(callback: () => void): () => void {
  const mql = window.matchMedia(MOBILE_QUERY);
  mql.addEventListener("change", callback);
  return () => mql.removeEventListener("change", callback);
}

function getSnapshot(): boolean {
  return window.matchMedia(MOBILE_QUERY).matches;
}

function getServerSnapshot(): boolean {
  return false; // SSR siempre renderiza desktop
}

export function usarEsMobile(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
