/**
 * Icono SVG para las 8 fases lunares.
 * Hereda color del padre via currentColor.
 */

const FASES: Record<string, React.ReactNode> = {
  "Luna Nueva": (
    <>
      <circle cx="8" cy="8" r="6" fill="currentColor" opacity="0.15" />
      <circle cx="8" cy="8" r="5.5" stroke="currentColor" strokeWidth="1" fill="none" />
    </>
  ),
  "Creciente": (
    <path d="M8 2a6 6 0 0 1 0 12 4.5 4.5 0 0 0 0-12z" fill="currentColor" />
  ),
  "Cuarto Creciente": (
    <path d="M8 2a6 6 0 0 1 0 12V2z" fill="currentColor" />
  ),
  "Gibosa Creciente": (
    <path d="M8 2a6 6 0 0 1 0 12 2.5 6 0 0 1 0-12z" fill="currentColor" />
  ),
  "Luna Llena": (
    <circle cx="8" cy="8" r="6" fill="currentColor" />
  ),
  "Gibosa Menguante": (
    <path d="M8 2a6 6 0 0 0 0 12 2.5 6 0 0 0 0-12z" fill="currentColor" />
  ),
  "Cuarto Menguante": (
    <path d="M8 2a6 6 0 0 0 0 12V2z" fill="currentColor" />
  ),
  "Menguante": (
    <path d="M8 2a6 6 0 0 0 0 12 4.5 4.5 0 0 1 0-12z" fill="currentColor" />
  ),
};

interface IconoFaseLunarProps {
  fase: string;
  tamaño?: number;
  className?: string;
}

export function IconoFaseLunar({ fase, tamaño = 16, className }: IconoFaseLunarProps) {
  const contenido = FASES[fase] ?? FASES["Creciente"];

  return (
    <svg
      width={tamaño}
      height={tamaño}
      viewBox="0 0 16 16"
      fill="none"
      className={className}
      aria-label={fase}
    >
      {contenido}
    </svg>
  );
}
