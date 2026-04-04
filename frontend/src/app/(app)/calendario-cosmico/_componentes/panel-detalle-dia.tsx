"use client";

import { format, isToday, parseISO } from "date-fns";
import { es } from "date-fns/locale";

import { Icono } from "@/componentes/ui/icono";
import { IconoFaseLunar } from "@/componentes/ui/icono-fase-lunar";
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
        className="flex min-h-[240px] flex-col items-center justify-center px-4 py-8 text-center lg:min-h-0 lg:border-l lg:px-5"
        style={{ borderColor: "var(--shell-borde)" }}
      >
        <Icono nombre="calendario" tamaño={28} className="mb-3 text-[color:var(--shell-texto-tenue)]" />
        <p className="text-sm font-medium text-[color:var(--shell-texto)]">
          Elegí un día del mes
        </p>
        <p className="mt-1 text-xs text-[color:var(--shell-texto-secundario)]">
          Vas a ver número personal, fase lunar y eventos del día
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
      {/* Fecha + descripción */}
      <div className="border-b px-4 py-4 lg:px-5" style={{ borderColor: "var(--shell-borde)" }}>
        <h3 className="text-lg font-semibold capitalize text-[color:var(--shell-texto)]">
          {isToday(fecha) ? "Hoy" : format(fecha, "EEEE d", { locale: es })}
          <span className="ml-1 text-[color:var(--shell-texto-secundario)] font-normal text-sm">
            {format(fecha, "MMMM", { locale: es })}
          </span>
        </h3>
        <p className="mt-2 text-sm leading-6 text-[color:var(--shell-texto-secundario)]">
          {eventos[0]?.descripcion ?? describirFaseLunar(dia.fase_lunar)}
        </p>
      </div>

      {/* Ritmo personal — inline */}
      <div className="border-b px-4 py-4 lg:px-5" style={{ borderColor: "var(--shell-borde)" }}>
        {ritmo ? (
          <>
            <div className="flex items-baseline gap-6">
              <div className="flex items-baseline gap-2">
                <Icono nombre="calendario" tamaño={14} className="text-[color:var(--color-acento)]" />
                <span className="text-xs text-[color:var(--shell-texto-secundario)]">Día</span>
                <span className="text-[22px] font-bold text-[color:var(--shell-texto)]">{ritmo.dia}</span>
              </div>
              <div className="flex items-baseline gap-2">
                <Icono nombre="reloj" tamaño={14} className="text-[color:var(--color-acento)]" />
                <span className="text-xs text-[color:var(--shell-texto-secundario)]">Año</span>
                <span className="text-[18px] font-semibold text-[color:var(--shell-texto)]">{ritmo.anio}</span>
              </div>
            </div>
            <p className="mt-2 text-[12px] leading-5 text-[color:var(--shell-texto-secundario)]">
              {ritmo.descripcionDia}
            </p>
          </>
        ) : (
          <p className="text-sm text-[color:var(--shell-texto-secundario)]">
            Completá tu perfil natal para activar el ritmo personal.
          </p>
        )}
      </div>

      {/* Eventos */}
      {eventos.length > 0 && (
        <div className="border-b px-4 py-4 lg:px-5" style={{ borderColor: "var(--shell-borde)" }}>
          <div className="flex flex-col gap-3">
            {eventos.map((evento) => (
              <div key={evento.id} className="flex gap-3">
                <span
                  className="mt-1.5 h-2 w-2 shrink-0 rounded-full"
                  style={{ background: tonoTexto(evento.impacto) }}
                />
                <div className="min-w-0">
                  <p className="text-sm font-medium" style={{ color: tonoTexto(evento.impacto) }}>
                    {evento.titulo}
                  </p>
                  <p className="mt-0.5 text-[12px] leading-5 text-[color:var(--shell-texto-secundario)]">
                    {evento.descripcion}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Luna + retro — compacto */}
      <div className="border-b px-4 py-4 lg:px-5" style={{ borderColor: "var(--shell-borde)" }}>
        <div className="flex items-center gap-2.5">
          <IconoFaseLunar fase={dia.fase_lunar} tamaño={20} className="text-[color:var(--color-acento)]" />
          <span className="text-sm font-medium text-[color:var(--shell-texto)]">{dia.fase_lunar}</span>
        </div>
        <p className="mt-1.5 text-[12px] leading-5 text-[color:var(--shell-texto-secundario)]">
          {describirFaseLunar(dia.fase_lunar)}
        </p>
        {retrogradosActivos.length > 0 && (
          <p className="mt-2 flex items-center gap-1.5 text-[12px] text-[color:var(--shell-texto-secundario)]">
            <Icono nombre="flechaIzquierda" tamaño={12} className="text-[color:var(--shell-badge-error-texto)]" />
            Retro: {retrogradosActivos.join(", ")}
          </p>
        )}
      </div>

      {/* Planetas */}
      <div className="px-4 py-4 lg:px-5">
        <div className="flex flex-col gap-2.5">
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
                  {planeta.retrogrado && (
                    <span className="ml-1 text-[color:var(--shell-badge-error-texto)]">R</span>
                  )}
                </p>
                <p className="text-xs text-[color:var(--shell-texto-secundario)]">
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
