"use client";

import { useState } from "react";
import { Icono } from "@/componentes/ui/icono";
import { IconoSigno } from "@/componentes/ui/icono-astral";
import {
  COLORES_PLANETA,
  ELEMENTO_SIGNO,
  MODALIDAD_SIGNO,
  REGENTE_SIGNO,
  ROMANO,
  DIGNIDAD_BADGE,
  BADGE_ASPECTO,
  SIMBOLOS_ASPECTO,
  COLORES_ELEMENTO,
  normalizarClave,
  interpretarPlaneta,
  interpretarAspecto,
  interpretarCasa,
  interpretarTriada,
  calcularDistribucion,
} from "@/lib/utilidades/interpretaciones-natal";
import type { CartaNatal, Planeta, Aspecto, Casa } from "@/lib/tipos";

// ---------------------------------------------------------------------------
// Tipos de selección
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Componente principal
// ---------------------------------------------------------------------------

export function PanelContextual({ seleccion, datos, onCerrar }: PanelContextualProps) {
  const [mostrarTecnico, setMostrarTecnico] = useState(false);

  return (
    <div className="flex flex-col h-full">
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

      {/* Sección técnica colapsable */}
      {seleccion.tipo !== "default" && (
        <div className="border-t border-[#E8E4E0]/40">
          <button
            onClick={() => setMostrarTecnico(!mostrarTecnico)}
            className="w-full flex items-center justify-between px-5 py-3 text-[11px] text-[#8A8580] uppercase tracking-wider font-medium hover:bg-[#FAFAFA] transition-colors"
          >
            <span>Datos técnicos</span>
            <Icono nombre={mostrarTecnico ? "caretUp" : "caretDown"} tamaño={14} />
          </button>
          {mostrarTecnico && (
            <div className="px-5 pb-4 text-[11px] text-[#8A8580] space-y-1">
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

// ---------------------------------------------------------------------------
// Vista default — Resumen rápido
// ---------------------------------------------------------------------------

function VistaDefault({ datos }: { datos: CartaNatal }) {
  const dist = calcularDistribucion(datos.planetas);
  const elementoDominante = Object.entries(dist.elementos).sort((a, b) => b[1] - a[1])[0];
  const modalidadDominante = Object.entries(dist.modalidades).sort((a, b) => b[1] - a[1])[0];

  return (
    <div className="p-5">
      <div className="flex flex-col items-center justify-center py-6 text-center">
        <div className="h-16 w-16 rounded-full bg-[#F5F0FF] flex items-center justify-center mb-4">
          <Icono nombre="destello" tamaño={28} peso="fill" className="text-[#B388FF]" />
        </div>
        <p className="text-[15px] font-medium text-[#2C2926]">Resumen de la Carta</p>
        <p className="text-[12px] text-[#8A8580] mt-1">
          Seleccioná un planeta, aspecto o casa para profundizar
        </p>
      </div>

      <div className="space-y-3 mt-2">
        <div className="rounded-xl border border-[#E8E4E0] px-4 py-3">
          <p className="text-[10px] text-[#8A8580] uppercase tracking-wider font-medium">Elemento dominante</p>
          <div className="flex items-center gap-2 mt-1">
            <div className="h-3 w-3 rounded-full" style={{ backgroundColor: COLORES_ELEMENTO[elementoDominante[0]] }} />
            <span className="text-[14px] font-semibold text-[#2C2926]">{elementoDominante[0]}</span>
            <span className="text-[12px] text-[#8A8580]">({elementoDominante[1]} planetas)</span>
          </div>
        </div>

        <div className="rounded-xl border border-[#E8E4E0] px-4 py-3">
          <p className="text-[10px] text-[#8A8580] uppercase tracking-wider font-medium">Modalidad dominante</p>
          <span className="text-[14px] font-semibold text-[#2C2926]">{modalidadDominante[0]}</span>
          <span className="text-[12px] text-[#8A8580] ml-2">({modalidadDominante[1]} planetas)</span>
        </div>

        <div className="rounded-xl border border-[#E8E4E0] px-4 py-3">
          <p className="text-[10px] text-[#8A8580] uppercase tracking-wider font-medium">Total aspectos</p>
          <span className="text-[14px] font-semibold text-[#2C2926]">{datos.aspectos.length}</span>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Vista planeta
// ---------------------------------------------------------------------------

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
  const narrativa = interpretarPlaneta(planeta.nombre, planeta.signo, planeta.casa, planeta.dignidad, planeta.retrogrado);

  const aspectosRelacionados = datos.aspectos.filter(
    (a) => a.planeta1 === planeta.nombre || a.planeta2 === planeta.nombre,
  );

  return (
    <div className="p-5">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-[15px] font-semibold text-[#2C2926]">Detalle del Planeta</h3>
        <button onClick={onCerrar} className="text-[#8A8580] hover:text-[#2C2926] transition-colors">
          <Icono nombre="x" tamaño={18} />
        </button>
      </div>

      <div className="h-px bg-[#E8E4E0] mb-5" />

      {/* Icono planeta */}
      <div className="flex flex-col items-center mb-5">
        <div
          className="h-14 w-14 rounded-full flex items-center justify-center mb-3"
          style={{ backgroundColor: `${colorPlaneta}20`, border: `2px solid ${colorPlaneta}`, color: colorPlaneta }}
        >
          <IconoSigno signo={planeta.signo} tamaño={28} />
        </div>
        <h2 className="text-lg font-bold text-[#2C2926]">{planeta.nombre} en {planeta.signo}</h2>
        <p className="text-[13px] text-[#8A8580] mt-0.5">
          {planeta.grado_en_signo.toFixed(2)}° · Casa {ROMANO[planeta.casa]}
        </p>
      </div>

      {/* Propiedades */}
      <div className="grid grid-cols-3 gap-2 mb-5">
        {[
          { label: "Elemento", value: elemento },
          { label: "Modalidad", value: modalidad },
          { label: "Regente", value: regente },
        ].map((prop) => (
          <div key={prop.label} className="rounded-lg border border-[#E8E4E0] px-2.5 py-2 text-center">
            <p className="text-[10px] text-[#8A8580] uppercase tracking-wider font-medium">{prop.label}</p>
            <p className="text-[13px] font-semibold text-[#2C2926] mt-0.5">{prop.value}</p>
          </div>
        ))}
      </div>

      {/* Dignidad */}
      {planeta.dignidad && (() => {
        const clave = normalizarClave(planeta.dignidad!);
        const estilo = DIGNIDAD_BADGE[clave];
        return (
          <div className="mb-5">
            <p className="text-[10px] text-[#8A8580] uppercase tracking-wider font-semibold mb-1.5">Dignidad</p>
            {estilo ? (
              <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-medium ${estilo.bg} ${estilo.text}`}>
                {planeta.dignidad}
              </span>
            ) : (
              <span className="text-[13px] text-[#2C2926]">{planeta.dignidad}</span>
            )}
          </div>
        );
      })()}

      {/* Interpretación */}
      <div className="mb-5">
        <p className="text-[11px] text-[#7C4DFF] uppercase tracking-wider font-semibold mb-2">Interpretación</p>
        <p className="text-[13px] text-[#2C2926] leading-relaxed">{narrativa}</p>
      </div>

      {/* Aspectos relacionados */}
      {aspectosRelacionados.length > 0 && (
        <div>
          <p className="text-[11px] text-[#7C4DFF] uppercase tracking-wider font-semibold mb-2">
            Aspectos Relacionados
          </p>
          <div className="flex flex-col gap-2">
            {aspectosRelacionados.map((asp, idx) => {
              const clave = normalizarClave(asp.tipo);
              const badge = BADGE_ASPECTO[clave];
              const simbolo = SIMBOLOS_ASPECTO[clave] || "·";
              const otroPlaneta = asp.planeta1 === planeta.nombre ? asp.planeta2 : asp.planeta1;

              return (
                <div
                  key={`${asp.planeta1}-${asp.planeta2}-${idx}`}
                  className="flex items-center justify-between bg-[#FAFAFA] rounded-lg px-3 py-2"
                >
                  <span className="text-[13px] text-[#2C2926]">
                    {simbolo} {otroPlaneta}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-[#8A8580]">{asp.orbe.toFixed(1)}°</span>
                    {badge && (
                      <span className={`text-[10px] font-medium rounded-full px-2 py-0.5 ${badge.bg} ${badge.text}`}>
                        {badge.label}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Vista aspecto
// ---------------------------------------------------------------------------

function VistaAspecto({
  aspecto,
  onCerrar,
}: {
  aspecto: Aspecto;
  onCerrar: () => void;
}) {
  const clave = normalizarClave(aspecto.tipo);
  const badge = BADGE_ASPECTO[clave];
  const narrativa = interpretarAspecto(aspecto.planeta1, aspecto.planeta2, aspecto.tipo, aspecto.orbe, aspecto.aplicativo);

  return (
    <div className="p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-[15px] font-semibold text-[#2C2926]">Detalle del Aspecto</h3>
        <button onClick={onCerrar} className="text-[#8A8580] hover:text-[#2C2926] transition-colors">
          <Icono nombre="x" tamaño={18} />
        </button>
      </div>
      <div className="h-px bg-[#E8E4E0] mb-5" />

      <div className="text-center mb-5">
        <div className="flex items-center justify-center gap-3 mb-2">
          <span className="text-[16px] font-bold text-[#2C2926]">{aspecto.planeta1}</span>
          {badge && (
            <span className={`text-[12px] font-semibold rounded-full px-3 py-1 ${badge.bg} ${badge.text}`}>
              {badge.label}
            </span>
          )}
          <span className="text-[16px] font-bold text-[#2C2926]">{aspecto.planeta2}</span>
        </div>
        <p className="text-[13px] text-[#8A8580]">
          Ángulo: {aspecto.angulo_exacto.toFixed(1)}° · Orbe: {aspecto.orbe.toFixed(1)}° ·{" "}
          {aspecto.aplicativo ? "Aplicativo" : "Separativo"}
        </p>
      </div>

      <div>
        <p className="text-[11px] text-[#7C4DFF] uppercase tracking-wider font-semibold mb-2">Interpretación</p>
        <p className="text-[13px] text-[#2C2926] leading-relaxed">{narrativa}</p>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Vista casa
// ---------------------------------------------------------------------------

function VistaCasa({
  casa,
  datos,
  onCerrar,
}: {
  casa: Casa;
  datos: CartaNatal;
  onCerrar: () => void;
}) {
  const planetasEnCasa = datos.planetas.filter((p) => p.casa === casa.numero).map((p) => p.nombre);
  const narrativa = interpretarCasa(casa.numero, casa.signo, planetasEnCasa);

  return (
    <div className="p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-[15px] font-semibold text-[#2C2926]">Casa {ROMANO[casa.numero]}</h3>
        <button onClick={onCerrar} className="text-[#8A8580] hover:text-[#2C2926] transition-colors">
          <Icono nombre="x" tamaño={18} />
        </button>
      </div>
      <div className="h-px bg-[#E8E4E0] mb-5" />

      <div className="text-center mb-5">
        <div className="h-14 w-14 rounded-full bg-[#F5F0FF] flex items-center justify-center mx-auto mb-3">
          <IconoSigno signo={casa.signo} tamaño={28} className="text-[#7C4DFF]" />
        </div>
        <h2 className="text-lg font-bold text-[#2C2926]">Casa {ROMANO[casa.numero]}</h2>
        <p className="text-[13px] text-[#8A8580] mt-0.5">
          {casa.signo} · {casa.grado_en_signo.toFixed(1)}°
        </p>
      </div>

      {planetasEnCasa.length > 0 && (
        <div className="mb-5">
          <p className="text-[10px] text-[#8A8580] uppercase tracking-wider font-medium mb-2">Planetas presentes</p>
          <div className="flex flex-wrap gap-1.5">
            {planetasEnCasa.map((nombre) => (
              <span key={nombre} className="text-[12px] font-medium bg-[#F5F0FF] text-[#7C4DFF] rounded-full px-2.5 py-0.5">
                {nombre}
              </span>
            ))}
          </div>
        </div>
      )}

      <div>
        <p className="text-[11px] text-[#7C4DFF] uppercase tracking-wider font-semibold mb-2">Interpretación</p>
        <p className="text-[13px] text-[#2C2926] leading-relaxed">{narrativa}</p>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Vista tríada
// ---------------------------------------------------------------------------

function VistaTriada({
  subtipo,
  datos,
  onCerrar,
}: {
  subtipo: "sol" | "luna" | "ascendente";
  datos: CartaNatal;
  onCerrar: () => void;
}) {
  const sol = datos.planetas.find((p) => p.nombre === "Sol")!;
  const luna = datos.planetas.find((p) => p.nombre === "Luna")!;
  const narrativa = interpretarTriada(sol.signo, sol.casa, luna.signo, luna.casa, datos.ascendente.signo);

  const titulo =
    subtipo === "sol" ? `Sol en ${sol.signo}` :
    subtipo === "luna" ? `Luna en ${luna.signo}` :
    `Ascendente en ${datos.ascendente.signo}`;

  const detalle =
    subtipo === "sol"
      ? interpretarPlaneta("Sol", sol.signo, sol.casa, sol.dignidad, sol.retrogrado)
      : subtipo === "luna"
      ? interpretarPlaneta("Luna", luna.signo, luna.casa, luna.dignidad, luna.retrogrado)
      : `Tu Ascendente en ${datos.ascendente.signo} define cómo el mundo te percibe. Es la lente a través de la cual filtras toda experiencia vital y la primera impresión que generas en los demás.`;

  return (
    <div className="p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-[15px] font-semibold text-[#2C2926]">Tríada: {titulo}</h3>
        <button onClick={onCerrar} className="text-[#8A8580] hover:text-[#2C2926] transition-colors">
          <Icono nombre="x" tamaño={18} />
        </button>
      </div>
      <div className="h-px bg-[#E8E4E0] mb-5" />

      <div className="mb-5">
        <p className="text-[11px] text-[#7C4DFF] uppercase tracking-wider font-semibold mb-2">{titulo}</p>
        <p className="text-[13px] text-[#2C2926] leading-relaxed">{detalle}</p>
      </div>

      <div>
        <p className="text-[11px] text-[#7C4DFF] uppercase tracking-wider font-semibold mb-2">Análisis Sol-Luna-Ascendente</p>
        <p className="text-[13px] text-[#2C2926] leading-relaxed">{narrativa}</p>
      </div>
    </div>
  );
}
