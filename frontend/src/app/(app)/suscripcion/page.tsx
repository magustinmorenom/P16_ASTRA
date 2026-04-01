"use client";

import { useState, useEffect, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";

import { Boton } from "@/componentes/ui/boton";
import { Icono } from "@/componentes/ui/icono";
import { Esqueleto } from "@/componentes/ui/esqueleto";
import {
  usarPlanes,
  usarMiSuscripcion,
  usarSuscribirse,
  usarCancelarSuscripcion,
  usarPagos,
  usarDetectarPais,
  usarSincronizarPagos,
  usarVerificarEstado,
} from "@/lib/hooks";
import { useStoreUI } from "@/lib/stores/store-ui";
import { formatearFechaHora, formatearFecha, formatearFechaCorta } from "@/lib/utilidades/formatear-fecha";
import type { Plan } from "@/lib/tipos";
import type { RespuestaSincronizar } from "@/lib/hooks/usar-suscripcion";
import HeaderMobile from "@/componentes/layouts/header-mobile";
import {
  esPlanPago,
  obtenerEtiquetaPlan,
} from "@/lib/utilidades/planes";

/* ------------------------------------------------------------------ */
/* Helpers                                                            */
/* ------------------------------------------------------------------ */

const FONDO_SUSCRIPCION = "relative min-h-full overflow-hidden bg-[#16011B]";
const SUPERFICIE_HERO =
  "relative overflow-hidden rounded-[32px] border border-white/[0.08] bg-[radial-gradient(circle_at_top_left,rgba(179,136,255,0.2),transparent_32%),linear-gradient(135deg,rgba(45,27,105,0.96),rgba(22,1,27,0.98))] shadow-[0_24px_70px_rgba(8,2,22,0.38)]";
const SUPERFICIE_PANEL =
  "rounded-[28px] border border-white/[0.08] bg-[linear-gradient(180deg,rgba(255,255,255,0.08),rgba(255,255,255,0.03))] shadow-[0_18px_40px_rgba(8,3,20,0.22)] backdrop-blur-xl";
const SUPERFICIE_ITEM =
  "rounded-[24px] border border-white/[0.08] bg-white/[0.04] transition-colors";

function FondoSuscripcion() {
  return (
    <>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(124,77,255,0.22),transparent_26%),radial-gradient(circle_at_top_right,rgba(179,136,255,0.14),transparent_24%),radial-gradient(circle_at_bottom_left,rgba(76,35,140,0.16),transparent_32%)]" />
      <div className="absolute right-[-80px] top-0 h-72 w-72 rounded-full bg-[#B388FF]/14 blur-3xl" />
      <div className="absolute left-[-40px] top-1/3 h-64 w-64 rounded-full bg-[#7C4DFF]/12 blur-3xl" />
    </>
  );
}

function EtiquetaPanel({ children }: { children: string }) {
  return (
    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-violet-200/70">
      {children}
    </p>
  );
}

