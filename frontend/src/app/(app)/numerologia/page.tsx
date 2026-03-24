"use client";

import { useState, type FormEvent } from "react";
import { Icono } from "@/componentes/ui/icono";
import { IconoAstral } from "@/componentes/ui/icono-astral";
import { Boton } from "@/componentes/ui/boton";
import { Input } from "@/componentes/ui/input";
import { Esqueleto } from "@/componentes/ui/esqueleto";
import { usarNumerologia, usarMisCalculos } from "@/lib/hooks";
import { cn } from "@/lib/utilidades/cn";
import type { Numerologia, NumeroRespuesta, DatosNumerologia } from "@/lib/tipos";
import HeaderMobile from "@/componentes/layouts/header-mobile";

// ---------------------------------------------------------------------------
// Constantes
// ---------------------------------------------------------------------------

const NUMEROS_MAESTROS = [11, 22, 33];

const ICONO_NUMERO: Record<
  string,
  { nombre: string; claseClara: string; claseOscura: string }
> = {
  "Camino de Vida": {
    nombre: "suerte",
    claseClara: "text-dorado-300",
    claseOscura: "text-acento",
  },
  "Expresión": {
    nombre: "emocion",
    claseClara: "text-violet-300",
    claseOscura: "text-primario",
  },
  "Impulso del Alma": {
    nombre: "salud",
    claseClara: "text-white/70",
    claseOscura: "text-violet-300",
  },
  Personalidad: {
    nombre: "personal",
    claseClara: "text-dorado-300",
    claseOscura: "text-acento",
  },
  "Número de Nacimiento": {
    nombre: "astrologia",
    claseClara: "text-violet-300",
    claseOscura: "text-primario",
  },
  "Año Personal": {
    nombre: "horoscopo",
    claseClara: "text-white/70",
    claseOscura: "text-violet-300",
  },
};

// ---------------------------------------------------------------------------
// Componente principal
// ---------------------------------------------------------------------------

