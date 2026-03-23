import { cn } from "@/lib/utilidades/cn";

const tamaños = {
  sm: "h-8 w-8 text-xs",
  md: "h-10 w-10 text-sm",
  lg: "h-14 w-14 text-lg",
} as const;

interface AvatarProps {
  nombre: string;
  imagen?: string | null;
  tamaño?: keyof typeof tamaños;
  className?: string;
}

function obtenerIniciales(nombre: string): string {
  return nombre
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((parte) => parte[0]?.toUpperCase() ?? "")
    .join("");
}

export function Avatar({
  nombre,
  imagen,
  tamaño = "md",
  className,
}: AvatarProps) {
  const iniciales = obtenerIniciales(nombre);

  return (
    <div
      className={cn(
        "relative shrink-0 rounded-full overflow-hidden",
        "bg-gradient-to-br from-violet-600 to-violet-800",
        "flex items-center justify-center font-semibold text-white",
        "border border-violet-500/30",
        tamaños[tamaño],
        className
      )}
      title={nombre}
    >
      {imagen ? (
        <img
          src={imagen}
          alt={nombre}
          className="h-full w-full object-cover"
        />
      ) : (
        <span>{iniciales}</span>
      )}
    </div>
  );
}
