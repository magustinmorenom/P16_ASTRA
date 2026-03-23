"use client";

import { useState } from "react";
import { Icono } from "@/componentes/ui/icono";
import { IconoAstral, IconoSigno } from "@/componentes/ui/icono-astral";
import { Esqueleto } from "@/componentes/ui/esqueleto";
import { Tarjeta } from "@/componentes/ui/tarjeta";
import { FormularioNacimiento } from "@/componentes/compuestos/formulario-nacimiento";
import RuedaZodiacal from "@/componentes/visualizaciones/rueda-zodiacal";
import { usarCartaNatal, usarMisCalculos } from "@/lib/hooks";
import type { DatosNacimiento, CartaNatal, Planeta, Aspecto } from "@/lib/tipos";

// ---------------------------------------------------------------------------
// Datos estáticos de astrología
// ---------------------------------------------------------------------------

const COLORES_PLANETA: Record<string, string> = {
  Sol: "#D4A234", Luna: "#9575CD", Mercurio: "#E57373", Venus: "#66BB6A",
  Marte: "#EF5350", Júpiter: "#FFA726", Saturno: "#78909C", Urano: "#26C6DA",
  Neptuno: "#5C6BC0", Plutón: "#8D6E63", "Nodo Norte": "#66BB6A", "Nodo Sur": "#A1887F",
};

const SIMBOLOS_ASPECTO: Record<string, string> = {
  conjuncion: "☌", trigono: "△", sextil: "⚹", cuadratura: "□", oposicion: "☍",
};

const BADGE_ASPECTO: Record<string, { bg: string; text: string; label: string }> = {
  conjuncion: { bg: "bg-amber-100", text: "text-amber-700", label: "Conjunción" },
  trigono: { bg: "bg-green-100", text: "text-green-700", label: "Trígono" },
  sextil: { bg: "bg-sky-100", text: "text-sky-700", label: "Sextil" },
  cuadratura: { bg: "bg-red-100", text: "text-red-600", label: "Cuadratura" },
  oposicion: { bg: "bg-violet-100", text: "text-violet-700", label: "Oposición" },
};

const ELEMENTO_SIGNO: Record<string, string> = {
  Aries: "Fuego", Tauro: "Tierra", Géminis: "Aire", Cáncer: "Agua",
  Leo: "Fuego", Virgo: "Tierra", Libra: "Aire", Escorpio: "Agua",
  Sagitario: "Fuego", Capricornio: "Tierra", Acuario: "Aire", Piscis: "Agua",
};

const MODALIDAD_SIGNO: Record<string, string> = {
  Aries: "Cardinal", Tauro: "Fijo", Géminis: "Mutable", Cáncer: "Cardinal",
  Leo: "Fijo", Virgo: "Mutable", Libra: "Cardinal", Escorpio: "Fijo",
  Sagitario: "Mutable", Capricornio: "Cardinal", Acuario: "Fijo", Piscis: "Mutable",
};

const REGENTE_SIGNO: Record<string, string> = {
  Aries: "Marte", Tauro: "Venus", Géminis: "Mercurio", Cáncer: "Luna",
  Leo: "Sol", Virgo: "Mercurio", Libra: "Venus", Escorpio: "Plutón",
  Sagitario: "Júpiter", Capricornio: "Saturno", Acuario: "Urano", Piscis: "Neptuno",
};

const ROMANO: Record<number, string> = {
  1: "I", 2: "II", 3: "III", 4: "IV", 5: "V", 6: "VI",
  7: "VII", 8: "VIII", 9: "IX", 10: "X", 11: "XI", 12: "XII",
};

const DIGNIDAD_BADGE: Record<string, { bg: string; text: string }> = {
  domicilio: { bg: "bg-green-100", text: "text-green-700" },
  exaltacion: { bg: "bg-emerald-100", text: "text-emerald-700" },
  detrimento: { bg: "bg-red-100", text: "text-red-600" },
  caida: { bg: "bg-orange-100", text: "text-orange-700" },
  peregrino: { bg: "bg-gray-100", text: "text-gray-600" },
};

