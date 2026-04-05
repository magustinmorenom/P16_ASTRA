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

const ESTILO_TARJETA_FECHA = {
  borderColor: "var(--shell-borde)",
  background: "var(--shell-superficie-fuerte)",
  boxShadow: "none",
} as const;

const ESTILO_ETIQUETA_FECHA = {
  borderColor: "var(--shell-chip-borde)",
  background: "var(--shell-chip)",
} as const;

export function TarjetaFecha({ fecha }: TarjetaFechaProps) {
  const dia = fecha.getDate();
  const mes = MESES[fecha.getMonth()];
  const diaSemana = DIAS[fecha.getDay()];

  return (
    <div
      className="flex shrink-0 flex-col items-center justify-center rounded-[18px] border px-4 py-3.5"
      style={ESTILO_TARJETA_FECHA}
    >
      <span
        className="rounded-full border px-2.5 py-1 text-[9px] font-semibold uppercase tracking-[0.18em] text-[color:var(--shell-texto-tenue)]"
        style={ESTILO_ETIQUETA_FECHA}
      >
        {diaSemana.slice(0, 3)}
      </span>
      <span className="mt-3 font-[family-name:var(--font-inria)] text-[34px] font-light leading-[0.95] tracking-tight text-[color:var(--shell-texto)]">
        {dia}
      </span>
      <span className="mt-1 font-[family-name:var(--font-inria)] text-[16px] font-light leading-[1] tracking-[0.18em] text-[color:var(--color-acento)]">
        {mes}
      </span>
    </div>
  );
}
