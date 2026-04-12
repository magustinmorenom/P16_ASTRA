"use client";

/**
 * Capa global del feature "Explicame mejor".
 *
 * Se monta una sola vez en LayoutApp y:
 *  1. Inicia el listener global de selección (`usarSeleccionExplicable`)
 *  2. Renderiza el menú contextual cuando hay una selección activa
 *  3. Renderiza el tooltip de explicación cuando hay respuesta o carga
 *
 * Como `(admin)/*` y `(auth)/*` no usan LayoutApp, ahí no se monta esta capa
 * y el feature queda automáticamente excluido.
 */

import { AnimatePresence } from "framer-motion";

import { usarSeleccionExplicable } from "@/lib/hooks/usar-seleccion-explicable";
import { useStoreExplicar } from "@/lib/stores/store-explicar";
import { MenuSeleccionExplicar } from "./menu-seleccion-explicar";
import { TooltipExplicacionAstra } from "./tooltip-explicacion-astra";

export function CapaExplicar() {
  // Listener global de selección
  usarSeleccionExplicable();

  const fase = useStoreExplicar((s) => s.fase);

  return (
    <AnimatePresence>
      {fase === "menu" && <MenuSeleccionExplicar key="menu" />}
      {(fase === "cargando" || fase === "listo" || fase === "error") && (
        <TooltipExplicacionAstra key="tooltip" />
      )}
    </AnimatePresence>
  );
}
