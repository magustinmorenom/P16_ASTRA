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
    <div
      className="flex shrink-0 flex-col items-center justify-center rounded-[18px] border px-5 py-4"
      style={{
        borderColor: "rgba(255, 255, 255, 0.1)",
        background: "rgba(255, 255, 255, 0.06)",
      }}
    >
      <span className="font-[family-name:var(--font-inria)] text-[34px] font-light leading-[0.95] tracking-tight text-[color:var(--shell-texto-inverso)]">
        {dia}
      </span>
      <span className="mt-1 font-[family-name:var(--font-inria)] text-[18px] font-light leading-[1] tracking-wide text-[color:var(--shell-texto-inverso)]">
        {mes}
      </span>
      <span
        className="mt-3 inline-block rounded-full border px-3 py-1 text-[9px] font-semibold tracking-[0.15em] text-[color:var(--shell-texto-inverso)]"
        style={{
          borderColor: "rgba(255, 255, 255, 0.1)",
          background: "rgba(255, 255, 255, 0.08)",
        }}
      >
        {diaSemana}
      </span>
    </div>
  );
}
