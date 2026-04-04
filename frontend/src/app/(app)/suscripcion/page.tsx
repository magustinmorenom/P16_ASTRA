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

const FONDO_SUSCRIPCION = "relative min-h-full overflow-hidden";
const SUPERFICIE_HERO =
  "tema-superficie-hero relative overflow-hidden rounded-[24px]";
const SUPERFICIE_PANEL =
  "tema-superficie-panel rounded-[24px]";
const SUPERFICIE_ITEM =
  "rounded-[20px] border transition-colors";
const ESTILO_ITEM_SHELL = {
  borderColor: "var(--shell-borde)",
  background: "var(--shell-superficie)",
} as const;
const ESTILO_BOTON_LINEA = {
  borderColor: "var(--shell-borde)",
  color: "var(--shell-texto-secundario)",
} as const;
const ESTILO_BOTON_PELIGRO = {
  background: "var(--color-error)",
  color: "var(--shell-hero-texto)",
} as const;
const ESTILO_BADGE_VIOLETA = {
  borderColor: "var(--shell-chip-borde)",
  background: "var(--shell-chip)",
  color: "var(--color-acento)",
} as const;
const ESTILO_ALERTA_EXITO = {
  borderColor: "var(--shell-badge-exito-borde)",
  background: "var(--shell-badge-exito-fondo)",
} as const;
const ESTILO_ALERTA_EXITO_ICONO = {
  borderColor: "var(--shell-badge-exito-borde)",
  background: "var(--shell-badge-exito-fondo)",
  color: "var(--shell-badge-exito-texto)",
} as const;
const ESTILO_ALERTA_ERROR = {
  borderColor: "var(--shell-badge-error-borde)",
  background: "var(--shell-badge-error-fondo)",
} as const;

function FondoSuscripcion() {
  return (
    <>
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(circle_at_top_left, var(--shell-glow-1), transparent 26%), radial-gradient(circle_at_top_right, var(--shell-glow-2), transparent 24%), radial-gradient(circle_at_bottom_left, var(--shell-glow-1), transparent 32%)",
        }}
      />
      <div
        className="absolute right-[-80px] top-0 h-72 w-72 rounded-full blur-3xl"
        style={{ background: "var(--shell-glow-2)" }}
      />
      <div
        className="absolute left-[-40px] top-1/3 h-64 w-64 rounded-full blur-3xl"
        style={{ background: "var(--shell-glow-1)" }}
      />
    </>
  );
}

