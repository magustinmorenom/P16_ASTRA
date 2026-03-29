const MESES = [
  "enero", "febrero", "marzo", "abril", "mayo", "junio",
  "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre",
];

const MESES_CORTOS = [
  "ene", "feb", "mar", "abr", "may", "jun",
  "jul", "ago", "sep", "oct", "nov", "dic",
];

export function formatearFecha(fecha: string): string {
  const d = new Date(fecha + "T12:00:00");
  return `${d.getDate()} de ${MESES[d.getMonth()]}, ${d.getFullYear()}`;
}

export function formatearFechaCorta(fecha: string): string {
  const d = new Date(fecha + "T12:00:00");
  const dia = String(d.getDate()).padStart(2, "0");
  const mes = String(d.getMonth() + 1).padStart(2, "0");
  return `${dia}/${mes}/${d.getFullYear()}`;
}

export function formatearHora(hora: string): string {
  return hora.slice(0, 5);
}

export function formatearFechaHora(fechaISO: string): string {
  const d = new Date(fechaISO);
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  return `${d.getDate()} ${MESES_CORTOS[d.getMonth()]} ${d.getFullYear()}, ${hh}:${mm}`;
}
