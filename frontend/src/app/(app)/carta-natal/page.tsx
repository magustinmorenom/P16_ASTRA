"use client";

import { useCallback, useState } from "react";
import type { Dispatch, SetStateAction } from "react";
import {
  Group as PanelGroup,
  Panel,
  Separator as PanelResizeHandle,
} from "react-resizable-panels";
import HeaderMobile from "@/componentes/layouts/header-mobile";
import { IconoAstral } from "@/componentes/ui/icono-astral";
import { Icono } from "@/componentes/ui/icono";
import { Esqueleto } from "@/componentes/ui/esqueleto";
import { FormularioNacimiento } from "@/componentes/compuestos/formulario-nacimiento";
import RuedaZodiacal from "@/componentes/visualizaciones/rueda-zodiacal";
import {
  ETIQUETA_CARTA,
  SUPERFICIE_CLARA_CARTA,
  SUPERFICIE_OSCURA_CARTA,
} from "@/componentes/carta-natal/estilos";
import { usarCartaNatal, usarMisCalculos } from "@/lib/hooks";
import type { Aspecto, CartaNatal, Casa, DatosNacimiento, Planeta } from "@/lib/tipos";

import { AspectosNarrativo } from "@/componentes/carta-natal/aspectos-narrativo";
import { CasasGrid } from "@/componentes/carta-natal/casas-grid";
import { DistribucionEnergetica } from "@/componentes/carta-natal/distribucion-energetica";
import { HeroCarta } from "@/componentes/carta-natal/hero-carta";
import {
  PanelContextual,
  type SeleccionContextual,
} from "@/componentes/carta-natal/panel-contextual";
import { PlanetasNarrativo } from "@/componentes/carta-natal/planetas-narrativo";
import { SeccionTriada } from "@/componentes/carta-natal/seccion-triada";

const FONDO_PAGINA =
  "relative min-h-full overflow-hidden bg-[#F7F4FF]";

function CapasFondo() {
  return (
    <>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(179,136,255,0.18),transparent_24%),radial-gradient(circle_at_bottom_left,rgba(124,77,255,0.14),transparent_28%)]" />
      <div className="absolute right-0 top-0 h-72 w-72 rounded-full bg-violet-300/18 blur-3xl" />
      <div className="absolute left-0 top-1/3 h-64 w-64 rounded-full bg-fuchsia-200/18 blur-3xl" />
    </>
  );
}

function manejarSeleccion(
  setSeleccion: Dispatch<SetStateAction<SeleccionContextual>>,
  tipo: "planeta" | "aspecto" | "casa" | "triada",
  valor: Planeta | Aspecto | Casa | "sol" | "luna" | "ascendente",
) {
  if (tipo === "planeta") {
    setSeleccion({ tipo, planeta: valor as Planeta });
    return;
  }

  if (tipo === "aspecto") {
    setSeleccion({ tipo, aspecto: valor as Aspecto });
    return;
  }

  if (tipo === "casa") {
    setSeleccion({ tipo, casa: valor as Casa });
    return;
  }

  setSeleccion({ tipo, subtipo: valor as "sol" | "luna" | "ascendente" });
}

