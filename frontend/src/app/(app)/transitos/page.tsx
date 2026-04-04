"use client";

import HeaderMobile from "@/componentes/layouts/header-mobile";
import { Boton } from "@/componentes/ui/boton";
import { Esqueleto } from "@/componentes/ui/esqueleto";
import { Icono } from "@/componentes/ui/icono";
import { IconoAstral, IconoSigno } from "@/componentes/ui/icono-astral";
import { usarTransitos } from "@/lib/hooks";
import { formatearFechaHora } from "@/lib/utilidades/formatear-fecha";

const SUPERFICIE_HERO =
  "tema-superficie-hero relative overflow-hidden rounded-[24px]";
const SUPERFICIE_PANEL =
  "tema-superficie-panel rounded-[24px]";

function obtenerEstiloVelocidad(velocidad: number) {
  if (velocidad < 0) {
    return { color: "var(--shell-badge-error-texto)" };
  }

  if (velocidad > 1) {
    return { color: "var(--shell-badge-violeta-texto)" };
  }

  return { color: "var(--shell-texto-tenue)" };
}

export default function PaginaTransitos() {
  const { data: datos, isLoading, isError, error, refetch } = usarTransitos();

  return (
    <>
      <HeaderMobile titulo="Tránsitos" mostrarAtras />

      <section
        className="relative min-h-full overflow-hidden"
        style={{ background: "var(--shell-fondo)" }}
      >
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(circle_at_top_left, var(--shell-glow-1), transparent 26%), radial-gradient(circle_at_top_right, var(--shell-glow-2), transparent 24%), radial-gradient(circle_at_bottom_left, var(--shell-glow-1), transparent 32%)",
          }}
        />
        <div
          className="absolute right-[-80px] top-0 h-72 w-72 rounded-full blur-3xl"
          style={{ background: "var(--shell-glow-2)" }}
        />
        <div
          className="absolute left-[-40px] top-1/3 h-64 w-64 rounded-full blur-3xl"
          style={{ background: "var(--shell-glow-1)" }}
        />

        <div className="relative z-10 mx-auto max-w-6xl px-4 py-5 lg:px-6 lg:py-6">
          <section className={`${SUPERFICIE_HERO} p-5 sm:p-6 lg:p-7`}>
            <div className="flex items-start gap-4">
              <div className="tema-gradiente-acento rounded-[22px] border border-shell-borde p-4 text-white shadow-[var(--shell-sombra-fuerte)]">
                <IconoAstral nombre="horoscopo" tamaño={24} className="text-white" />
              </div>

              <div className="min-w-0">
                <h1 className="tema-hero-titulo text-lg font-semibold tracking-tight sm:text-xl">
                  Tránsitos en vivo
                </h1>
                <p className="tema-hero-secundario mt-2 text-sm leading-6">
                  Posiciones actuales y velocidad de los astros
                </p>
                {datos ? (
                  <p className="tema-hero-tenue mt-3 text-sm leading-6">
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
                  <p className="text-base font-semibold text-[color:var(--shell-texto)]">
                    No pudimos cargar los tránsitos
                  </p>
                  <p className="mt-2 text-sm leading-6 text-[color:var(--shell-texto-secundario)]">
                    {error?.message || "Intentá nuevamente en unos segundos."}
                  </p>
                </div>

                <Boton
                  variante="fantasma"
                  onClick={() => refetch()}
                  icono={<Icono nombre="flecha" tamaño={16} />}
                  className="rounded-full border bg-transparent px-4"
                  style={{
                    borderColor: "var(--shell-borde)",
                    color: "var(--shell-texto-secundario)",
                  }}
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
                      className="rounded-[20px] border p-4"
                      style={{
                        borderColor: "var(--shell-borde)",
                        background: "var(--shell-superficie)",
                      }}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-base font-semibold text-[color:var(--shell-texto)]">
                            {planeta.nombre}
                          </p>
                          <div className="mt-2 flex items-center gap-2 text-sm text-[color:var(--shell-texto-secundario)]">
                            <IconoSigno
                              signo={planeta.signo}
                              tamaño={18}
                              className="text-shell-badge-acento"
                            />
                            <span>{planeta.signo}</span>
                          </div>
                        </div>

                        <div className="text-right">
                          <p className="text-sm font-medium text-[color:var(--shell-texto)]">
                            {gradoEntero}°{minutos.toString().padStart(2, "0")}&apos;
                          </p>
                          <p className="mt-2 text-xs" style={obtenerEstiloVelocidad(planeta.velocidad)}>
                            {planeta.velocidad >= 0 ? "+" : ""}
                            {planeta.velocidad.toFixed(4)}°/día
                          </p>
                        </div>
                      </div>

                      <div
                        className="mt-4 flex items-center gap-1.5 border-t pt-3 text-xs text-[color:var(--shell-texto-tenue)]"
                        style={{ borderColor: "var(--shell-borde)" }}
                      >
                        {planeta.retrogrado ? (
                          <>
                            <Icono nombre="flechaIzquierda" tamaño={12} className="text-[color:var(--shell-badge-error-texto)]" />
                            <span className="text-[color:var(--shell-badge-error-texto)]">Retro</span>
                          </>
                        ) : (
                          <>
                            <Icono nombre="flecha" tamaño={12} />
                            <span>Directo</span>
                          </>
                        )}
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
