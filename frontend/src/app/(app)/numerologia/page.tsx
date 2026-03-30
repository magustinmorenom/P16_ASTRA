"use client";

import { useState, useCallback, useEffect, type FormEvent } from "react";
import { Icono } from "@/componentes/ui/icono";
import { IconoAstral } from "@/componentes/ui/icono-astral";
import { Boton } from "@/componentes/ui/boton";
import { Input } from "@/componentes/ui/input";
import { Badge } from "@/componentes/ui/badge";
import { Esqueleto } from "@/componentes/ui/esqueleto";
import { CtaNumerologia } from "@/componentes/dashboard-v2/cta-numerologia";
import { usarNumerologia, usarMisCalculos } from "@/lib/hooks";
import { usarEsMobile } from "@/lib/hooks/usar-es-mobile";
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

const NUMERO_VACIO_DEFAULT: NumeroRespuesta = { numero: 0, descripcion: "—" };

// ── Tipos ──────────────────────────────────────────────────────────────────

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
  if (mesDiff < 0 || (mesDiff === 0 && hoy.getDate() < nacimiento.getDate())) {
    edad--;
  }
  return edad;
}

// ── Panel de Detalle (modal glassmorphic) ──────────────────────────────────

function PanelDetalle({
  detalle,
  datos,
  numerosCore,
  esMaestro,
  onCerrar,
  onAbrirNumero,
}: {
  detalle: DetalleNumero;
  datos: Numerologia;
  numerosCore: { clave: string; titulo: string; dato: NumeroRespuesta }[];
  esMaestro: (n: number) => boolean;
  onCerrar: () => void;
  onAbrirNumero: (clave: string, titulo: string, dato: NumeroRespuesta) => void;
}) {
  const [montado, setMontado] = useState(false);

  useEffect(() => {
    requestAnimationFrame(() => setMontado(true));
  }, []);

  const cerrar = () => {
    setMontado(false);
    setTimeout(onCerrar, 300);
  };

  return (
    <div className="hidden lg:block fixed inset-0 z-50 pointer-events-none">
      <div
        onClick={cerrar}
        className={cn(
          "absolute inset-0 bg-black/20 transition-opacity duration-300 pointer-events-auto",
          montado ? "opacity-100" : "opacity-0",
        )}
      />
      <aside
        className={cn(
          "absolute top-0 right-0 h-full w-[380px] pointer-events-auto",
          "flex flex-col",
          "backdrop-blur-2xl bg-[#1A1128]/75 border-l border-white/10",
          "shadow-[-8px_0_32px_rgba(124,77,255,0.08)]",
          "transition-all duration-300 ease-[cubic-bezier(0.25,0.1,0.25,1)]",
          montado
            ? "translate-x-0 opacity-100"
            : "translate-x-full opacity-0",
        )}
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-white/8 flex items-center justify-between">
          <p className="text-xs font-semibold text-[#B388FF] uppercase tracking-wider">
            Detalle del Número
          </p>
          <button
            onClick={cerrar}
            className="text-[#B388FF]/60 hover:text-[#F5F0FF] transition-colors"
          >
            <Icono nombre="x" tamaño={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto scroll-sutil p-5 pt-4 flex flex-col gap-4">
          {/* Número grande */}
          <div className="flex flex-col items-center gap-2 py-4">
            {ICONO_NUMERO[detalle.clave] && (
              <IconoAstral
                nombre={ICONO_NUMERO[detalle.clave] as Parameters<typeof IconoAstral>[0]["nombre"]}
                tamaño={32}
                className="text-[#B388FF]"
              />
            )}
            <p className={cn("text-5xl font-bold", detalle.esMaestro ? "text-[#D4A234]" : "text-[#B388FF]")}>
              {detalle.numero}
            </p>
            <p className="text-[14px] font-semibold text-white/90 uppercase tracking-wider text-center">
              {detalle.titulo}
            </p>
            {detalle.esMaestro && <Badge variante="advertencia">Número Maestro</Badge>}
          </div>

          {/* Qué significa */}
          <div className="rounded-xl backdrop-blur-xl bg-white/[0.06] border border-white/[0.10] p-4">
            <p className="text-[11px] font-semibold text-white/40 uppercase tracking-wider mb-2">
              Qué significa
            </p>
            <p className="text-[14px] text-white/80 leading-relaxed">
              {detalle.que_es}
            </p>
          </div>

          {/* Significado del número */}
          <div className="rounded-xl backdrop-blur-xl bg-white/[0.06] border border-white/[0.10] p-4">
            <p className="text-[11px] font-semibold text-white/40 uppercase tracking-wider mb-2">
              El número {detalle.numero}
            </p>
            <p className="text-[15px] font-semibold text-[#B388FF] mb-1">
              {detalle.descripcion}
            </p>
            {detalle.descripcion_larga && (
              <p className="text-[14px] text-white/60 leading-relaxed">
                {detalle.descripcion_larga}
              </p>
            )}
          </div>

          {/* Extra (etapas) */}
          {detalle.extra && (
            <div className="rounded-xl bg-[#7C4DFF]/15 border border-[#7C4DFF]/25 p-4">
              <p className="text-[14px] font-semibold text-[#B388FF]">
                {detalle.extra}
              </p>
            </div>
          )}

          {/* Resumen compacto */}
          <div className="pt-2">
            <p className="text-[11px] font-semibold text-white/40 uppercase tracking-wider mb-2">
              Todos tus números
            </p>
            <div className="flex flex-col">
              {[
                ...numerosCore,
                { clave: "anio_personal", titulo: "Año Personal", dato: (datos.anio_personal ?? NUMERO_VACIO_DEFAULT) },
              ].map(({ clave, titulo, dato }) => (
                <button
                  key={clave}
                  onClick={() => onAbrirNumero(clave, titulo, dato)}
                  className={cn(
                    "flex items-center justify-between px-3 py-2.5 rounded-xl transition-colors",
                    detalle.clave === clave
                      ? "bg-white/[0.08]"
                      : "hover:bg-white/[0.04]",
                  )}
                >
                  <span className="text-[14px] font-medium text-white/80">{titulo}</span>
                  <span className={cn("text-[15px] font-bold", esMaestro(dato.numero) ? "text-[#D4A234]" : "text-[#B388FF]")}>
                    {dato.numero}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </aside>
    </div>
  );
}

// ── Componente principal ───────────────────────────────────────────────────

export default function PaginaNumerologia() {
  const mutacion = usarNumerologia();
  const { data: calculos, isLoading: cargandoCalculos } = usarMisCalculos();
  const esMobile = usarEsMobile();

  const [datosManual, setDatosManual] = useState<Numerologia | null>(null);
  const [modoManual, setModoManual] = useState(false);
  const [detalle, setDetalle] = useState<DetalleNumero | null>(null);
  const [detalleAbierto, setDetalleAbierto] = useState(false);

  // Formulario
  const [nombre, setNombre] = useState("");
  const [fechaNacimiento, setFechaNacimiento] = useState("");
  const [sistema, setSistema] = useState<"pitagorico" | "caldeo">("pitagorico");

  const datosRaw = datosManual ?? (calculos?.numerologia as Numerologia | null) ?? null;
  // Validar que los campos esenciales existen antes de considerar datos como válidos
  const datos = datosRaw?.camino_de_vida?.numero !== undefined ? datosRaw : null;

  function manejarEnvio(e: FormEvent) {
    e.preventDefault();
    const payload: DatosNumerologia = { nombre, fecha_nacimiento: fechaNacimiento, sistema };
    mutacion.mutate({ datos: payload }, { onSuccess: setDatosManual });
  }

  const esMaestro = (n: number) => NUMEROS_MAESTROS.includes(n);

  const abrirNumero = useCallback(
    (clave: string, titulo: string, resp: NumeroRespuesta) => {
      setDetalle({
        titulo, clave,
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
        que_es: `Este es tu número personal para ${item.nombre_mes}. Cada mes tiene una vibración diferente dentro de tu año personal${datos ? ` (${(datos.anio_personal ?? NUMERO_VACIO_DEFAULT).numero})` : ""}. Influye en las oportunidades y desafíos del mes.`,
        esMaestro: esMaestro(item.numero),
      });
      setDetalleAbierto(true);
    },
    [datos],
  );

  const abrirEtapa = useCallback(
    (etapa: EtapaVida, indice: number, edadActual: number) => {
      const activa = edadActual >= etapa.edad_inicio && (etapa.edad_fin === null || edadActual < etapa.edad_fin);
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
        <section className={cn("flex-1 p-5 lg:p-8 flex flex-col gap-6 overflow-y-auto scroll-sutil", esMobile ? "bg-fondo" : "bg-[#16011b]")}>
          <Esqueleto className={cn("h-8 w-48", !esMobile && "!bg-white/5")} />
          <div className="flex gap-3">
            <Esqueleto className={cn("h-[140px] flex-[2] rounded-2xl", !esMobile && "!bg-white/5")} />
            <div className="flex-1 flex flex-col gap-3">
              <Esqueleto className={cn("h-[62px] rounded-2xl", !esMobile && "!bg-white/5")} />
              <Esqueleto className={cn("h-[62px] rounded-2xl", !esMobile && "!bg-white/5")} />
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Esqueleto key={i} className={cn("h-[110px] rounded-2xl", !esMobile && "!bg-white/5")} />
            ))}
          </div>
        </section>
      </>
    );
  }

  // ── Estado: formulario ────────────────────────────────────────────────

  if (!datos || modoManual) {
    return (
      <>
        <HeaderMobile titulo="Numerología" mostrarAtras />
        <section className={cn("flex-1 p-5 lg:p-8 flex flex-col gap-6 overflow-y-auto scroll-sutil", esMobile ? "bg-fondo" : "bg-[#16011b]")}>
          <div>
            <h1 className={cn("text-[22px] font-semibold tracking-tight flex items-center gap-3", esMobile ? "text-texto" : "text-white")}>
              <IconoAstral nombre="numerologia" tamaño={28} className="text-[#B388FF]" />
              Numerología
            </h1>
            <p className={cn("mt-2 text-[14px]", esMobile ? "text-texto-secundario" : "text-white/50")}>
              Calculá tu carta numerológica completa con camino de vida, expresión, impulso del alma y más.
            </p>
          </div>
          <div className="max-w-lg">
            <div className="mb-4">
              <CtaNumerologia
                titulo="Tu Carta Numerológica"
                descripcion="Calculá tu mapa numerológico completo"
                ruta={null}
                mostrarAccion={false}
              />
            </div>
            <div className={cn("rounded-2xl p-6", esMobile ? "bg-fondo-tarjeta border border-borde" : "backdrop-blur-xl bg-white/[0.06] border border-white/[0.10]")}>
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
                  <label className={cn("text-[13px] font-medium", esMobile ? "text-texto-secundario" : "text-white/50")}>
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
                          esMobile
                            ? sistema === s
                              ? "border-primario bg-fondo-elevado text-primario"
                              : "border-borde bg-fondo-tarjeta text-texto-secundario hover:border-violet-300"
                            : sistema === s
                              ? "border-[#7C4DFF] bg-[#7C4DFF]/15 text-[#B388FF]"
                              : "border-white/10 bg-white/[0.04] text-white/50 hover:border-white/20",
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
                  icono={<IconoAstral nombre="numerologia" tamaño={20} className="text-current" />}
                  className="w-full mt-2"
                >
                  Calcular
                </Boton>
              </form>
            </div>
            {mutacion.isError && (
              <div className="mt-4 rounded-xl bg-red-500/10 border border-red-500/20 px-4 py-3">
                <p className="text-[14px] text-red-400">
                  {mutacion.error?.message ?? "Error al calcular la numerología."}
                </p>
              </div>
            )}
          </div>
        </section>
      </>
    );
  }

  // ── Estado: resultados ────────────────────────────────────────────────

  const edadActual = calcularEdad(datos.fecha_nacimiento);
  const mesActual = new Date().getMonth() + 1;

  const esEtapaActiva = (etapa: EtapaVida) =>
    edadActual >= etapa.edad_inicio && (etapa.edad_fin === null || edadActual < etapa.edad_fin);

  const numerosCore: { clave: string; titulo: string; dato: NumeroRespuesta }[] = [
    { clave: "camino_de_vida", titulo: "Camino de Vida", dato: datos.camino_de_vida ?? NUMERO_VACIO_DEFAULT },
    { clave: "expresion", titulo: "Expresión", dato: datos.expresion ?? NUMERO_VACIO_DEFAULT },
    { clave: "impulso_del_alma", titulo: "Impulso del Alma", dato: datos.impulso_del_alma ?? NUMERO_VACIO_DEFAULT },
    { clave: "personalidad", titulo: "Personalidad", dato: datos.personalidad ?? NUMERO_VACIO_DEFAULT },
    { clave: "numero_nacimiento", titulo: "Nacimiento", dato: datos.numero_nacimiento ?? NUMERO_VACIO_DEFAULT },
  ];

  // Clases condicionales desktop/mobile
  const esDesktop = !esMobile;

  return (
    <>
      <HeaderMobile titulo="Numerología" mostrarAtras />
      <section className={cn(
        "flex-1 p-5 lg:p-8 flex flex-col gap-6 overflow-y-auto scroll-sutil pb-24 lg:pb-8",
        esDesktop ? "bg-[#16011b]" : "bg-fondo",
      )}>
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className={cn("text-[22px] font-semibold tracking-tight flex items-center gap-3", esDesktop ? "text-white" : "text-texto")}>
            <IconoAstral nombre="numerologia" tamaño={28} className="text-[#B388FF]" />
            Numerología
          </h1>
          <div className="flex items-center gap-3">
            <p className={cn("text-[14px] hidden sm:block", esDesktop ? "text-white/40" : "text-texto-secundario")}>
              {datos.nombre} · {datos.fecha_nacimiento}
            </p>
            <Badge variante="info">
              {datos.sistema === "pitagorico" ? "Pitagórico" : "Caldeo"}
            </Badge>
          </div>
        </div>

        <p className={cn("text-[14px] -mt-3", esDesktop ? "text-white/40" : "text-texto-secundario")}>
          Tocá cualquier número para ver su explicación detallada.
        </p>

        <CtaNumerologia
          numeroPersonal={(datos.dia_personal ?? NUMERO_VACIO_DEFAULT).numero}
          titulo="Tu Carta Numerológica"
          descripcion={`Tu número personal hoy es ${(datos.dia_personal ?? NUMERO_VACIO_DEFAULT).numero}`}
          ruta={null}
          mostrarAccion={false}
        />

        {/* ─── Hero: Día Personal + Año + Mes ───────────────────────── */}
        <div className="flex gap-3">
          <button
            onClick={() => abrirNumero("dia_personal", "Día Personal", (datos.dia_personal ?? NUMERO_VACIO_DEFAULT))}
            className={cn(
              "flex-[2] rounded-2xl p-5 text-left transition-all border",
              esDesktop
                ? "backdrop-blur-xl bg-white/[0.06] border-white/[0.10] hover:border-[#B388FF]/40"
                : "bg-gradient-to-br from-violet-900/60 to-fondo-tarjeta border-violet-700/40 hover:border-violet-400",
              detalle?.clave === "dia_personal" && "ring-2 ring-[#7C4DFF]/40",
            )}
          >
            <p className={cn("text-[11px] font-semibold uppercase tracking-wider", esDesktop ? "text-white/40" : "text-texto-secundario")}>
              Tu día hoy
            </p>
            <p className="text-[48px] font-bold text-[#B388FF] leading-none mt-1">
              {(datos.dia_personal ?? NUMERO_VACIO_DEFAULT).numero}
            </p>
            <p className={cn("text-[14px] mt-2 leading-snug", esDesktop ? "text-white/60" : "text-texto-secundario")}>
              {(datos.dia_personal ?? NUMERO_VACIO_DEFAULT).descripcion}
            </p>
          </button>

          <div className="flex-1 flex flex-col gap-3">
            <button
              onClick={() => abrirNumero("anio_personal", "Año Personal", (datos.anio_personal ?? NUMERO_VACIO_DEFAULT))}
              className={cn(
                "flex-1 rounded-2xl p-4 text-left transition-all border",
                esDesktop
                  ? "backdrop-blur-xl bg-white/[0.06] border-white/[0.10] hover:border-[#B388FF]/40"
                  : "bg-gradient-to-br from-violet-900/60 to-fondo-tarjeta border-violet-700/40 hover:border-violet-400",
                detalle?.clave === "anio_personal" && "ring-2 ring-[#7C4DFF]/40",
              )}
            >
              <p className={cn("text-[11px] font-semibold uppercase tracking-wider", esDesktop ? "text-white/40" : "text-texto-secundario")}>
                Año
              </p>
              <p className="text-[28px] font-bold text-[#B388FF] leading-none mt-0.5">
                {(datos.anio_personal ?? NUMERO_VACIO_DEFAULT).numero}
              </p>
            </button>
            <button
              onClick={() => abrirNumero("mes_personal", "Mes Personal", (datos.mes_personal ?? NUMERO_VACIO_DEFAULT))}
              className={cn(
                "flex-1 rounded-2xl p-4 text-left transition-all border",
                esDesktop
                  ? "backdrop-blur-xl bg-white/[0.06] border-white/[0.10] hover:border-[#B388FF]/40"
                  : "bg-fondo-tarjeta border-borde hover:border-violet-400",
                detalle?.clave === "mes_personal" && "ring-2 ring-[#7C4DFF]/40",
              )}
            >
              <p className={cn("text-[11px] font-semibold uppercase tracking-wider", esDesktop ? "text-white/40" : "text-texto-secundario")}>
                Mes
              </p>
              <p className="text-[28px] font-bold text-[#B388FF] leading-none mt-0.5">
                {(datos.mes_personal ?? NUMERO_VACIO_DEFAULT).numero}
              </p>
            </button>
          </div>
        </div>

        {/* ─── Tus Números ──────────────────────────────────────────── */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <h2 className={cn("text-lg font-bold", esDesktop ? "text-white" : "text-texto")}>
              Tus Números
            </h2>
            {datos.numeros_maestros_presentes?.length > 0 && (
              <Badge variante="advertencia">
                Maestros: {datos.numeros_maestros_presentes.join(", ")}
              </Badge>
            )}
          </div>
          <p className={cn("text-[14px] mb-3", esDesktop ? "text-white/40" : "text-texto-secundario")}>
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
                    "rounded-2xl p-4 text-center transition-all border",
                    esDesktop
                      ? seleccionado
                        ? "bg-white/[0.10] border-[#B388FF]/40 ring-2 ring-[#7C4DFF]/30"
                        : maestro
                          ? "bg-[#D4A234]/10 border-[#D4A234]/20 hover:border-[#D4A234]/40"
                          : clave === "camino_de_vida"
                            ? "backdrop-blur-xl bg-white/[0.06] border-white/[0.10] hover:border-[#B388FF]/40"
                            : "backdrop-blur-xl bg-white/[0.04] border-white/[0.08] hover:border-white/20"
                      : seleccionado
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
                        nombre={ICONO_NUMERO[clave] as Parameters<typeof IconoAstral>[0]["nombre"]}
                        tamaño={18}
                        className="text-[#B388FF]"
                      />
                    </div>
                  )}
                  <p className={cn("text-3xl font-bold", maestro ? "text-[#D4A234]" : "text-[#B388FF]")}>
                    {dato.numero}
                  </p>
                  <p className={cn("text-[11px] font-semibold uppercase tracking-wider mt-1", esDesktop ? "text-white/40" : "text-texto-secundario")}>
                    {titulo}
                  </p>
                  {maestro && <Badge variante="advertencia" className="mt-2">Maestro</Badge>}
                </button>
              );
            })}
          </div>
        </div>

        {/* ─── 12 Meses del Año ─────────────────────────────────────── */}
        {datos.meses_personales && datos.meses_personales.length > 0 && (
          <div>
            <h2 className={cn("text-lg font-bold mb-1", esDesktop ? "text-white" : "text-texto")}>
              Tus 12 Meses del Año
            </h2>
            <p className={cn("text-[14px] mb-3", esDesktop ? "text-white/40" : "text-texto-secundario")}>
              Cada mes tiene una vibración diferente · Año Personal {(datos.anio_personal ?? NUMERO_VACIO_DEFAULT).numero}
            </p>
            <div className="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-12 gap-2">
              {datos.meses_personales.map((item) => {
                const esActual = item.mes === mesActual;
                const seleccionado = detalle?.titulo === `Mes Personal — ${item.nombre_mes}`;
                return (
                  <button
                    key={item.mes}
                    onClick={() => abrirMes(item)}
                    className={cn(
                      "rounded-xl py-3 px-2 text-center transition-all border",
                      esDesktop
                        ? seleccionado
                          ? "bg-white/[0.10] border-[#B388FF]/40 ring-2 ring-[#7C4DFF]/30"
                          : esActual
                            ? "bg-[#7C4DFF]/15 border-[#7C4DFF]/30"
                            : "bg-white/[0.04] border-white/[0.08] hover:border-white/20"
                        : seleccionado
                          ? "bg-fondo-elevado border-violet-300 ring-2 ring-violet-300/30"
                          : esActual
                            ? "bg-primario/10 border-primario/30"
                            : "bg-fondo-tarjeta border-borde hover:border-violet-300",
                    )}
                  >
                    <p className={cn("text-[11px] font-semibold uppercase", esDesktop ? "text-white/40" : "text-texto-secundario")}>
                      {item.nombre_mes.substring(0, 3)}
                    </p>
                    <p className={cn("text-xl font-bold mt-0.5", esActual ? "text-[#B388FF]" : esDesktop ? "text-white/80" : "text-texto")}>
                      {item.numero}
                    </p>
                    {esActual && <div className="w-1.5 h-1.5 rounded-full bg-[#7C4DFF] mx-auto mt-1" />}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* ─── Etapas de Vida ───────────────────────────────────────── */}
        {datos.etapas_de_la_vida?.length > 0 && (
          <div>
            <h2 className={cn("text-lg font-bold mb-1", esDesktop ? "text-white" : "text-texto")}>
              Etapas de Vida
            </h2>
            <p className={cn("text-[14px] mb-3", esDesktop ? "text-white/40" : "text-texto-secundario")}>
              Los 4 grandes períodos de tu vida · Tenés {edadActual} años
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {datos.etapas_de_la_vida.map((etapa, idx) => {
                const activa = esEtapaActiva(etapa);
                const pasada = etapa.edad_fin !== null && edadActual >= etapa.edad_fin;
                const maestro = esMaestro(etapa.numero);
                return (
                  <button
                    key={idx}
                    onClick={() => abrirEtapa(etapa, idx, edadActual)}
                    className={cn(
                      "rounded-2xl p-4 text-left transition-all border",
                      esDesktop
                        ? activa
                          ? "backdrop-blur-xl bg-white/[0.08] border-[#7C4DFF]/40 ring-2 ring-[#7C4DFF]/20"
                          : "backdrop-blur-xl bg-white/[0.04] border-white/[0.08] hover:border-white/20"
                        : activa
                          ? "bg-gradient-to-br from-violet-900/60 to-fondo-tarjeta border-violet-400 ring-2 ring-violet-400/20"
                          : "bg-fondo-tarjeta border-borde hover:border-violet-300",
                      pasada && "opacity-50",
                    )}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className={cn(
                        "w-10 h-10 rounded-full flex items-center justify-center",
                        esDesktop
                          ? activa ? "bg-[#7C4DFF]/20" : "bg-white/[0.06]"
                          : activa ? "bg-primario/20" : "bg-fondo-elevado",
                      )}>
                        <span className={cn("text-lg font-bold", activa ? "text-[#B388FF]" : esDesktop ? "text-white/70" : "text-texto")}>
                          {etapa.numero}
                        </span>
                      </div>
                      <div className="flex gap-1.5">
                        {activa && <Badge variante="info">Ahora</Badge>}
                        {maestro && <Badge variante="advertencia">Maestro</Badge>}
                      </div>
                    </div>
                    <p className={cn("text-[14px] font-semibold", esDesktop ? "text-white/90" : "text-texto")}>
                      {etapa.nombre || `Pináculo ${idx + 1}`}
                    </p>
                    <p className={cn("text-[12px]", esDesktop ? "text-white/40" : "text-texto-terciario")}>
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
          onClick={() => { setModoManual(true); setDatosManual(null); setDetalle(null); }}
          className={cn("self-start flex items-center gap-2 text-[14px] transition-colors", esDesktop ? "text-white/40 hover:text-[#B388FF]" : "text-texto-secundario hover:text-primario")}
        >
          <Icono nombre="flechaIzquierda" tamaño={16} />
          Nuevo cálculo
        </button>
      </section>

      {/* ─── Panel Detalle — Desktop (overlay glassmorphic) ─────────── */}
      {detalleAbierto && detalle && !esMobile && (
        <PanelDetalle
          detalle={detalle}
          datos={datos}
          numerosCore={numerosCore}
          esMaestro={esMaestro}
          onCerrar={() => setDetalleAbierto(false)}
          onAbrirNumero={abrirNumero}
        />
      )}

      {/* ─── Panel Detalle — Mobile (overlay bottom) ────────────────── */}
      {detalleAbierto && detalle && esMobile && (
        <div className="lg:hidden fixed inset-0 z-50 flex flex-col justify-end">
          <button
            onClick={() => setDetalleAbierto(false)}
            className="absolute inset-0 bg-black/40"
            aria-label="Cerrar detalle"
          />
          <div className="relative bg-fondo-tarjeta rounded-t-2xl max-h-[75vh] overflow-y-auto scroll-sutil animate-in slide-in-from-bottom duration-200">
            <div className="sticky top-0 bg-fondo-tarjeta pt-3 pb-2 flex justify-center rounded-t-2xl z-10">
              <div className="w-10 h-1 rounded-full bg-borde" />
            </div>
            <div className="px-5 pb-8 flex flex-col gap-4">
              <div className="flex flex-col items-center gap-2 py-2">
                <p className={cn("text-5xl font-bold", detalle.esMaestro ? "text-acento" : "text-primario")}>
                  {detalle.numero}
                </p>
                <p className="text-[14px] font-semibold text-texto uppercase tracking-wider text-center">
                  {detalle.titulo}
                </p>
                {detalle.esMaestro && <Badge variante="advertencia">Número Maestro</Badge>}
              </div>
              <div className="rounded-xl bg-fondo-elevado p-4">
                <p className="text-[11px] font-semibold text-texto-secundario uppercase tracking-wider mb-2">Qué significa</p>
                <p className="text-[14px] text-texto leading-relaxed">{detalle.que_es}</p>
              </div>
              <div className="rounded-xl bg-fondo-elevado p-4">
                <p className="text-[11px] font-semibold text-texto-secundario uppercase tracking-wider mb-2">El número {detalle.numero}</p>
                <p className="text-[14px] font-semibold text-primario mb-1">{detalle.descripcion}</p>
                {detalle.descripcion_larga && (
                  <p className="text-[14px] text-texto-secundario leading-relaxed">{detalle.descripcion_larga}</p>
                )}
              </div>
              {detalle.extra && (
                <div className="rounded-xl bg-primario/10 border border-primario/20 p-4">
                  <p className="text-[14px] font-semibold text-primario">{detalle.extra}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
