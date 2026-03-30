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
    <div className="flex flex-col items-start">
      <span className="text-[#f8f6ff] font-[family-name:var(--font-inria)] text-[56px] leading-[1] font-normal">
        {dia}
      </span>
      <span className="text-[#f8f6ff] font-[family-name:var(--font-inria)] text-[28px] leading-[1] font-normal">
        {mes}
      </span>
      <span className="mt-1.5 inline-block rounded-[10px] bg-[#271d45]/50 px-2.5 py-0.5 text-[#f8f6ff] text-[10px] font-medium tracking-widest">
        {diaSemana}
      </span>
    </div>
  );
}
