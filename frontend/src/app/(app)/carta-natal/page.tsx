"use client";

import { useCallback, useState } from "react";
import type { Dispatch, SetStateAction } from "react";
import HeaderMobile from "@/componentes/layouts/header-mobile";
import { RailLateral } from "@/componentes/layouts/rail-lateral";
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
  obtenerClavePanelContextual,
  PanelContextual,
  obtenerMetaPanelContextual,
  type SeleccionContextual,
} from "@/componentes/carta-natal/panel-contextual";
import { PlanetasNarrativo } from "@/componentes/carta-natal/planetas-narrativo";
import { SeccionTriada } from "@/componentes/carta-natal/seccion-triada";

const FONDO_PAGINA =
  "relative min-h-full lg:h-full lg:min-h-0 lg:overflow-hidden";
const ESTILO_FONDO_PAGINA = {
  background: "var(--shell-fondo)",
} as const;
const ESTILO_PANEL_INTERNO = {
  borderColor: "var(--shell-borde)",
  background: "var(--shell-superficie-suave)",
} as const;
const ESTILO_CHIP = {
  borderColor: "var(--shell-chip-borde)",
  background: "var(--shell-chip)",
  color: "var(--shell-texto-secundario)",
} as const;
const ESTILO_BOTON_CIERRE = {
  borderColor: "var(--shell-borde)",
  background: "var(--shell-superficie)",
  color: "var(--shell-texto-secundario)",
} as const;

type VistaExplorador = "planetas" | "aspectos" | "casas";

