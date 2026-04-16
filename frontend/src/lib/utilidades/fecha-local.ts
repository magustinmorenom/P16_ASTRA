/**
 * Utilidades de fecha local del usuario.
 * Reemplaza el patrón roto `new Date().toISOString().split("T")[0]`
 * que devuelve fecha UTC en vez de local.
 */

/** Fecha local del usuario como "YYYY-MM-DD". */
export function fechaHoyLocal(): string {
  return fechaDeDate(new Date());
}

/** Date → "YYYY-MM-DD" usando campos locales (no UTC). */
export function fechaDeDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const dia = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${dia}`;
}

/** ¿El ISO timestamp es del mismo día local que hoy? */
export function esHoyLocal(isoTimestamp: string): boolean {
  const fecha = new Date(isoTimestamp);
  const hoy = new Date();
  return (
    fecha.getFullYear() === hoy.getFullYear() &&
    fecha.getMonth() === hoy.getMonth() &&
    fecha.getDate() === hoy.getDate()
  );
}
