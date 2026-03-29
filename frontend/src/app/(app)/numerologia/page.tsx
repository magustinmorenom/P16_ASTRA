"use client";

import { useState, useCallback, type FormEvent } from "react";
import { Icono } from "@/componentes/ui/icono";
import { IconoAstral } from "@/componentes/ui/icono-astral";
import { Boton } from "@/componentes/ui/boton";
import { Input } from "@/componentes/ui/input";
import { Badge } from "@/componentes/ui/badge";
import { Esqueleto } from "@/componentes/ui/esqueleto";
import { usarNumerologia, usarMisCalculos } from "@/lib/hooks";
import { cn } from "@/lib/utilidades/cn";
import type {
  Numerologia,
  NumeroRespuesta,
  EtapaVida,
  MesPersonalItem,
  DatosNumerologia,
} from "@/lib/tipos";
import HeaderMobile from "@/componentes/layouts/header-mobile";

// ── Constantes ─────────────────────────────────────────────────────────────

const NUMEROS_MAESTROS = [11, 22, 33];

/** Explicaciones en lenguaje simple para cada número */
const QUE_ES: Record<string, string> = {
  camino_de_vida:
    "Es el número más importante de tu carta. Se calcula con tu fecha de nacimiento completa y revela tu propósito de vida, las lecciones que viniste a aprender y el camino que mejor te llevará a realizarte.",
  expresion:
    "Se calcula con todas las letras de tu nombre completo. Muestra tus talentos naturales, tus habilidades innatas y cómo te expresás ante el mundo.",
  impulso_del_alma:
    "Se calcula solo con las vocales de tu nombre. Revela tus deseos más profundos, lo que realmente te motiva y lo que tu alma anhela.",
  personalidad:
    "Se calcula solo con las consonantes de tu nombre. Muestra la imagen que proyectás hacia afuera, cómo los demás te perciben a primera vista.",
  numero_nacimiento:
    "Se calcula solo con el día en que naciste. Representa un talento especial que te acompaña toda la vida, como un regalo de nacimiento.",
  anio_personal:
    "Indica la energía general que domina tu año actual. Cambia cada año en tu cumpleaños y define el tono de todo lo que hacés durante ese período.",
  mes_personal:
    "La energía específica de este mes dentro de tu año personal. Te ayuda a entender qué temas están más activos ahora.",
  dia_personal:
    "La vibración energética de hoy según tu ciclo personal. Útil para planificar actividades y decisiones del día.",
  etapa:
    "Los pináculos son cuatro grandes períodos de tu vida, cada uno con un número que define las lecciones y oportunidades principales de esa etapa.",
};

const ICONO_NUMERO: Record<string, string> = {
  camino_de_vida: "suerte",
  expresion: "emocion",
  impulso_del_alma: "salud",
  personalidad: "personal",
  numero_nacimiento: "astrologia",
  anio_personal: "horoscopo",
  mes_personal: "horoscopo",
  dia_personal: "horoscopo",
};

// ── Tipo para el panel de detalle ──────────────────────────────────────────

interface DetalleNumero {
  titulo: string;
  clave: string;
  numero: number;
  descripcion: string;
  descripcion_larga?: string;
  que_es: string;
  esMaestro: boolean;
  extra?: string;
}

// ── Utilidades ─────────────────────────────────────────────────────────────

function calcularEdad(fechaNacimiento: string): number {
  const hoy = new Date();
  const nacimiento = new Date(fechaNacimiento);
  let edad = hoy.getFullYear() - nacimiento.getFullYear();
  const mesDiff = hoy.getMonth() - nacimiento.getMonth();
  if (
    mesDiff < 0 ||
    (mesDiff === 0 && hoy.getDate() < nacimiento.getDate())
  ) {
    edad--;
  }
  return edad;
}

// ── Componente principal ───────────────────────────────────────────────────

