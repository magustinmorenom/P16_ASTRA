"use client";

import { useState, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";

import { Tarjeta } from "@/componentes/ui/tarjeta";
import { Badge } from "@/componentes/ui/badge";
import { Boton } from "@/componentes/ui/boton";
import { Icono } from "@/componentes/ui/icono";
import { Esqueleto } from "@/componentes/ui/esqueleto";
import { Separador } from "@/componentes/ui/separador";
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

/* ------------------------------------------------------------------ */
/* Helpers                                                            */
/* ------------------------------------------------------------------ */

function badgeEstado(estado: string) {
  const mapa: Record<string, { variante: "exito" | "error" | "advertencia" | "info"; texto: string }> = {
    activa: { variante: "exito", texto: "Activa" },
    cancelada: { variante: "error", texto: "Cancelada" },
    pendiente: { variante: "advertencia", texto: "Pendiente" },
    pausada: { variante: "info", texto: "Pausada" },
  };
  const cfg = mapa[estado] ?? { variante: "info" as const, texto: estado };
  return <Badge variante={cfg.variante}>{cfg.texto}</Badge>;
}

function badgeEstadoPago(estado: string) {
  const mapa: Record<string, "exito" | "error" | "advertencia" | "info"> = {
    aprobado: "exito",
    pendiente: "advertencia",
    en_proceso: "info",
    rechazado: "error",
    cancelado: "error",
    reembolsado: "info",
    contracargo: "error",
  };
  return <Badge variante={mapa[estado] ?? "info"}>{estado}</Badge>;
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

/* ------------------------------------------------------------------ */
/* Componente principal                                               */
/* ------------------------------------------------------------------ */

export default function PaginaSuscripcion() {
  const queryClient = useQueryClient();
  const [paisSeleccionado, setPaisSeleccionado] = useState("AR");
  const [checkoutEnCurso, setCheckoutEnCurso] = useState(() => {
    if (typeof window !== "undefined") {
      return sessionStorage.getItem("astra_checkout_en_curso") === "1";
    }
    return false;
  });
  const [premiumConfirmado, setPremiumConfirmado] = useState(false);

  const { data: planes, isLoading: cargandoPlanes } = usarPlanes();
  const { data: miSuscripcion, isLoading: cargandoSuscripcion } = usarMiSuscripcion();
  const suscribirse = usarSuscribirse();
  const cancelar = usarCancelarSuscripcion();
  const { data: pagos, isLoading: cargandoPagos } = usarPagos();
  const { data: paisDetectado, isLoading: cargandoPais } = usarDetectarPais();
  const sincronizarPagos = usarSincronizarPagos();
  const planActualSlug = miSuscripcion?.plan_slug ?? "gratis";

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
    if (estadoVerificacion?.es_premium && checkoutEnCurso) {
      setPremiumConfirmado(true);
      setCheckoutEnCurso(false);
      sessionStorage.removeItem("astra_checkout_en_curso");
      queryClient.invalidateQueries({ queryKey: ["mi-suscripcion"] });
      queryClient.invalidateQueries({ queryKey: ["planes"] });
      queryClient.invalidateQueries({ queryKey: ["pagos"] });
      queryClient.invalidateQueries({ queryKey: ["facturas"] });
    }
  }, [estadoVerificacion, checkoutEnCurso, queryClient]);

  // Si miSuscripcion ya dice premium (refetch on window focus), confirmar también
  useEffect(() => {
    if (checkoutEnCurso && miSuscripcion?.plan_slug === "premium" && miSuscripcion?.estado === "activa") {
      setPremiumConfirmado(true);
      setCheckoutEnCurso(false);
      sessionStorage.removeItem("astra_checkout_en_curso");
    }
  }, [miSuscripcion, checkoutEnCurso]);

  const { mostrarToast } = useStoreUI();
  const [mostrarConfirmacionCancelar, setMostrarConfirmacionCancelar] = useState(false);

  // Actualizar país seleccionado cuando se detecte por IP
  useEffect(() => {
    if (paisDetectado?.pais_codigo) {
      setPaisSeleccionado(paisDetectado.pais_codigo);
    }
  }, [paisDetectado]);

  const planGratis = planes?.find((p) => p.slug === "gratis") ?? null;
  const planPremium = planes?.find((p) => p.slug === "premium") ?? null;

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
    <><HeaderMobile titulo="Suscripcion" mostrarAtras />
    <div className="flex flex-col gap-10">
      {/* Banner de confirmación post-checkout */}
      {premiumConfirmado && (
        <div className="flex items-center gap-4 rounded-xl border border-exito/30 bg-exito/10 p-5">
          <div className="flex items-center justify-center w-12 h-12 rounded-full bg-exito/20">
            <Icono nombre="check" tamaño={24} className="text-exito" />
          </div>
          <div>
            <p className="font-semibold text-texto">
              Tu plan Premium esta activo
            </p>
            <p className="text-sm text-texto-secundario">
              Ya podes disfrutar de todas las funcionalidades avanzadas de ASTRA.
            </p>
          </div>
        </div>
      )}

      {/* Banner de verificación en curso */}
      {checkoutEnCurso && !premiumConfirmado && (
        <div className="flex items-center gap-4 rounded-xl border border-acento/30 bg-acento/10 p-5">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-acento border-t-transparent" />
          <div>
            <p className="font-semibold text-texto">
              Verificando tu pago...
            </p>
            <p className="text-sm text-texto-secundario">
              Estamos confirmando tu pago con MercadoPago. Esto puede tomar unos segundos.
            </p>
          </div>
        </div>
      )}

      {/* Encabezado */}
      <div>
        <h1 className="text-3xl font-bold text-texto">
          Planes y Suscripcion
        </h1>
        <p className="mt-2 text-texto-secundario">
          Elige el plan que mejor se adapte a tus necesidades
        </p>
      </div>

      {/* ---------------------------------------------------------- */}
      {/* País detectado                                             */}
      {/* ---------------------------------------------------------- */}
      <section className="flex items-center gap-2 text-sm text-texto-secundario">
        <Icono nombre="ubicacion" tamaño={18} className="text-acento" />
        {cargandoPais ? (
          <Esqueleto className="h-5 w-48" />
        ) : (
          <span>
            Pais detectado:{" "}
            <span className="font-medium text-texto">
              {paisDetectado?.pais_nombre ?? "Argentina"} ({paisDetectado?.moneda ?? "ARS"})
            </span>
          </span>
        )}
      </section>

      {/* ---------------------------------------------------------- */}
      {/* Seccion: Planes disponibles                                */}
      {/* ---------------------------------------------------------- */}
      <section className="flex flex-col gap-4">
        <h2 className="text-xl font-semibold text-texto">
          Planes disponibles
        </h2>

        {cargandoPlanes ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto w-full">
            <Esqueleto className="h-96" />
            <Esqueleto className="h-96" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto w-full">
            {/* ---- Plan Gratis ---- */}
            <Tarjeta variante="default" padding="lg">
              <div className="flex flex-col gap-4 h-full">
                {/* Cabecera */}
                <div>
                  <h3 className="text-xl font-bold text-texto">
                    {planGratis?.nombre ?? "Gratis"}
                  </h3>
                  {planGratis && (
                    <>
                      <p className="text-3xl font-bold text-texto mt-2">
                        {formatearPrecioPlan(planGratis, paisSeleccionado).principal}
                      </p>
                      <p className="text-sm text-texto-terciario">
                        {formatearPrecioPlan(planGratis, paisSeleccionado).detalle}
                      </p>
                    </>
                  )}
                </div>

                <Separador />

                {/* Limites */}
                <div className="flex flex-col gap-1 text-sm text-texto-secundario">
                  <span>
                    <span className="text-texto-terciario">Perfiles: </span>
                    {planGratis ? formatearLimite(planGratis.limite_perfiles) : "1"}
                  </span>
                  <span>
                    <span className="text-texto-terciario">Calculos/dia: </span>
                    {planGratis ? formatearLimite(planGratis.limite_calculos_dia) : "10"}
                  </span>
                </div>

                <Separador />

                {/* Features */}
                <ul className="flex flex-col gap-2 flex-1">
                  {planGratis?.features && planGratis.features.length > 0 ? (
                    planGratis.features.map((f) => (
                      <li
                        key={f}
                        className="flex items-center gap-2 text-sm text-texto-secundario"
                      >
                        <Icono nombre="check" tamaño={16} className="text-exito" />
                        {f}
                      </li>
                    ))
                  ) : (
                    <>
                      <li className="flex items-center gap-2 text-sm text-texto-secundario">
                        <Icono nombre="check" tamaño={16} className="text-exito" />
                        Carta natal basica
                      </li>
                      <li className="flex items-center gap-2 text-sm text-texto-secundario">
                        <Icono nombre="check" tamaño={16} className="text-exito" />
                        Numerologia pitagorica
                      </li>
                      <li className="flex items-center gap-2 text-sm text-texto-secundario">
                        <Icono nombre="check" tamaño={16} className="text-exito" />
                        Transitos diarios
                      </li>
                    </>
                  )}
                </ul>

                {/* Accion */}
                {planActualSlug === "gratis" && (
                  <Badge variante="exito" className="self-start">
                    Plan actual
                  </Badge>
                )}
              </div>
            </Tarjeta>

            {/* ---- Plan Premium ---- */}
            <Tarjeta variante="dorado" padding="lg">
              <div className="flex flex-col gap-4 h-full">
                {/* Cabecera */}
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-xl font-bold text-texto">
                      {planPremium?.nombre ?? "Premium"}
                    </h3>
                    <Icono nombre="corona" tamaño={20} className="text-dorado-400" />
                  </div>
                  {planPremium ? (
                    <>
                      <p className="text-3xl font-bold text-texto mt-2">
                        {formatearPrecioPlan(planPremium, paisSeleccionado).principal}
                      </p>
                      <p className="text-sm text-texto-terciario">
                        {formatearPrecioPlan(planPremium, paisSeleccionado).detalle}
                      </p>
                    </>
                  ) : (
                    <>
                      <p className="text-3xl font-bold text-texto mt-2">
                        $9 <span className="text-base font-normal text-texto-secundario">USD/mes</span>
                      </p>
                    </>
                  )}
                  {planPremium?.descripcion && (
                    <p className="text-sm text-texto-terciario mt-1">
                      {planPremium.descripcion}
                    </p>
                  )}
                </div>

                <Separador />

                {/* Limites */}
                <div className="flex flex-col gap-1 text-sm text-texto-secundario">
                  <span>
                    <span className="text-texto-terciario">Perfiles: </span>
                    {planPremium ? formatearLimite(planPremium.limite_perfiles) : "Ilimitados"}
                  </span>
                  <span>
                    <span className="text-texto-terciario">Calculos/dia: </span>
                    {planPremium ? formatearLimite(planPremium.limite_calculos_dia) : "Ilimitados"}
                  </span>
                </div>

                <Separador />

                {/* Features */}
                <ul className="flex flex-col gap-2 flex-1">
                  {planPremium?.features && planPremium.features.length > 0 ? (
                    planPremium.features.map((f) => (
                      <li
                        key={f}
                        className="flex items-center gap-2 text-sm text-texto-secundario"
                      >
                        <Icono nombre="check" tamaño={16} className="text-dorado-400" />
                        {f}
                      </li>
                    ))
                  ) : (
                    <>
                      <li className="flex items-center gap-2 text-sm text-texto-secundario">
                        <Icono nombre="check" tamaño={16} className="text-dorado-400" />
                        Todo lo del plan Gratis
                      </li>
                      <li className="flex items-center gap-2 text-sm text-texto-secundario">
                        <Icono nombre="check" tamaño={16} className="text-dorado-400" />
                        Diseno Humano completo
                      </li>
                      <li className="flex items-center gap-2 text-sm text-texto-secundario">
                        <Icono nombre="check" tamaño={16} className="text-dorado-400" />
                        Retorno Solar anual
                      </li>
                      <li className="flex items-center gap-2 text-sm text-texto-secundario">
                        <Icono nombre="check" tamaño={16} className="text-dorado-400" />
                        Transitos vs carta natal
                      </li>
                      <li className="flex items-center gap-2 text-sm text-texto-secundario">
                        <Icono nombre="check" tamaño={16} className="text-dorado-400" />
                        Soporte prioritario
                      </li>
                    </>
                  )}
                </ul>

                {/* Accion */}
                {planActualSlug === "premium" ? (
                  <Badge variante="exito" className="self-start">
                    Plan actual
                  </Badge>
                ) : (
                  <Boton
                    variante="primario"
                    onClick={() => {
                      if (planPremium) manejarSuscribirse(planPremium);
                    }}
                    cargando={suscribirse.isPending}
                    className="w-full"
                    icono={<Icono nombre="cohete" tamaño={18} />}
                  >
                    Actualizar a Premium
                  </Boton>
                )}
              </div>
            </Tarjeta>
          </div>
        )}
      </section>

      {/* ---------------------------------------------------------- */}
      {/* Seccion: Mi Suscripcion                                    */}
      {/* ---------------------------------------------------------- */}
      <section className="flex flex-col gap-4">
        <h2 className="text-xl font-semibold text-texto">Mi Suscripcion</h2>

        {cargandoSuscripcion ? (
          <Esqueleto className="h-32" />
        ) : miSuscripcion ? (
          <Tarjeta variante="default" padding="md">
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-3">
                <span className="font-semibold text-texto">
                  Plan: {miSuscripcion.plan_nombre ?? "Gratis"}
                </span>
                {miSuscripcion.cancelacion_programada ? (
                  <Badge variante="advertencia">
                    Activo hasta {miSuscripcion.fecha_fin ? formatearFechaCorta(miSuscripcion.fecha_fin) : "—"}
                  </Badge>
                ) : (
                  badgeEstado(miSuscripcion.estado)
                )}
              </div>

              {/* Banner informativo de cancelación programada */}
              {miSuscripcion.cancelacion_programada && (
                <div className="flex flex-col gap-2 rounded-lg border border-advertencia/30 bg-advertencia/5 p-4">
                  <p className="text-sm text-texto">
                    Tu suscripcion Premium sigue activa hasta el{" "}
                    <span className="font-semibold">
                      {miSuscripcion.fecha_fin ? formatearFecha(miSuscripcion.fecha_fin) : "—"}
                    </span>.
                    Despues de esa fecha, tu plan cambiara automaticamente a Gratis.
                  </p>
                  <p className="text-xs text-texto-terciario">
                    Podes verificar la cancelacion en{" "}
                    <a
                      href="https://www.mercadopago.com.ar/subscriptions"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-acento underline"
                    >
                      mercadopago.com.ar &gt; Suscripciones
                    </a>
                  </p>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-sm text-texto-secundario">
                <div>
                  <span className="text-texto-terciario">Inicio: </span>
                  {miSuscripcion.fecha_inicio
                    ? formatearFecha(miSuscripcion.fecha_inicio)
                    : "\u2014"}
                </div>
                <div>
                  <span className="text-texto-terciario">Fin: </span>
                  {miSuscripcion.fecha_fin
                    ? formatearFecha(miSuscripcion.fecha_fin)
                    : "\u2014"}
                </div>
                <div>
                  <span className="text-texto-terciario">Pais: </span>
                  {miSuscripcion.pais_codigo}
                </div>
              </div>

              {/* Botón cancelar: solo si activa, premium, y NO tiene cancelación programada */}
              {miSuscripcion.estado === "activa" &&
                miSuscripcion.plan_slug !== "gratis" &&
                !miSuscripcion.cancelacion_programada && (
                  <div className="pt-2">
                    {!mostrarConfirmacionCancelar ? (
                      <Boton
                        variante="secundario"
                        onClick={() => setMostrarConfirmacionCancelar(true)}
                      >
                        Cancelar suscripcion
                      </Boton>
                    ) : (
                      <div className="flex flex-col gap-3 rounded-lg border border-error/30 bg-error/5 p-4">
                        <p className="text-sm font-medium text-texto">
                          Estas seguro que queres cancelar tu suscripcion Premium?
                        </p>
                        <p className="text-xs text-texto-secundario">
                          Se cancelara el cobro recurrente en MercadoPago.
                          Seguiras con acceso Premium hasta fin del periodo pagado,
                          luego tu plan cambiara a Gratis automaticamente.
                          Podes volver a suscribirte en cualquier momento.
                        </p>
                        <div className="flex items-center gap-3">
                          <Boton
                            variante="primario"
                            onClick={manejarCancelar}
                            cargando={cancelar.isPending}
                            className="bg-error hover:bg-error/80"
                          >
                            Si, cancelar
                          </Boton>
                          <Boton
                            variante="secundario"
                            onClick={() => setMostrarConfirmacionCancelar(false)}
                          >
                            No, mantener Premium
                          </Boton>
                        </div>
                      </div>
                    )}
                  </div>
                )}
            </div>
          </Tarjeta>
        ) : (
          <Tarjeta variante="default" padding="md">
            <p className="text-sm text-texto-terciario">
              No tienes una suscripcion activa.
            </p>
          </Tarjeta>
        )}
      </section>

      {/* ---------------------------------------------------------- */}
      {/* Seccion: Historial de Pagos                                */}
      {/* ---------------------------------------------------------- */}
      <section className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-texto">
            Historial de Pagos
          </h2>
          <Boton
            variante="secundario"
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
            className="text-xs"
            icono={<Icono nombre="descarga" tamaño={16} />}
          >
            Sincronizar con MP
          </Boton>
        </div>

        {cargandoPagos ? (
          <div className="flex flex-col gap-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <Esqueleto key={i} className="h-12" />
            ))}
          </div>
        ) : pagos && pagos.length > 0 ? (
          <div className="overflow-x-auto rounded-xl border border-borde">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-borde bg-fondo-elevado">
                  <th className="text-left px-4 py-3 text-texto-terciario font-medium">
                    Fecha
                  </th>
                  <th className="text-left px-4 py-3 text-texto-terciario font-medium">
                    Monto
                  </th>
                  <th className="text-left px-4 py-3 text-texto-terciario font-medium">
                    Estado
                  </th>
                  <th className="text-left px-4 py-3 text-texto-terciario font-medium">
                    Metodo
                  </th>
                  <th className="text-left px-4 py-3 text-texto-terciario font-medium">
                    Factura
                  </th>
                </tr>
              </thead>
              <tbody>
                {pagos.map((pago) => (
                  <tr
                    key={pago.id}
                    className="border-b border-borde last:border-b-0 hover:bg-fondo-elevado/50 transition-colors"
                  >
                    <td className="px-4 py-3 text-texto">
                      {pago.fecha_pago
                        ? formatearFechaHora(pago.fecha_pago)
                        : pago.creado_en
                          ? formatearFechaHora(pago.creado_en)
                          : "\u2014"}
                    </td>
                    <td className="px-4 py-3 text-texto">
                      {formatearMonto(pago.monto_centavos, pago.moneda)}
                    </td>
                    <td className="px-4 py-3">
                      {badgeEstadoPago(pago.estado)}
                    </td>
                    <td className="px-4 py-3 text-texto-secundario">
                      {pago.metodo_pago ?? "\u2014"}
                    </td>
                    <td className="px-4 py-3">
                      {pago.factura_id ? (
                        <a
                          href={`/api/v1/suscripcion/facturas/${pago.factura_id}/pdf`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 text-xs font-medium text-acento hover:text-acento/80 transition-colors"
                          title={`Descargar ${pago.numero_factura}`}
                        >
                          <Icono nombre="descarga" tamaño={16} />
                          PDF
                        </a>
                      ) : (
                        <span className="text-texto-terciario">{"\u2014"}</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <Tarjeta variante="default" padding="md">
            <p className="text-sm text-texto-terciario">
              No hay pagos registrados.
            </p>
          </Tarjeta>
        )}
      </section>

    </div>
    </>
  );
}