function PillEstado({
  children,
  tono = "neutral",
}: {
  children: string;
  tono?: "neutral" | "exito" | "error" | "violeta";
}) {
  const clases = {
    neutral: "border-white/10 bg-white/[0.06] text-white/72",
    exito: "border-emerald-400/20 bg-emerald-500/14 text-emerald-200",
    error: "border-rose-400/20 bg-rose-500/14 text-rose-200",
    violeta: "border-[#B388FF]/20 bg-[#7C4DFF]/12 text-[#E7DAFF]",
  };

  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[10px] font-semibold ${clases[tono]}`}>
      {children}
    </span>
  );
}

function badgeEstado(estado: string) {
  const mapa: Record<string, { tono: "exito" | "error" | "violeta" | "neutral"; texto: string }> = {
    activa: { tono: "exito", texto: "Activa" },
    cancelada: { tono: "error", texto: "Cancelada" },
    pendiente: { tono: "violeta", texto: "Pendiente" },
    pausada: { tono: "violeta", texto: "Pausada" },
  };
  const cfg = mapa[estado] ?? { tono: "neutral" as const, texto: estado };
  return <PillEstado tono={cfg.tono}>{cfg.texto}</PillEstado>;
}

function badgeEstadoPago(estado: string) {
  const mapa: Record<string, "exito" | "error" | "violeta" | "neutral"> = {
    aprobado: "exito",
    pendiente: "violeta",
    en_proceso: "neutral",
    rechazado: "error",
    cancelado: "error",
    reembolsado: "neutral",
    contracargo: "error",
  };
  return <PillEstado tono={mapa[estado] ?? "neutral"}>{estado}</PillEstado>;
}

function formatearMonto(centavos: number, moneda: string): string {
  const valor = (centavos / 100).toFixed(2);
  return `$${valor} ${moneda}`;
}

function formatearPrecioPlan(plan: Plan, paisCodigo: string): { principal: string; detalle: string } {
  if (plan.precio_usd_centavos === 0) {
    return { principal: "$0", detalle: "para siempre" };
  }

  const usd = (plan.precio_usd_centavos / 100).toFixed(0);

  // Intentar precio del país seleccionado desde precios_por_pais
  const precioPais = plan.precios_por_pais?.[paisCodigo];
  if (precioPais) {
    const local = (precioPais.precio_local / 100).toFixed(0);
    return {
      principal: `$${local} ${precioPais.moneda}`,
      detalle: `~USD $${usd}/${plan.intervalo === "months" ? "mes" : plan.intervalo}`,
    };
  }

  // Fallback al precio_local del plan (retrocompat)
  if (plan.precio_local && plan.moneda_local) {
    const local = (plan.precio_local / 100).toFixed(0);
    return {
      principal: `$${local} ${plan.moneda_local}`,
      detalle: `~USD $${usd}/${plan.intervalo === "months" ? "mes" : plan.intervalo}`,
    };
  }

  return {
    principal: `$${usd}`,
    detalle: `USD/${plan.intervalo === "months" ? "mes" : plan.intervalo}`,
  };
}

function formatearLimite(valor: number): string {
  return valor === -1 ? "Ilimitados" : String(valor);
}

const PLAN_MAX_PLACEHOLDER: Plan = {
  id: "plan-max-ui",
  nombre: "Max",
  slug: "max",
  descripcion: "La capa más alta de ASTRA. Acceso y beneficios en definición.",
  precio_usd_centavos: 0,
  intervalo: "months",
  limite_perfiles: -1,
  limite_calculos_dia: -1,
  features: [
    "Todo lo de Premium",
    "Prioridad máxima",
    "Experiencias expandidas",
    "Acceso comercial por definir",
  ],
  precio_local: null,
  moneda_local: null,
};

function obtenerPlanesVisibles(planes: Plan[] | undefined): Plan[] {
  const mapa = new Map((planes ?? []).map((plan) => [plan.slug, plan]));

  if (!mapa.has("max")) {
    mapa.set("max", PLAN_MAX_PLACEHOLDER);
  }

  return ["gratis", "premium", "max"]
    .map((slug) => mapa.get(slug))
    .filter((plan): plan is Plan => !!plan);
}

function obtenerPrecioVisible(plan: Plan, paisCodigo: string): { principal: string; detalle: string } {
  if (plan.slug === "max") {
    return {
      principal: "Acceso por definir",
      detalle: "Vamos a cerrar precio y modalidad en la próxima iteración.",
    };
  }

  return formatearPrecioPlan(plan, paisCodigo);
}

function obtenerFeaturesFallback(plan: Plan): string[] {
  if (plan.slug === "gratis") {
    return [
      "Carta natal básica",
      "Numerología pitagórica",
      "Tránsitos diarios",
    ];
  }

  if (plan.slug === "premium") {
    return [
      "Todo lo del plan Free",
      "Diseño Humano completo",
      "Retorno Solar anual",
      "Tránsitos vs carta natal",
      "Soporte prioritario",
    ];
  }

  return [
    "Todo lo de Premium",
    "Prioridad máxima",
    "Capas extra de interpretación",
    "Acceso y beneficios en definición",
  ];
}

function obtenerTextoEstadoPlan(
  etiquetaPlanActual: string,
  tienePlanPago: boolean,
  estado: string | undefined,
) {
  if (estado === "cancelada") {
    return `Tu cuenta vuelve a Free al cerrar el período ya abonado.`;
  }

  if (!tienePlanPago) {
    return "Tenés la capa base activa y podés subir cuando necesites más profundidad.";
  }

  return `${etiquetaPlanActual} está activo en tu cuenta.`;
}

/* ------------------------------------------------------------------ */
/* Componente principal                                               */
/* ------------------------------------------------------------------ */

export default function PaginaSuscripcion() {
  const queryClient = useQueryClient();
  const [checkoutEnCurso, setCheckoutEnCurso] = useState(() => {
    if (typeof window !== "undefined") {
      return sessionStorage.getItem("astra_checkout_en_curso") === "1";
    }
    return false;
  });
  const [premiumConfirmado, setPremiumConfirmado] = useState(false);

  const { data: planes, isLoading: cargandoPlanes } = usarPlanes();
  const { data: miSuscripcion } = usarMiSuscripcion();
  const suscribirse = usarSuscribirse();
  const cancelar = usarCancelarSuscripcion();
  const { data: pagos, isLoading: cargandoPagos } = usarPagos();
  const { data: paisDetectado, isLoading: cargandoPais } = usarDetectarPais();
  const sincronizarPagos = usarSincronizarPagos();
  const planActualSlug = miSuscripcion?.plan_slug ?? "gratis";
  const etiquetaPlanActual = obtenerEtiquetaPlan(
    miSuscripcion?.plan_slug,
    miSuscripcion?.plan_nombre,
  );
  const paisSeleccionado = paisDetectado?.pais_codigo ?? "AR";
  const tienePlanPago = esPlanPago(miSuscripcion?.plan_slug);

  const confirmarCheckout = useCallback(() => {
    setPremiumConfirmado(true);
    setCheckoutEnCurso(false);
    sessionStorage.removeItem("astra_checkout_en_curso");
    queryClient.invalidateQueries({ queryKey: ["mi-suscripcion"] });
    queryClient.invalidateQueries({ queryKey: ["planes"] });
    queryClient.invalidateQueries({ queryKey: ["pagos"] });
    queryClient.invalidateQueries({ queryKey: ["facturas"] });
  }, [queryClient]);

  // Polling post-checkout: cuando el usuario vuelve del checkout de MP,
  // hacemos polling activo para detectar cuándo el webhook activa la suscripción
  const { data: estadoVerificacion } = usarVerificarEstado(checkoutEnCurso && !premiumConfirmado);

  // Detectar que el usuario volvió del checkout (tab se hizo visible de nuevo)
  useEffect(() => {
    function manejarVisibilidad() {
      if (document.visibilityState === "visible" && checkoutEnCurso) {
        // Invalidar para refrescar inmediatamente
        queryClient.invalidateQueries({ queryKey: ["mi-suscripcion"] });
      }
    }
    document.addEventListener("visibilitychange", manejarVisibilidad);
    return () => document.removeEventListener("visibilitychange", manejarVisibilidad);
  }, [checkoutEnCurso, queryClient]);

  // Cuando el polling detecta que es premium, confirmar y detener
  useEffect(() => {
    if (!estadoVerificacion?.es_premium || !checkoutEnCurso) return;

    const timeoutId = window.setTimeout(() => {
      confirmarCheckout();
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [estadoVerificacion, checkoutEnCurso, confirmarCheckout]);

  // Si miSuscripcion ya dice premium (refetch on window focus), confirmar también
  useEffect(() => {
    if (!(checkoutEnCurso && esPlanPago(miSuscripcion?.plan_slug) && miSuscripcion?.estado === "activa")) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      confirmarCheckout();
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [miSuscripcion, checkoutEnCurso, confirmarCheckout]);

  const { mostrarToast } = useStoreUI();
  const [mostrarConfirmacionCancelar, setMostrarConfirmacionCancelar] = useState(false);

  const planesVisibles = obtenerPlanesVisibles(planes);

  function manejarSuscribirse(plan: Plan) {
    suscribirse.mutate(
      { plan_id: plan.id, pais_codigo: paisSeleccionado },
      {
        onSuccess: (resp) => {
          sessionStorage.setItem("astra_checkout_en_curso", "1");
          setCheckoutEnCurso(true);
          setPremiumConfirmado(false);
          window.location.href = resp.init_point;
        },
      }
    );
  }

  function manejarCancelar() {
    cancelar.mutate(undefined, {
      onSuccess: () => {
        setMostrarConfirmacionCancelar(false);
        queryClient.invalidateQueries({ queryKey: ["mi-suscripcion"] });
        queryClient.invalidateQueries({ queryKey: ["planes"] });
      },
    });
  }

  return (
    <>
      <HeaderMobile titulo="Suscripcion" mostrarAtras />
      <div className={FONDO_SUSCRIPCION}>
        <FondoSuscripcion />

        <div className="relative z-10 mx-auto max-w-6xl px-4 py-5 lg:px-6 lg:py-6">
          <section className={`${SUPERFICIE_HERO} p-5 sm:p-6 lg:p-7`}>
            <div className="absolute -right-14 top-[-64px] h-44 w-44 rounded-full bg-[#B388FF]/18 blur-3xl" />
            <div className="absolute bottom-[-76px] left-8 h-36 w-36 rounded-full bg-[#7C4DFF]/14 blur-3xl" />

            <div className="relative z-10">
              <EtiquetaPanel>Cuenta y facturación</EtiquetaPanel>

              <div className="mt-4 grid gap-5 xl:grid-cols-[1.15fr_0.85fr] xl:items-start">
                <div>
                  <div className="flex items-start gap-4">
                    <div className="rounded-[26px] border border-white/10 bg-[linear-gradient(135deg,rgba(124,77,255,0.92),rgba(179,136,255,0.7))] p-4 text-white shadow-[0_16px_34px_rgba(34,10,76,0.34)]">
                      <Icono nombre="corona" tamaño={26} />
                    </div>

                    <div className="min-w-0">
                      <h1 className="text-xl font-semibold tracking-[-0.02em] text-white sm:text-2xl">
                        Planes y facturación
                      </h1>
                      <p className="mt-2 max-w-2xl text-sm leading-6 text-white/64">
                        Gestioná tu plan, revisá el estado de la cuenta y descargá
                        comprobantes sin salir de ASTRA.
                      </p>
                    </div>
                  </div>

                  <div className="mt-5 flex flex-wrap gap-2.5">
                    <div className="rounded-full border border-white/10 bg-white/[0.08] px-3.5 py-1.5">
                      <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-violet-200/70">
                        Plan
                      </span>
                      <span className="ml-2 text-[13px] font-medium text-white">
                        {etiquetaPlanActual}
                      </span>
                    </div>
                    <div className="rounded-full border border-white/10 bg-white/[0.06] px-3.5 py-1.5">
                      <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-violet-200/70">
                        País
                      </span>
                      <span className="ml-2 text-[13px] font-medium text-white">
                        {cargandoPais
                          ? "Detectando"
                          : `${paisDetectado?.pais_nombre ?? "Argentina"} (${paisDetectado?.moneda ?? "ARS"})`}
                      </span>
                    </div>
                    <div className="rounded-full border border-white/10 bg-white/[0.06] px-3.5 py-1.5">
                      <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-violet-200/70">
                        Estado
                      </span>
                      <span className="ml-2 text-[13px] font-medium text-white">
                        {miSuscripcion?.estado ?? "Free"}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="rounded-[26px] border border-white/[0.08] bg-white/[0.05] p-5 backdrop-blur-xl">
                  <EtiquetaPanel>Mi suscripción</EtiquetaPanel>
                  <div className="mt-3 flex items-start justify-between gap-4">
                  <div>
                      <p className="text-2xl font-semibold tracking-[-0.02em] text-white">
                        {etiquetaPlanActual}
                      </p>
                      <p className="mt-2 text-sm leading-6 text-white/60">
                        {obtenerTextoEstadoPlan(
                          etiquetaPlanActual,
                          tienePlanPago,
                          miSuscripcion?.estado,
                        )}
                      </p>
                    </div>
                    {miSuscripcion
                      ? badgeEstado(miSuscripcion.estado)
                      : <PillEstado tono="neutral">Free</PillEstado>}
                  </div>

                  {miSuscripcion?.fecha_fin && (
                    <p className="mt-4 text-sm leading-6 text-white/64">
                      {miSuscripcion.cancelacion_programada ? "Activo hasta " : "Corte actual "}
                      <span className="font-medium text-white">
                        {formatearFechaCorta(miSuscripcion.fecha_fin)}
                      </span>
                      .
                    </p>
                  )}
                </div>
              </div>

              {(premiumConfirmado || (checkoutEnCurso && !premiumConfirmado)) && (
                <div className="mt-5 grid gap-3 md:grid-cols-2">
                  {premiumConfirmado && (
                    <div className="rounded-[24px] border border-emerald-400/18 bg-emerald-500/[0.08] p-4">
                      <div className="flex items-start gap-3">
                        <div className="rounded-2xl border border-emerald-400/18 bg-emerald-500/[0.14] p-2.5 text-emerald-200">
                          <Icono nombre="check" tamaño={16} />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-white">
                            Tu plan pago está activo
                          </p>
                          <p className="mt-1 text-xs leading-5 text-white/56">
                            La cuenta ya tiene acceso a la capa avanzada.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {checkoutEnCurso && !premiumConfirmado && (
                    <div className="rounded-[24px] border border-[#B388FF]/18 bg-[#7C4DFF]/[0.08] p-4">
                      <div className="flex items-start gap-3">
                        <div className="mt-0.5 h-9 w-9 animate-spin rounded-full border-2 border-[#D8C0FF] border-t-transparent" />
                        <div>
                          <p className="text-sm font-medium text-white">
                            Verificando tu pago
                          </p>
                          <p className="mt-1 text-xs leading-5 text-white/56">
                            MercadoPago puede tardar unos segundos en reflejar la activación.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </section>

          <div className="mt-6">
            <section className={`${SUPERFICIE_PANEL} p-5 lg:p-6`}>
              <EtiquetaPanel>Planes disponibles</EtiquetaPanel>
              <h2 className="mt-2 text-lg font-semibold tracking-tight text-white">
                Elegí tu capa
              </h2>
              <p className="mt-2 text-sm leading-6 text-white/56">
                Free para base, Premium para la experiencia completa actual y Max
                como siguiente capa en definición.
              </p>

              {cargandoPlanes ? (
                <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-3">
                  {Array.from({ length: 3 }).map((_, indice) => (
                    <Esqueleto key={indice} className="h-80 rounded-[28px]" />
                  ))}
                </div>
              ) : (
                <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-3">
                  {planesVisibles.map((plan) => {
                    const esPlanActual = planActualSlug === plan.slug;
                    const esMax = plan.slug === "max";
                    const esPremium = plan.slug === "premium";
                    const precio = obtenerPrecioVisible(plan, paisSeleccionado);
                    const features = plan.features.length > 0
                      ? plan.features
                      : obtenerFeaturesFallback(plan);
                    const puedeSuscribirse = esPremium;
                    const iconoPlan = esMax ? "corona" : esPremium ? "cohete" : "destello";

                    return (
                      <div
                        key={plan.slug}
                        className={`flex h-full flex-col rounded-[28px] border p-5 shadow-[0_18px_40px_rgba(8,3,20,0.2)] ${
                          esPlanActual
                            ? "border-[#B388FF]/28 bg-[linear-gradient(180deg,rgba(124,77,255,0.18),rgba(255,255,255,0.05))]"
                            : "border-white/[0.08] bg-white/[0.04]"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className={`rounded-[22px] border border-white/10 p-3.5 ${
                            esMax
                              ? "bg-[linear-gradient(135deg,rgba(124,77,255,0.9),rgba(179,136,255,0.7))] text-white"
                              : esPremium
                                ? "bg-[linear-gradient(135deg,rgba(124,77,255,0.78),rgba(179,136,255,0.52))] text-white"
                                : "bg-white/[0.08] text-[#E7DAFF]"
                          }`}>
                            <Icono nombre={iconoPlan} tamaño={18} />
                          </div>

                          {esPlanActual ? (
                            <PillEstado tono="exito">Plan actual</PillEstado>
                          ) : esMax ? (
                            <PillEstado tono="violeta">Próximamente</PillEstado>
                          ) : null}
                        </div>

                        <div className="mt-4">
                          <h3 className="text-lg font-semibold text-white">
                            {obtenerEtiquetaPlan(plan.slug, plan.nombre)}
                          </h3>
                          <p className="mt-3 text-xl font-semibold tracking-[-0.02em] text-white">
                            {precio.principal}
                          </p>
                          <p className="mt-1 text-xs leading-5 text-white/48">
                            {precio.detalle}
                          </p>
                          {plan.descripcion && (
                            <p className="mt-3 text-sm leading-6 text-white/58">
                              {plan.descripcion}
                            </p>
                          )}
                        </div>

                        <div className="mt-4 flex flex-wrap gap-2 text-[12px] text-white/58">
                          <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1">
                            Perfiles: {formatearLimite(plan.limite_perfiles)}
                          </span>
                          <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1">
                            Cálculos/día: {formatearLimite(plan.limite_calculos_dia)}
                          </span>
                        </div>

                        <ul className="mt-5 flex flex-1 flex-col gap-2">
                          {features.map((feature) => (
                            <li
                              key={`${plan.slug}-${feature}`}
                              className="flex items-start gap-2 text-sm leading-6 text-white/68"
                            >
                              <Icono
                                nombre="check"
                                tamaño={15}
                                className={esMax ? "mt-1 text-[#D8C0FF]" : esPremium ? "mt-1 text-[#B388FF]" : "mt-1 text-emerald-300"}
                              />
                              <span>{feature}</span>
                            </li>
                          ))}
                        </ul>

                        {puedeSuscribirse && !esPlanActual ? (
                          <Boton
                            variante="primario"
                            onClick={() => manejarSuscribirse(plan)}
                            cargando={suscribirse.isPending}
                            className="mt-5 w-full rounded-full bg-[#7C4DFF] text-white hover:bg-[#8F66FF]"
                            icono={<Icono nombre="cohete" tamaño={16} />}
                          >
                            Actualizar a {obtenerEtiquetaPlan(plan.slug, plan.nombre)}
                          </Boton>
                        ) : null}
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
          </div>

          {miSuscripcion?.cancelacion_programada && (
            <section className={`${SUPERFICIE_PANEL} mt-6 p-5 lg:p-6`}>
              <EtiquetaPanel>Gestión del plan</EtiquetaPanel>
              <h2 className="mt-2 text-lg font-semibold tracking-tight text-white">
                Cancelación programada
              </h2>
              <div className="mt-5 rounded-[24px] border border-rose-400/18 bg-rose-500/[0.06] p-4">
                <p className="text-sm leading-6 text-rose-100/78">
                  Tu suscripción {etiquetaPlanActual} sigue activa hasta el{" "}
                  <span className="font-medium text-white">
                    {miSuscripcion.fecha_fin ? formatearFecha(miSuscripcion.fecha_fin) : "—"}
                  </span>
                  . Después de esa fecha, la cuenta vuelve a Free.
                </p>
              </div>
            </section>
          )}

          {miSuscripcion?.estado === "activa" &&
            miSuscripcion.plan_slug !== "gratis" &&
            !miSuscripcion.cancelacion_programada && (
              <section className={`${SUPERFICIE_PANEL} mt-6 p-5 lg:p-6`}>
                <EtiquetaPanel>Gestión del plan</EtiquetaPanel>
                <h2 className="mt-2 text-lg font-semibold tracking-tight text-white">
                  Cancelar suscripción
                </h2>
                <div className={`${SUPERFICIE_ITEM} mt-5 p-4`}>
                  {!mostrarConfirmacionCancelar ? (
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <p className="text-sm leading-6 text-white/58">
                        Si necesitás frenar renovaciones, podés cancelar el débito
                        recurrente antes de facturación.
                      </p>
                      <Boton
                        variante="fantasma"
                        onClick={() => setMostrarConfirmacionCancelar(true)}
                        className="rounded-full border border-white/10 bg-transparent px-4 text-white/72 hover:bg-white/[0.06] hover:text-white"
                      >
                        Cancelar suscripción
                      </Boton>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <p className="text-sm font-medium text-white">
                        ¿Querés cancelar tu plan {etiquetaPlanActual}?
                      </p>
                      <p className="text-xs leading-5 text-white/52">
                        Se frena el cobro recurrente y mantenés acceso hasta cerrar
                        el período ya abonado.
                      </p>
                      <div className="flex flex-wrap gap-3">
                        <Boton
                          variante="primario"
                          onClick={manejarCancelar}
                          cargando={cancelar.isPending}
                          className="rounded-full bg-[#E57373] px-4 text-white hover:bg-[#ef8484]"
                        >
                          Sí, cancelar
                        </Boton>
                        <Boton
                          variante="fantasma"
                          onClick={() => setMostrarConfirmacionCancelar(false)}
                          className="rounded-full border border-white/10 bg-transparent px-4 text-white/72 hover:bg-white/[0.06] hover:text-white"
                        >
                          No, mantener
                        </Boton>
                      </div>
                    </div>
                  )}
                </div>
              </section>
            )}

          <section className={`${SUPERFICIE_PANEL} mt-6 p-5 lg:p-6`}>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <EtiquetaPanel>Facturación</EtiquetaPanel>
                <h2 className="mt-2 text-lg font-semibold tracking-tight text-white">
                  Pagos y comprobantes
                </h2>
                <p className="mt-2 text-sm leading-6 text-white/56">
                  Historial corto, estado de cada cobro y acceso directo al PDF
                  cuando existe factura.
                </p>
              </div>

              <Boton
                variante="fantasma"
                onClick={() => {
                  sincronizarPagos.mutate(undefined, {
                    onSuccess: (datos: RespuestaSincronizar) => {
                      queryClient.invalidateQueries({ queryKey: ["pagos"] });
                      queryClient.invalidateQueries({ queryKey: ["mi-suscripcion"] });
                      queryClient.invalidateQueries({ queryKey: ["verificar-estado"] });
                      if (datos.sincronizados > 0) {
                        mostrarToast("exito", `Se sincronizaron ${datos.sincronizados} pagos`);
                      } else if (datos.errores && datos.errores.length > 0) {
                        mostrarToast("error", datos.errores.join(". "));
                      } else {
                        mostrarToast("info", "No se encontraron pagos nuevos");
                      }
                    },
                    onError: () => {
                      mostrarToast("error", "Error al conectar con MercadoPago");
                    },
                  });
                }}
                cargando={sincronizarPagos.isPending}
                className="rounded-full border border-white/10 bg-transparent px-4 text-white/72 hover:bg-white/[0.06] hover:text-white"
                icono={<Icono nombre="descarga" tamaño={16} />}
              >
                Sincronizar con MP
              </Boton>
            </div>

            {cargandoPagos ? (
              <div className="mt-5 space-y-3">
                {Array.from({ length: 3 }).map((_, indice) => (
                  <Esqueleto key={indice} className="h-24 rounded-[24px]" />
                ))}
              </div>
            ) : pagos && pagos.length > 0 ? (
              <div className="mt-5 space-y-3">
                {pagos.map((pago) => (
                  <div
                    key={pago.id}
                    className={`${SUPERFICIE_ITEM} flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between`}
                  >
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-sm font-medium text-white">
                          {formatearMonto(pago.monto_centavos, pago.moneda)}
                        </p>
                        {badgeEstadoPago(pago.estado)}
                      </div>
                      <p className="mt-2 text-sm text-white/58">
                        {pago.fecha_pago
                          ? formatearFechaHora(pago.fecha_pago)
                          : pago.creado_en
                            ? formatearFechaHora(pago.creado_en)
                            : "—"}
                      </p>
                      <p className="mt-1 text-xs text-white/44">
                        Método: {pago.metodo_pago ?? "—"}
                      </p>
                    </div>

                    {pago.factura_id ? (
                      <a
                        href={`/api/v1/suscripcion/facturas/${pago.factura_id}/pdf`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.06] px-4 py-2 text-sm font-medium text-white/78 transition-colors hover:bg-white/[0.1] hover:text-white"
                        title={`Descargar ${pago.numero_factura}`}
                      >
                        <Icono nombre="descarga" tamaño={16} />
                        Descargar PDF
                      </a>
                    ) : (
                      <span className="text-xs text-white/38">Sin factura</span>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className={`${SUPERFICIE_ITEM} mt-5 p-4`}>
                <p className="text-sm leading-6 text-white/58">
                  No hay pagos registrados todavía.
                </p>
              </div>
            )}
          </section>
        </div>
      </div>
    </>
  );
}
