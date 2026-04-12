"use client";

/**
 * Avatar mini de Astra para el tooltip de "Explicame mejor".
 *
 * - Sin círculo de fondo (la imagen va sola)
 * - En dark mode usa el isotipo blanco
 * - En light mode usa el isotipo ciruela
 */

import Image from "next/image";

import { usarTema } from "@/lib/hooks/usar-tema";

export function AvatarAstraMini({ tamaño = 24 }: { tamaño?: number }) {
  const { esOscuro, cargado } = usarTema();

  // Mientras el tema no haya hidratado, usar ciruela como fallback neutro
  const src =
    cargado && esOscuro ? "/img/isotipo-blanco.png" : "/img/isotipo-ciruela.png";

  return (
    <Image
      src={src}
      alt="Astra"
      width={tamaño}
      height={tamaño}
      className="shrink-0"
      priority={false}
    />
  );
}