function EtiquetaPanel({ children }: { children: string }) {
  return (
    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[color:var(--color-acento)]">
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
  const estilos = {
    neutral: {
      borderColor: "var(--shell-badge-neutral-borde)",
      background: "var(--shell-badge-neutral-fondo)",
      color: "var(--shell-badge-neutral-texto)",
    },
    exito: {
      borderColor: "var(--shell-badge-exito-borde)",
      background: "var(--shell-badge-exito-fondo)",
      color: "var(--shell-badge-exito-texto)",
    },
    error: {
      borderColor: "var(--shell-badge-error-borde)",
      background: "var(--shell-badge-error-fondo)",
      color: "var(--shell-badge-error-texto)",
    },
    violeta: {
      borderColor: "var(--shell-badge-violeta-borde)",
      background: "var(--shell-badge-violeta-fondo)",
      color: "var(--shell-badge-violeta-texto)",
    },
  };

  return (
    <span
      className="inline-flex items-center rounded-full border px-2.5 py-1 text-[10px] font-semibold"
      style={estilos[tono]}
    >
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

function resumirFeatures(features: string[]): string[] {
  return features.slice(0, 3);
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
      <HeaderMobile titulo="Suscripción" mostrarAtras />
      <div className={FONDO_SUSCRIPCION} style={{ background: "var(--shell-fondo)" }}>
        <FondoSuscripcion />

        <div className="relative z-10 mx-auto max-w-6xl px-4 py-5 lg:px-6 lg:py-6">
          <section className={`${SUPERFICIE_HERO} p-5 sm:p-6 lg:p-7`}>
            <div
              className="absolute -right-14 top-[-64px] h-44 w-44 rounded-full blur-3xl"
              style={{ background: "var(--shell-glow-2)" }}
            />
            <div
              className="absolute bottom-[-76px] left-8 h-36 w-36 rounded-full blur-3xl"
              style={{ background: "var(--shell-glow-1)" }}
            />

            <div className="relative z-10">
              <EtiquetaPanel>Cuenta y facturación</EtiquetaPanel>
              <div className="mt-4 flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                <div className="min-w-0">
                  <div className="flex items-start gap-4">
                    <div className="rounded-[22px] border border-shell-borde tema-gradiente-acento p-4 text-[color:var(--shell-hero-texto)] shadow-[var(--shell-sombra-fuerte)]">
                      <Icono nombre="corona" tamaño={24} />
                    </div>

                    <div className="min-w-0">
                      <h1 className="tema-hero-titulo text-lg font-semibold tracking-tight sm:text-xl">
                        Tu plan y tus cobros
                      </h1>
                      <p className="tema-hero-secundario mt-2 text-sm leading-6">
                        {etiquetaPlanActual} ·{" "}
                        {cargandoPais
                          ? "Detectando país"
                          : `${paisDetectado?.pais_nombre ?? "Argentina"} (${paisDetectado?.moneda ?? "ARS"})`}{" "}
                        · {miSuscripcion?.estado ?? "Free"}
                      </p>
                      <p className="tema-hero-tenue mt-2 text-sm leading-6">
                        {obtenerTextoEstadoPlan(
                          etiquetaPlanActual,
                          tienePlanPago,
                          miSuscripcion?.estado,
                        )}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="shrink-0">
                  {miSuscripcion
                    ? badgeEstado(miSuscripcion.estado)
                    : <PillEstado tono="neutral">Free</PillEstado>}
                </div>
              </div>

              {miSuscripcion?.fecha_fin && (
                <p className="tema-hero-secundario mt-4 text-sm leading-6">
                  {miSuscripcion.cancelacion_programada ? "Activo hasta " : "Corte actual "}
                  <span className="font-medium text-[color:var(--shell-hero-texto)]">
                    {formatearFechaCorta(miSuscripcion.fecha_fin)}
                  </span>
                  .
                </p>
              )}

              {(premiumConfirmado || (checkoutEnCurso && !premiumConfirmado)) && (
                <div className="mt-5 space-y-3">
                  {premiumConfirmado && (
                    <div className="rounded-[20px] border px-4 py-3" style={ESTILO_ALERTA_EXITO}>
                      <div className="flex items-center gap-3">
                        <div className="rounded-xl border p-2" style={ESTILO_ALERTA_EXITO_ICONO}>
                          <Icono nombre="check" tamaño={14} />
                        </div>
                        <p className="text-sm" style={{ color: "var(--shell-badge-exito-texto)" }}>
                          Pago confirmado. La cuenta ya tiene acceso completo.
                        </p>
                      </div>
                    </div>
                  )}

                  {checkoutEnCurso && !premiumConfirmado && (
                    <div className="rounded-[20px] border px-4 py-3" style={ESTILO_BADGE_VIOLETA}>
                      <div className="flex items-center gap-3">
                        <div className="h-7 w-7 animate-spin rounded-full border-2 border-[color:var(--color-acento)] border-t-transparent" />
                        <p className="text-sm text-[color:var(--shell-hero-texto-secundario)]">
                          Verificando el pago. MercadoPago puede tardar unos segundos.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </section>

          <div className="mt-6">
            <section className={`${SUPERFICIE_PANEL} p-5 lg:p-6`}>
              <h2 className="text-base font-semibold tracking-tight text-[color:var(--shell-texto)]">
                Elegí tu plan
              </h2>

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
                    const featuresCompactas = resumirFeatures(features);
                    const puedeSuscribirse = esPremium;
                    const iconoPlan = esMax ? "corona" : esPremium ? "cohete" : "destello";

                    return (
                      <div
                        key={plan.slug}
                        className="flex h-full flex-col rounded-[22px] border p-5"
                        style={
                          esPlanActual
                            ? {
                                borderColor: "var(--shell-borde-fuerte)",
                                background:
                                  "linear-gradient(180deg, var(--shell-chip), var(--shell-superficie))",
                                boxShadow: "var(--shell-sombra-suave)",
                              }
                            : {
                                borderColor: "var(--shell-borde)",
                                background: "var(--shell-superficie)",
                                boxShadow: "var(--shell-sombra-suave)",
                              }
                        }
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div
                            className="rounded-[22px] border p-3.5"
                            style={
                              esMax
                                ? {
                                    borderColor: "var(--shell-borde)",
                                    background:
                                      "var(--shell-gradiente-acento)",
                                    color: "var(--shell-hero-texto)",
                                  }
                                : esPremium
                                  ? {
                                      borderColor: "var(--shell-borde)",
                                      background:
                                        "var(--shell-gradiente-acento-suave)",
                                      color: "var(--shell-hero-texto)",
                                    }
                                  : {
                                      borderColor: "var(--shell-chip-borde)",
                                      background: "var(--shell-superficie-suave)",
                                      color: "var(--color-acento)",
                                    }
                            }
                          >
                            <Icono nombre={iconoPlan} tamaño={18} />
                          </div>

                          {esPlanActual ? (
                            <PillEstado tono="exito">Plan actual</PillEstado>
                          ) : esMax ? (
                            <PillEstado tono="violeta">Próximamente</PillEstado>
                          ) : null}
                        </div>

                        <div className="mt-4">
                          <h3 className="text-base font-semibold text-[color:var(--shell-texto)]">
                            {obtenerEtiquetaPlan(plan.slug, plan.nombre)}
                          </h3>
                          <p className="mt-3 text-lg font-semibold tracking-tight text-[color:var(--shell-texto)]">
                            {precio.principal}
                          </p>
                          <p className="mt-1 text-xs leading-5 text-[color:var(--shell-texto-tenue)]">
                            {precio.detalle}
                          </p>
                          {plan.descripcion && (
                            <p className="mt-3 text-sm leading-6 text-[color:var(--shell-texto-secundario)]">
                              {plan.descripcion}
                            </p>
                          )}
                        </div>

                        <p className="mt-4 text-xs leading-5 text-[color:var(--shell-texto-tenue)]">
                          Perfiles {formatearLimite(plan.limite_perfiles)} · Cálculos/día{" "}
                          {formatearLimite(plan.limite_calculos_dia)}
                        </p>

                        <ul className="mt-5 flex flex-1 flex-col gap-2">
                          {featuresCompactas.map((feature) => (
                            <li
                              key={`${plan.slug}-${feature}`}
                              className="flex items-start gap-2 text-sm leading-6 text-[color:var(--shell-texto-secundario)]"
                            >
                              <Icono
                                nombre="check"
                                tamaño={15}
                                className={esMax ? "mt-1 text-shell-badge-acento" : esPremium ? "mt-1 text-acento" : "mt-1 text-[color:var(--shell-texto-tenue)]"}
                              />
                              <span>{feature}</span>
                            </li>
                          ))}
                          {features.length > featuresCompactas.length ? (
                            <li className="text-sm leading-6 text-[color:var(--shell-texto-tenue)]">
                              y {features.length - featuresCompactas.length} puntos más
                            </li>
                          ) : null}
                        </ul>

                        {puedeSuscribirse && !esPlanActual ? (
                          <Boton
                            variante="primario"
                            onClick={() => manejarSuscribirse(plan)}
                            cargando={suscribirse.isPending}
                            className="mt-5 w-full rounded-full"
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
              <h2 className="mt-2 text-base font-semibold tracking-tight text-[color:var(--shell-texto)]">
                Cancelación programada
              </h2>
              <div className="mt-5 rounded-[24px] border p-4" style={ESTILO_ALERTA_ERROR}>
                <p className="text-sm leading-6 text-[color:var(--shell-badge-error-texto)]">
                  Tu suscripción {etiquetaPlanActual} sigue activa hasta el{" "}
                  <span className="font-medium text-[color:var(--shell-texto)]">
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
                <h2 className="mt-2 text-base font-semibold tracking-tight text-[color:var(--shell-texto)]">
                  Cancelar suscripción
                </h2>
                <div className={`${SUPERFICIE_ITEM} mt-5 p-4`} style={ESTILO_ITEM_SHELL}>
                  {!mostrarConfirmacionCancelar ? (
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <p className="text-sm leading-6 text-[color:var(--shell-texto-secundario)]">
                        Si necesitás frenar renovaciones, podés cancelar el débito
                        recurrente antes de facturación.
                      </p>
                      <Boton
                        variante="fantasma"
                        onClick={() => setMostrarConfirmacionCancelar(true)}
                        className="rounded-full border px-4"
                        style={ESTILO_BOTON_LINEA}
                      >
                        Cancelar suscripción
                      </Boton>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <p className="text-sm font-medium text-[color:var(--shell-texto)]">
                        ¿Querés cancelar tu plan {etiquetaPlanActual}?
                      </p>
                      <p className="text-xs leading-5 text-[color:var(--shell-texto-tenue)]">
                        Se frena el cobro recurrente y mantenés acceso hasta cerrar
                        el período ya abonado.
                      </p>
                      <div className="flex flex-wrap gap-3">
                        <Boton
                          variante="primario"
                          onClick={manejarCancelar}
                          cargando={cancelar.isPending}
                          className="rounded-full px-4"
                          style={ESTILO_BOTON_PELIGRO}
                        >
                          Sí, cancelar
                        </Boton>
                        <Boton
                          variante="fantasma"
                          onClick={() => setMostrarConfirmacionCancelar(false)}
                          className="rounded-full border px-4"
                          style={ESTILO_BOTON_LINEA}
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
                <h2 className="text-base font-semibold tracking-tight text-[color:var(--shell-texto)]">
                  Pagos y comprobantes
                </h2>
                <p className="mt-2 text-sm leading-6 text-[color:var(--shell-texto-secundario)]">
                  Estado de cada cobro y acceso directo al PDF cuando existe factura.
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
                className="rounded-full border px-4"
                style={ESTILO_BOTON_LINEA}
                icono={<Icono nombre="descarga" tamaño={16} />}
              >
                Sincronizar pagos
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
                    style={ESTILO_ITEM_SHELL}
                  >
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-sm font-medium text-[color:var(--shell-texto)]">
                          {formatearMonto(pago.monto_centavos, pago.moneda)}
                        </p>
                        {badgeEstadoPago(pago.estado)}
                      </div>
                      <p className="mt-2 text-sm text-[color:var(--shell-texto-secundario)]">
                        {pago.fecha_pago
                          ? formatearFechaHora(pago.fecha_pago)
                          : pago.creado_en
                            ? formatearFechaHora(pago.creado_en)
                            : "—"}
                      </p>
                      <p className="mt-1 text-xs text-[color:var(--shell-texto-tenue)]">
                        Método: {pago.metodo_pago ?? "—"}
                      </p>
                    </div>

                    {pago.factura_id ? (
                      <a
                        href={`/api/v1/suscripcion/facturas/${pago.factura_id}/pdf`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition-colors"
                        style={ESTILO_ITEM_SHELL}
                        title={`Descargar ${pago.numero_factura}`}
                      >
                        <Icono nombre="descarga" tamaño={16} />
                        Descargar PDF
                      </a>
                    ) : (
                      <span className="text-xs text-[color:var(--shell-texto-tenue)]">Sin factura</span>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className={`${SUPERFICIE_ITEM} mt-5 p-4`} style={ESTILO_ITEM_SHELL}>
                <p className="text-sm leading-6 text-[color:var(--shell-texto-secundario)]">
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