function ModalRuedaAstral({
  abierta,
  datos,
  onCerrar,
}: {
  abierta: boolean;
  datos: CartaNatal | null;
  onCerrar: () => void;
}) {
  if (!abierta || !datos) return null;

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-[#11091f]/72 px-4 backdrop-blur-md">
      <button
        type="button"
        aria-label="Cerrar rueda natal"
        onClick={onCerrar}
        className="absolute inset-0"
      />

      <div
        className="relative z-10 w-full max-w-[980px] overflow-hidden rounded-[32px] border border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(179,136,255,0.16),transparent_28%),linear-gradient(135deg,#170d2c_0%,#241148_54%,#34205f_100%)] shadow-[0_30px_100px_rgba(10,4,25,0.48)]"
        onClick={(evento) => evento.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 border-b border-white/10 px-5 py-4 lg:px-6">
          <div>
            <p className={`${ETIQUETA_CARTA} text-violet-200/70`}>
              Rueda natal
            </p>
            <h2 className="mt-2 text-[22px] font-semibold tracking-tight text-white">
              Mapa completo de la carta
            </h2>
            <p className="mt-1 text-[13px] text-violet-100/66">
              Vista de consulta del gráfico astral. Sin interacción directa.
            </p>
          </div>

          <button
            type="button"
            onClick={onCerrar}
            className="rounded-full border border-white/10 bg-white/[0.08] p-2 text-violet-100/75 transition-colors hover:bg-white/[0.14] hover:text-white"
          >
            <Icono nombre="x" tamaño={18} />
          </button>
        </div>

        <div className="max-h-[82vh] overflow-y-auto p-4 lg:p-6">
          <div className="rounded-[28px] border border-white/60 bg-white/90 p-4 shadow-[0_22px_60px_rgba(22,6,39,0.18)]">
            <RuedaZodiacal
              planetas={datos.planetas}
              casas={datos.casas}
              aspectos={datos.aspectos}
              claro
              className="mx-auto"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function PaginaCartaNatal() {
  const mutacion = usarCartaNatal();
  const { data: calculos, isLoading: cargandoCalculos } = usarMisCalculos();
  const [datosManual, setDatosManual] = useState<CartaNatal | null>(null);
  const [modoManual, setModoManual] = useState(false);
  const [modalRuedaAbierta, setModalRuedaAbierta] = useState(false);
  const [seleccion, setSeleccion] = useState<SeleccionContextual>({ tipo: "default" });

  const datos = datosManual ?? (calculos?.natal as CartaNatal | null) ?? null;

  function manejarCalculo(datosNacimiento: DatosNacimiento) {
    mutacion.mutate(
      { datos: datosNacimiento },
      {
        onSuccess: (resultado) => {
          setDatosManual(resultado);
          setModoManual(false);
          setSeleccion({ tipo: "default" });
        },
      },
    );
  }

  const reiniciarCalculo = useCallback(() => {
    setModoManual(true);
    setSeleccion({ tipo: "default" });
  }, []);

  const seleccionarPlaneta = useCallback((planeta: Planeta) => {
    manejarSeleccion(setSeleccion, "planeta", planeta);
  }, []);

  const seleccionarAspecto = useCallback((aspecto: Aspecto) => {
    manejarSeleccion(setSeleccion, "aspecto", aspecto);
  }, []);

  const seleccionarCasa = useCallback((casa: Casa) => {
    manejarSeleccion(setSeleccion, "casa", casa);
  }, []);

  const seleccionarTriada = useCallback(
    (subtipo: "sol" | "luna" | "ascendente") => {
      manejarSeleccion(setSeleccion, "triada", subtipo);
    },
    [],
  );

  const cerrarSeleccion = useCallback(() => {
    setSeleccion({ tipo: "default" });
  }, []);

  const abrirModalRueda = useCallback(() => {
    setModalRuedaAbierta(true);
  }, []);

  const cerrarModalRueda = useCallback(() => {
    setModalRuedaAbierta(false);
  }, []);

  if (cargandoCalculos && !modoManual) {
    return (
      <>
        <HeaderMobile titulo="Carta Astral" mostrarAtras />
        <div className={FONDO_PAGINA}>
          <CapasFondo />

          <section className="relative z-10 flex flex-col gap-6 p-5 lg:p-[28px_32px]">
            <div className={`${SUPERFICIE_OSCURA_CARTA} p-6 lg:p-8`}>
              <div className="absolute -right-14 top-8 h-36 w-36 rounded-full bg-[#B388FF]/18 blur-3xl" />
              <div className="relative z-10">
                <p className={`${ETIQUETA_CARTA} text-violet-200/75`}>Carta astral</p>
                <h1 className="mt-3 flex items-center gap-3 text-[26px] font-semibold tracking-tight text-white lg:text-[32px]">
                  <IconoAstral nombre="astrologia" tamaño={30} className="text-[#D4A234]" />
                  Carta Astral
                </h1>
                <p className="mt-3 max-w-3xl text-[14px] leading-relaxed text-violet-100/72">
                  Estamos preparando la lectura base de tu carta para mostrarla
                  con una jerarquía más sobria y útil.
                </p>
              </div>
            </div>

            <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
              <Esqueleto className="h-[460px] rounded-[28px]" />
              <div className="grid gap-4">
                <Esqueleto className="h-[200px] rounded-[24px]" />
                <Esqueleto className="h-[240px] rounded-[24px]" />
              </div>
            </div>

            <div className={`${SUPERFICIE_CLARA_CARTA} flex items-center justify-center gap-3 px-5 py-4`}>
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-[#7C4DFF] border-t-transparent" />
              <p className="text-[13px] text-[#6F6A65]">Cargando tu carta natal...</p>
            </div>
          </section>
        </div>
      </>
    );
  }

  if (!datos || modoManual) {
    return (
      <>
        <HeaderMobile titulo="Carta Astral" mostrarAtras />
        <div className={FONDO_PAGINA}>
          <CapasFondo />

          <section className="relative z-10 flex flex-col gap-6 p-5 lg:p-[28px_32px]">
            <div className={`${SUPERFICIE_OSCURA_CARTA} p-6 lg:p-8`}>
              <div className="absolute -right-16 top-0 h-44 w-44 rounded-full bg-[#B388FF]/18 blur-3xl" />
              <div className="absolute -left-10 bottom-0 h-36 w-36 rounded-full bg-[#7C4DFF]/16 blur-3xl" />

              <div className="relative z-10 grid gap-6 xl:grid-cols-[1.05fr_0.95fr] xl:items-start">
                <div>
                  <p className={`${ETIQUETA_CARTA} text-violet-200/75`}>
                    Lectura guiada
                  </p>
                  <h1 className="mt-3 flex items-center gap-3 text-[26px] font-semibold tracking-tight text-white lg:text-[32px]">
                    <IconoAstral nombre="astrologia" tamaño={30} className="text-[#D4A234]" />
                    Carta Astral
                  </h1>
                  <p className="mt-3 max-w-2xl text-[14px] leading-relaxed text-violet-100/72">
                    Calculá la carta completa y recorré primero la lectura esencial:
                    tríada, planetas, aspectos y casas. La rueda queda disponible
                    aparte como artefacto de consulta.
                  </p>

                  <div className="mt-5 grid gap-3 sm:grid-cols-2">
                    {[
                      {
                        titulo: "Lectura por capas",
                        descripcion: "Entrás por la síntesis y después profundizás sólo donde hace falta.",
                      },
                      {
                        titulo: "Rueda en modal",
                        descripcion: "El gráfico natal queda disponible bajo demanda, sin dominar toda la pantalla.",
                      },
                    ].map((item) => (
                      <div
                        key={item.titulo}
                        className="rounded-2xl border border-white/10 bg-white/[0.08] p-4 backdrop-blur-md"
                      >
                        <p className="text-sm font-semibold text-white">{item.titulo}</p>
                        <p className="mt-2 text-[13px] leading-relaxed text-violet-100/66">
                          {item.descripcion}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className={`${SUPERFICIE_CLARA_CARTA} p-4 lg:p-5`}>
                  <div className="rounded-[22px] border border-white/70 bg-white/92 p-5">
                    <p className={`${ETIQUETA_CARTA} text-[#7C4DFF]`}>
                      Datos de nacimiento
                    </p>
                    <p className="mt-2 text-sm leading-relaxed text-[#6F6A65]">
                      Ingresá tus datos para generar la carta completa y abrir la
                      lectura contextual de planetas, aspectos y casas.
                    </p>

                    <div className="mt-5">
                      <FormularioNacimiento
                        onSubmit={manejarCalculo}
                        cargando={mutacion.isPending}
                      />
                    </div>
                  </div>

                  {mutacion.isError && (
                    <div className="mt-4 rounded-2xl border border-red-200/70 bg-red-50/90 px-4 py-3">
                      <p className="text-[13px] text-red-600">
                        {mutacion.error?.message || "Error al calcular la carta natal."}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </section>
        </div>
      </>
    );
  }

  const sol = datos.planetas.find((planeta) => planeta.nombre === "Sol");
  const luna = datos.planetas.find((planeta) => planeta.nombre === "Luna");
  const planetaSeleccionadoNombre =
    seleccion.tipo === "planeta" ? seleccion.planeta.nombre : null;
  const haySeleccionMobile = seleccion.tipo !== "default";

  return (
    <>
      <HeaderMobile titulo="Carta Astral" mostrarAtras />
      <div className={FONDO_PAGINA}>
        <CapasFondo />

        <div className="relative z-10 h-full min-h-0 flex flex-col lg:flex-row lg:overflow-hidden">
          <div className="lg:hidden flex-1 overflow-y-auto scroll-sutil">
            <div className="p-5 pb-24">
              <HeroCarta
                datos={datos}
                onAbrirRueda={abrirModalRueda}
                onNuevoCalculo={reiniciarCalculo}
              />
              {sol && luna && (
                <SeccionTriada
                  sol={sol}
                  luna={luna}
                  ascendente={datos.ascendente}
                  onSeleccionar={seleccionarTriada}
                />
              )}
              <DistribucionEnergetica planetas={datos.planetas} />
              <PlanetasNarrativo
                planetas={datos.planetas}
                planetaSeleccionado={planetaSeleccionadoNombre}
                onSeleccionar={seleccionarPlaneta}
              />
              <AspectosNarrativo
                aspectos={datos.aspectos}
                onSeleccionar={seleccionarAspecto}
              />
              <CasasGrid casas={datos.casas} onSeleccionar={seleccionarCasa} />
            </div>
          </div>

          {haySeleccionMobile && (
            <>
              <button
                type="button"
                aria-label="Cerrar panel contextual"
                onClick={cerrarSeleccion}
                className="fixed inset-0 z-40 bg-[#140c27]/45 backdrop-blur-[2px] lg:hidden"
              />
              <div className="fixed inset-x-3 bottom-3 z-50 max-h-[72vh] overflow-hidden rounded-[28px] border border-white/12 bg-[radial-gradient(circle_at_top_right,rgba(212,162,52,0.12),transparent_24%),linear-gradient(135deg,#170d2c_0%,#241148_54%,#34205f_100%)] shadow-[0_28px_90px_rgba(15,8,34,0.42)] lg:hidden">
                <div className="flex justify-center py-2">
                  <div className="h-1 w-14 rounded-full bg-white/18" />
                </div>
                <div
                  className="max-h-[calc(72vh-20px)] overflow-y-auto scroll-sutil"
                  onClick={(evento) => evento.stopPropagation()}
                >
                  <PanelContextual
                    seleccion={seleccion}
                    datos={datos}
                    onCerrar={cerrarSeleccion}
                  />
                </div>
              </div>
            </>
          )}

          <div className="hidden lg:flex flex-1 min-h-0 p-5 lg:p-6">
            <div className="flex-1 min-h-0 overflow-hidden rounded-[32px] border border-white/60 bg-white/42 backdrop-blur-2xl shadow-[0_28px_90px_rgba(46,16,92,0.14)]">
              <PanelGroup orientation="horizontal" id="carta-natal-paneles">
                <Panel defaultSize={72} minSize={58}>
                  <section className="h-full overflow-y-auto scroll-sutil bg-transparent p-5 xl:p-6">
                    <div className="mx-auto max-w-[1120px]">
                      <HeroCarta
                        datos={datos}
                        onAbrirRueda={abrirModalRueda}
                        onNuevoCalculo={reiniciarCalculo}
                      />
                      {sol && luna && (
                        <SeccionTriada
                          sol={sol}
                          luna={luna}
                          ascendente={datos.ascendente}
                          onSeleccionar={seleccionarTriada}
                        />
                      )}
                      <DistribucionEnergetica planetas={datos.planetas} />
                      <PlanetasNarrativo
                        planetas={datos.planetas}
                        planetaSeleccionado={planetaSeleccionadoNombre}
                        onSeleccionar={seleccionarPlaneta}
                      />
                      <AspectosNarrativo
                        aspectos={datos.aspectos}
                        onSeleccionar={seleccionarAspecto}
                      />
                      <CasasGrid casas={datos.casas} onSeleccionar={seleccionarCasa} />
                    </div>
                  </section>
                </Panel>

                <PanelResizeHandle className="group flex w-2 cursor-col-resize items-center justify-center bg-white/10 transition-colors hover:bg-[#7C4DFF]/20">
                  <div className="h-10 w-0.5 rounded-full bg-white/30 transition-colors group-hover:bg-[#D4A234]" />
                </PanelResizeHandle>

                <Panel defaultSize={28} minSize={20} maxSize={34} collapsible>
                  <aside className="h-full overflow-hidden border-l border-white/10 bg-[radial-gradient(circle_at_top_right,rgba(212,162,52,0.12),transparent_24%),linear-gradient(135deg,#170d2c_0%,#241148_54%,#34205f_100%)]">
                    <PanelContextual
                      seleccion={seleccion}
                      datos={datos}
                      onCerrar={cerrarSeleccion}
                    />
                  </aside>
                </Panel>
              </PanelGroup>
            </div>
          </div>
        </div>

        <ModalRuedaAstral
          abierta={modalRuedaAbierta}
          datos={datos}
          onCerrar={cerrarModalRueda}
        />
      </div>
    </>
  );
}
