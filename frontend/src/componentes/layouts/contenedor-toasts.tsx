"use client";

import { useEffect, useRef } from "react";
import { useStoreUI } from "@/lib/stores/store-ui";
import { Alerta } from "@/componentes/ui/alerta";

/**
 * Contenedor global de toasts. Se monta una vez en el layout principal.
 * Renderiza las notificaciones como alertas flotantes con auto-dismiss.
 */
export function ContenedorToasts() {
  const toasts = useStoreUI((s) => s.toasts);
  const cerrarToast = useStoreUI((s) => s.cerrarToast);
  const timeoutsRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  useEffect(() => {
    for (const toast of toasts) {
      if (!timeoutsRef.current.has(toast.id)) {
        const timeout = setTimeout(() => {
          cerrarToast(toast.id);
          timeoutsRef.current.delete(toast.id);
        }, toast.duracionMs);
        timeoutsRef.current.set(toast.id, timeout);
      }
    }

    // Limpiar timeouts de toasts que ya no existen
    const idsActivos = new Set(toasts.map((t) => t.id));
    for (const [id, timeout] of timeoutsRef.current) {
      if (!idsActivos.has(id)) {
        clearTimeout(timeout);
        timeoutsRef.current.delete(id);
      }
    }
  }, [toasts, cerrarToast]);

  // Limpiar todos los timeouts al desmontar
  useEffect(() => {
    const timeouts = timeoutsRef.current;
    return () => {
      for (const timeout of timeouts.values()) {
        clearTimeout(timeout);
      }
    };
  }, []);

  if (toasts.length === 0) return null;

  return (
    <div
      data-no-explicable="true"
      className="fixed bottom-24 right-4 z-[100] flex flex-col gap-2 w-80 max-w-[calc(100vw-2rem)]"
    >
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className="animate-in slide-in-from-right-5 fade-in duration-300"
        >
          <Alerta
            variante={toast.variante}
            mensaje={toast.mensaje}
            onCerrar={() => cerrarToast(toast.id)}
            className="shadow-lg"
          />
        </div>
      ))}
    </div>
  );
}
