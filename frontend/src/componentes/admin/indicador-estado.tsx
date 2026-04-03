import { cn } from "@/lib/utilidades/cn";

interface IndicadorEstadoProps {
  nombre: string;
  estado: string;
  detalle?: string;
}

const COLORES: Record<string, string> = {
  conectado: "bg-emerald-400",
  saludable: "bg-emerald-400",
  desconectado: "bg-red-400",
  degradado: "bg-yellow-400",
};

export function IndicadorEstado({ nombre, estado, detalle }: IndicadorEstadoProps) {
  const color = COLORES[estado] ?? "bg-white/30";

  return (
    <div className="flex items-center gap-3 rounded-xl border border-white/[0.06] bg-white/[0.03] px-4 py-3">
      <span className={cn("h-2.5 w-2.5 rounded-full", color)} />
      <div className="flex-1">
        <p className="text-sm font-medium text-white">{nombre}</p>
        {detalle && <p className="text-xs text-white/48">{detalle}</p>}
      </div>
      <span className="text-xs font-medium text-white/60">{estado}</span>
    </div>
  );
}
