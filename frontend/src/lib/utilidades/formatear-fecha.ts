import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";

export function formatearFecha(fecha: string): string {
  return format(parseISO(fecha), "d 'de' MMMM, yyyy", { locale: es });
}

export function formatearFechaCorta(fecha: string): string {
  return format(parseISO(fecha), "dd/MM/yyyy");
}

export function formatearHora(hora: string): string {
  return hora.slice(0, 5); // HH:MM
}

export function formatearFechaHora(fechaISO: string): string {
  return format(parseISO(fechaISO), "d MMM yyyy, HH:mm", { locale: es });
}
