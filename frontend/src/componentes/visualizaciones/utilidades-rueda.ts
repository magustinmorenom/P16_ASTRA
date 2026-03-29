/**
 * Utilidades geometricas para la rueda zodiacal.
 * Polar → cartesiano, ajuste de angulo, colision avoidance, arcos SVG.
 */

// ---------------------------------------------------------------------------
// Polar a cartesiano
// ---------------------------------------------------------------------------

export function polarAXY(
  angulo: number,
  radio: number,
  cx: number,
  cy: number,
): { x: number; y: number } {
  const rad = ((angulo - 90) * Math.PI) / 180;
  return { x: cx + radio * Math.cos(rad), y: cy + radio * Math.sin(rad) };
}

// ---------------------------------------------------------------------------
// Ajustar longitud ecliptica a angulo del chart
// El Ascendente se coloca a la izquierda (180°) y el zodiaco gira en sentido horario
// ---------------------------------------------------------------------------

export function ajustarAngulo(longitud: number, ascGrado: number): number {
  return (ascGrado - longitud + 360) % 360;
}

// ---------------------------------------------------------------------------
// Colision avoidance para planetas
// ---------------------------------------------------------------------------

export interface PlanetaConAngulo {
  nombre: string;
  longitud: number;
  real: number;    // angulo real en el chart
  display: number; // angulo ajustado para evitar superposicion
}

export function resolverColisiones(
  planetas: Array<{ nombre: string; longitud: number }>,
  ascGrado: number,
  separacionMin: number = 10,
): PlanetaConAngulo[] {
  // Convertir a angulos del chart
  const items: PlanetaConAngulo[] = planetas.map((p) => {
    const real = ajustarAngulo(p.longitud, ascGrado);
    return { nombre: p.nombre, longitud: p.longitud, real, display: real };
  });

  // Ordenar por angulo real
  items.sort((a, b) => a.real - b.real);

  // Resolver colisiones iterativamente
  let cambio = true;
  let iteraciones = 0;
  while (cambio && iteraciones < 20) {
    cambio = false;
    iteraciones++;
    for (let i = 0; i < items.length; i++) {
      for (let j = i + 1; j < items.length; j++) {
        let diff = items[j].display - items[i].display;
        // Normalizar a -180..180
        if (diff > 180) diff -= 360;
        if (diff < -180) diff += 360;

        if (Math.abs(diff) < separacionMin) {
          const ajuste = (separacionMin - Math.abs(diff)) / 2 + 0.5;
          const signo = diff >= 0 ? 1 : -1;
          items[i].display = (items[i].display - signo * ajuste + 360) % 360;
          items[j].display = (items[j].display + signo * ajuste + 360) % 360;
          cambio = true;
        }
      }
    }
  }

  return items;
}

// ---------------------------------------------------------------------------
// Generar path de arco SVG para segmentos zodiacales
// ---------------------------------------------------------------------------

export function generarArcoSVG(
  startAngle: number,
  endAngle: number,
  innerR: number,
  outerR: number,
  cx: number,
  cy: number,
): string {
  const s1 = polarAXY(startAngle, outerR, cx, cy);
  const s2 = polarAXY(endAngle, outerR, cx, cy);
  const s3 = polarAXY(endAngle, innerR, cx, cy);
  const s4 = polarAXY(startAngle, innerR, cx, cy);

  // Determinar si el arco es mayor a 180 grados
  let sweep = endAngle - startAngle;
  if (sweep < 0) sweep += 360;
  const largeArc = sweep > 180 ? 1 : 0;

  return [
    `M ${s1.x} ${s1.y}`,
    `A ${outerR} ${outerR} 0 ${largeArc} 1 ${s2.x} ${s2.y}`,
    `L ${s3.x} ${s3.y}`,
    `A ${innerR} ${innerR} 0 ${largeArc} 0 ${s4.x} ${s4.y}`,
    "Z",
  ].join(" ");
}

// ---------------------------------------------------------------------------
// Numeros romanos (reutilizado de interpretaciones-natal)
// ---------------------------------------------------------------------------

export const ROMANO: Record<number, string> = {
  1: "I", 2: "II", 3: "III", 4: "IV", 5: "V", 6: "VI",
  7: "VII", 8: "VIII", 9: "IX", 10: "X", 11: "XI", 12: "XII",
};

// ---------------------------------------------------------------------------
// Nombres de signos en orden
// ---------------------------------------------------------------------------

export const SIGNOS = [
  "Aries", "Tauro", "Géminis", "Cáncer", "Leo", "Virgo",
  "Libra", "Escorpio", "Sagitario", "Capricornio", "Acuario", "Piscis",
] as const;
