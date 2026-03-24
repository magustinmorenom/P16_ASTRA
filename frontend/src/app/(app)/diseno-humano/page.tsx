"use client";

import { useState } from "react";
import { Icono } from "@/componentes/ui/icono";
import { IconoAstral } from "@/componentes/ui/icono-astral";
import { Boton } from "@/componentes/ui/boton";
import { Esqueleto } from "@/componentes/ui/esqueleto";
import { FormularioNacimiento } from "@/componentes/compuestos/formulario-nacimiento";
import BodyGraph from "@/componentes/visualizaciones/body-graph";
import { usarDisenoHumano, usarMisCalculos, usarMiPerfil } from "@/lib/hooks";
import { cn } from "@/lib/utilidades/cn";
import type { DatosNacimiento, DisenoHumano } from "@/lib/tipos";
import HeaderMobile from "@/componentes/layouts/header-mobile";

// ---------------------------------------------------------------------------
// Mapeo de claves de centros a nombres legibles
// ---------------------------------------------------------------------------

const MAPA_CENTROS: Record<string, string> = {
  cabeza: "Cabeza",
  ajna: "Ajna",
  garganta: "Garganta",
  g: "G (Identidad)",
  identidad: "G (Identidad)",
  corazon: "Corazón (Ego)",
  ego: "Corazón (Ego)",
  sacral: "Sacral",
  plexo_solar: "Plexo Solar",
  "plexo solar": "Plexo Solar",
  emocional: "Plexo Solar",
  bazo: "Bazo",
  esplenico: "Bazo",
  raiz: "Raíz",
};

function nombreCentroLegible(clave: string): string {
  return MAPA_CENTROS[clave.toLowerCase()] || clave;
}

// ---------------------------------------------------------------------------
// Componente principal
// ---------------------------------------------------------------------------

