"use client";

import { useState } from "react";
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
  usarPaises,
  usarFacturas,
} from "@/lib/hooks";
import { formatearFechaHora, formatearFecha } from "@/lib/utilidades/formatear-fecha";
import type { Plan } from "@/lib/tipos";

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

  const { data: planes, isLoading: cargandoPlanes } = usarPlanes();
  const { data: miSuscripcion, isLoading: cargandoSuscripcion } = usarMiSuscripcion();
  const suscribirse = usarSuscribirse();
  const cancelar = usarCancelarSuscripcion();
  const { data: pagos, isLoading: cargandoPagos } = usarPagos();
  const { data: paises, isLoading: cargandoPaises } = usarPaises();
  const { data: facturas, isLoading: cargandoFacturas } = usarFacturas();

  const planActualSlug = miSuscripcion?.plan_slug ?? "gratis";

  const planGratis = planes?.find((p) => p.slug === "gratis") ?? null;
  const planPremium = planes?.find((p) => p.slug === "premium") ?? null;

  function manejarSuscribirse(plan: Plan) {
    suscribirse.mutate(
      { plan_id: plan.id, pais_codigo: paisSeleccionado },
      {
        onSuccess: (resp) => {
          window.location.href = resp.init_point;
        },
      }
    );
  }

  function manejarCancelar() {
    cancelar.mutate(undefined, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["mi-suscripcion"] });
      },
    });
  }

  return (
    <div className="flex flex-col gap-10">
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
      {/* Selector de pais                                           */}
      {/* ---------------------------------------------------------- */}
      <section className="flex flex-col gap-2">
        <label htmlFor="selector-pais" className="text-sm font-medium text-texto-secundario">
          Tu pais
        </label>
        {cargandoPaises ? (
          <Esqueleto className="h-10 w-48" />
        ) : (
          <select
            id="selector-pais"
            value={paisSeleccionado}
            onChange={(e) => setPaisSeleccionado(e.target.value)}
            className="w-48 rounded-lg border border-borde bg-fondo-elevado px-3 py-2 text-sm text-texto focus:outline-none focus:ring-2 focus:ring-acento"
          >
            {paises?.map((p) => (
              <option key={p.pais_codigo} value={p.pais_codigo}>
                {p.pais_nombre} ({p.moneda})
              </option>
            ))}
          </select>
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
                {planActualSlug === "gratis" ? (
                  <Badge variante="exito" className="self-start">
                    Plan actual
                  </Badge>
                ) : (
                  <Boton
                    variante="secundario"
                    onClick={manejarCancelar}
                    cargando={cancelar.isPending}
                    className="w-full"
                  >
                    Volver al plan Gratis
                  </Boton>
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
                  <div className="flex flex-col gap-2">
                    <Badge variante="exito" className="self-start">
                      Plan actual
                    </Badge>
                    {miSuscripcion?.estado === "activa" && (
                      <Boton
                        variante="secundario"
                        onClick={manejarCancelar}
                        cargando={cancelar.isPending}
                        className="w-full"
                      >
                        Cancelar suscripcion
                      </Boton>
                    )}
                  </div>
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
                {badgeEstado(miSuscripcion.estado)}
              </div>

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

              {miSuscripcion.estado === "activa" &&
                miSuscripcion.plan_slug !== "gratis" && (
                  <div className="pt-2">
                    <Boton
                      variante="secundario"
                      onClick={manejarCancelar}
                      cargando={cancelar.isPending}
                    >
                      Cancelar suscripcion
                    </Boton>
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
        <h2 className="text-xl font-semibold text-texto">
          Historial de Pagos
        </h2>

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

      {/* ---------------------------------------------------------- */}
      {/* Seccion: Facturas                                          */}
      {/* ---------------------------------------------------------- */}
      <section className="flex flex-col gap-4">
        <h2 className="text-xl font-semibold text-texto">
          Facturas
        </h2>

        {cargandoFacturas ? (
          <div className="flex flex-col gap-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <Esqueleto key={i} className="h-12" />
            ))}
          </div>
        ) : facturas && facturas.length > 0 ? (
          <div className="overflow-x-auto rounded-xl border border-borde">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-borde bg-fondo-elevado">
                  <th className="text-left px-4 py-3 text-texto-terciario font-medium">
                    Numero
                  </th>
                  <th className="text-left px-4 py-3 text-texto-terciario font-medium">
                    Fecha
                  </th>
                  <th className="text-left px-4 py-3 text-texto-terciario font-medium">
                    Concepto
                  </th>
                  <th className="text-left px-4 py-3 text-texto-terciario font-medium">
                    Monto
                  </th>
                  <th className="text-left px-4 py-3 text-texto-terciario font-medium">
                    Estado
                  </th>
                </tr>
              </thead>
              <tbody>
                {facturas.map((factura) => (
                  <tr
                    key={factura.id}
                    className="border-b border-borde last:border-b-0 hover:bg-fondo-elevado/50 transition-colors"
                  >
                    <td className="px-4 py-3 text-texto font-mono text-xs">
                      {factura.numero_factura}
                    </td>
                    <td className="px-4 py-3 text-texto">
                      {factura.creado_en
                        ? formatearFecha(factura.creado_en)
                        : "\u2014"}
                    </td>
                    <td className="px-4 py-3 text-texto-secundario">
                      {factura.concepto}
                    </td>
                    <td className="px-4 py-3 text-texto">
                      {formatearMonto(factura.monto_centavos, factura.moneda)}
                    </td>
                    <td className="px-4 py-3">
                      <Badge variante="exito">{factura.estado}</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <Tarjeta variante="default" padding="md">
            <p className="text-sm text-texto-terciario">
              No hay facturas generadas.
            </p>
          </Tarjeta>
        )}
      </section>
    </div>
  );
}
