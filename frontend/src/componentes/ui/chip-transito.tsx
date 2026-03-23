import { cn } from "@/lib/utilidades/cn";

interface ChipTransitoProps {
  planeta: string;
  signo: string;
  grado: string;
  className?: string;
}

export function ChipTransito({
  planeta,
  signo,
  grado,
  className,
}: ChipTransitoProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full",
        "bg-violet-900/50 border border-violet-700/30",
        "px-3 py-1 text-xs font-medium",
        className
      )}
    >
      <span className="text-acento">{planeta}</span>
      <span className="text-texto-secundario">en</span>
      <span className="text-texto">{signo}</span>
      <span className="text-texto-terciario">{grado}</span>
    </span>
  );
}
