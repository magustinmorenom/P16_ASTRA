"use client";

/**
 * Hook global de selección de texto para "Explicame mejor".
 *
 * Monta un listener `selectionchange` en `document` que:
 *  1. Detecta cuando hay una selección no vacía
 *  2. Verifica que esté dentro de un nodo con [data-explicable="true"]
 *     y que NO haya ningún ancestro con [data-no-explicable="true"]
 *  3. Normaliza el texto (trim + colapso de espacios)
 *  4. Calcula el bounding rect del Range
 *  5. Publica { texto, rect, contextoSeccion } al store
 *
 * Cierra automáticamente en: scroll, resize, route change, ESC, click fuera,
 * y cuando la selección queda vacía.
 */

import { useEffect } from "react";
import { usePathname } from "next/navigation";

import { useStoreExplicar } from "@/lib/stores/store-explicar";

const MIN_CHARS = 2;
const MAX_CHARS = 600;
const MAX_CONTEXTO_EXTENDIDO = 1200;
const DEBOUNCE_MS = 120;

/** Tags considerados "bloque de lectura" para extraer contexto natural. */
const TAGS_BLOQUE = new Set([
  "P",
  "LI",
  "BLOCKQUOTE",
  "H1",
  "H2",
  "H3",
  "H4",
  "H5",
  "H6",
  "TD",
  "TH",
  "DD",
  "DT",
  "FIGCAPTION",
  "ARTICLE",
  "SECTION",
]);

/** Normaliza el texto seleccionado: trim + colapso de whitespace. */
function normalizarTexto(raw: string): string {
  return raw.replace(/\s+/g, " ").trim();
}

/**
 * Reduce un bloque demasiado largo a las oraciones que rodean a la selección.
 * Si no encuentra el fragmento dentro del bloque, recorta los primeros MAX_*.
 */
function recortarAlEntornoDeOracion(
  bloque: string,
  seleccion: string,
): string {
  if (bloque.length <= MAX_CONTEXTO_EXTENDIDO) return bloque;

  const idx = bloque.indexOf(seleccion);
  if (idx === -1) return bloque.slice(0, MAX_CONTEXTO_EXTENDIDO);

  // Inicio de oración: último separador antes del idx
  const izq = bloque.slice(0, idx);
  const matchesIzq = Array.from(izq.matchAll(/[.!?…]\s+/g));
  const inicio = matchesIzq.length
    ? matchesIzq[matchesIzq.length - 1].index! +
      matchesIzq[matchesIzq.length - 1][0].length
    : 0;

  // Fin de oración: primer separador después del fin de la selección
  const fin = idx + seleccion.length;
  const der = bloque.slice(fin);
  const matchDer = der.match(/[.!?…](\s|$)/);
  const finFinal = matchDer
    ? fin + matchDer.index! + 1
    : Math.min(bloque.length, fin + 240);

  const recorte = bloque.slice(inicio, finFinal).trim();
  return recorte.length > 0
    ? recorte.slice(0, MAX_CONTEXTO_EXTENDIDO)
    : bloque.slice(0, MAX_CONTEXTO_EXTENDIDO);
}

/**
 * Extrae el bloque de lectura que contiene a la selección.
 *
 * Sube por el árbol desde el `commonAncestorContainer` hasta encontrar el
 * primer elemento "bloque" (párrafo, item de lista, encabezado, etc.) sin
 * salirse de la zona explicable. Si la selección ya cubre todo el bloque
 * o lo supera, devuelve null (no hay contexto extra que aportar).
 */
function extraerContextoExtendido(
  range: Range,
  seleccion: string,
): string | null {
  let elemento: Element | null =
    range.commonAncestorContainer.nodeType === Node.ELEMENT_NODE
      ? (range.commonAncestorContainer as Element)
      : range.commonAncestorContainer.parentElement;

  if (!elemento) return null;

  const limiteExplicable = elemento.closest('[data-explicable="true"]');
  if (!limiteExplicable) return null;

  // Subir hasta encontrar un bloque, sin salir de la zona explicable.
  while (elemento && elemento !== limiteExplicable.parentElement) {
    if (TAGS_BLOQUE.has(elemento.tagName)) break;
    if (elemento === limiteExplicable) break;
    elemento = elemento.parentElement;
  }
  if (!elemento) return null;

  // Si llegamos al borde explicable sin pasar por un bloque, usamos el propio
  // contenedor explicable como fallback (mejor que nada).
  const fuenteTexto = TAGS_BLOQUE.has(elemento.tagName)
    ? elemento
    : limiteExplicable;

  const bruto = fuenteTexto.textContent ?? "";
  const bloque = normalizarTexto(bruto);
  if (!bloque) return null;

  // Si la selección ya es prácticamente todo el bloque, no hay nada que sumar.
  if (bloque.length <= seleccion.length + 4) return null;
  if (!bloque.includes(seleccion)) {
    // El normalizado del bloque puede diferir del de la selección por
    // saltos de línea raros — devolvemos el bloque igual; sirve como contexto.
    return bloque.slice(0, MAX_CONTEXTO_EXTENDIDO);
  }

  return recortarAlEntornoDeOracion(bloque, seleccion);
}

