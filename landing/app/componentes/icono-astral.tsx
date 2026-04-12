const MAPA_ICONOS_ASTRALES = {
  astrologia: "020-astrology",
  numerologia: "021-numerology",
  personal: "014-personal",
  emocion: "022-emotion",
  libro: "023-book",
  carrera: "024-career",
  salud: "019-healthy",
} as const;

export type NombreIconoAstral = keyof typeof MAPA_ICONOS_ASTRALES;

interface IconoAstralProps {
  nombre: NombreIconoAstral;
  tamano?: number;
  className?: string;
}

export function IconoAstral({
  nombre,
  tamano = 24,
  className = "",
}: IconoAstralProps) {
  const archivo = MAPA_ICONOS_ASTRALES[nombre];
  const url = `/img/icons/${archivo}.svg`;

  return (
    <span
      aria-hidden="true"
      className={`inline-block shrink-0 bg-current ${className}`}
      style={{
        width: tamano,
        height: tamano,
        maskImage: `url("${url}")`,
        maskPosition: "center",
        maskRepeat: "no-repeat",
        maskSize: "contain",
        WebkitMaskImage: `url("${url}")`,
        WebkitMaskPosition: "center",
        WebkitMaskRepeat: "no-repeat",
        WebkitMaskSize: "contain",
      }}
    />
  );
}