export default function PaginaDisenoHumano() {
  const mutacion = usarDisenoHumano();
  const { data: calculos, isLoading: cargandoCalculos } = usarMisCalculos();
  const { data: perfil } = usarMiPerfil();
  const [datosManual, setDatosManual] = useState<DisenoHumano | null>(null);
  const [modoManual, setModoManual] = useState(false);

  // Datos a mostrar: manual (si recalculó) o desde DB
  const datos =
    datosManual ?? (calculos?.diseno_humano as DisenoHumano | null) ?? null;
  const nombrePersona = perfil?.nombre ?? "";

  function manejarCalculo(datosNacimiento: DatosNacimiento) {
    mutacion.mutate(
      { datos: datosNacimiento },
      { onSuccess: setDatosManual },
    );
  }

  // -------------------------------------------------------------------------
  // Estado: cargando
  // -------------------------------------------------------------------------
  if (cargandoCalculos && !modoManual) {
    return (
      <><HeaderMobile titulo="Diseno Humano" mostrarAtras />
      <div className="flex flex-col lg:flex-row h-full min-h-0 lg:overflow-hidden">
        <section className="flex-1 scroll-sutil bg-[#FAFAFA] p-5 lg:p-[28px_32px] flex flex-col gap-6 overflow-y-auto">
          <h1 className="text-[22px] font-semibold text-[#2C2926] tracking-tight flex items-center gap-3">
            <IconoAstral
              nombre="personal"
              tamaño={28}
              className="text-acento"
            />
            Diseño Humano
          </h1>
          <Esqueleto className="h-[140px] w-full rounded-[20px]" />
          <Esqueleto className="h-[300px] w-full rounded-xl" />
          <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
            {Array.from({ length: 9 }).map((_, i) => (
              <Esqueleto key={i} className="h-[60px] rounded-xl" />
            ))}
          </div>
          <div className="flex items-center justify-center gap-3 pt-4">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-[#7C4DFF] border-t-transparent" />
            <p className="text-[13px] text-[#8A8580]">
              Cargando tu Diseño Humano…
            </p>
          </div>
        </section>
      </div>
      </>
    );
  }

  // -------------------------------------------------------------------------
  // Estado: formulario (sin datos)
  // -------------------------------------------------------------------------
  if (!datos || modoManual) {
    return (
      <><HeaderMobile titulo="Diseno Humano" mostrarAtras />
      <div className="flex flex-col lg:flex-row h-full min-h-0 lg:overflow-hidden">
        <section className="flex-1 scroll-sutil bg-[#FAFAFA] p-5 lg:p-[28px_32px] flex flex-col gap-6 overflow-y-auto">
          <div>
            <h1 className="text-[22px] font-semibold text-[#2C2926] tracking-tight flex items-center gap-3">
              <IconoAstral
                nombre="personal"
                tamaño={28}
                className="text-acento"
              />
              Diseño Humano
            </h1>
            <p className="mt-2 text-[13px] text-[#8A8580]">
              Calculá tu Body Graph completo con tipo, autoridad, perfil,
              centros, canales y activaciones.
            </p>
          </div>

          <div className="max-w-lg">
            <div className="rounded-2xl bg-white border border-[#E8E4E0] p-6">
              <FormularioNacimiento
                onSubmit={manejarCalculo}
                cargando={mutacion.isPending}
              />
            </div>

            {mutacion.isError && (
              <div className="mt-4 rounded-xl bg-red-50 border border-red-200/50 px-4 py-3">
                <p className="text-[13px] text-red-600">
                  {mutacion.error?.message ||
                    "Error al calcular el Diseño Humano."}
                </p>
              </div>
            )}
          </div>
        </section>
      </div>
      </>
    );
  }

  // -------------------------------------------------------------------------
  // Estado: resultados
  // -------------------------------------------------------------------------
  const centrosEntries = Object.entries(datos.centros);

  // Atributos principales para el hero
  const atributos = [
    { etiqueta: "Tipo", valor: datos.tipo },
    { etiqueta: "Autoridad", valor: datos.autoridad },
    { etiqueta: "Perfil", valor: datos.perfil },
    { etiqueta: "Definición", valor: datos.definicion },
  ];

  // Cruz de Encarnación
  const cruzItems = [
    { etiqueta: "Sol Consc.", valor: datos.cruz_encarnacion?.sol_consciente },
    {
      etiqueta: "Tierra Consc.",
      valor: datos.cruz_encarnacion?.tierra_consciente,
    },
    {
      etiqueta: "Sol Inconsc.",
      valor: datos.cruz_encarnacion?.sol_inconsciente,
    },
    {
      etiqueta: "Tierra Inconsc.",
      valor: datos.cruz_encarnacion?.tierra_inconsciente,
    },
  ];

  return (
    <><HeaderMobile titulo="Diseno Humano" mostrarAtras />
    <div className="flex flex-col lg:flex-row h-full min-h-0 lg:overflow-hidden">
      {/* ----------------------------------------------------------------- */}
      {/* Panel Central                                                      */}
      {/* ----------------------------------------------------------------- */}
      <section className="flex-1 scroll-sutil bg-[#FAFAFA] p-5 lg:p-[28px_32px] flex flex-col gap-6 overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-[22px] font-semibold text-[#2C2926] tracking-tight flex items-center gap-3">
            <IconoAstral
              nombre="personal"
              tamaño={28}
              className="text-acento"
            />
            Diseño Humano
          </h1>
          <button
            onClick={() => {
              setModoManual(true);
              setDatosManual(null);
            }}
            className="flex items-center gap-2 text-[13px] text-[#8A8580] hover:text-[#7C4DFF] transition-colors"
          >
            <Icono nombre="flechaIzquierda" tamaño={16} />
            <span className="hidden sm:inline">Nuevo cálculo</span>
          </button>
        </div>

        {/* Hero gradient card — Tipo, Autoridad, Perfil, Definición */}
        <div className="rounded-[20px] bg-gradient-to-b from-[#2D1B69] via-[#4A2D8C] to-[#7C4DFF] p-5">
          <p className="text-violet-300 text-[11px] font-semibold tracking-widest uppercase mb-3">
            {nombrePersona ? `Diseño Humano de ${nombrePersona}` : "Tu Diseño Humano"}
          </p>
          <div className="flex flex-wrap gap-2">
            {atributos.map((attr) => (
              <div
                key={attr.etiqueta}
                className="flex items-center gap-2 rounded-xl bg-white/[0.08] px-3 py-2"
              >
                <div className="flex flex-col">
                  <span className="text-[10px] text-[#B388FF] leading-tight">
                    {attr.etiqueta}
                  </span>
                  <span className="text-[14px] font-bold text-white leading-tight">
                    {attr.valor}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Cruz de Encarnación */}
        <div className="rounded-xl bg-white border border-[#E8E4E0] p-4">
          <div className="flex items-center gap-2 mb-3">
            <IconoAstral
              nombre="astrologia"
              tamaño={20}
              className="text-[#7C4DFF]"
            />
            <h2 className="text-[15px] font-semibold text-[#2C2926]">
              Cruz de Encarnación
            </h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {cruzItems.map((item) => (
              <div key={item.etiqueta} className="text-center">
                <p className="text-[10px] text-[#8A8580] uppercase tracking-wider">
                  {item.etiqueta}
                </p>
                <p className="text-xl font-bold text-[#2C2926] mt-0.5">
                  {item.valor ?? "—"}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Body Graph */}
        <div className="rounded-xl bg-white border border-[#E8E4E0] p-5">
          <BodyGraph datos={datos} />
        </div>

        {/* Centros */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <IconoAstral
              nombre="salud"
              tamaño={20}
              className="text-[#7C4DFF]"
            />
            <h2 className="text-lg font-bold text-[#2C2926]">Centros</h2>
          </div>
          <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
            {centrosEntries.map(([clave, estado]) => {
              const definido = estado === "definido";
              return (
                <div
                  key={clave}
                  className={cn(
                    "rounded-xl p-3 text-center border transition-colors",
                    definido
                      ? "bg-[#F5F0FF] border-[#B388FF]/30"
                      : "bg-white border-[#E8E4E0]",
                  )}
                >
                  <p className="text-[12px] font-medium text-[#2C2926]">
                    {nombreCentroLegible(clave)}
                  </p>
                  <span
                    className={cn(
                      "inline-block mt-1 text-[10px] font-semibold px-2 py-0.5 rounded-full",
                      definido
                        ? "text-[#7C4DFF] bg-[#7C4DFF]/10"
                        : "text-[#8A8580] bg-[#E8E4E0]/50",
                    )}
                  >
                    {definido ? "Definido" : "Abierto"}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Canales Definidos */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <IconoAstral
              nombre="compatibilidad"
              tamaño={20}
              className="text-[#7C4DFF]"
            />
            <h2 className="text-lg font-bold text-[#2C2926]">
              Canales Definidos
            </h2>
          </div>
          {datos.canales.length === 0 ? (
            <div className="rounded-xl bg-white border border-[#E8E4E0] p-4 text-center">
              <p className="text-[13px] text-[#8A8580]">
                No se encontraron canales definidos.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {datos.canales.map((canal) => (
                <div
                  key={`${canal.puertas[0]}-${canal.puertas[1]}`}
                  className="rounded-xl bg-white border border-[#E8E4E0] p-3 flex items-center justify-between hover:border-[#B388FF] transition-colors"
                >
                  <div>
                    <p className="text-[13px] font-semibold text-[#2C2926]">
                      {canal.nombre}
                    </p>
                    <p className="text-[11px] text-[#8A8580]">
                      {canal.centros[0]} — {canal.centros[1]}
                    </p>
                  </div>
                  <span className="text-[11px] font-bold text-[#7C4DFF] bg-[#F5F0FF] px-2 py-1 rounded-lg shrink-0 ml-2">
                    {canal.puertas[0]}–{canal.puertas[1]}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ----------------------------------------------------------------- */}
      {/* Panel Derecho — Activaciones                                       */}
      {/* ----------------------------------------------------------------- */}
      <aside className="hidden lg:flex w-[300px] flex-shrink-0 bg-white flex-col border-l border-[#E8E4E0]/40 overflow-hidden">
        <div className="p-5 pb-3 shrink-0">
          <h3 className="text-[15px] font-semibold text-[#2C2926]">
            Activaciones
          </h3>
          <p className="text-[11px] text-[#8A8580] mt-0.5">
            {datos.activaciones_conscientes.length +
              datos.activaciones_inconscientes.length}{" "}
            activaciones planetarias
          </p>
        </div>
        <div className="h-px bg-[#E8E4E0] mx-5" />

        <div className="flex-1 overflow-y-auto scroll-sutil p-5 pt-3 flex flex-col gap-0">
          {/* Conscientes */}
          {datos.activaciones_conscientes.length > 0 && (
            <>
              <p className="text-[11px] font-semibold text-[#7C4DFF] uppercase tracking-wider mb-2 mt-1">
                Conscientes
              </p>
              {datos.activaciones_conscientes.map((act) => (
                <div
                  key={`c-${act.planeta}-${act.puerta}`}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-[#F5F0FF] transition-colors"
                >
                  <div className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-semibold text-[#2C2926] leading-tight">
                      {act.planeta}
                    </p>
                    <p className="text-[11px] text-[#8A8580] leading-tight">
                      Puerta {act.puerta} · Línea {act.linea} · Color{" "}
                      {act.color}
                    </p>
                  </div>
                </div>
              ))}
            </>
          )}

          {/* Inconscientes */}
          {datos.activaciones_inconscientes.length > 0 && (
            <>
              <p className="text-[11px] font-semibold text-[#D4A234] uppercase tracking-wider mb-2 mt-4">
                Inconscientes
              </p>
              {datos.activaciones_inconscientes.map((act) => (
                <div
                  key={`i-${act.planeta}-${act.puerta}`}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-[#F5F0FF] transition-colors"
                >
                  <div className="w-2 h-2 rounded-full bg-[#D4A234] shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-semibold text-[#2C2926] leading-tight">
                      {act.planeta}
                    </p>
                    <p className="text-[11px] text-[#8A8580] leading-tight">
                      Puerta {act.puerta} · Línea {act.linea} · Color{" "}
                      {act.color}
                    </p>
                  </div>
                </div>
              ))}
            </>
          )}

          {datos.activaciones_conscientes.length === 0 &&
            datos.activaciones_inconscientes.length === 0 && (
              <div className="flex-1 flex flex-col items-center justify-center text-center gap-3">
                <Icono
                  nombre="planeta"
                  tamaño={32}
                  className="text-[#B388FF]"
                />
                <p className="text-sm text-[#8A8580]">
                  Sin activaciones disponibles
                </p>
              </div>
            )}
        </div>
      </aside>
    </div>
    </>
  );
}
