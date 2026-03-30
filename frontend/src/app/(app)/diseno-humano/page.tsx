"use client";

import { useState } from "react";
import { Icono } from "@/componentes/ui/icono";
import { IconoAstral } from "@/componentes/ui/icono-astral";
import { Esqueleto } from "@/componentes/ui/esqueleto";
import { FormularioNacimiento } from "@/componentes/compuestos/formulario-nacimiento";
import BodyGraph from "@/componentes/visualizaciones/body-graph";
import { usarDisenoHumano, usarMisCalculos, usarMiPerfil } from "@/lib/hooks";
import { cn } from "@/lib/utilidades/cn";
import type { DatosNacimiento, DisenoHumano } from "@/lib/tipos";
import HeaderMobile from "@/componentes/layouts/header-mobile";

const PANEL_CLARO =
  "rounded-[24px] border border-white/60 bg-white/72 backdrop-blur-xl shadow-[0_18px_60px_rgba(77,29,149,0.10)]";

const PANEL_OSCURO =
  "relative overflow-hidden rounded-[28px] border border-white/10 bg-[radial-gradient(circle_at_top_right,rgba(179,136,255,0.18),transparent_22%),linear-gradient(135deg,#170d2c_0%,#25134a_48%,#3a1f76_100%)] shadow-[0_28px_90px_rgba(14,8,32,0.35)]";

