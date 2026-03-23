import { cn } from "@/lib/utilidades/cn";

interface SeparadorProps {
  orientacion?: "horizontal" | "vertical";
  className?: string;
}

export function Separador({
  orientacion = "horizontal",
  className,
}: SeparadorProps) {
  return (
    <div
      role="separator"
      aria-orientation={orientacion}
      className={cn(
        "shrink-0 bg-borde",
        orientacion === "horizontal" ? "h-px w-full" : "w-px h-full",
        className
      )}
    />
  );
}
