"use client";

import { format, isToday, parseISO } from "date-fns";
import { es } from "date-fns/locale";

import { IconoSigno } from "@/componentes/ui/icono-astral";
import type { TransitosDia } from "@/lib/tipos";
import {
  calcularRitmoPersonal,
  describirFaseLunar,
  obtenerEventosClave,
  obtenerPlanetasClave,
  obtenerRetrogradosActivos,
} from "@/lib/utilidades/calendario-cosmico";

function tonoTexto(tipo: "favorable" | "neutral" | "precaucion") {
  switch (tipo) {
    case "favorable":
      return "var(--shell-badge-exito-texto)";
    case "precaucion":
      return "var(--shell-badge-error-texto)";
    default:
      return "var(--shell-badge-violeta-texto)";
  }
}

export function PanelDetalleDia({
  dia,
  fechaNacimiento,
}: {
  dia: TransitosDia | null;
  fechaNacimiento?: string | null;
}) {
  if (!dia) {
    return (
      <aside
        className="flex min-h-[240px] flex-col justify-center px-4 py-5 lg:min-h-0 lg:border-l lg:px-5"
        style={{ borderColor: "var(--shell-borde)" }}
      >
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[color:var(--shell-texto-tenue)]">
          Día seleccionado
        </p>
        <h3 className="mt-2 text-lg font-semibold text-[color:var(--shell-texto)]">
          Elegí un día del mes
        </h3>
        <p className="mt-2 text-sm leading-6 text-[color:var(--shell-texto-secundario)]">
          El panel contextual muestra número personal, fase lunar y los hitos de tránsito
          más relevantes del día que marques.
        </p>
      </aside>
    );
  }

  const fecha = parseISO(dia.fecha);
  const ritmo = calcularRitmoPersonal(fechaNacimiento, fecha);
  const eventos = obtenerEventosClave(dia);
  const retrogradosActivos = obtenerRetrogradosActivos(dia.planetas);
  const planetasClave = obtenerPlanetasClave(dia);

  return (
    <aside
      className="flex flex-col lg:border-l"
      style={{ borderColor: "var(--shell-borde)" }}
    >
      <div className="border-b px-4 py-4 lg:px-5" style={{ borderColor: "var(--shell-borde)" }}>
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[color:var(--shell-texto-tenue)]">
          {isToday(fecha) ? "Hoy" : "Detalle del día"}
        </p>
        <h3 className="mt-1 text-lg font-semibold text-[color:var(--shell-texto)]">
          {format(fecha, "EEEE d 'de' MMMM", { locale: es })}
        </h3>
        <p className="mt-2 text-sm leading-6 text-[color:var(--shell-texto-secundario)]">
          {eventos[0]?.descripcion ?? describirFaseLunar(dia.fase_lunar)}
        </p>
      </div>

      <div className="border-b px-4 py-4 lg:px-5" style={{ borderColor: "var(--shell-borde)" }}>
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[color:var(--shell-texto-tenue)]">
          Ritmo personal
        </p>
        {ritmo ? (
          <>
            <div className="mt-3 flex items-end gap-5">
              <div>
                <p className="text-[28px] font-semibold leading-none text-[color:var(--shell-texto)]">
                  {ritmo.dia}
                </p>
                <p className="mt-2 text-[11px] uppercase tracking-[0.16em] text-[color:var(--shell-texto-tenue)]">
                  Día personal
                </p>
              </div>
              <div>
                <p className="text-[22px] font-semibold leading-none text-[color:var(--shell-texto)]">
                  {ritmo.anio}
                </p>
                <p className="mt-2 text-[11px] uppercase tracking-[0.16em] text-[color:var(--shell-texto-tenue)]">
                  Año personal
                </p>
              </div>
            </div>
            <p className="mt-3 text-sm leading-6 text-[color:var(--shell-texto-secundario)]">
              Día {ritmo.dia}: {ritmo.descripcionDia}. Año {ritmo.anio}: {ritmo.descripcionAnio}.
            </p>
          </>
        ) : (
          <p className="mt-3 text-sm leading-6 text-[color:var(--shell-texto-secundario)]">
            Completá tu perfil natal para activar año, mes y día personal dentro del calendario.
          </p>
        )}
      </div>

      <div className="border-b px-4 py-4 lg:px-5" style={{ borderColor: "var(--shell-borde)" }}>
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[color:var(--shell-texto-tenue)]">
          Momentos clave
        </p>
        <div className="mt-3 flex flex-col gap-3">
          {eventos.length > 0 ? (
            eventos.map((evento) => (
              <div key={evento.id} className="flex gap-3">
                <span
                  className="mt-1.5 h-2 w-2 rounded-full"
                  style={{ background: tonoTexto(evento.impacto) }}
                />
                <div className="min-w-0">
                  <p
                    className="text-sm font-medium"
                    style={{ color: tonoTexto(evento.impacto) }}
                  >
                    {evento.titulo}
                  </p>
                  <p className="mt-1 text-sm leading-6 text-[color:var(--shell-texto-secundario)]">
                    {evento.descripcion}
                  </p>
                </div>
              </div>
            ))
          ) : (
            <p className="text-sm leading-6 text-[color:var(--shell-texto-secundario)]">
              No hay cambios fuertes cargados para esta fecha. El foco está más en sostener el
              ritmo que en reaccionar a un hito puntual.
            </p>
          )}
        </div>
      </div>

      <div className="border-b px-4 py-4 lg:px-5" style={{ borderColor: "var(--shell-borde)" }}>
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[color:var(--shell-texto-tenue)]">
          Luna y movimiento
        </p>
        <p className="mt-3 text-sm leading-6 text-[color:var(--shell-texto-secundario)]">
          {dia.fase_lunar}. {describirFaseLunar(dia.fase_lunar)}
        </p>
        {retrogradosActivos.length > 0 ? (
          <p className="mt-3 text-sm leading-6 text-[color:var(--shell-texto-secundario)]">
            Retro activos: {retrogradosActivos.join(", ")}.
          </p>
        ) : (
          <p className="mt-3 text-sm leading-6 text-[color:var(--shell-texto-secundario)]">
            No hay retrogradaciones activas entre los planetas visibles del detalle.
          </p>
        )}
      </div>

      <div className="px-4 py-4 lg:px-5">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[color:var(--shell-texto-tenue)]">
          Planetas de referencia
        </p>
        <div className="mt-3 flex flex-col gap-3">
          {planetasClave.map((planeta) => (
            <div key={planeta.nombre} className="flex items-center gap-3">
              <IconoSigno
                signo={planeta.signo}
                tamaño={18}
                className="text-[color:var(--color-acento)]"
              />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-[color:var(--shell-texto)]">
                  {planeta.nombre}
                  {planeta.retrogrado ? (
                    <span className="ml-1 text-[color:var(--shell-badge-error-texto)]">R</span>
                  ) : null}
                </p>
                <p className="text-sm text-[color:var(--shell-texto-secundario)]">
                  {planeta.signo} · {planeta.grado_en_signo.toFixed(1)}°
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </aside>
  );
}
