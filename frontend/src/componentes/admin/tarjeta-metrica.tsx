import { cn } from "@/lib/utilidades/cn";

interface TarjetaMetricaProps {
  etiqueta: string;
  valor: string | number;
  subtexto?: string;
  icono?: React.ReactNode;
  className?: string;
}

export function TarjetaMetrica({
  etiqueta,
  valor,
  subtexto,
  icono,
  className,
}: TarjetaMetricaProps) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-white/[0.08] bg-white/[0.04] p-5 transition-colors",
        className,
      )}
    >
      <div className="flex items-start justify-between">
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-violet-200/50">
          {etiqueta}
        </p>
        {icono && <div className="text-violet-300/60">{icono}</div>}
      </div>
      <p className="mt-2 text-[28px] font-bold leading-none text-white">
        {valor}
      </p>
      {subtexto && (
        <p className="mt-1.5 text-[12px] text-white/48">{subtexto}</p>
      )}
    </div>
  );
}
