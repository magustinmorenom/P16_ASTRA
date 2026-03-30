"use client";

import { useState, useCallback } from "react";
import { Panel, Group as PanelGroup, Separator as PanelResizeHandle } from "react-resizable-panels";
import HeaderMobile from "@/componentes/layouts/header-mobile";
import { IconoAstral } from "@/componentes/ui/icono-astral";
import { Tarjeta } from "@/componentes/ui/tarjeta";
import { FormularioNacimiento } from "@/componentes/compuestos/formulario-nacimiento";
import { usarCartaNatal, usarMisCalculos } from "@/lib/hooks";
import type { DatosNacimiento, CartaNatal, Planeta, Aspecto, Casa } from "@/lib/tipos";

import { HeroCarta } from "@/componentes/carta-natal/hero-carta";
import { SeccionTriada } from "@/componentes/carta-natal/seccion-triada";
import { DistribucionEnergetica } from "@/componentes/carta-natal/distribucion-energetica";
import { PlanetasNarrativo } from "@/componentes/carta-natal/planetas-narrativo";
import { AspectosNarrativo } from "@/componentes/carta-natal/aspectos-narrativo";
import { CasasGrid } from "@/componentes/carta-natal/casas-grid";
import { PanelContextual, type SeleccionContextual } from "@/componentes/carta-natal/panel-contextual";

// ---------------------------------------------------------------------------
// Componente principal
// ---------------------------------------------------------------------------

export default function PaginaCartaNatal() {
  const mutacion = usarCartaNatal();
  const { data: calculos, isLoading: cargandoCalculos } = usarMisCalculos();
  const [datosManual, setDatosManual] = useState<CartaNatal | null>(null);
  const [modoManual, setModoManual] = useState(false);
  const [seleccion, setSeleccion] = useState<SeleccionContextual>({ tipo: "default" });

  const datos = datosManual ?? (calculos?.natal as CartaNatal | null) ?? null;

  function manejarCalculo(datosNacimiento: DatosNacimiento) {
    mutacion.mutate({ datos: datosNacimiento }, {
      onSuccess: (resultado) => {
        setDatosManual(resultado);
        setSeleccion({ tipo: "default" });
      },
    });
  }

  const seleccionarPlaneta = useCallback((p: Planeta) => {
    setSeleccion({ tipo: "planeta", planeta: p });
  }, []);

  const seleccionarAspecto = useCallback((a: Aspecto) => {
    setSeleccion({ tipo: "aspecto", aspecto: a });
  }, []);

  const seleccionarCasa = useCallback((c: Casa) => {
    setSeleccion({ tipo: "casa", casa: c });
  }, []);

  const seleccionarTriada = useCallback((subtipo: "sol" | "luna" | "ascendente") => {
    setSeleccion({ tipo: "triada", subtipo });
  }, []);

  const cerrarSeleccion = useCallback(() => {
    setSeleccion({ tipo: "default" });
  }, []);

  // --- Estado de carga ---
  if (cargandoCalculos && !modoManual) {
    return (
      <>
      <HeaderMobile titulo="Carta Astral" mostrarAtras />
      <div className="flex items-center justify-center h-full">
        <div className="text-center space-y-4">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#7C4DFF] border-t-transparent mx-auto" />
          <p className="text-[#8A8580]">Cargando tu carta natal...</p>
        </div>
      </div>
      </>
    );
  }

  // --- Sin datos: formulario ---
  if (!datos || modoManual) {
    return (
      <>
      <HeaderMobile titulo="Carta Astral" mostrarAtras />
      <div className="max-w-2xl mx-auto p-6">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-[#2C2926] flex items-center gap-3">
            <IconoAstral nombre="astrologia" tamaño={28} className="text-[#7C4DFF]" />
            Carta Natal
          </h1>
          <p className="mt-2 text-sm text-[#8A8580]">
            Ingresá los datos de nacimiento para calcular la carta natal completa.
          </p>
        </div>

        <Tarjeta padding="lg">
          <FormularioNacimiento
            onSubmit={manejarCalculo}
            cargando={mutacion.isPending}
          />
        </Tarjeta>

        {mutacion.isError && (
          <div className="mt-4 rounded-xl bg-red-50 border border-red-200 px-4 py-3">
            <p className="text-sm text-red-600">
              {mutacion.error?.message || "Error al calcular la carta natal."}
            </p>
          </div>
        )}
      </div>
      </>
    );
  }

  // --- Encontrar Sol y Luna para tríada ---
  const sol = datos.planetas.find((p) => p.nombre === "Sol");
  const luna = datos.planetas.find((p) => p.nombre === "Luna");

  const planetaSeleccionadoNombre =
    seleccion.tipo === "planeta" ? seleccion.planeta.nombre : null;

  // --- Vista con resultados ---
  return (
    <>
    <HeaderMobile titulo="Carta Astral" mostrarAtras />
    {/* Desktop: Paneles resizables / Mobile: solo scroll */}
    <div className="h-full min-h-0 flex flex-col lg:flex-row lg:overflow-hidden">
      {/* Mobile: scroll simple sin panel derecho */}
      <div className="lg:hidden flex-1 overflow-y-auto scroll-sutil bg-[#FAFAFA]">
        <div className="p-5 pb-24">
          <HeroCarta datos={datos} onPlanetaClick={seleccionarPlaneta} />
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
          <AspectosNarrativo aspectos={datos.aspectos} onSeleccionar={seleccionarAspecto} />
          <CasasGrid casas={datos.casas} onSeleccionar={seleccionarCasa} />
        </div>
      </div>

      {/* Desktop: layout con paneles resizables */}
      <div className="hidden lg:flex flex-1 min-h-0">
        <PanelGroup
          orientation="horizontal"
          id="carta-natal-paneles"
        >
          {/* Panel Central — Scroll narrativo */}
          <Panel defaultSize="70%" minSize="55%">
            <section className="h-full overflow-y-auto scroll-sutil bg-[#FAFAFA] p-7">
              <HeroCarta datos={datos} onPlanetaClick={seleccionarPlaneta} />
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
              <AspectosNarrativo aspectos={datos.aspectos} onSeleccionar={seleccionarAspecto} />
              <CasasGrid casas={datos.casas} onSeleccionar={seleccionarCasa} />
            </section>
          </Panel>

          {/* Handle arrastrable */}
          <PanelResizeHandle className="w-1.5 bg-[#E8E4E0]/40 hover:bg-[#7C4DFF]/30 transition-colors cursor-col-resize flex items-center justify-center group">
            <div className="w-0.5 h-8 bg-[#B3ADA7] rounded-full group-hover:bg-[#7C4DFF] transition-colors" />
          </PanelResizeHandle>

          {/* Panel Derecho — Contextual */}
          <Panel defaultSize="30%" minSize="20%" maxSize="40%" collapsible>
            <aside className="h-full bg-white border-l border-[#E8E4E0]/40 overflow-hidden">
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
    </>
  );
}
