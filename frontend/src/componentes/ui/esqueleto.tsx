import { cn } from "@/lib/utilidades/cn";

interface EsqueletoProps {
  className?: string;
}

export function Esqueleto({ className }: EsqueletoProps) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        "animate-pulse rounded-lg",
        "bg-gradient-to-r from-violet-900/40 via-fondo-elevado to-violet-900/40",
        "bg-[length:200%_100%]",
        className
      )}
    />
  );
}