export default function PaginaNumerologia() {
  const mutacion = usarNumerologia();
  const { data: calculos, isLoading: cargandoCalculos } = usarMisCalculos();

  const [datosManual, setDatosManual] = useState<Numerologia | null>(null);
  const [modoManual, setModoManual] = useState(false);
  const [numeroSeleccionado, setNumeroSeleccionado] = useState<string | null>(
    "Camino de Vida",
  );

  // Campos del formulario
  const [nombre, setNombre] = useState("");
  const [fechaNacimiento, setFechaNacimiento] = useState("");
  const [sistema, setSistema] = useState<"pitagorico" | "caldeo">("pitagorico");

  // Datos a mostrar: manual (si recalculó) o desde DB
  const datos =
    datosManual ?? (calculos?.numerologia as Numerologia | null) ?? null;

  function manejarEnvio(e: FormEvent) {
    e.preventDefault();
    const payload: DatosNumerologia = {
      nombre,
      fecha_nacimiento: fechaNacimiento,
      sistema,
    };
    mutacion.mutate(
      { datos: payload },
      { onSuccess: setDatosManual },
    );
  }

  function esNumeroMaestro(numero: number): boolean {
    if (!datos) return false;
    return (
      NUMEROS_MAESTROS.includes(numero) &&
      datos.numeros_maestros_presentes.includes(numero)
    );
  }

  // -------------------------------------------------------------------------
  // Estado: cargando
  // -------------------------------------------------------------------------
  if (cargandoCalculos && !modoManual) {
    return (
      <><HeaderMobile titulo="Numerologia" mostrarAtras />
      <div className="flex flex-col lg:flex-row h-full min-h-0 lg:overflow-hidden">
        <section className="flex-1 scroll-sutil bg-fondo p-5 lg:p-[28px_32px] flex flex-col gap-6 overflow-y-auto">
          <h1 className="text-[22px] font-semibold text-texto tracking-tight flex items-center gap-3">
            <IconoAstral nombre="numerologia" tamaño={28} className="text-acento" />
            Numerología
          </h1>
          <Esqueleto className="h-[140px] w-full rounded-[20px]" />
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Esqueleto key={i} className="h-[100px] rounded-xl" />
            ))}
          </div>
          <div className="flex items-center justify-center gap-3 pt-4">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-primario border-t-transparent" />
            <p className="text-[13px] text-texto-secundario">
              Cargando tu carta numerológica…
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
      <><HeaderMobile titulo="Numerologia" mostrarAtras />
      <div className="flex flex-col lg:flex-row h-full min-h-0 lg:overflow-hidden">
        <section className="flex-1 scroll-sutil bg-fondo p-5 lg:p-[28px_32px] flex flex-col gap-6 overflow-y-auto">
          <div>
            <h1 className="text-[22px] font-semibold text-texto tracking-tight flex items-center gap-3">
              <IconoAstral nombre="numerologia" tamaño={28} className="text-acento" />
              Numerología
            </h1>
            <p className="mt-2 text-[13px] text-texto-secundario">
              Calculá tu carta numerológica completa con camino de vida,
              expresión, impulso del alma y más.
            </p>
          </div>

          <div className="max-w-lg">
            <div className="rounded-2xl bg-fondo-tarjeta border border-borde p-6">
              <form onSubmit={manejarEnvio} className="flex flex-col gap-4">
                <Input
                  etiqueta="Nombre completo"
                  type="text"
                  placeholder="Nombre completo"
                  icono={<Icono nombre="usuario" tamaño={18} />}
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  required
                />

                <Input
                  etiqueta="Fecha de nacimiento"
                  type="date"
                  icono={<Icono nombre="calendario" tamaño={18} />}
                  value={fechaNacimiento}
                  onChange={(e) => setFechaNacimiento(e.target.value)}
                  required
                />

                {/* Selector de sistema */}
                <div className="flex flex-col gap-1.5 w-full">
                  <label className="text-[13px] font-medium text-texto-secundario">
                    Sistema de cálculo
                  </label>
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => setSistema("pitagorico")}
                      className={cn(
                        "flex-1 py-2.5 px-4 rounded-lg border text-sm font-medium transition-colors",
                        sistema === "pitagorico"
                          ? "border-primario bg-fondo-elevado text-primario"
                          : "border-borde bg-fondo-tarjeta text-texto-secundario hover:border-violet-300",
                      )}
                    >
                      Pitagórico
                    </button>
                    <button
                      type="button"
                      onClick={() => setSistema("caldeo")}
                      className={cn(
                        "flex-1 py-2.5 px-4 rounded-lg border text-sm font-medium transition-colors",
                        sistema === "caldeo"
                          ? "border-primario bg-fondo-elevado text-primario"
                          : "border-borde bg-fondo-tarjeta text-texto-secundario hover:border-violet-300",
                      )}
                    >
                      Caldeo
                    </button>
                  </div>
                </div>

                <Boton
                  type="submit"
                  variante="primario"
                  tamaño="lg"
                  cargando={mutacion.isPending}
                  icono={
                    <IconoAstral nombre="numerologia" tamaño={20} className="text-current" />
                  }
                  className="w-full mt-2"
                >
                  Calcular
                </Boton>
              </form>
            </div>

            {mutacion.isError && (
              <div className="mt-4 rounded-xl bg-error/10 border border-error/20 px-4 py-3">
                <p className="text-[13px] text-error">
                  {mutacion.error?.message || "Error al calcular la numerología."}
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
  const numeros: { titulo: string; dato: NumeroRespuesta }[] = [
    { titulo: "Camino de Vida", dato: datos.camino_de_vida },
    { titulo: "Expresión", dato: datos.expresion },
    { titulo: "Impulso del Alma", dato: datos.impulso_del_alma },
    { titulo: "Personalidad", dato: datos.personalidad },
    { titulo: "Número de Nacimiento", dato: datos.numero_nacimiento },
    { titulo: "Año Personal", dato: datos.anio_personal },
  ];

  const detalleSeleccionado = numeros.find(
    (n) => n.titulo === numeroSeleccionado,
  );
  const iconoDetalle = numeroSeleccionado
    ? ICONO_NUMERO[numeroSeleccionado]
    : null;
  const esMaestroDetalle = detalleSeleccionado
    ? esNumeroMaestro(detalleSeleccionado.dato.numero)
    : false;

  return (
    <><HeaderMobile titulo="Numerologia" mostrarAtras />
    <div className="flex flex-col lg:flex-row h-full min-h-0 lg:overflow-hidden">
      {/* ----------------------------------------------------------------- */}
      {/* Panel Central                                                      */}
      {/* ----------------------------------------------------------------- */}
      <section className="flex-1 scroll-sutil bg-fondo p-5 lg:p-[28px_32px] flex flex-col gap-6 overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-[22px] font-semibold text-texto tracking-tight flex items-center gap-3">
            <IconoAstral nombre="numerologia" tamaño={28} className="text-acento" />
            Numerología
          </h1>
          <div className="flex items-center gap-3">
            <p className="text-[13px] text-texto-secundario hidden sm:block">
              {datos.fecha_nacimiento}
            </p>
            <span className="text-[11px] font-semibold text-primario bg-fondo-elevado px-2.5 py-1 rounded-lg">
              {datos.sistema === "pitagorico" ? "Pitagórico" : "Caldeo"}
            </span>
          </div>
        </div>

        {/* Hero gradient card — tarjeta compacta con todos los números */}
        <div className="rounded-[20px] bg-gradient-to-b from-violet-900 via-violet-800 to-primario p-5">
          <p className="text-violet-300 text-[11px] font-semibold tracking-widest uppercase mb-3">
            Carta Numerológica de {datos.nombre}
          </p>
          <div className="flex flex-wrap gap-2">
            {numeros.map(({ titulo, dato }) => {
              const esMaestro = esNumeroMaestro(dato.numero);
              const iconoConf = ICONO_NUMERO[titulo];
              return (
                <button
                  key={titulo}
                  onClick={() => setNumeroSeleccionado(titulo)}
                  className={cn(
                    "flex items-center gap-2.5 rounded-xl px-3 py-2 transition-all",
                    numeroSeleccionado === titulo
                      ? "bg-white/20 ring-1 ring-white/40"
                      : "bg-white/[0.08] hover:bg-white/[0.14]",
                  )}
                >
                  {iconoConf && (
                    <IconoAstral
                      nombre={
                        iconoConf.nombre as Parameters<typeof IconoAstral>[0]["nombre"]
                      }
                      tamaño={16}
                      className={iconoConf.claseClara}
                    />
                  )}
                  <div className="flex flex-col items-start">
                    <span
                      className={cn(
                        "text-[14px] font-bold leading-tight",
                        esMaestro ? "text-dorado-300" : "text-white",
                      )}
                    >
                      {dato.numero}
                    </span>
                    <span className="text-[10px] text-violet-300 leading-tight">
                      {titulo}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Banner de números maestros */}
        {datos.numeros_maestros_presentes?.length > 0 && (
          <div className="rounded-xl bg-dorado-300/10 border border-dorado-400/20 p-4 flex items-center gap-3">
            <IconoAstral nombre="suerte" tamaño={22} className="text-acento shrink-0" />
            <div>
              <p className="text-[13px] font-semibold text-texto">
                Números Maestros: {datos.numeros_maestros_presentes.join(", ")}
              </p>
              <p className="text-[11px] text-texto-secundario">
                No se reducen y tienen un significado especial
              </p>
            </div>
          </div>
        )}

        {/* Grid de números */}
        <div>
          <h2 className="text-lg font-bold text-texto mb-3">Tus Números</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {numeros.map(({ titulo, dato }) => {
              const iconoConfig = ICONO_NUMERO[titulo];
              const esMaestro = esNumeroMaestro(dato.numero);
              const seleccionado = numeroSeleccionado === titulo;
              return (
                <button
                  key={titulo}
                  onClick={() => setNumeroSeleccionado(titulo)}
                  className={cn(
                    "rounded-xl p-4 text-center transition-all border cursor-pointer",
                    seleccionado
                      ? "bg-fondo-elevado border-violet-300 ring-2 ring-violet-300/30"
                      : esMaestro
                        ? "bg-dorado-300/10 border-dorado-400/20 hover:border-dorado-400/50"
                        : "bg-fondo-tarjeta border-borde hover:border-violet-300",
                  )}
                >
                  {iconoConfig && (
                    <div className="flex justify-center mb-2">
                      <IconoAstral
                        nombre={
                          iconoConfig.nombre as Parameters<typeof IconoAstral>[0]["nombre"]
                        }
                        tamaño={20}
                        className={iconoConfig.claseOscura}
                      />
                    </div>
                  )}
                  <p
                    className={cn(
                      "text-3xl font-bold",
                      esMaestro ? "text-acento" : "text-primario",
                    )}
                  >
                    {dato.numero}
                  </p>
                  <p className="text-[11px] font-semibold text-texto-secundario uppercase tracking-wider mt-1">
                    {titulo}
                  </p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Tarjeta: Ciclos Personales (año/mes/día personal + etapas) */}
        <div className="rounded-xl bg-fondo-tarjeta border border-borde p-5">
          <div className="flex items-center gap-2 mb-4">
            <IconoAstral nombre="horoscopo" tamaño={20} className="text-primario" />
            <h2 className="text-[15px] font-semibold text-texto">
              Ciclos Personales
            </h2>
          </div>

          {/* Año / Mes / Día personal */}
          <div className="grid grid-cols-3 gap-3 mb-5">
            {[
              { etiqueta: "Año Personal", dato: datos.anio_personal },
              { etiqueta: "Mes Personal", dato: datos.mes_personal },
              { etiqueta: "Día Personal", dato: datos.dia_personal },
            ].map((ciclo) => (
              <div
                key={ciclo.etiqueta}
                className="rounded-xl bg-fondo-elevado p-3 text-center"
              >
                <p className="text-[10px] text-texto-secundario uppercase tracking-wider">
                  {ciclo.etiqueta}
                </p>
                <p
                  className={cn(
                    "text-2xl font-bold mt-1",
                    ciclo.dato && esNumeroMaestro(ciclo.dato.numero)
                      ? "text-acento"
                      : "text-primario",
                  )}
                >
                  {ciclo.dato?.numero ?? "—"}
                </p>
                <p className="text-[11px] text-texto-secundario mt-1 leading-snug">
                  {ciclo.dato?.descripcion ?? ""}
                </p>
              </div>
            ))}
          </div>

          {/* Etapas de la vida */}
          {datos.etapas_de_la_vida && datos.etapas_de_la_vida.length > 0 && (
            <>
              <div className="flex items-center gap-2 mb-3">
                <IconoAstral nombre="astrologia" tamaño={18} className="text-primario" />
                <h3 className="text-[13px] font-semibold text-texto">
                  Etapas de la Vida
                </h3>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {datos.etapas_de_la_vida.map((etapa, idx) => (
                  <div
                    key={idx}
                    className="rounded-xl border border-borde p-3 text-center"
                  >
                    <p className="text-[10px] text-texto-terciario uppercase tracking-wider">
                      Etapa {idx + 1}
                    </p>
                    <p className="text-xl font-bold text-primario mt-1">
                      {etapa.numero}
                    </p>
                    <p className="text-[10px] text-texto-secundario mt-1">
                      {etapa.edad_inicio}–{etapa.edad_fin ?? "+"} años
                    </p>
                    <p className="text-[11px] text-texto-secundario mt-1 leading-snug">
                      {etapa.descripcion}
                    </p>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Nuevo cálculo */}
        <button
          onClick={() => {
            setModoManual(true);
            setDatosManual(null);
          }}
          className="self-start flex items-center gap-2 text-[13px] text-texto-secundario hover:text-primario transition-colors"
        >
          <Icono nombre="flechaIzquierda" tamaño={16} />
          Nuevo cálculo
        </button>
      </section>

      {/* ----------------------------------------------------------------- */}
      {/* Panel Derecho — Detalle del número seleccionado                    */}
      {/* ----------------------------------------------------------------- */}
      <aside className="hidden lg:flex w-[300px] flex-shrink-0 bg-fondo-tarjeta flex-col border-l border-borde overflow-hidden">
        <div className="p-5 pb-3 shrink-0">
          <h3 className="text-[15px] font-semibold text-texto">
            Detalle del Número
          </h3>
        </div>
        <div className="h-px bg-borde mx-5" />

        {detalleSeleccionado ? (
          <div className="flex-1 overflow-y-auto scroll-sutil p-5 pt-4 flex flex-col gap-4">
            {/* Número grande */}
            <div className="flex flex-col items-center gap-2 py-4">
              {iconoDetalle && (
                <IconoAstral
                  nombre={
                    iconoDetalle.nombre as Parameters<typeof IconoAstral>[0]["nombre"]
                  }
                  tamaño={32}
                  className={iconoDetalle.claseOscura}
                />
              )}
              <p
                className={cn(
                  "text-5xl font-bold",
                  esMaestroDetalle ? "text-acento" : "text-primario",
                )}
              >
                {detalleSeleccionado.dato.numero}
              </p>
              <p className="text-[13px] font-semibold text-texto uppercase tracking-wider">
                {detalleSeleccionado.titulo}
              </p>
              {esMaestroDetalle && (
                <span className="text-[11px] font-semibold text-acento bg-dorado-300/10 px-2.5 py-1 rounded-lg">
                  Número Maestro
                </span>
              )}
            </div>

            {/* Descripción */}
            <div className="rounded-xl bg-fondo-elevado p-4">
              <p className="text-[13px] text-texto leading-relaxed">
                {detalleSeleccionado.dato.descripcion}
              </p>
            </div>

            {/* Todos los números en lista compacta */}
            <div className="pt-2">
              <p className="text-[11px] font-semibold text-texto-secundario uppercase tracking-wider mb-2">
                Resumen
              </p>
              <div className="flex flex-col gap-0">
                {numeros.map(({ titulo, dato }) => (
                  <button
                    key={titulo}
                    onClick={() => setNumeroSeleccionado(titulo)}
                    className={cn(
                      "flex items-center justify-between px-3 py-2.5 rounded-xl transition-colors",
                      titulo === numeroSeleccionado
                        ? "bg-fondo-elevado"
                        : "hover:bg-fondo-elevado/50",
                    )}
                  >
                    <span className="text-[13px] font-medium text-texto">
                      {titulo}
                    </span>
                    <span
                      className={cn(
                        "text-[15px] font-bold",
                        esNumeroMaestro(dato.numero)
                          ? "text-acento"
                          : "text-primario",
                      )}
                    >
                      {dato.numero}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center gap-3 p-5">
            <Icono nombre="numeral" tamaño={32} className="text-violet-300" />
            <p className="text-sm text-texto-secundario">
              Seleccioná un número para ver el detalle
            </p>
          </div>
        )}
      </aside>
    </div>
    </>
  );
}
