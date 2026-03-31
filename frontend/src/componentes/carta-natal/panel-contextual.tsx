"use client";

import { useState } from "react";
import { Icono } from "@/componentes/ui/icono";
import { IconoSigno } from "@/componentes/ui/icono-astral";
import { ETIQUETA_CARTA } from "@/componentes/carta-natal/estilos";
import {
  ARQUETIPO_PLANETA,
  BADGE_ASPECTO,
  COLORES_ELEMENTO,
  COLORES_PLANETA,
  DIGNIDAD_BADGE,
  ELEMENTO_SIGNO,
  MODALIDAD_SIGNO,
  NARRATIVA_ASPECTO,
  REGENTE_SIGNO,
  ROMANO,
  SIMBOLOS_ASPECTO,
  TEMA_CASA,
  calcularDistribucion,
  interpretarAspecto,
  interpretarCasa,
  interpretarPlaneta,
  interpretarTriada,
  normalizarClave,
} from "@/lib/utilidades/interpretaciones-natal";
import type { Aspecto, CartaNatal, Casa, Planeta } from "@/lib/tipos";

export type SeleccionContextual =
  | { tipo: "default" }
  | { tipo: "planeta"; planeta: Planeta }
  | { tipo: "aspecto"; aspecto: Aspecto }
  | { tipo: "casa"; casa: Casa }
  | { tipo: "triada"; subtipo: "sol" | "luna" | "ascendente" };

interface PanelContextualProps {
  seleccion: SeleccionContextual;
  datos: CartaNatal;
  onCerrar: () => void;
}

const TARJETA_PANEL =
  "rounded-[20px] border border-white/10 bg-white/[0.08] p-4 backdrop-blur-xl";

const TARJETA_PANEL_SUAVE =
  "rounded-2xl border border-white/10 bg-white/[0.05] p-4";

function SeccionPanel({
  titulo,
  contenido,
}: {
  titulo: string;
  contenido: string;
}) {
  return (
    <div className={TARJETA_PANEL}>
      <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-violet-200/72">
        {titulo}
      </p>
      <p className="mt-2 text-[13px] leading-relaxed text-violet-50/88">
        {contenido}
      </p>
    </div>
  );
}

function CabeceraPanel({
  etiqueta,
  titulo,
  subtitulo,
  onCerrar,
}: {
  etiqueta: string;
  titulo: string;
  subtitulo: string;
  onCerrar: () => void;
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div>
        <p className={`${ETIQUETA_CARTA} text-violet-200/72`}>{etiqueta}</p>
        <h3 className="mt-2 text-[20px] font-semibold tracking-tight text-white">
          {titulo}
        </h3>
        <p className="mt-2 text-[13px] leading-relaxed text-violet-100/68">
          {subtitulo}
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
  );
}

function obtenerResumenAspecto(aspecto: Aspecto) {
  const clave = normalizarClave(aspecto.tipo);
  const badge = BADGE_ASPECTO[clave];

  if (!badge) {
    return `Este aspecto conecta ${aspecto.planeta1} y ${aspecto.planeta2} de forma significativa.`;
  }

  return `La ${badge.label.toLowerCase()} conecta ${aspecto.planeta1} y ${aspecto.planeta2} y describe cómo interactúan esas dos funciones dentro de tu carta.`;
}

function obtenerObservacionPlaneta(planeta: Planeta, datos: CartaNatal) {
  const aspectosRelacionados = datos.aspectos.filter(
    (aspecto) =>
      aspecto.planeta1 === planeta.nombre || aspecto.planeta2 === planeta.nombre,
  );
  const temaCasa = TEMA_CASA[planeta.casa] || "esta área de vida";

  return `${planeta.nombre} descarga su energía sobre ${temaCasa}. ${
    planeta.retrogrado
      ? "Al estar retrógrado, primero pide revisión interna antes de mostrarse hacia afuera."
      : "Tiende a expresarse con mayor disponibilidad en el mundo externo."
  } ${
    aspectosRelacionados.length > 0
      ? `Además no opera solo: se enlaza con ${aspectosRelacionados.length} aspecto${aspectosRelacionados.length === 1 ? "" : "s"} que matizan su expresión.`
      : "Su expresión aparece más limpia y directa dentro del conjunto de la carta."
  }`;
}