function normalizarClave(s: string): string {
  return s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

// ---------------------------------------------------------------------------
// Componente principal
// ---------------------------------------------------------------------------

export default function PaginaCartaNatal() {
  const mutacion = usarCartaNatal();
  const { data: calculos, isLoading: cargandoCalculos } = usarMisCalculos();
  const [datosManual, setDatosManual] = useState<CartaNatal | null>(null);
  const [modoManual, setModoManual] = useState(false);
  const [planetaSeleccionado, setPlanetaSeleccionado] = useState<Planeta | null>(null);

  const datos = datosManual ?? (calculos?.natal as CartaNatal | null) ?? null;

  function manejarCalculo(datosNacimiento: DatosNacimiento) {
    mutacion.mutate({ datos: datosNacimiento }, {
      onSuccess: (resultado) => {
        setDatosManual(resultado);
        setPlanetaSeleccionado(null);
      },
    });
  }

  // --- Estado de carga ---
  if (cargandoCalculos && !modoManual) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center space-y-4">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#7C4DFF] border-t-transparent mx-auto" />
          <p className="text-[#8A8580]">Cargando tu carta natal...</p>
        </div>
      </div>
    );
  }

  // --- Sin datos: formulario ---
  if (!datos || modoManual) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-[#2C2926] flex items-center gap-3">
            <IconoAstral nombre="astrologia" tamaño={28} className="text-[#7C4DFF]" />
            Carta Natal
          </h1>
          <p className="mt-2 text-sm text-[#8A8580]">
            Ingresa los datos de nacimiento para calcular la carta natal completa.
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
    );
  }

  // --- Aspectos relacionados con el planeta seleccionado ---
  const aspectosRelacionados = planetaSeleccionado
    ? datos.aspectos.filter(
        (a) => a.planeta1 === planetaSeleccionado.nombre || a.planeta2 === planetaSeleccionado.nombre
      )
    : [];

  // --- Vista con resultados ---
  return (
    <div className="flex h-full min-h-0 overflow-hidden">
      {/* ================================================================ */}
      {/* Panel Central                                                     */}
      {/* ================================================================ */}
      <section className="flex-1 overflow-y-auto scroll-sutil bg-[#FAFAFA] p-5 lg:p-7">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-[22px] font-bold text-[#2C2926] tracking-tight">
            Carta Natal de {datos.nombre}
          </h1>
          <p className="text-[13px] text-[#8A8580] mt-1">
            {datos.fecha_nacimiento} · {datos.hora_nacimiento} · {datos.ciudad}, {datos.pais}
          </p>
        </div>

        {/* Contenido principal: 2 columnas */}
        <div className="flex gap-6">
          {/* Columna izquierda: Rueda + Tabla */}
          <div className="flex-1 min-w-0 flex flex-col gap-6">
            {/* Rueda zodiacal */}
            <div className="bg-white rounded-2xl p-4 lg:p-6">
              <RuedaZodiacal
                planetas={datos.planetas}
                casas={datos.casas}
                aspectos={datos.aspectos}
                claro
                onPlanetaClick={setPlanetaSeleccionado}
              />
            </div>

            {/* Tabla de planetas */}
            <div className="bg-white rounded-2xl overflow-hidden">
              {/* Tabs */}
              <div className="flex border-b border-[#E8E4E0]/60 px-4">
                {["Planetas", "Signos", "Casas", "Aspectos", "Dignidades"].map((tab, i) => (
                  <button
                    key={tab}
                    className={`px-4 py-3 text-[13px] font-medium border-b-2 transition-colors ${
                      i === 0
                        ? "border-[#7C4DFF] text-[#7C4DFF]"
                        : "border-transparent text-[#8A8580] hover:text-[#2C2926]"
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>

              {/* Tabla */}
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-[#8A8580] text-[11px] uppercase tracking-wider">
                      <th className="text-left py-3 px-4 font-medium">Planeta</th>
                      <th className="text-left py-3 px-4 font-medium">Signo</th>
                      <th className="text-left py-3 px-4 font-medium">Grado</th>
                      <th className="text-center py-3 px-4 font-medium">Casa</th>
                      <th className="text-left py-3 px-4 font-medium">Dignidad</th>
                    </tr>
                  </thead>
                  <tbody>
                    {datos.planetas.map((planeta) => {
                      const esSeleccionado = planetaSeleccionado?.nombre === planeta.nombre;
                      const colorDot = COLORES_PLANETA[planeta.nombre] || "#9E9E9E";
                      const claveDignidad = planeta.dignidad ? normalizarClave(planeta.dignidad) : null;
                      const dignidadEstilo = claveDignidad ? DIGNIDAD_BADGE[claveDignidad] : null;

                      return (
                        <tr
                          key={planeta.nombre}
                          onClick={() => setPlanetaSeleccionado(planeta)}
                          className={`border-t border-[#E8E4E0]/40 cursor-pointer transition-colors ${
                            esSeleccionado
                              ? "bg-[#F5F0FF]"
                              : "hover:bg-[#FAFAFA]"
                          }`}
                        >
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2.5">
                              <div
                                className="h-2.5 w-2.5 rounded-full shrink-0"
                                style={{ backgroundColor: colorDot }}
                              />
                              <span className="font-medium text-[#2C2926]">
                                {planeta.nombre}
                              </span>
                            </div>
                          </td>
                          <td className="py-3 px-4 text-[#2C2926]">
                            <div className="flex items-center gap-1.5">
                              <IconoSigno signo={planeta.signo} tamaño={16} className="text-[#7C4DFF]" />
                              <span>{planeta.signo}</span>
                            </div>
                          </td>
                          <td className="py-3 px-4 text-[#7C4DFF] font-mono text-[13px]">
                            {planeta.grado_en_signo.toFixed(2)}°
                          </td>
                          <td className="py-3 px-4 text-center text-[#2C2926]">
                            {ROMANO[planeta.casa] || planeta.casa}
                          </td>
                          <td className="py-3 px-4">
                            {dignidadEstilo ? (
                              <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ${dignidadEstilo.bg} ${dignidadEstilo.text}`}>
                                {planeta.dignidad}
                              </span>
                            ) : (
                              <span className="text-[#B3ADA7]">—</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Columna derecha: Aspectos + Casas */}
          <div className="hidden md:flex w-[280px] flex-shrink-0 flex-col gap-6">
            {/* Aspectos */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <IconoAstral nombre="compatibilidad" tamaño={18} className="text-[#7C4DFF]" />
                <h3 className="text-[15px] font-semibold text-[#2C2926]">Aspectos</h3>
              </div>
              <div className="flex flex-col gap-2">
                {datos.aspectos.slice(0, 6).map((aspecto, idx) => {
                  const clave = normalizarClave(aspecto.tipo);
                  const badge = BADGE_ASPECTO[clave];
                  const simbolo = SIMBOLOS_ASPECTO[clave] || "·";

                  return (
                    <div
                      key={`${aspecto.planeta1}-${aspecto.planeta2}-${idx}`}
                      className="bg-white rounded-xl px-3.5 py-3 flex items-center justify-between"
                    >
                      <div className="min-w-0">
                        <p className="text-[13px] font-medium text-[#2C2926]">
                          {aspecto.planeta1} {simbolo} {aspecto.planeta2}
                        </p>
                        <p className="text-[11px] text-[#8A8580] mt-0.5">
                          {aspecto.angulo_exacto.toFixed(0)}° · orbe {aspecto.orbe.toFixed(1)}° · {aspecto.aplicativo ? "Aplicativo" : "Separativo"}
                        </p>
                      </div>
                      {badge && (
                        <span className={`shrink-0 ml-2 inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ${badge.bg} ${badge.text}`}>
                          {badge.label}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Casas */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <IconoAstral nombre="bola-cristal" tamaño={18} className="text-[#7C4DFF]" />
                <h3 className="text-[15px] font-semibold text-[#2C2926]">Casas</h3>
              </div>
              <div className="grid grid-cols-3 gap-1.5">
                {datos.casas.map((casa) => {
                  const esAngular = [1, 4, 7, 10].includes(casa.numero);
                  return (
                    <div
                      key={casa.numero}
                      className={`rounded-lg px-2.5 py-2.5 text-center ${
                        esAngular
                          ? "bg-[#7C4DFF] text-white"
                          : "bg-white text-[#2C2926]"
                      }`}
                    >
                      <p className={`text-[11px] font-semibold ${esAngular ? "text-white/70" : "text-[#8A8580]"}`}>
                        {ROMANO[casa.numero]}
                      </p>
                      <div className={`flex items-center justify-center gap-1 mt-0.5 ${esAngular ? "" : ""}`}>
                        <IconoSigno signo={casa.signo} tamaño={14} className={esAngular ? "text-white" : "text-[#7C4DFF]"} />
                        <span className="text-[13px] font-medium">{Math.floor(casa.grado_en_signo)}°</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ================================================================ */}
      {/* Panel Derecho — Detalle del Planeta                               */}
      {/* ================================================================ */}
      <aside className="hidden lg:flex w-[340px] flex-shrink-0 bg-white flex-col border-l border-[#E8E4E0]/40 overflow-hidden">
        {/* Parte superior: Detalle */}
        <div className="flex-1 overflow-y-auto scroll-sutil">
          {planetaSeleccionado ? (
            <PanelDetallePlaneta
              planeta={planetaSeleccionado}
              datos={datos}
              aspectosRelacionados={aspectosRelacionados}
              onCerrar={() => setPlanetaSeleccionado(null)}
            />
          ) : (
            <div className="flex flex-col items-center justify-center h-full p-6 text-center">
              <div className="h-16 w-16 rounded-full bg-[#F5F0FF] flex items-center justify-center mb-4">
                <IconoAstral nombre="astrologia" tamaño={28} className="text-[#B388FF]" />
              </div>
              <p className="text-[15px] font-medium text-[#2C2926]">Selecciona un planeta</p>
              <p className="text-[12px] text-[#8A8580] mt-1">
                Haz clic en un planeta de la tabla o la rueda para ver su detalle
              </p>
            </div>
          )}
        </div>

        {/* Parte inferior: Chat ASTRA AI */}
        <div className="bg-[#F5F0FF] flex flex-col border-t border-[#E8E4E0]/40 shrink-0">
          <div className="px-5 py-3.5 bg-white border-b border-[#E8E4E0]/40">
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-full bg-gradient-to-b from-[#7C4DFF] to-[#2D1B69] flex items-center justify-center">
                <Icono nombre="destello" tamaño={16} peso="fill" className="text-[#F0D68A]" />
              </div>
              <div>
                <p className="text-sm font-semibold text-[#2C2926]">ASTRA AI</p>
                <p className="text-[11px] text-[#8A8580]">Tu guía cósmica personal</p>
              </div>
            </div>
          </div>

          <div className="px-5 py-4 flex flex-col gap-3">
            <div className="flex gap-2.5">
              <div className="h-7 w-7 rounded-full bg-[#7C4DFF] flex items-center justify-center shrink-0 mt-0.5">
                <Icono nombre="destello" tamaño={14} peso="fill" className="text-[#F0D68A]" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="bg-white rounded-[4px_14px_14px_14px] px-3.5 py-2.5 shadow-[0_1px_4px_rgba(0,0,0,0.04)]">
                  <p className="text-[13px] text-[#2C2926] leading-relaxed">
                    {planetaSeleccionado
                      ? `Hola. ${planetaSeleccionado.nombre} en ${planetaSeleccionado.signo} en tu Casa ${planetaSeleccionado.casa} tiene mucho que decir. ¿Quieres que profundicemos?`
                      : "¡Hola! Selecciona un planeta para que te cuente su influencia en tu carta natal."}
                  </p>
                </div>
                <p className="text-[10px] text-[#B3ADA7] mt-1 ml-1">ASTRA AI</p>
              </div>
            </div>
          </div>

          <div className="px-5 py-3.5 bg-white border-t border-[#E8E4E0]/40">
            <div className="flex items-center gap-2.5">
              <div className="flex-1 h-10 px-3.5 rounded-xl bg-[#F5F0FF] flex items-center">
                <span className="text-[13px] text-[#8A8580]">Preguntale algo a ASTRA AI...</span>
              </div>
              <button className="h-10 w-10 rounded-xl bg-[#7C4DFF] flex items-center justify-center text-white shrink-0">
                <Icono nombre="enviarMensaje" tamaño={18} />
              </button>
            </div>
          </div>
        </div>
      </aside>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Sub-componente: Panel de detalle del planeta
// ---------------------------------------------------------------------------

function PanelDetallePlaneta({
  planeta,
  datos,
  aspectosRelacionados,
  onCerrar,
}: {
  planeta: Planeta;
  datos: CartaNatal;
  aspectosRelacionados: Aspecto[];
  onCerrar: () => void;
}) {
  const elemento = ELEMENTO_SIGNO[planeta.signo] || "—";
  const modalidad = MODALIDAD_SIGNO[planeta.signo] || "—";
  const regente = REGENTE_SIGNO[planeta.signo] || "—";
  const colorPlaneta = COLORES_PLANETA[planeta.nombre] || "#7C4DFF";

  return (
    <div className="p-5">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-[15px] font-semibold text-[#2C2926]">Detalle del Planeta</h3>
        <button
          onClick={onCerrar}
          className="text-[#8A8580] hover:text-[#2C2926] transition-colors"
        >
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
        <h2 className="text-lg font-bold text-[#2C2926]">
          {planeta.nombre} en {planeta.signo}
        </h2>
        <p className="text-[13px] text-[#8A8580] mt-0.5">
          {planeta.grado_en_signo.toFixed(2)}° · Casa {ROMANO[planeta.casa]}
        </p>
      </div>

      {/* Propiedades: Elemento, Modalidad, Regente */}
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
      {planeta.dignidad && (
        <div className="mb-5">
          <p className="text-[10px] text-[#8A8580] uppercase tracking-wider font-semibold mb-1.5">Dignidad</p>
          {(() => {
            const clave = normalizarClave(planeta.dignidad!);
            const estilo = DIGNIDAD_BADGE[clave];
            return estilo ? (
              <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-medium ${estilo.bg} ${estilo.text}`}>
                {planeta.dignidad}
              </span>
            ) : (
              <span className="text-[13px] text-[#2C2926]">{planeta.dignidad}</span>
            );
          })()}
        </div>
      )}

      {/* Interpretación */}
      <div className="mb-5">
        <p className="text-[11px] text-[#7C4DFF] uppercase tracking-wider font-semibold mb-2">
          Interpretación
        </p>
        <p className="text-[13px] text-[#2C2926] leading-relaxed">
          {planeta.nombre} en {planeta.signo} en la Casa {ROMANO[planeta.casa]} revela una{" "}
          {elemento === "Fuego" ? "energía dinámica y acción directa" :
           elemento === "Tierra" ? "identidad construida sobre la responsabilidad y las raíces" :
           elemento === "Aire" ? "mente analítica orientada a la comunicación" :
           "profunda conexión emocional e intuitiva"}.{" "}
          {planeta.retrogrado
            ? `Al estar retrógrado, ${planeta.nombre} te invita a revisar y reflexionar sobre estos temas internamente.`
            : `Tu sentido de propósito se activa cuando lideras desde lo ${modalidad === "Cardinal" ? "pionero" : modalidad === "Fijo" ? "estable" : "adaptable"}.`}
        </p>
      </div>

      {/* Aspectos relacionados */}
      {aspectosRelacionados.length > 0 && (
        <div>
          <p className="text-[11px] text-[#7C4DFF] uppercase tracking-wider font-semibold mb-2">
            Aspectos Relacionados
          </p>
          <div className="flex flex-col gap-2">
            {aspectosRelacionados.slice(0, 4).map((asp, idx) => {
              const clave = normalizarClave(asp.tipo);
              const badge = BADGE_ASPECTO[clave];
              const otroPlaneta = asp.planeta1 === planeta.nombre ? asp.planeta2 : asp.planeta1;

              return (
                <div
                  key={`${asp.planeta1}-${asp.planeta2}-${idx}`}
                  className="flex items-center justify-between bg-[#FAFAFA] rounded-lg px-3 py-2"
                >
                  <span className="text-[13px] text-[#2C2926]">{otroPlaneta}</span>
                  {badge && (
                    <span className={`text-[10px] font-medium rounded-full px-2 py-0.5 ${badge.bg} ${badge.text}`}>
                      {badge.label}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
