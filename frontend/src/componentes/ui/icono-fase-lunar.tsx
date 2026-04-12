/**
 * Icono SVG ilustrado para las 8 fases lunares.
 *
 * Renderiza los archivos de `/public/img/fases-lunares/` (estilo ilustración
 * con gradientes y sombreado). Estos SVGs NO son monocromáticos: tienen
 * profundidad propia, por eso se usa `<img>` directo en vez de `mask-image`.
 *
 * Importante: usamos `<img>` HTML y NO `next/image` porque Next bloquea
 * los SVGs en su pipeline de imágenes por seguridad XSS (requiere
 * `dangerouslyAllowSVG: true` en next.config, que es inseguro). Para iconos
 * estáticos del bundle propio, `<img>` es la opción correcta y simple.
 *
 * Mapping fase (string del backend) → archivo en `/public/img/fases-lunares/`.
 * Las 8 fases provienen de `backend/app/servicios/servicio_pronostico.py` y
 * `servicio_transitos_persistidos.py` — deben coincidir exactamente.
 */

import { cn } from "@/lib/utilidades/cn";

const MAPA_FASE_ARCHIVO: Record<string, string> = {
  "Luna Nueva": "new-moon",
  "Creciente": "waxing-crescent",
  "Cuarto Creciente": "first-quarter",
  "Gibosa Creciente": "waxing-gibbous",
  "Luna Llena": "full-moon",
  "Gibosa Menguante": "waning-gibbous",
  "Cuarto Menguante": "last-quarter",
  "Menguante": "waning-crescent",
};

const ARCHIVO_FALLBACK = "moon";

interface IconoFaseLunarProps {
  fase: string;
  tamaño?: number;
  className?: string;
}

export function IconoFaseLunar({ fase, tamaño = 16, className }: IconoFaseLunarProps) {
  const archivo = MAPA_FASE_ARCHIVO[fase] ?? ARCHIVO_FALLBACK;
  const url = `/img/fases-lunares/${archivo}.svg`;

  return (
    <img
      src={url}
      alt={fase}
      width={tamaño}
      height={tamaño}
      draggable={false}
      className={cn("inline-block shrink-0 select-none", className)}
      style={{ width: tamaño, height: tamaño }}
    />
  );
}

/**
 * Icono ilustrado de luna genérica (sin fase específica).
 *
 * Usa los archivos de `/img/fases-lunares/` también, pero variantes neutras:
 * `moon`, `moon-symbol`, `bright-moon`, `crescent-moon`. Sirve para todos
 * los lugares de la UI donde se muestra "Luna" sin referirse a una fase
 * particular: títulos, labels, listas planetarias, headers de secciones
 * lunares, etc.
 *
 * Mantiene la misma API que IconoFaseLunar para consistencia.
 */
interface IconoLunaProps {
  tamaño?: number;
  className?: string;
  /** Texto descriptivo para lectores de pantalla. Default: "Luna". */
  alt?: string;
  /** Variante del archivo. Default: "moon". */
  variante?: "moon" | "moon-symbol" | "bright-moon" | "crescent-moon";
}

export function IconoLuna({
  tamaño = 16,
  className,
  alt = "Luna",
  variante = "moon",
}: IconoLunaProps) {
  const url = `/img/fases-lunares/${variante}.svg`;
  return (
    <img
      src={url}
      alt={alt}
      width={tamaño}
      height={tamaño}
      draggable={false}
      className={cn("inline-block shrink-0 select-none", className)}
      style={{ width: tamaño, height: tamaño }}
    />
  );
}
