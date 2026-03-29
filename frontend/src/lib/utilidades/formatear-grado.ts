const SIGNOS = [
  "Aries", "Tauro", "Géminis", "Cáncer", "Leo", "Virgo",
  "Libra", "Escorpio", "Sagitario", "Capricornio", "Acuario", "Piscis",
] as const;

export function formatearGrado(longitud: number): string {
  const signoIdx = Math.floor(longitud / 30);
  const grado = longitud % 30;
  const grados = Math.floor(grado);
  const minutos = Math.floor((grado - grados) * 60);
  const signo = SIGNOS[signoIdx] || "?";
  return `${grados}°${minutos.toString().padStart(2, "0")}' ${signo}`;
}

export function obtenerSignoDesdeGrado(longitud: number): string {
  return SIGNOS[Math.floor(longitud / 30)] || "?";
}

export { SIGNOS };