export default function PaginaNumerologia() {
  const mutacion = usarNumerologia();
  const { data: calculos, isLoading: cargandoCalculos } = usarMisCalculos();

  const [datosManual, setDatosManual] = useState<Numerologia | null>(null);
  const [modoManual, setModoManual] = useState(false);
  const [detalle, setDetalle] = useState<DetalleNumero | null>(null);

  // Formulario
  const [nombre, setNombre] = useState("");
  const [fechaNacimiento, setFechaNacimiento] = useState("");
  const [sistema, setSistema] = useState<"pitagorico" | "caldeo">("pitagorico");

  // En mobile mostramos el detalle inline (sheet abierto)
  const [detalleAbierto, setDetalleAbierto] = useState(false);

  const datos =
    datosManual ?? (calculos?.numerologia as Numerologia | null) ?? null;

  function manejarEnvio(e: FormEvent) {
    e.preventDefault();
    const payload: DatosNumerologia = {
      nombre,
      fecha_nacimiento: fechaNacimiento,
      sistema,
    };
    mutacion.mutate({ datos: payload }, { onSuccess: setDatosManual });
  }

  const esMaestro = (n: number) => NUMEROS_MAESTROS.includes(n);

  // ── Helpers detalle ────────────────────────────────────────────────────

  const abrirNumero = useCallback(
    (clave: string, titulo: string, resp: NumeroRespuesta) => {
      setDetalle({
        titulo,
        clave,
        numero: resp.numero,
        descripcion: resp.descripcion,
        descripcion_larga: resp.descripcion_larga,
        que_es: QUE_ES[clave] ?? "",
        esMaestro: esMaestro(resp.numero),
      });
      setDetalleAbierto(true);
    },
    [],
  );

  const abrirMes = useCallback(
    (item: MesPersonalItem) => {
      setDetalle({
        titulo: `Mes Personal — ${item.nombre_mes}`,
        clave: "mes_personal",
        numero: item.numero,
        descripcion: item.descripcion,
        que_es: `Este es tu número personal para ${item.nombre_mes}. Cada mes tiene una vibración diferente dentro de tu año personal${datos ? ` (${datos.anio_personal.numero})` : ""}. Influye en las oportunidades y desafíos del mes.`,
        esMaestro: esMaestro(item.numero),
      });
      setDetalleAbierto(true);
    },
    [datos],
  );

  const abrirEtapa = useCallback(
    (etapa: EtapaVida, indice: number, edadActual: number) => {
      const activa =
        edadActual >= etapa.edad_inicio &&
        (etapa.edad_fin === null || edadActual < etapa.edad_fin);
      const pasada = etapa.edad_fin !== null && edadActual >= etapa.edad_fin;
      setDetalle({
        titulo: etapa.nombre || `Pináculo ${indice + 1}`,
        clave: "etapa",
        numero: etapa.numero,
        descripcion: etapa.descripcion,
        descripcion_larga: etapa.descripcion_larga,
        que_es: QUE_ES.etapa,
        esMaestro: esMaestro(etapa.numero),
        extra: activa
          ? `Estás en esta etapa ahora (${edadActual} años).`
          : pasada
            ? "Esta etapa ya pasó."
            : `Esta etapa comienza a los ${etapa.edad_inicio} años.`,
      });
      setDetalleAbierto(true);
    },
    [],
  );

  // ── Estado: cargando ──────────────────────────────────────────────────

  if (cargandoCalculos && !modoManual) {
    return (
      <>
        <HeaderMobile titulo="Numerología" mostrarAtras />
        <div className="flex flex-col lg:flex-row h-full min-h-0 lg:overflow-hidden">
          <section className="flex-1 scroll-sutil bg-fondo p-5 lg:p-[28px_32px] flex flex-col gap-6 overflow-y-auto">
            <Esqueleto className="h-8 w-48" />
            <div className="flex gap-3">
              <Esqueleto className="h-[130px] flex-[2] rounded-xl" />
              <div className="flex-1 flex flex-col gap-3">
                <Esqueleto className="h-[58px] rounded-xl" />
                <Esqueleto className="h-[58px] rounded-xl" />
              </div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Esqueleto key={i} className="h-[100px] rounded-xl" />
              ))}
            </div>
            <Esqueleto className="h-[200px] rounded-xl" />
          </section>
        </div>
      </>
    );
  }

  // ── Estado: formulario ────────────────────────────────────────────────

  if (!datos || modoManual) {
    return (
      <>
        <HeaderMobile titulo="Numerología" mostrarAtras />
        <div className="flex flex-col lg:flex-row h-full min-h-0 lg:overflow-hidden">
          <section className="flex-1 scroll-sutil bg-fondo p-5 lg:p-[28px_32px] flex flex-col gap-6 overflow-y-auto">
            <div>
              <h1 className="text-[22px] font-semibold text-texto tracking-tight flex items-center gap-3">
                <IconoAstral
                  nombre="numerologia"
                  tamaño={28}
                  className="text-acento"
                />
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
                  <div className="flex flex-col gap-1.5 w-full">
                    <label className="text-[13px] font-medium text-texto-secundario">
                      Sistema de cálculo
                    </label>
                    <div className="flex gap-3">
                      {(["pitagorico", "caldeo"] as const).map((s) => (
                        <button
                          key={s}
                          type="button"
                          onClick={() => setSistema(s)}
                          className={cn(
                            "flex-1 py-2.5 px-4 rounded-lg border text-sm font-medium transition-colors",
                            sistema === s
                              ? "border-primario bg-fondo-elevado text-primario"
                              : "border-borde bg-fondo-tarjeta text-texto-secundario hover:border-violet-300",
                          )}
                        >
                          {s === "pitagorico" ? "Pitagórico" : "Caldeo"}
                        </button>
                      ))}
                    </div>
                  </div>
                  <Boton
                    type="submit"
                    variante="primario"
                    tamaño="lg"
                    cargando={mutacion.isPending}
                    icono={
                      <IconoAstral
                        nombre="numerologia"
                        tamaño={20}
                        className="text-current"
                      />
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
                    {mutacion.error?.message ??
                      "Error al calcular la numerología."}
                  </p>
                </div>
              )}
            </div>
          </section>
        </div>
      </>
    );
  }

  // ── Estado: resultados ────────────────────────────────────────────────

  const edadActual = calcularEdad(datos.fecha_nacimiento);
  const mesActual = new Date().getMonth() + 1;

  const esEtapaActiva = (etapa: EtapaVida) =>
    edadActual >= etapa.edad_inicio &&
    (etapa.edad_fin === null || edadActual < etapa.edad_fin);

  const numerosCore: { clave: string; titulo: string; dato: NumeroRespuesta }[] =
    [
      { clave: "camino_de_vida", titulo: "Camino de Vida", dato: datos.camino_de_vida },
      { clave: "expresion", titulo: "Expresión", dato: datos.expresion },
      { clave: "impulso_del_alma", titulo: "Impulso del Alma", dato: datos.impulso_del_alma },
      { clave: "personalidad", titulo: "Personalidad", dato: datos.personalidad },
      { clave: "numero_nacimiento", titulo: "Nacimiento", dato: datos.numero_nacimiento },
    ];

  return (
    <>
      <HeaderMobile titulo="Numerología" mostrarAtras />
      <div className="flex flex-col lg:flex-row h-full min-h-0 lg:overflow-hidden">
        {/* ─── Panel Central ──────────────────────────────────────────── */}
        <section className="flex-1 scroll-sutil bg-fondo p-5 lg:p-[28px_32px] flex flex-col gap-6 overflow-y-auto pb-24 lg:pb-8">
          {/* Header */}
          <div className="flex items-center justify-between">
            <h1 className="text-[22px] font-semibold text-texto tracking-tight flex items-center gap-3">
              <IconoAstral
                nombre="numerologia"
                tamaño={28}
                className="text-acento"
              />
              Numerología
            </h1>
            <div className="flex items-center gap-3">
              <p className="text-[13px] text-texto-secundario hidden sm:block">
                {datos.nombre} · {datos.fecha_nacimiento}
              </p>
              <Badge variante="info">
                {datos.sistema === "pitagorico" ? "Pitagórico" : "Caldeo"}
              </Badge>
            </div>
          </div>

          {/* Subtítulo */}
          <p className="text-[13px] text-texto-secundario -mt-3">
            Tocá cualquier número para ver su explicación detallada.
          </p>

          {/* ─── Hero: Día Personal + Año + Mes ───────────────────────── */}
          <div className="flex gap-3">
            {/* Día Personal — hero principal */}
            <button
              onClick={() =>
                abrirNumero("dia_personal", "Día Personal", datos.dia_personal)
              }
              className={cn(
                "flex-[2] rounded-xl p-5 text-left transition-all border cursor-pointer",
                "bg-gradient-to-br from-violet-900/60 to-fondo-tarjeta border-violet-700/40",
                "hover:border-violet-400",
                detalle?.clave === "dia_personal" &&
                  "ring-2 ring-violet-400/40",
              )}
            >
              <p className="text-[10px] font-semibold text-texto-secundario uppercase tracking-wider">
                Tu día hoy
              </p>
              <p className="text-[48px] font-bold text-primario leading-none mt-1">
                {datos.dia_personal.numero}
              </p>
              <p className="text-[12px] text-texto-secundario mt-2 leading-snug">
                {datos.dia_personal.descripcion}
              </p>
            </button>

            {/* Año + Mes */}
            <div className="flex-1 flex flex-col gap-3">
              <button
                onClick={() =>
                  abrirNumero(
                    "anio_personal",
                    "Año Personal",
                    datos.anio_personal,
                  )
                }
                className={cn(
                  "flex-1 rounded-xl p-4 text-left transition-all border cursor-pointer",
                  "bg-gradient-to-br from-violet-900/60 to-fondo-tarjeta border-violet-700/40",
                  "hover:border-violet-400",
                  detalle?.clave === "anio_personal" &&
                    "ring-2 ring-violet-400/40",
                )}
              >
                <p className="text-[10px] font-semibold text-texto-secundario uppercase tracking-wider">
                  Año
                </p>
                <p className="text-[28px] font-bold text-primario leading-none mt-0.5">
                  {datos.anio_personal.numero}
                </p>
              </button>
              <button
                onClick={() =>
                  abrirNumero(
                    "mes_personal",
                    "Mes Personal",
                    datos.mes_personal,
                  )
                }
                className={cn(
                  "flex-1 rounded-xl p-4 text-left transition-all border cursor-pointer",
                  "bg-fondo-tarjeta border-borde",
                  "hover:border-violet-400",
                  detalle?.clave === "mes_personal" &&
                    "ring-2 ring-violet-400/40",
                )}
              >
                <p className="text-[10px] font-semibold text-texto-secundario uppercase tracking-wider">
                  Mes
                </p>
                <p className="text-[28px] font-bold text-primario leading-none mt-0.5">
                  {datos.mes_personal.numero}
                </p>
              </button>
            </div>
          </div>

          {/* ─── Tus Números ──────────────────────────────────────────── */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <h2 className="text-lg font-bold text-texto">Tus Números</h2>
              {datos.numeros_maestros_presentes?.length > 0 && (
                <Badge variante="advertencia">
                  Maestros: {datos.numeros_maestros_presentes.join(", ")}
                </Badge>
              )}
            </div>
            <p className="text-[12px] text-texto-secundario mb-3">
              Los números clave que definen tu personalidad y propósito
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
              {numerosCore.map(({ clave, titulo, dato }) => {
                const maestro = esMaestro(dato.numero);
                const seleccionado = detalle?.clave === clave;
                return (
                  <button
                    key={clave}
                    onClick={() => abrirNumero(clave, titulo, dato)}
                    className={cn(
                      "rounded-xl p-4 text-center transition-all border cursor-pointer",
                      seleccionado
                        ? "bg-fondo-elevado border-violet-300 ring-2 ring-violet-300/30"
                        : maestro
                          ? "bg-dorado-300/10 border-dorado-400/20 hover:border-dorado-400/50"
                          : clave === "camino_de_vida"
                            ? "bg-gradient-to-br from-violet-900/60 to-fondo-tarjeta border-violet-700/40 hover:border-violet-400"
                            : "bg-fondo-tarjeta border-borde hover:border-violet-300",
                    )}
                  >
                    {ICONO_NUMERO[clave] && (
                      <div className="flex justify-center mb-1.5">
                        <IconoAstral
                          nombre={
                            ICONO_NUMERO[clave] as Parameters<
                              typeof IconoAstral
                            >[0]["nombre"]
                          }
                          tamaño={18}
                          className="text-primario"
                        />
                      </div>
                    )}
                    <p
                      className={cn(
                        "text-3xl font-bold",
                        maestro ? "text-acento" : "text-primario",
                      )}
                    >
                      {dato.numero}
                    </p>
                    <p className="text-[10px] font-semibold text-texto-secundario uppercase tracking-wider mt-1">
                      {titulo}
                    </p>
                    {maestro && (
                      <Badge variante="advertencia" className="mt-2">
                        Maestro
                      </Badge>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* ─── 12 Meses del Año ─────────────────────────────────────── */}
          {datos.meses_personales && datos.meses_personales.length > 0 && (
            <div>
              <h2 className="text-lg font-bold text-texto mb-1">
                Tus 12 Meses del Año
              </h2>
              <p className="text-[12px] text-texto-secundario mb-3">
                Cada mes tiene una vibración diferente · Año Personal{" "}
                {datos.anio_personal.numero}
              </p>
              <div className="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-12 gap-2">
                {datos.meses_personales.map((item) => {
                  const esActual = item.mes === mesActual;
                  const seleccionado =
                    detalle?.titulo === `Mes Personal — ${item.nombre_mes}`;
                  return (
                    <button
                      key={item.mes}
                      onClick={() => abrirMes(item)}
                      className={cn(
                        "rounded-xl py-3 px-2 text-center transition-all border cursor-pointer",
                        seleccionado
                          ? "bg-fondo-elevado border-violet-300 ring-2 ring-violet-300/30"
                          : esActual
                            ? "bg-primario/10 border-primario/30"
                            : "bg-fondo-tarjeta border-borde hover:border-violet-300",
                      )}
                    >
                      <p className="text-[10px] font-semibold text-texto-secundario uppercase">
                        {item.nombre_mes.substring(0, 3)}
                      </p>
                      <p
                        className={cn(
                          "text-xl font-bold mt-0.5",
                          esActual ? "text-primario" : "text-texto",
                        )}
                      >
                        {item.numero}
                      </p>
                      {esActual && (
                        <div className="w-1.5 h-1.5 rounded-full bg-primario mx-auto mt-1" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* ─── Etapas de Vida ───────────────────────────────────────── */}
          {datos.etapas_de_la_vida?.length > 0 && (
            <div>
              <h2 className="text-lg font-bold text-texto mb-1">
                Etapas de Vida
              </h2>
              <p className="text-[12px] text-texto-secundario mb-3">
                Los 4 grandes períodos de tu vida · Tenés {edadActual} años
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {datos.etapas_de_la_vida.map((etapa, idx) => {
                  const activa = esEtapaActiva(etapa);
                  const pasada =
                    etapa.edad_fin !== null && edadActual >= etapa.edad_fin;
                  const maestro = esMaestro(etapa.numero);
                  return (
                    <button
                      key={idx}
                      onClick={() => abrirEtapa(etapa, idx, edadActual)}
                      className={cn(
                        "rounded-xl p-4 text-left transition-all border cursor-pointer",
                        activa
                          ? "bg-gradient-to-br from-violet-900/60 to-fondo-tarjeta border-violet-400 ring-2 ring-violet-400/20"
                          : "bg-fondo-tarjeta border-borde hover:border-violet-300",
                        pasada && "opacity-50",
                      )}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div
                          className={cn(
                            "w-10 h-10 rounded-full flex items-center justify-center",
                            activa
                              ? "bg-primario/20"
                              : "bg-fondo-elevado",
                          )}
                        >
                          <span
                            className={cn(
                              "text-lg font-bold",
                              activa ? "text-primario" : "text-texto",
                            )}
                          >
                            {etapa.numero}
                          </span>
                        </div>
                        <div className="flex gap-1.5">
                          {activa && <Badge variante="info">Ahora</Badge>}
                          {maestro && (
                            <Badge variante="advertencia">Maestro</Badge>
                          )}
                        </div>
                      </div>
                      <p className="text-[13px] font-semibold text-texto">
                        {etapa.nombre || `Pináculo ${idx + 1}`}
                      </p>
                      <p className="text-[11px] text-texto-terciario">
                        De {etapa.edad_inicio} a {etapa.edad_fin ?? "∞"} años
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Nuevo cálculo */}
          <button
            onClick={() => {
              setModoManual(true);
              setDatosManual(null);
              setDetalle(null);
            }}
            className="self-start flex items-center gap-2 text-[13px] text-texto-secundario hover:text-primario transition-colors"
          >
            <Icono nombre="flechaIzquierda" tamaño={16} />
            Nuevo cálculo
          </button>
        </section>

        {/* ─── Panel Derecho — Detalle (Desktop) ─────────────────────── */}
        <aside className="hidden lg:flex w-[320px] flex-shrink-0 bg-fondo-tarjeta flex-col border-l border-borde overflow-hidden">
          <div className="p-5 pb-3 shrink-0">
            <h3 className="text-[15px] font-semibold text-texto">
              Detalle del Número
            </h3>
          </div>
          <div className="h-px bg-borde mx-5" />

          {detalle ? (
            <div className="flex-1 overflow-y-auto scroll-sutil p-5 pt-4 flex flex-col gap-4">
              {/* Número grande */}
              <div className="flex flex-col items-center gap-2 py-4">
                {ICONO_NUMERO[detalle.clave] && (
                  <IconoAstral
                    nombre={
                      ICONO_NUMERO[detalle.clave] as Parameters<
                        typeof IconoAstral
                      >[0]["nombre"]
                    }
                    tamaño={32}
                    className="text-primario"
                  />
                )}
                <p
                  className={cn(
                    "text-5xl font-bold",
                    detalle.esMaestro ? "text-acento" : "text-primario",
                  )}
                >
                  {detalle.numero}
                </p>
                <p className="text-[13px] font-semibold text-texto uppercase tracking-wider text-center">
                  {detalle.titulo}
                </p>
                {detalle.esMaestro && (
                  <Badge variante="advertencia">Número Maestro</Badge>
                )}
              </div>

              {/* Qué significa */}
              <div className="rounded-xl bg-fondo-elevado p-4">
                <p className="text-[10px] font-semibold text-texto-secundario uppercase tracking-wider mb-2">
                  Qué significa
                </p>
                <p className="text-[13px] text-texto leading-relaxed">
                  {detalle.que_es}
                </p>
              </div>

              {/* Significado del número */}
              <div className="rounded-xl bg-fondo-elevado p-4">
                <p className="text-[10px] font-semibold text-texto-secundario uppercase tracking-wider mb-2">
                  El número {detalle.numero}
                </p>
                <p className="text-[14px] font-semibold text-primario mb-1">
                  {detalle.descripcion}
                </p>
                {detalle.descripcion_larga && (
                  <p className="text-[13px] text-texto-secundario leading-relaxed">
                    {detalle.descripcion_larga}
                  </p>
                )}
              </div>

              {/* Extra (etapas) */}
              {detalle.extra && (
                <div className="rounded-xl bg-primario/10 border border-primario/20 p-4">
                  <p className="text-[13px] font-semibold text-primario">
                    {detalle.extra}
                  </p>
                </div>
              )}

              {/* Resumen compacto */}
              <div className="pt-2">
                <p className="text-[10px] font-semibold text-texto-secundario uppercase tracking-wider mb-2">
                  Todos tus números
                </p>
                <div className="flex flex-col">
                  {[
                    ...numerosCore,
                    {
                      clave: "anio_personal",
                      titulo: "Año Personal",
                      dato: datos.anio_personal,
                    },
                  ].map(({ clave, titulo, dato }) => (
                    <button
                      key={clave}
                      onClick={() => abrirNumero(clave, titulo, dato)}
                      className={cn(
                        "flex items-center justify-between px-3 py-2.5 rounded-xl transition-colors",
                        detalle.clave === clave
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
                          esMaestro(dato.numero) ? "text-acento" : "text-primario",
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
              <IconoAstral
                nombre="numerologia"
                tamaño={32}
                className="text-primario opacity-40"
              />
              <p className="text-sm text-texto-secundario">
                Seleccioná un número para ver el detalle
              </p>
            </div>
          )}
        </aside>
      </div>

      {/* ─── Panel Detalle — Mobile (overlay bottom) ─────────────────── */}
      {detalleAbierto && detalle && (
        <div className="lg:hidden fixed inset-0 z-50 flex flex-col justify-end">
          {/* Backdrop */}
          <button
            onClick={() => setDetalleAbierto(false)}
            className="absolute inset-0 bg-black/40"
            aria-label="Cerrar detalle"
          />
          {/* Panel */}
          <div className="relative bg-fondo-tarjeta rounded-t-2xl max-h-[75vh] overflow-y-auto scroll-sutil animate-in slide-in-from-bottom duration-200">
            {/* Handle */}
            <div className="sticky top-0 bg-fondo-tarjeta pt-3 pb-2 flex justify-center rounded-t-2xl z-10">
              <div className="w-10 h-1 rounded-full bg-borde" />
            </div>
            <div className="px-5 pb-8 flex flex-col gap-4">
              {/* Número */}
              <div className="flex flex-col items-center gap-2 py-2">
                <p
                  className={cn(
                    "text-5xl font-bold",
                    detalle.esMaestro ? "text-acento" : "text-primario",
                  )}
                >
                  {detalle.numero}
                </p>
                <p className="text-[14px] font-semibold text-texto uppercase tracking-wider text-center">
                  {detalle.titulo}
                </p>
                {detalle.esMaestro && (
                  <Badge variante="advertencia">Número Maestro</Badge>
                )}
              </div>

              {/* Qué significa */}
              <div className="rounded-xl bg-fondo-elevado p-4">
                <p className="text-[10px] font-semibold text-texto-secundario uppercase tracking-wider mb-2">
                  Qué significa
                </p>
                <p className="text-[13px] text-texto leading-relaxed">
                  {detalle.que_es}
                </p>
              </div>

              {/* Significado del número */}
              <div className="rounded-xl bg-fondo-elevado p-4">
                <p className="text-[10px] font-semibold text-texto-secundario uppercase tracking-wider mb-2">
                  El número {detalle.numero}
                </p>
                <p className="text-[14px] font-semibold text-primario mb-1">
                  {detalle.descripcion}
                </p>
                {detalle.descripcion_larga && (
                  <p className="text-[13px] text-texto-secundario leading-relaxed">
                    {detalle.descripcion_larga}
                  </p>
                )}
              </div>

              {/* Extra */}
              {detalle.extra && (
                <div className="rounded-xl bg-primario/10 border border-primario/20 p-4">
                  <p className="text-[13px] font-semibold text-primario">
                    {detalle.extra}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
