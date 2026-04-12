"use client";

/**
 * Menú contextual flotante que aparece sobre la selección de texto.
 *
 * Dos acciones:
 *  - Copiar: navigator.clipboard.writeText + toast
 *  - Explicame mejor: dispara la mutation y cambia la fase del store a 'cargando'
 *
 * Posicionamiento: arriba de la selección por defecto, abajo si no hay espacio.
 * Renderizado vía createPortal a document.body para escapar overflow del rail.
 */

import { useEffect, useMemo, useRef } from "react";
import { createPortal } from "react-dom";
import { motion } from "framer-motion";

import { Icono } from "@/componentes/ui/icono";
import { useStoreExplicar } from "@/lib/stores/store-explicar";
import { useStoreUI } from "@/lib/stores/store-ui";
import { usarExplicar } from "@/lib/hooks/usar-explicar";

const ALTO_MENU = 40;
const ANCHO_ESTIMADO = 200;
const MARGEN_VIEWPORT = 12;
const ESPACIO_ARRIBA = 8;

export function MenuSeleccionExplicar() {
  const seleccion = useStoreExplicar((s) => s.seleccion);
  const fase = useStoreExplicar((s) => s.fase);
  const cerrar = useStoreExplicar((s) => s.cerrar);
  const mostrarToast = useStoreUI((s) => s.mostrarToast);
  const explicarMutation = usarExplicar();
  const refMenu = useRef<HTMLDivElement>(null);

  // Cerrar al hacer click fuera del menú (mientras esté en fase 'menu')
  useEffect(() => {
    if (fase !== "menu") return;

    const onClickFuera = (e: MouseEvent) => {
      if (
        refMenu.current &&
        !refMenu.current.contains(e.target as Node)
      ) {
        // Solo cerrar si el click NO está dentro de un texto seleccionable
        // (sino el propio acto de seleccionar lo cerraría)
        const target = e.target as Element | null;
        if (target?.closest?.('[data-explicar-menu="true"]')) return;
        cerrar();
      }
    };

    // Usamos mousedown para que cierre antes de que selectionchange dispare
    document.addEventListener("mousedown", onClickFuera);
    return () => document.removeEventListener("mousedown", onClickFuera);
  }, [fase, cerrar]);

  // Calcular posición flotante a partir del rect de la selección
  const posicion = useMemo(() => {
    if (!seleccion) return null;
    const { rect } = seleccion;

    // Por defecto: arriba de la selección, centrado horizontalmente
    let top = rect.top - ALTO_MENU - ESPACIO_ARRIBA;
    let left = rect.left + rect.width / 2 - ANCHO_ESTIMADO / 2;

    // Si no hay espacio arriba, ponerlo abajo
    if (top < MARGEN_VIEWPORT) {
      top = rect.bottom + ESPACIO_ARRIBA;
    }

    // Clamp horizontal al viewport
    const maxLeft = window.innerWidth - ANCHO_ESTIMADO - MARGEN_VIEWPORT;
    if (left < MARGEN_VIEWPORT) left = MARGEN_VIEWPORT;
    if (left > maxLeft) left = maxLeft;

    return { top, left };
  }, [seleccion]);

  if (fase !== "menu" || !seleccion || !posicion) return null;
  if (typeof document === "undefined") return null;

  const onCopiar = () => {
    if (!navigator.clipboard) {
      mostrarToast("error", "Tu navegador no permite copiar al portapapeles.");
      return;
    }
    navigator.clipboard
      .writeText(seleccion.texto)
      .then(() => {
        mostrarToast("exito", "Texto copiado");
        cerrar();
        // Limpiar la selección visual
        window.getSelection()?.removeAllRanges();
      })
      .catch(() => {
        mostrarToast("error", "No pudimos copiar el texto.");
      });
  };

  const onExplicar = () => {
    explicarMutation.mutate({
      texto: seleccion.texto,
      contextoSeccion: seleccion.contextoSeccion,
      contextoExtendido: seleccion.contextoExtendido,
    });
  };

  return createPortal(
    <motion.div
      ref={refMenu}
      data-explicar-menu="true"
      data-no-explicable="true"
      initial={{ opacity: 0, y: 6, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 6, scale: 0.96 }}
      transition={{ duration: 0.15, ease: "easeOut" }}
      className="fixed flex items-center gap-1 rounded-full border p-1 shadow-2xl"
      style={{
        top: posicion.top,
        left: posicion.left,
        zIndex: 9999,
        background: "var(--shell-panel)",
        borderColor: "var(--shell-borde)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
      }}
    >
      <button
        type="button"
        onClick={onCopiar}
        className="flex h-8 items-center gap-1.5 rounded-full px-3 text-[12px] font-medium transition-colors hover:bg-[color:var(--shell-superficie-suave)]"
        style={{ color: "var(--shell-texto)" }}
      >
        <Icono nombre="copiar" tamaño={14} />
        <span>Copiar</span>
      </button>

      <span
        className="block h-4 w-px"
        style={{ background: "var(--shell-borde)" }}
      />

      <button
        type="button"
        onClick={onExplicar}
        className="flex h-8 items-center gap-1.5 rounded-full px-3 text-[12px] font-semibold transition-all hover:-translate-y-[1px]"
        style={{
          color: "#fff",
          background:
            "linear-gradient(135deg, var(--color-violet-500), var(--color-violet-700))",
          boxShadow: "0 4px 12px var(--shell-glow-1)",
        }}
      >
        <Icono nombre="destello" tamaño={14} peso="fill" />
        <span>Explicame mejor</span>
      </button>
    </motion.div>,
    document.body,
  );
}