function obtenerObservacionAspecto(aspecto: Aspecto) {
  const precision =
    aspecto.orbe < 2
      ? "Se siente con mucha fuerza porque el orbe es muy estrecho."
      : aspecto.orbe < 5
        ? "Tiene una presencia clara y consistente en la experiencia."
        : "Opera de forma más sutil, pero sigue coloreando tu manera de vivir esas dos energías.";

  const movimiento = aspecto.aplicativo
    ? "Al ser aplicativo, esta dinámica tiende a intensificarse cuando una situación la activa."
    : "Al ser separativo, suele sentirse como un patrón ya conocido que aprendiste a reconocer.";

  return `${precision} ${movimiento}`;
}

function obtenerObservacionCasa(casa: Casa, planetasEnCasa: string[]) {
  const regente = REGENTE_SIGNO[casa.signo] || casa.signo;

  return `Con ${casa.signo} en la cúspide, ${regente} marca el tono de esta casa. ${
    planetasEnCasa.length > 0
      ? `Como además están presentes ${planetasEnCasa.join(", ")}, este territorio toma más protagonismo en tu historia.`
      : "Aunque no tenga planetas adentro, sigue activa a través de la posición de su regente en la carta."
  }`;
}

function obtenerDefinicionTriada(subtipo: "sol" | "luna" | "ascendente") {
  if (subtipo === "sol") {
    return "El Sol representa tu identidad esencial, la dirección que querés sostener y la cualidad central con la que buscás irradiar.";
  }

  if (subtipo === "luna") {
    return "La Luna muestra tu manera de sentir, procesar y buscar seguridad emocional. Es la capa más íntima y reactiva de la carta.";
  }

  return "El Ascendente es la puerta de entrada a tu carta. Habla de tu presencia, tu tono inicial y la forma en que empezás a relacionarte con el mundo.";
}

