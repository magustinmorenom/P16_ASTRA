const DIAS = [
  "DOMINGO", "LUNES", "MARTES", "MIÉRCOLES",
  "JUEVES", "VIERNES", "SÁBADO",
] as const;

const MESES = [
  "ENE", "FEB", "MAR", "ABR", "MAY", "JUN",
  "JUL", "AGO", "SEP", "OCT", "NOV", "DIC",
] as const;

interface TarjetaFechaProps {
  fecha: Date;
}

export function TarjetaFecha({ fecha }: TarjetaFechaProps) {
  const dia = fecha.getDate();
  const mes = MESES[fecha.getMonth()];
  const diaSemana = DIAS[fecha.getDay()];

  return (
    <div className="flex shrink-0 flex-col items-center justify-center rounded-[20px] border border-white/[0.08] bg-white/[0.04] px-4 py-3">
      <span className="font-[family-name:var(--font-inria)] text-[42px] font-light leading-[1] tracking-tight text-[#f8f6ff]">
        {dia}
      </span>
      <span className="font-[family-name:var(--font-inria)] text-[22px] font-light leading-[1.1] tracking-wide text-[#f8f6ff]">
        {mes}
      </span>
      <span className="mt-2 inline-block rounded-full border border-white/[0.08] bg-white/[0.06] px-3 py-0.5 text-[9px] font-semibold tracking-[0.15em] text-[#f8f6ff]">
        {diaSemana}
      </span>
    </div>
  );
}