const MAPA_CENTROS: Record<string, string> = {
  cabeza: "Cabeza",
  ajna: "Ajna",
  garganta: "Garganta",
  g: "G (Identidad)",
  identidad: "G (Identidad)",
  corazon: "Corazón (Ego)",
  ego: "Corazón (Ego)",
  sacral: "Sacral",
  sacro: "Sacral",
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

function obtenerEstadoCentro(estado: string) {
  const definido = estado === "definido";

  return {
    definido,
    etiqueta: definido ? "Definido" : "Abierto",
    descripcion: definido
      ? "Energía consistente y disponible de forma estable."
      : "Centro receptivo que amplifica y aprende por experiencia.",
  };
}

function TarjetaActivaciones({
  titulo,
  tono,
  activaciones,
}: {
  titulo: string;
  tono: "violeta" | "dorado";
  activaciones: DisenoHumano["activaciones_conscientes"];
}) {
  const etiquetaColor =
    tono === "violeta" ? "text-violet-700" : "text-[#8A5A00]";
  const puntoColor = tono === "violeta" ? "bg-[#7C4DFF]" : "bg-[#D4A234]";
  const contenedorColor =
    tono === "violeta"
      ? "border-violet-200/70 bg-violet-50/70"
      : "border-[#E9D4A2]/60 bg-[#FFF8E8]";

  return (
    <div className={cn("rounded-2xl border p-4", contenedorColor)}>
      <p className={cn("text-[11px] font-semibold uppercase tracking-[0.16em]", etiquetaColor)}>
        {titulo}
      </p>

      {activaciones.length === 0 ? (
        <div className="mt-4 rounded-2xl border border-dashed border-[#E8E4E0] bg-white/60 px-4 py-5 text-center">
          <p className="text-sm text-[#8A8580]">
            No hay activaciones para mostrar en este grupo.
          </p>
        </div>
      ) : (
        <div className="mt-3 flex flex-col gap-2">
          {activaciones.map((act) => (
            <div
              key={`${titulo}-${act.planeta}-${act.puerta}-${act.linea}`}
              className="flex items-start gap-3 rounded-2xl border border-white/70 bg-white/75 px-4 py-3"
            >
              <span className={cn("mt-1 h-2.5 w-2.5 shrink-0 rounded-full", puntoColor)} />
              <div className="min-w-0">
                <p className="text-sm font-semibold text-[#2C2926]">
                  {act.planeta}
                </p>
                <p className="text-[13px] leading-relaxed text-[#6F6A65]">
                  Puerta {act.puerta} · Línea {act.linea} · Color {act.color}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function PaginaDisenoHumano() {
  const mutacion = usarDisenoHumano();
  const { data: calculos, isLoading: cargandoCalculos } = usarMisCalculos();
  const { data: perfil } = usarMiPerfil();
  const [datosManual, setDatosManual] = useState<DisenoHumano | null>(null);
  const [modoManual, setModoManual] = useState(false);

  const datos =
    datosManual ?? (calculos?.diseno_humano as DisenoHumano | null) ?? null;
  const nombrePersona = perfil?.nombre ?? "";

  function manejarCalculo(datosNacimiento: DatosNacimiento) {
    mutacion.mutate({ datos: datosNacimiento }, { onSuccess: setDatosManual });
  }

  if (cargandoCalculos && !modoManual) {
    return (
      <>
        <HeaderMobile titulo="Diseño Humano" mostrarAtras />
        <div className="relative min-h-full overflow-hidden bg-[#F8F6FF]">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(179,136,255,0.18),transparent_24%),radial-gradient(circle_at_bottom_left,rgba(124,77,255,0.14),transparent_28%)]" />
          <div className="absolute right-0 top-0 h-72 w-72 rounded-full bg-violet-300/18 blur-3xl" />
          <div className="absolute left-0 top-1/3 h-64 w-64 rounded-full bg-fuchsia-200/18 blur-3xl" />

          <section className="relative z-10 flex flex-col gap-6 p-5 lg:p-[28px_32px]">
            <div className={cn(PANEL_OSCURO, "p-6 lg:p-8")}>
              <div className="absolute -right-14 top-10 h-36 w-36 rounded-full bg-[#B388FF]/18 blur-3xl" />
              <div className="relative z-10">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-violet-200/75">
                  Diseño Humano
                </p>
                <h1 className="mt-3 flex items-center gap-3 text-[30px] font-semibold tracking-tight text-white lg:text-[38px]">
                  <IconoAstral nombre="personal" tamaño={32} className="text-[#D4A234]" />
                  Diseño Humano
                </h1>
                <p className="mt-3 max-w-3xl text-[15px] leading-relaxed text-violet-100/72">
                  Estamos preparando tu Body Graph, centros y activaciones para
                  mostrar una lectura más clara y visual.
                </p>
              </div>
            </div>

            <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
              <Esqueleto className="h-[420px] rounded-[24px]" />
              <div className="grid gap-4">
                <Esqueleto className="h-[180px] rounded-[24px]" />
                <Esqueleto className="h-[220px] rounded-[24px]" />
              </div>
            </div>

            <div className={cn(PANEL_CLARO, "flex items-center justify-center gap-3 px-5 py-4")}>
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-[#7C4DFF] border-t-transparent" />
              <p className="text-[13px] text-[#6F6A65]">
                Cargando tu Diseño Humano…
              </p>
            </div>
          </section>
        </div>
      </>
    );
  }

  if (!datos || modoManual) {
    return (
      <>
        <HeaderMobile titulo="Diseño Humano" mostrarAtras />
        <div className="relative min-h-full overflow-hidden bg-[#F8F6FF]">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(179,136,255,0.18),transparent_24%),radial-gradient(circle_at_bottom_left,rgba(124,77,255,0.14),transparent_28%)]" />
          <div className="absolute right-0 top-0 h-72 w-72 rounded-full bg-violet-300/18 blur-3xl" />
          <div className="absolute left-0 top-1/3 h-64 w-64 rounded-full bg-fuchsia-200/18 blur-3xl" />

          <section className="relative z-10 flex flex-col gap-6 p-5 lg:p-[28px_32px]">
            <div className={cn(PANEL_OSCURO, "p-6 lg:p-8")}>
              <div className="absolute -right-16 top-0 h-44 w-44 rounded-full bg-[#B388FF]/18 blur-3xl" />
              <div className="absolute -left-10 bottom-0 h-36 w-36 rounded-full bg-[#7C4DFF]/16 blur-3xl" />

              <div className="relative z-10 grid gap-6 xl:grid-cols-[1.05fr_0.95fr] xl:items-start">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-violet-200/75">
                    Lectura energética
                  </p>
                  <h1 className="mt-3 flex items-center gap-3 text-[30px] font-semibold tracking-tight text-white lg:text-[40px]">
                    <IconoAstral nombre="personal" tamaño={34} className="text-[#D4A234]" />
                    Diseño Humano
                  </h1>
                  <p className="mt-4 max-w-2xl text-[15px] leading-relaxed text-violet-100/72">
                    Calculá tu Body Graph completo con una puesta visual más
                    clara: tipo, autoridad, perfil, centros, canales y
                    activaciones en una sola lectura.
                  </p>

                  <div className="mt-5 grid gap-3 sm:grid-cols-3">
                    {[
                      {
                        titulo: "Tipo",
                        descripcion: "Cómo se mueve tu energía y cómo conviene iniciar.",
                      },
                      {
                        titulo: "Autoridad",
                        descripcion: "La forma más afinada de tomar decisiones.",
                      },
                      {
                        titulo: "Centros",
                        descripcion: "Qué zonas son estables y cuáles absorben más del entorno.",
                      },
                    ].map((item) => (
                      <div
                        key={item.titulo}
                        className="rounded-2xl border border-white/10 bg-white/[0.08] p-4 backdrop-blur-md"
                      >
                        <p className="text-sm font-semibold text-white">
                          {item.titulo}
                        </p>
                        <p className="mt-2 text-[13px] leading-relaxed text-violet-100/65">
                          {item.descripcion}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-[24px] border border-white/12 bg-white/[0.10] p-4 backdrop-blur-xl lg:p-5">
                  <div className="rounded-[20px] border border-white/70 bg-white/92 p-5">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#7C4DFF]">
                      Datos de nacimiento
                    </p>
                    <p className="mt-2 text-sm leading-relaxed text-[#6F6A65]">
                      Ingresá tus datos para generar la carta completa de Diseño Humano.
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
                        {mutacion.error?.message ||
                          "Error al calcular el Diseño Humano."}
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

  const centrosEntries = Object.entries(datos.centros);
  const centrosDefinidos = centrosEntries.filter(([, estado]) => estado === "definido").length;
  const activacionesTotal =
    datos.activaciones_conscientes.length + datos.activaciones_inconscientes.length;
  const atributos = [
    { etiqueta: "Tipo", valor: datos.tipo },
    { etiqueta: "Autoridad", valor: datos.autoridad },
    { etiqueta: "Perfil", valor: datos.perfil },
    { etiqueta: "Definición", valor: datos.definicion },
  ];
  const cruzItems = [
    { etiqueta: "Sol Consciente", valor: datos.cruz_encarnacion?.sol_consciente },
    { etiqueta: "Tierra Consciente", valor: datos.cruz_encarnacion?.tierra_consciente },
    { etiqueta: "Sol Inconsciente", valor: datos.cruz_encarnacion?.sol_inconsciente },
    { etiqueta: "Tierra Inconsciente", valor: datos.cruz_encarnacion?.tierra_inconsciente },
  ];

  return (
    <>
      <HeaderMobile titulo="Diseño Humano" mostrarAtras />
      <div className="relative min-h-full overflow-hidden bg-[#F8F6FF]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(179,136,255,0.18),transparent_24%),radial-gradient(circle_at_bottom_left,rgba(124,77,255,0.14),transparent_28%)]" />
        <div className="absolute right-0 top-0 h-72 w-72 rounded-full bg-violet-300/18 blur-3xl" />
        <div className="absolute left-0 top-1/3 h-64 w-64 rounded-full bg-fuchsia-200/18 blur-3xl" />

        <section className="relative z-10 flex flex-col gap-6 p-5 lg:p-[28px_32px]">
          <div className={cn(PANEL_OSCURO, "p-6 lg:p-8")}>
            <div className="absolute -right-14 top-8 h-40 w-40 rounded-full bg-[#B388FF]/20 blur-3xl" />
            <div className="absolute left-10 top-14 h-24 w-24 rounded-full bg-[#D4A234]/10 blur-3xl" />

            <div className="relative z-10">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="max-w-3xl">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-violet-200/75">
                    {nombrePersona ? `Diseño Humano de ${nombrePersona}` : "Tu Diseño Humano"}
                  </p>
                  <h1 className="mt-3 flex items-center gap-3 text-[30px] font-semibold tracking-tight text-white lg:text-[42px]">
                    <IconoAstral nombre="personal" tamaño={34} className="text-[#D4A234]" />
                    Diseño Humano
                  </h1>
                  <p className="mt-4 max-w-2xl text-[15px] leading-relaxed text-violet-100/72">
                    Una lectura visual de tu mecánica energética para entender cómo
                    decidís, dónde sostenés energía estable y qué activaciones
                    marcan tu diseño consciente e inconsciente.
                  </p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <span className="rounded-full border border-white/12 bg-white/[0.08] px-3 py-1 text-[11px] font-medium text-violet-100/85">
                      {centrosDefinidos} centros definidos
                    </span>
                    <span className="rounded-full border border-white/12 bg-white/[0.08] px-3 py-1 text-[11px] font-medium text-violet-100/85">
                      {datos.canales.length} canales activos
                    </span>
                    <span className="rounded-full border border-white/12 bg-white/[0.08] px-3 py-1 text-[11px] font-medium text-violet-100/85">
                      {activacionesTotal} activaciones planetarias
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => {
                    setModoManual(true);
                    setDatosManual(null);
                  }}
                  className="inline-flex items-center gap-2 self-start rounded-full border border-white/12 bg-white/[0.08] px-4 py-2 text-[13px] font-medium text-violet-100/85 transition-colors hover:bg-white/[0.14] hover:text-white"
                >
                  <Icono nombre="flechaIzquierda" tamaño={16} />
                  Nuevo cálculo
                </button>
              </div>

              <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                {atributos.map((attr) => (
                  <div
                    key={attr.etiqueta}
                    className="rounded-2xl border border-white/10 bg-white/[0.08] px-4 py-4 backdrop-blur-md"
                  >
                    <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-violet-200/72">
                      {attr.etiqueta}
                    </p>
                    <p className="mt-2 text-[18px] font-semibold leading-snug text-white">
                      {attr.valor}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="grid gap-6 xl:grid-cols-[1.08fr_0.92fr]">
            <div className={cn(PANEL_OSCURO, "p-5 lg:p-6")}>
              <div className="absolute left-1/3 top-1/2 h-40 w-40 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#B388FF]/10 blur-3xl" />
              <div className="relative z-10">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <IconoAstral nombre="personal" tamaño={20} className="text-[#D4A234]" />
                      <h2 className="text-[18px] font-semibold text-white">
                        Body Graph
                      </h2>
                    </div>
                    <p className="mt-2 text-sm leading-relaxed text-violet-100/66">
                      Visualización central de tus centros, definición energética y conexiones activas.
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <span className="rounded-full border border-white/10 bg-white/[0.08] px-3 py-1 text-[11px] font-medium text-violet-100/82">
                      {datos.puertas_conscientes.length} puertas conscientes
                    </span>
                    <span className="rounded-full border border-white/10 bg-white/[0.08] px-3 py-1 text-[11px] font-medium text-violet-100/82">
                      {datos.puertas_inconscientes.length} puertas inconscientes
                    </span>
                  </div>
                </div>

                <div className="mt-5 rounded-[24px] border border-white/10 bg-[#110A21]/70 p-4 lg:p-6">
                  <BodyGraph datos={datos} className="min-h-[460px]" />
                </div>
              </div>
            </div>

            <div className="grid gap-6">
              <div className={cn(PANEL_CLARO, "p-5 lg:p-6")}>
                <div className="flex items-center gap-2">
                  <IconoAstral nombre="astrologia" tamaño={20} className="text-[#7C4DFF]" />
                  <h2 className="text-[18px] font-semibold text-[#2C2926]">
                    Cruz de Encarnación
                  </h2>
                </div>
                <p className="mt-2 text-sm leading-relaxed text-[#6F6A65]">
                  Los cuatro ejes principales que organizan tu propósito y tu tono de vida.
                </p>

                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  {cruzItems.map((item) => (
                    <div
                      key={item.etiqueta}
                      className="rounded-2xl border border-violet-100 bg-violet-50/55 p-4"
                    >
                      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#7C4DFF]">
                        {item.etiqueta}
                      </p>
                      <p className="mt-2 text-[22px] font-semibold text-[#2C2926]">
                        {item.valor ?? "—"}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              <div className={cn(PANEL_CLARO, "p-5 lg:p-6")}>
                <div className="flex items-center gap-2">
                  <Icono nombre="planeta" tamaño={18} className="text-[#7C4DFF]" />
                  <h2 className="text-[18px] font-semibold text-[#2C2926]">
                    Activaciones
                  </h2>
                </div>
                <p className="mt-2 text-sm leading-relaxed text-[#6F6A65]">
                  Cómo se distribuye la información entre tu diseño consciente e inconsciente.
                </p>

                <div className="mt-5 grid gap-4">
                  <TarjetaActivaciones
                    titulo="Conscientes"
                    tono="violeta"
                    activaciones={datos.activaciones_conscientes}
                  />
                  <TarjetaActivaciones
                    titulo="Inconscientes"
                    tono="dorado"
                    activaciones={datos.activaciones_inconscientes}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="grid gap-6 xl:grid-cols-[0.92fr_1.08fr]">
            <div className={cn(PANEL_CLARO, "p-5 lg:p-6")}>
              <div className="flex items-center gap-2">
                <IconoAstral nombre="salud" tamaño={20} className="text-[#7C4DFF]" />
                <h2 className="text-[18px] font-semibold text-[#2C2926]">
                  Centros
                </h2>
              </div>
              <p className="mt-2 text-sm leading-relaxed text-[#6F6A65]">
                Los puntos de estabilidad y apertura donde se organiza tu energía.
              </p>

              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                {centrosEntries.map(([clave, estado]) => {
                  const meta = obtenerEstadoCentro(estado);
                  return (
                    <div
                      key={clave}
                      className={cn(
                        "rounded-2xl border p-4 transition-colors",
                        meta.definido
                          ? "border-violet-200/70 bg-[linear-gradient(135deg,rgba(124,77,255,0.12),rgba(179,136,255,0.08))]"
                          : "border-[#E8E4E0] bg-white/70",
                      )}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold text-[#2C2926]">
                            {nombreCentroLegible(clave)}
                          </p>
                          <p className="mt-2 text-[13px] leading-relaxed text-[#6F6A65]">
                            {meta.descripcion}
                          </p>
                        </div>
                        <span
                          className={cn(
                            "shrink-0 rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em]",
                            meta.definido
                              ? "bg-[#7C4DFF]/12 text-[#7C4DFF]"
                              : "bg-[#E8E4E0]/70 text-[#8A8580]",
                          )}
                        >
                          {meta.etiqueta}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className={cn(PANEL_CLARO, "p-5 lg:p-6")}>
              <div className="flex items-center gap-2">
                <IconoAstral nombre="compatibilidad" tamaño={20} className="text-[#7C4DFF]" />
                <h2 className="text-[18px] font-semibold text-[#2C2926]">
                  Canales Definidos
                </h2>
              </div>
              <p className="mt-2 text-sm leading-relaxed text-[#6F6A65]">
                Los circuitos que unen centros y marcan talentos, consistencia y dirección energética.
              </p>

              {datos.canales.length === 0 ? (
                <div className="mt-5 rounded-2xl border border-dashed border-[#E8E4E0] bg-white/60 px-4 py-8 text-center">
                  <p className="text-sm text-[#8A8580]">
                    No se encontraron canales definidos.
                  </p>
                </div>
              ) : (
                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  {datos.canales.map((canal) => (
                    <div
                      key={`${canal.puertas[0]}-${canal.puertas[1]}`}
                      className="rounded-2xl border border-violet-100 bg-white/80 p-4 transition-colors hover:border-[#B388FF]/70"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold text-[#2C2926]">
                            {canal.nombre}
                          </p>
                          <p className="mt-2 text-[13px] leading-relaxed text-[#6F6A65]">
                            {canal.centros[0]} · {canal.centros[1]}
                          </p>
                        </div>
                        <span className="shrink-0 rounded-xl bg-[#F5F0FF] px-2.5 py-1 text-[11px] font-semibold text-[#7C4DFF]">
                          {canal.puertas[0]}–{canal.puertas[1]}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