function CapasFondo() {
  return (
    <>
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(circle_at_top_left, var(--shell-glow-1), transparent 26%), radial-gradient(circle_at_top_right, var(--shell-glow-2), transparent 22%), radial-gradient(circle_at_bottom_left, var(--shell-glow-1), transparent 30%)",
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
    <div
      className="fixed inset-0 z-[120] flex items-center justify-center px-4 backdrop-blur-md"
      style={{ background: "var(--shell-overlay)" }}
    >
      <button
        type="button"
        aria-label="Cerrar rueda natal"
        onClick={onCerrar}
        className="absolute inset-0"
      />

      <div
        className="tema-superficie-panel relative z-10 w-full max-w-[980px] overflow-hidden rounded-[32px]"
        onClick={(evento) => evento.stopPropagation()}
      >
        <div
          className="flex items-center justify-between gap-4 border-b px-5 py-3 lg:px-6"
          style={{ borderColor: "var(--shell-borde)" }}
        >
          <div>
            <p className={`${ETIQUETA_CARTA} text-[color:var(--color-acento)]`}>
              Rueda natal
            </p>
            <h2 className="mt-1 text-[20px] font-semibold tracking-tight text-[color:var(--shell-texto)]">
              Mapa completo de la carta
            </h2>
          </div>

          <button
            type="button"
            onClick={onCerrar}
            className="rounded-full border p-2 transition-colors hover:text-[color:var(--shell-texto)]"
            style={ESTILO_BOTON_CIERRE}
          >
            <Icono nombre="x" tamaño={18} />
          </button>
        </div>

        <div className="p-3 lg:p-4">
          <div
            className="tema-superficie-panel-suave flex items-center justify-center rounded-[28px] p-3 lg:p-4"
            style={{ height: "80vh" }}
          >
          <RuedaZodiacal
            planetas={datos.planetas}
            casas={datos.casas}
            aspectos={datos.aspectos}
            className="mx-auto h-full w-auto max-w-full aspect-square"
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
  const [vistaExplorador, setVistaExplorador] = useState<VistaExplorador>("planetas");

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

  const seleccionarEnergia = useCallback(
    (valor: Extract<SeleccionContextual, { tipo: "energia" }>) => {
      setSeleccion(valor);
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
        <div className={FONDO_PAGINA} style={ESTILO_FONDO_PAGINA}>
          <CapasFondo />

          <section className="relative z-10 flex h-full flex-col gap-6 overflow-y-auto scroll-sutil p-5 lg:p-[28px_32px]">
            <div className={`${SUPERFICIE_OSCURA_CARTA} p-6 lg:p-8`}>
              <div
                className="absolute -right-14 top-8 h-36 w-36 rounded-full blur-3xl"
                style={{ background: "var(--shell-glow-2)" }}
              />
              <div className="relative z-10">
                <p className={`${ETIQUETA_CARTA} text-[color:var(--color-acento)]`}>Carta astral</p>
                <div className="mt-4 flex items-start gap-4">
                  <div className="hidden h-16 w-16 shrink-0 items-center justify-center rounded-[24px] bg-gradient-to-br from-[#7C4DFF] via-[#9C6DFF] to-[#B388FF] shadow-[0_18px_40px_rgba(34,12,72,0.45)] sm:flex">
                    <IconoAstral nombre="astrologia" tamaño={30} className="text-white" />
                  </div>
                  <div>
                    <h1 className="text-[26px] font-semibold tracking-tight text-[color:var(--shell-texto)] lg:text-[32px]">
                      Carta Astral
                    </h1>
                    <p className="mt-3 max-w-3xl text-[14px] leading-relaxed text-[color:var(--shell-texto-secundario)]">
                      Estamos preparando la lectura base de tu carta para mostrarla
                      con una jerarquía más sobria y útil.
                    </p>
                  </div>
                </div>
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
              <p className="text-[13px] text-[color:var(--shell-texto-secundario)]">Cargando tu carta natal...</p>
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
        <div className={FONDO_PAGINA} style={ESTILO_FONDO_PAGINA}>
          <CapasFondo />

          <section className="relative z-10 flex h-full flex-col gap-6 overflow-y-auto scroll-sutil p-5 lg:p-[28px_32px]">
            <div className={`${SUPERFICIE_OSCURA_CARTA} p-6 lg:p-8`}>
              <div
                className="absolute -right-16 top-0 h-44 w-44 rounded-full blur-3xl"
                style={{ background: "var(--shell-glow-2)" }}
              />
              <div
                className="absolute -left-10 bottom-0 h-36 w-36 rounded-full blur-3xl"
                style={{ background: "var(--shell-glow-1)" }}
              />

              <div className="relative z-10 grid gap-6 xl:grid-cols-[1.05fr_0.95fr] xl:items-start">
                <div>
                  <p className={`${ETIQUETA_CARTA} text-[color:var(--color-acento)]`}>
                    Lectura natal
                  </p>
                  <div className="mt-4 flex items-start gap-4">
                    <div className="hidden h-16 w-16 shrink-0 items-center justify-center rounded-[24px] bg-gradient-to-br from-[#7C4DFF] via-[#9C6DFF] to-[#B388FF] shadow-[0_18px_40px_rgba(34,12,72,0.45)] sm:flex">
                      <IconoAstral nombre="astrologia" tamaño={30} className="text-white" />
                    </div>
                    <div>
                      <h1 className="text-[24px] font-semibold tracking-tight text-[color:var(--shell-texto)] lg:text-[28px]">
                        Calculá tu carta
                      </h1>
                      <p className="mt-3 max-w-2xl text-[14px] leading-relaxed text-[color:var(--shell-texto-secundario)]">
                        Ingresá tus datos y abrí una lectura base compacta: tríada,
                        pulso, planetas, aspectos y casas; la rueda queda sólo como apoyo.
                      </p>
                    </div>
                  </div>

                  <div className="mt-5 flex flex-wrap gap-2">
                    {["Tríada", "Pulso", "Planetas", "Rueda a pedido"].map((item) => (
                      <span
                        key={item}
                        className="rounded-full border px-3 py-1.5 text-[11px] font-medium"
                        style={ESTILO_CHIP}
                      >
                        {item}
                      </span>
                    ))}
                  </div>
                </div>

                <div className={`${SUPERFICIE_CLARA_CARTA} p-4 lg:p-5`}>
                  <div className="rounded-[24px] border p-5" style={ESTILO_PANEL_INTERNO}>
                    <p className={`${ETIQUETA_CARTA} text-[color:var(--color-acento)]`}>
                      Datos de nacimiento
                    </p>
                    <p className="mt-2 text-sm leading-relaxed text-[color:var(--shell-texto-secundario)]">
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
  const seleccionEnergeticaActiva = seleccion.tipo === "energia" ? seleccion : null;
  const haySeleccionMobile = seleccion.tipo !== "default";
  const metaPanel = obtenerMetaPanelContextual(seleccion, datos);
  const vistasExplorador: { clave: VistaExplorador; etiqueta: string }[] = [
    { clave: "planetas", etiqueta: "Planetas" },
    { clave: "aspectos", etiqueta: "Aspectos" },
    { clave: "casas", etiqueta: "Casas" },
  ];

  const contenidoPrincipal = (
    <div className="relative min-h-full overflow-hidden" style={ESTILO_FONDO_PAGINA}>
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-80"
        style={{
          background:
            "radial-gradient(circle_at_top_left, var(--shell-glow-1), transparent 44%)",
        }}
      />
      <div
        className="pointer-events-none absolute right-[-120px] top-24 h-72 w-72 rounded-full blur-3xl"
        style={{ background: "var(--shell-glow-2)" }}
      />
      <div
        className="pointer-events-none absolute left-10 top-[640px] h-64 w-64 rounded-full blur-3xl"
        style={{ background: "var(--shell-glow-1)" }}
      />

      <div className="relative mx-auto flex max-w-5xl flex-col gap-5 px-5 py-6 pb-24 lg:px-7 lg:pb-6">
        <HeroCarta
          datos={datos}
          onAbrirRueda={abrirModalRueda}
        />

        <section className={`${SUPERFICIE_CLARA_CARTA} p-3.5 sm:p-4`}>
          <div className="grid gap-3 xl:grid-cols-[1.08fr_0.92fr]">
            {sol && luna ? (
              <SeccionTriada
                sol={sol}
                luna={luna}
                ascendente={datos.ascendente}
                onSeleccionar={seleccionarTriada}
              />
            ) : null}

            <DistribucionEnergetica
              planetas={datos.planetas}
              onSeleccionar={seleccionarEnergia}
              seleccionActiva={seleccionEnergeticaActiva}
            />
          </div>
        </section>

        <section className={`${SUPERFICIE_CLARA_CARTA} p-3.5 sm:p-4`}>
          <div
            className="inline-flex rounded-full border p-1"
            style={{
              borderColor: "var(--shell-borde)",
              background: "var(--shell-superficie-suave)",
            }}
          >
            {vistasExplorador.map((vista) => (
              <button
                key={vista.clave}
                type="button"
                onClick={() => setVistaExplorador(vista.clave)}
                className={`rounded-full px-3 py-1.5 text-[11px] font-medium transition-all ${
                  vistaExplorador === vista.clave
                    ? "bg-[var(--shell-chip-hover)] text-[color:var(--shell-texto)]"
                    : "text-[color:var(--shell-texto-secundario)] hover:text-[color:var(--shell-texto)]"
                }`}
              >
                {vista.etiqueta}
              </button>
            ))}
          </div>

          <div className="mt-3 overflow-hidden">
            {vistaExplorador === "planetas" && (
              <PlanetasNarrativo
                planetas={datos.planetas}
                planetaSeleccionado={planetaSeleccionadoNombre}
                onSeleccionar={seleccionarPlaneta}
              />
            )}

            {vistaExplorador === "aspectos" && (
              <AspectosNarrativo
                aspectos={datos.aspectos}
                onSeleccionar={seleccionarAspecto}
              />
            )}

            {vistaExplorador === "casas" && (
              <div className="p-3.5 sm:p-4">
                <CasasGrid casas={datos.casas} onSeleccionar={seleccionarCasa} />
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );

  return (
    <>
      <HeaderMobile titulo="Carta Astral" mostrarAtras />
      <div className={FONDO_PAGINA} style={ESTILO_FONDO_PAGINA}>
        <CapasFondo />

        <div className="relative z-10 flex min-h-full flex-col lg:h-full lg:min-h-0 lg:flex-row lg:overflow-hidden">
          <div className="lg:hidden flex-1 overflow-y-auto scroll-sutil">
            {contenidoPrincipal}
          </div>

          {haySeleccionMobile && (
            <>
              <button
                type="button"
                aria-label="Cerrar panel contextual"
                onClick={cerrarSeleccion}
                className="fixed inset-0 z-40 backdrop-blur-[2px] lg:hidden"
                style={{ background: "var(--shell-overlay-suave)" }}
              />
              <div className="tema-superficie-panel fixed inset-x-3 bottom-3 z-50 max-h-[72vh] overflow-hidden rounded-[28px] lg:hidden">
                <div className="flex justify-center py-2">
                  <div className="h-1 w-14 rounded-full" style={{ background: "var(--shell-borde-fuerte)" }} />
                </div>
                <div
                  className="max-h-[calc(72vh-20px)] overflow-y-auto scroll-sutil"
                  onClick={(evento) => evento.stopPropagation()}
                >
                  <PanelContextual
                    seleccion={seleccion}
                    datos={datos}
                    onCerrar={cerrarSeleccion}
                    modo="movil"
                  />
                </div>
              </div>
            </>
          )}

          <div className="hidden lg:flex flex-1 min-h-0">
            <section className="min-w-0 flex-1 overflow-y-auto scroll-sutil-dark">
              {contenidoPrincipal}
            </section>

            <RailLateral
              etiqueta={metaPanel.etiqueta}
              titulo={metaPanel.titulo}
              subtitulo={metaPanel.subtitulo}
              onCerrar={seleccion.tipo !== "default" ? cerrarSeleccion : undefined}
              cuerpoClassName="!p-0 overflow-hidden"
              claveContenido={obtenerClavePanelContextual(seleccion)}
            >
              <div className="h-full min-h-0">
                <PanelContextual
                  seleccion={seleccion}
                  datos={datos}
                  onCerrar={cerrarSeleccion}
                  modo="escritorio"
                />
              </div>
            </RailLateral>
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