/** Devuelve el primer segmento del pathname (ej: "/diseno-humano/x" → "diseno-humano"). */
function extraerContextoSeccion(pathname: string | null): string {
  if (!pathname) return "general";
  const limpio = pathname.replace(/^\//, "");
  const primero = limpio.split("/")[0];
  return primero || "general";
}

/**
 * Devuelve el Element más cercano al nodo dado. Si el nodo es un Text node,
 * sube al parentElement.
 */
function elementoDeNodo(nodo: Node | null): Element | null {
  if (!nodo) return null;
  if (nodo.nodeType === Node.ELEMENT_NODE) return nodo as Element;
  return nodo.parentElement;
}

/**
 * Verifica que la selección esté contenida dentro de [data-explicable]
 * y que no tenga ningún ancestro con [data-no-explicable].
 */
function esSeleccionExplicable(range: Range): boolean {
  const elementoComun = elementoDeNodo(range.commonAncestorContainer);
  if (!elementoComun) return false;

  // Debe estar dentro de una zona explicable
  const explicable = elementoComun.closest('[data-explicable="true"]');
  if (!explicable) return false;

  // No debe haber opt-out en la cadena (entre el commonAncestor y el explicable)
  const optOut = elementoComun.closest('[data-no-explicable="true"]');
  if (optOut && explicable.contains(optOut)) return false;

  // Tampoco aceptamos selecciones dentro de inputs/textarea editables
  const editable = elementoComun.closest(
    'input, textarea, [contenteditable="true"]',
  );
  if (editable) return false;

  return true;
}

export function usarSeleccionExplicable(): void {
  const pathname = usePathname();
  const abrirMenu = useStoreExplicar((s) => s.abrirMenu);
  const cerrar = useStoreExplicar((s) => s.cerrar);

  useEffect(() => {
    let timeoutId: number | undefined;

    /** Cerrar SOLO si estamos en fase 'menu' o 'cerrado' — nunca tocar el tooltip ya abierto. */
    const cerrarSiSoloMenu = () => {
      const fase = useStoreExplicar.getState().fase;
      if (fase === "menu" || fase === "cerrado") cerrar();
    };

    const procesar = () => {
      // Si el tooltip ya está visible (cargando/listo/error), no abrir nuevo menú
      // mientras esté abierto — el usuario tiene que cerrarlo con la X primero.
      const faseActual = useStoreExplicar.getState().fase;
      if (
        faseActual === "cargando" ||
        faseActual === "listo" ||
        faseActual === "error"
      ) {
        return;
      }

      const sel = window.getSelection();
      if (!sel || sel.isCollapsed || sel.rangeCount === 0) {
        cerrarSiSoloMenu();
        return;
      }

      const range = sel.getRangeAt(0);
      const textoCrudo = sel.toString();
      const texto = normalizarTexto(textoCrudo);

      if (texto.length < MIN_CHARS || texto.length > MAX_CHARS) {
        cerrarSiSoloMenu();
        return;
      }

      if (!esSeleccionExplicable(range)) {
        cerrarSiSoloMenu();
        return;
      }

      const rect = range.getBoundingClientRect();
      if (rect.width === 0 && rect.height === 0) {
        cerrarSiSoloMenu();
        return;
      }

      const contextoExtendido = extraerContextoExtendido(range, texto);

      abrirMenu({
        texto,
        rect,
        contextoSeccion: extraerContextoSeccion(pathname),
        contextoExtendido: contextoExtendido ?? undefined,
      });
    };

    const onSelectionChange = () => {
      if (timeoutId !== undefined) window.clearTimeout(timeoutId);
      timeoutId = window.setTimeout(procesar, DEBOUNCE_MS);
    };

    // Estos listeners NO afectan al tooltip ya abierto: solo cierran el menú flotante
    // (cuya posición depende del rect de la selección que se invalida al hacer scroll/resize).
    const onScroll = () => cerrarSiSoloMenu();
    const onResize = () => cerrarSiSoloMenu();
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") cerrarSiSoloMenu();
    };

    document.addEventListener("selectionchange", onSelectionChange);
    window.addEventListener("scroll", onScroll, true);
    window.addEventListener("resize", onResize);
    document.addEventListener("keydown", onKeyDown);

    return () => {
      if (timeoutId !== undefined) window.clearTimeout(timeoutId);
      document.removeEventListener("selectionchange", onSelectionChange);
      window.removeEventListener("scroll", onScroll, true);
      window.removeEventListener("resize", onResize);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [pathname, abrirMenu, cerrar]);

  // Cerrar todo (menú y tooltip) al cambiar de ruta — el rect ya no apunta a nada relevante.
  useEffect(() => {
    cerrar();
  }, [pathname, cerrar]);
}
