"use client";

import HeaderMobile from "@/componentes/layouts/header-mobile";
import { Boton } from "@/componentes/ui/boton";
import { Esqueleto } from "@/componentes/ui/esqueleto";
import { Icono } from "@/componentes/ui/icono";
import { IconoAstral, IconoSigno } from "@/componentes/ui/icono-astral";
import { usarTransitos } from "@/lib/hooks";
import { formatearFechaHora } from "@/lib/utilidades/formatear-fecha";

const SUPERFICIE_HERO =
  "relative overflow-hidden rounded-[24px] border border-white/[0.08] bg-[radial-gradient(circle_at_top_left,rgba(179,136,255,0.2),transparent_32%),linear-gradient(135deg,rgba(45,27,105,0.96),rgba(22,1,27,0.98))] shadow-[0_24px_70px_rgba(8,2,22,0.38)]";
const SUPERFICIE_PANEL =
  "rounded-[24px] border border-white/[0.08] bg-[linear-gradient(180deg,rgba(255,255,255,0.08),rgba(255,255,255,0.03))] shadow-[0_18px_40px_rgba(8,3,20,0.22)] backdrop-blur-xl";

function obtenerColorVelocidad(velocidad: number) {
  if (velocidad < 0) return "text-rose-200";
  if (velocidad > 1) return "text-[#D8C0FF]";
  return "text-white/62";
}

export default function PaginaTransitos() {
  const { data: datos, isLoading, isError, error, refetch } = usarTransitos();

  return (
    <>
      <HeaderMobile titulo="Tránsitos" mostrarAtras />

      <section className="relative min-h-full overflow-hidden bg-[#16011B] text-white">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(124,77,255,0.22),transparent_26%),radial-gradient(circle_at_top_right,rgba(179,136,255,0.14),transparent_24%),radial-gradient(circle_at_bottom_left,rgba(76,35,140,0.16),transparent_32%)]" />
        <div className="absolute right-[-80px] top-0 h-72 w-72 rounded-full bg-[#B388FF]/14 blur-3xl" />
        <div className="absolute left-[-40px] top-1/3 h-64 w-64 rounded-full bg-[#7C4DFF]/12 blur-3xl" />

        <div className="relative z-10 mx-auto max-w-6xl px-4 py-5 lg:px-6 lg:py-6">
          <section className={`${SUPERFICIE_HERO} p-5 sm:p-6 lg:p-7`}>
            <div className="flex items-start gap-4">
              <div className="rounded-[22px] border border-white/10 bg-[linear-gradient(135deg,rgba(124,77,255,0.92),rgba(179,136,255,0.72))] p-4 text-white shadow-[0_16px_34px_rgba(34,10,76,0.34)]">
                <IconoAstral nombre="horoscopo" tamaño={24} className="text-white" />
              </div>

              <div className="min-w-0">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-violet-200/72">
                  Tránsitos en vivo
                </p>
                <h1 className="mt-2 text-lg font-semibold tracking-tight text-white sm:text-xl">
                  Posiciones actuales y velocidad de los astros
                </h1>
                <p className="mt-2 text-sm leading-6 text-white/62">
                  Lectura compacta del cielo del momento, sin badges ni ruido extra.
                </p>
                {datos ? (
                  <p className="mt-3 text-sm leading-6 text-white/52">
                    Actualizado {formatearFechaHora(datos.fecha_utc)}
                  </p>
                ) : null}
              </div>
            </div>
          </section>

          {isLoading ? (
            <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {Array.from({ length: 9 }).map((_, indice) => (
                <Esqueleto key={indice} className="h-36 rounded-[24px]" />
              ))}
            </div>
          ) : null}

          {isError ? (
            <section className={`${SUPERFICIE_PANEL} mt-6 p-5`}>
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-base font-semibold text-white">
                    No pudimos cargar los tránsitos
                  </p>
                  <p className="mt-2 text-sm leading-6 text-white/58">
                    {error?.message || "Intentá nuevamente en unos segundos."}
                  </p>
                </div>

                <Boton
                  variante="fantasma"
                  onClick={() => refetch()}
                  icono={<Icono nombre="flecha" tamaño={16} />}
                  className="rounded-full border border-white/10 bg-transparent px-4 text-white/72 hover:bg-white/[0.06] hover:text-white"
                >
                  Reintentar
                </Boton>
              </div>
            </section>
          ) : null}

          {datos ? (
            <section className={`${SUPERFICIE_PANEL} mt-6 p-4 sm:p-5`}>
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {datos.planetas.map((planeta) => {
                  const gradoEntero = Math.floor(planeta.grado_en_signo);
                  const minutos = Math.floor((planeta.grado_en_signo - gradoEntero) * 60);

                  return (
                    <article
                      key={planeta.nombre}
                      className="rounded-[20px] border border-white/[0.08] bg-white/[0.04] p-4"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-base font-semibold text-white">
                            {planeta.nombre}
                          </p>
                          <div className="mt-2 flex items-center gap-2 text-sm text-white/66">
                            <IconoSigno
                              signo={planeta.signo}
                              tamaño={18}
                              className="text-[#D8C0FF]"
                            />
                            <span>{planeta.signo}</span>
                          </div>
                        </div>

                        <div className="text-right">
                          <p className="text-sm font-medium text-white">
                            {gradoEntero}°{minutos.toString().padStart(2, "0")}&apos;
                          </p>
                          <p className={`mt-2 text-xs ${obtenerColorVelocidad(planeta.velocidad)}`}>
                            {planeta.velocidad >= 0 ? "+" : ""}
                            {planeta.velocidad.toFixed(4)}°/día
                          </p>
                        </div>
                      </div>

                      <div className="mt-4 border-t border-white/[0.08] pt-3 text-xs uppercase tracking-[0.16em] text-white/44">
                        {planeta.retrogrado ? "Retrógrado" : "Movimiento directo"}
                      </div>
                    </article>
                  );
                })}
              </div>
            </section>
          ) : null}
        </div>
      </section>
    </>
  );
}
