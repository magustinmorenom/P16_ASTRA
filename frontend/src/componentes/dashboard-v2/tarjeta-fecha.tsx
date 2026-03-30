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
    <div className="flex flex-col items-center justify-center">
      <span className="text-[#f8f6ff] font-[family-name:var(--font-inria)] text-[52px] leading-[1] font-light tracking-tight">
        {dia}
      </span>
      <span className="text-[#f8f6ff] font-[family-name:var(--font-inria)] text-[26px] leading-[1.1] font-light tracking-wide">
        {mes}
      </span>
      <span className="mt-2 inline-block rounded-full bg-[#271d45]/60 px-3 py-0.5 text-[#f8f6ff] text-[9px] font-semibold tracking-[0.15em]">
        {diaSemana}
      </span>
    </div>
  );
}