export function PanelContextual({
  seleccion,
  datos,
  onCerrar,
}: PanelContextualProps) {
  const mostrarDatosTecnicos =
    seleccion.tipo === "planeta" ||
    seleccion.tipo === "aspecto" ||
    seleccion.tipo === "casa";
  const [seleccionTecnicaActiva, setSeleccionTecnicaActiva] = useState<string | null>(null);
  const claveSeleccionTecnica =
    seleccion.tipo === "planeta"
      ? `planeta:${seleccion.planeta.nombre}`
      : seleccion.tipo === "aspecto"
        ? `aspecto:${seleccion.aspecto.planeta1}:${seleccion.aspecto.planeta2}:${seleccion.aspecto.tipo}`
        : seleccion.tipo === "casa"
          ? `casa:${seleccion.casa.numero}`
          : null;
  const mostrarTecnico =
    claveSeleccionTecnica !== null && seleccionTecnicaActiva === claveSeleccionTecnica;

  return (
    <div className="flex h-full flex-col text-white">
      <div className="flex-1 overflow-y-auto scroll-sutil">
        {seleccion.tipo === "default" && <VistaDefault datos={datos} />}
        {seleccion.tipo === "planeta" && (
          <VistaPlaneta planeta={seleccion.planeta} datos={datos} onCerrar={onCerrar} />
        )}
        {seleccion.tipo === "aspecto" && (
          <VistaAspecto aspecto={seleccion.aspecto} onCerrar={onCerrar} />
        )}
        {seleccion.tipo === "casa" && (
          <VistaCasa casa={seleccion.casa} datos={datos} onCerrar={onCerrar} />
        )}
        {seleccion.tipo === "triada" && (
          <VistaTriada subtipo={seleccion.subtipo} datos={datos} onCerrar={onCerrar} />
        )}
      </div>

      {mostrarDatosTecnicos && (
        <div className="border-t border-white/10 bg-[#140c27]/86">
          <button
            type="button"
            onClick={() =>
              setSeleccionTecnicaActiva((actual) =>
                actual === claveSeleccionTecnica ? null : claveSeleccionTecnica,
              )
            }
            className="flex w-full items-center justify-between px-5 py-3 text-[11px] font-medium uppercase tracking-[0.16em] text-violet-100/68 transition-colors hover:bg-white/[0.04]"
          >
            <span>Datos técnicos</span>
            <Icono nombre={mostrarTecnico ? "caretUp" : "caretDown"} tamaño={14} />
          </button>

          {mostrarTecnico && (
            <div className="space-y-1 px-5 pb-4 text-[11px] text-violet-100/72">
              {seleccion.tipo === "planeta" && (
                <>
                  <p>Longitud eclíptica: {seleccion.planeta.longitud.toFixed(4)}°</p>
                  <p>Latitud: {seleccion.planeta.latitud.toFixed(4)}°</p>
                  <p>Velocidad: {seleccion.planeta.velocidad.toFixed(4)}°/día</p>
                </>
              )}
              {seleccion.tipo === "aspecto" && (
                <>
                  <p>Ángulo exacto: {seleccion.aspecto.angulo_exacto.toFixed(4)}°</p>
                  <p>Orbe: {seleccion.aspecto.orbe.toFixed(4)}°</p>
                </>
              )}
              {seleccion.tipo === "casa" && (
                <>
                  <p>Grado absoluto: {seleccion.casa.grado.toFixed(4)}°</p>
                  <p>Grado en signo: {seleccion.casa.grado_en_signo.toFixed(4)}°</p>
                </>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function VistaDefault({ datos }: { datos: CartaNatal }) {
  const dist = calcularDistribucion(datos.planetas);
  const elementoDominante = Object.entries(dist.elementos).sort(
    (a, b) => b[1] - a[1],
  )[0];
  const modalidadDominante = Object.entries(dist.modalidades).sort(
    (a, b) => b[1] - a[1],
  )[0];

  return (
    <div className="p-5 lg:p-6">
      <div className="flex h-full flex-col">
        <div className="rounded-[24px] border border-white/10 bg-white/[0.08] p-5 backdrop-blur-xl">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.08] text-[#D4A234]">
            <Icono nombre="destello" tamaño={26} peso="fill" />
          </div>

          <p className={`${ETIQUETA_CARTA} mt-4 text-violet-200/72`}>
            Panel contextual
          </p>
          <h2 className="mt-2 text-[22px] font-semibold tracking-tight text-white">
            Leé la carta por capas
          </h2>
          <p className="mt-3 text-[14px] leading-relaxed text-violet-100/70">
            Cada bloque técnico es clickeable. Primero ves qué representa ese dato
            en astrología y luego cómo se manifiesta específicamente en tu carta.
          </p>
        </div>

        <div className="mt-4 grid gap-3">
          <div className={TARJETA_PANEL}>
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-violet-200/70">
              Elemento dominante
            </p>
            <div className="mt-2 flex items-center gap-2">
              <div
                className="h-3 w-3 rounded-full"
                style={{ backgroundColor: COLORES_ELEMENTO[elementoDominante[0]] }}
              />
              <p className="text-sm font-semibold text-white">{elementoDominante[0]}</p>
            </div>
            <p className="mt-1 text-[12px] text-violet-100/62">
              {elementoDominante[1]} planetas sostienen este tono.
            </p>
          </div>

          <div className={TARJETA_PANEL}>
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-violet-200/70">
              Modalidad dominante
            </p>
            <p className="mt-2 text-sm font-semibold text-white">{modalidadDominante[0]}</p>
            <p className="mt-1 text-[12px] text-violet-100/62">
              {modalidadDominante[1]} planetas repiten este patrón.
            </p>
          </div>

          <div className={TARJETA_PANEL}>
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-violet-200/70">
              Qué podés abrir
            </p>
            <div className="mt-3 grid gap-2">
              {[
                "Rueda y tríada para leer el mapa general.",
                "Planetas y aspectos para ver dinámica interna.",
                "Casas para ubicar dónde se juega cada tema.",
              ].map((item) => (
                <div key={item} className={TARJETA_PANEL_SUAVE}>
                  <p className="text-[12px] leading-relaxed text-violet-50/84">
                    {item}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function VistaPlaneta({
  planeta,
  datos,
  onCerrar,
}: {
  planeta: Planeta;
  datos: CartaNatal;
  onCerrar: () => void;
}) {
  const elemento = ELEMENTO_SIGNO[planeta.signo] || "—";
  const modalidad = MODALIDAD_SIGNO[planeta.signo] || "—";
  const regente = REGENTE_SIGNO[planeta.signo] || "—";
  const colorPlaneta = COLORES_PLANETA[planeta.nombre] || "#7C4DFF";
  const narrativa = interpretarPlaneta(
    planeta.nombre,
    planeta.signo,
    planeta.casa,
    planeta.dignidad,
    planeta.retrogrado,
  );
  const aspectosRelacionados = datos.aspectos.filter(
    (aspecto) =>
      aspecto.planeta1 === planeta.nombre || aspecto.planeta2 === planeta.nombre,
  );
  const dignidadClave = planeta.dignidad ? normalizarClave(planeta.dignidad) : null;
  const dignidad = dignidadClave ? DIGNIDAD_BADGE[dignidadClave] : null;
  const resumenGeneral =
    ARQUETIPO_PLANETA[planeta.nombre]
      ? `${planeta.nombre} representa ${ARQUETIPO_PLANETA[planeta.nombre]}.`
      : `${planeta.nombre} señala una función importante dentro de tu carta.`;

  return (
    <div className="p-5 lg:p-6">
      <CabeceraPanel
        etiqueta="Planeta"
        titulo={`${planeta.nombre} en ${planeta.signo}`}
        subtitulo={`Casa ${ROMANO[planeta.casa]} · ${planeta.grado_en_signo.toFixed(1)}°`}
        onCerrar={onCerrar}
      />

      <div className="mt-4 flex items-center gap-3 rounded-[24px] border border-white/10 bg-white/[0.08] p-4">
        <div
          className="flex h-14 w-14 items-center justify-center rounded-2xl border"
          style={{
            backgroundColor: `${colorPlaneta}22`,
            borderColor: `${colorPlaneta}55`,
            color: colorPlaneta,
          }}
        >
          <IconoSigno signo={planeta.signo} tamaño={28} />
        </div>

        <div>
          <p className="text-sm font-semibold text-white">{planeta.signo}</p>
          <p className="mt-1 text-[12px] text-violet-100/62">
            {planeta.retrogrado ? "Movimiento retrógrado" : "Movimiento directo"}
          </p>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-3">
        {[
          { etiqueta: "Elemento", valor: elemento },
          { etiqueta: "Modalidad", valor: modalidad },
          { etiqueta: "Regente", valor: regente },
        ].map((item) => (
          <div key={item.etiqueta} className={TARJETA_PANEL_SUAVE}>
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-violet-200/70">
              {item.etiqueta}
            </p>
            <p className="mt-2 text-[13px] font-semibold text-white">{item.valor}</p>
          </div>
        ))}
      </div>

      {planeta.dignidad && (
        <div className="mt-4">
          <div className={TARJETA_PANEL}>
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-violet-200/70">
              Dignidad
            </p>
            <div className="mt-2">
              {dignidad ? (
                <span
                  className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-medium ${dignidad.bg} ${dignidad.text}`}
                >
                  {planeta.dignidad}
                </span>
              ) : (
                <span className="text-sm text-white">{planeta.dignidad}</span>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="mt-4 space-y-3">
        <SeccionPanel titulo="Qué es" contenido={resumenGeneral} />
        <SeccionPanel titulo="En tu carta" contenido={narrativa} />
        <SeccionPanel
          titulo="Qué observar"
          contenido={obtenerObservacionPlaneta(planeta, datos)}
        />
      </div>

      {aspectosRelacionados.length > 0 && (
        <div className="mt-4">
          <div className={TARJETA_PANEL}>
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-violet-200/70">
              Aspectos vinculados
            </p>
            <div className="mt-3 grid gap-2">
              {aspectosRelacionados.map((aspecto, idx) => {
                const clave = normalizarClave(aspecto.tipo);
                const badge = BADGE_ASPECTO[clave];
                const simbolo = SIMBOLOS_ASPECTO[clave] || "·";
                const otroPlaneta =
                  aspecto.planeta1 === planeta.nombre
                    ? aspecto.planeta2
                    : aspecto.planeta1;

                return (
                  <div
                    key={`${aspecto.planeta1}-${aspecto.planeta2}-${idx}`}
                    className={TARJETA_PANEL_SUAVE}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-[12px] font-medium text-white">
                        {simbolo} {otroPlaneta}
                      </p>
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] text-violet-100/62">
                          {aspecto.orbe.toFixed(1)}°
                        </span>
                        {badge && (
                          <span
                            className={`rounded-full px-2 py-1 text-[10px] font-medium ${badge.bg} ${badge.text}`}
                          >
                            {badge.label}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function VistaAspecto({
  aspecto,
  onCerrar,
}: {
  aspecto: Aspecto;
  onCerrar: () => void;
}) {
  const clave = normalizarClave(aspecto.tipo);
  const badge = BADGE_ASPECTO[clave];
  const narrativa = interpretarAspecto(
    aspecto.planeta1,
    aspecto.planeta2,
    aspecto.tipo,
    aspecto.orbe,
    aspecto.aplicativo,
  );

  return (
    <div className="p-5 lg:p-6">
      <CabeceraPanel
        etiqueta="Aspecto"
        titulo={`${aspecto.planeta1} · ${badge?.label || aspecto.tipo} · ${aspecto.planeta2}`}
        subtitulo={`${aspecto.aplicativo ? "Aplicativo" : "Separativo"} · Orbe ${aspecto.orbe.toFixed(1)}°`}
        onCerrar={onCerrar}
      />

      <div className="mt-4 grid grid-cols-3 gap-3">
        {[
          { etiqueta: "Planeta 1", valor: aspecto.planeta1 },
          { etiqueta: "Aspecto", valor: badge?.label || aspecto.tipo },
          { etiqueta: "Planeta 2", valor: aspecto.planeta2 },
        ].map((item) => (
          <div key={item.etiqueta} className={TARJETA_PANEL_SUAVE}>
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-violet-200/70">
              {item.etiqueta}
            </p>
            <p className="mt-2 text-[13px] font-semibold text-white">{item.valor}</p>
          </div>
        ))}
      </div>

      <div className="mt-4 space-y-3">
        <SeccionPanel titulo="Qué es" contenido={obtenerResumenAspecto(aspecto)} />
        <SeccionPanel titulo="En tu carta" contenido={narrativa} />
        <SeccionPanel
          titulo="Qué observar"
          contenido={obtenerObservacionAspecto(aspecto)}
        />
      </div>

      <div className="mt-4">
        <div className={TARJETA_PANEL}>
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-violet-200/70">
            Clave del vínculo
          </p>
          <p className="mt-2 text-[13px] leading-relaxed text-violet-50/88">
            {NARRATIVA_ASPECTO[clave] ||
              "Estas dos energías forman una dinámica relevante dentro de tu carta."}
          </p>
        </div>
      </div>
    </div>
  );
}

function VistaCasa({
  casa,
  datos,
  onCerrar,
}: {
  casa: Casa;
  datos: CartaNatal;
  onCerrar: () => void;
}) {
  const planetasEnCasa = datos.planetas
    .filter((planeta) => planeta.casa === casa.numero)
    .map((planeta) => planeta.nombre);
  const regente = REGENTE_SIGNO[casa.signo] || casa.signo;
  const narrativa = interpretarCasa(casa.numero, casa.signo, planetasEnCasa);
  const resumenGeneral = `La Casa ${ROMANO[casa.numero]} abarca ${
    TEMA_CASA[casa.numero] || "un territorio importante de experiencia"
  }.`;

  return (
    <div className="p-5 lg:p-6">
      <CabeceraPanel
        etiqueta="Casa"
        titulo={`Casa ${ROMANO[casa.numero]} en ${casa.signo}`}
        subtitulo={`${casa.grado_en_signo.toFixed(1)}° · Regente ${regente}`}
        onCerrar={onCerrar}
      />

      <div className="mt-4 flex items-center gap-3 rounded-[24px] border border-white/10 bg-white/[0.08] p-4">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.08] text-[#D4A234]">
          <IconoSigno signo={casa.signo} tamaño={28} />
        </div>
        <div>
          <p className="text-sm font-semibold text-white">{casa.signo}</p>
          <p className="mt-1 text-[12px] text-violet-100/62">
            Cúspide de la Casa {ROMANO[casa.numero]}
          </p>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-3">
        {[
          { etiqueta: "Regente", valor: regente },
          { etiqueta: "Planetas", valor: String(planetasEnCasa.length) },
          { etiqueta: "Grado", valor: `${casa.grado_en_signo.toFixed(1)}°` },
        ].map((item) => (
          <div key={item.etiqueta} className={TARJETA_PANEL_SUAVE}>
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-violet-200/70">
              {item.etiqueta}
            </p>
            <p className="mt-2 text-[13px] font-semibold text-white">{item.valor}</p>
          </div>
        ))}
      </div>

      <div className="mt-4 space-y-3">
        <SeccionPanel titulo="Qué es" contenido={resumenGeneral} />
        <SeccionPanel titulo="En tu carta" contenido={narrativa} />
        <SeccionPanel
          titulo="Qué observar"
          contenido={obtenerObservacionCasa(casa, planetasEnCasa)}
        />
      </div>

      {planetasEnCasa.length > 0 && (
        <div className="mt-4">
          <div className={TARJETA_PANEL}>
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-violet-200/70">
              Planetas presentes
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {planetasEnCasa.map((nombre) => (
                <span
                  key={nombre}
                  className="rounded-full border border-white/10 bg-white/[0.08] px-3 py-1.5 text-[11px] font-medium text-white"
                >
                  {nombre}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function VistaTriada({
  subtipo,
  datos,
  onCerrar,
}: {
  subtipo: "sol" | "luna" | "ascendente";
  datos: CartaNatal;
  onCerrar: () => void;
}) {
  const sol = datos.planetas.find((planeta) => planeta.nombre === "Sol")!;
  const luna = datos.planetas.find((planeta) => planeta.nombre === "Luna")!;
  const narrativa = interpretarTriada(
    sol.signo,
    sol.casa,
    luna.signo,
    luna.casa,
    datos.ascendente.signo,
  );

  const titulo =
    subtipo === "sol"
      ? `Sol en ${sol.signo}`
      : subtipo === "luna"
        ? `Luna en ${luna.signo}`
        : `Ascendente en ${datos.ascendente.signo}`;

  const detalle =
    subtipo === "sol"
      ? interpretarPlaneta("Sol", sol.signo, sol.casa, sol.dignidad, sol.retrogrado)
      : subtipo === "luna"
        ? interpretarPlaneta("Luna", luna.signo, luna.casa, luna.dignidad, luna.retrogrado)
        : `Tu Ascendente en ${datos.ascendente.signo} define la primera impresión que generás y el filtro inicial con el que entrás en la experiencia.`;

  return (
    <div className="p-5 lg:p-6">
      <CabeceraPanel
        etiqueta="Tríada principal"
        titulo={titulo}
        subtitulo="La identidad, la emoción y la presencia son el eje más visible de tu carta."
        onCerrar={onCerrar}
      />

      <div className="mt-4 grid gap-3">
        <SeccionPanel titulo="Qué es" contenido={obtenerDefinicionTriada(subtipo)} />
        <SeccionPanel titulo="En tu carta" contenido={detalle} />
        <SeccionPanel
          titulo="Lectura integrada"
          contenido={narrativa}
        />
      </div>

      <div className="mt-4 grid grid-cols-3 gap-3">
        {[
          { etiqueta: "Sol", valor: sol.signo },
          { etiqueta: "Luna", valor: luna.signo },
          { etiqueta: "Ascendente", valor: datos.ascendente.signo },
        ].map((item) => (
          <div key={item.etiqueta} className={TARJETA_PANEL_SUAVE}>
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-violet-200/70">
              {item.etiqueta}
            </p>
            <p className="mt-2 text-[13px] font-semibold text-white">{item.valor}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
