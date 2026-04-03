"use client";

import { usarMetricasAdmin } from "@/lib/hooks/usar-admin";
import { TarjetaMetrica } from "@/componentes/admin/tarjeta-metrica";
import { Icono } from "@/componentes/ui/icono";

function formatearMoneda(centavos: number, moneda: string): string {
  return `${moneda} ${(centavos / 100).toLocaleString("es-AR", { minimumFractionDigits: 0 })}`;
}

export default function PaginaAdminDashboard() {
  const { data, isLoading } = usarMetricasAdmin();

  if (isLoading || !data) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-violet-400 border-t-transparent" />
      </div>
    );
  }

  const { usuarios, suscripciones, ingresos, costos_api, actividad } = data;

  const totalIngresosMes = Object.values(ingresos.mes_actual).reduce(
    (a, b) => a + b,
    0,
  );
  const totalCostosMes = Object.values(costos_api.mes_actual).reduce(
    (a, b) => a + b,
    0,
  );
  const premium = suscripciones.premium ?? 0;
  const gratis = suscripciones.gratis ?? 0;
  const tasaConversion = usuarios.total > 0
    ? ((premium / usuarios.total) * 100).toFixed(1)
    : "0";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-[22px] font-bold text-white">Panel de administración</h1>
        <p className="mt-1 text-sm text-white/48">Vista general de ASTRA</p>
      </div>

      {/* Usuarios */}
      <section>
        <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-violet-300/50">
          Usuarios
        </p>
        <div className="grid grid-cols-4 gap-3">
          <TarjetaMetrica etiqueta="Total" valor={usuarios.total} />
          <TarjetaMetrica etiqueta="Nuevos (7d)" valor={usuarios.nuevos_7d} />
          <TarjetaMetrica etiqueta="Activos hoy" valor={usuarios.activos_hoy} />
          <TarjetaMetrica
            etiqueta="Conversión Premium"
            valor={`${tasaConversion}%`}
            subtexto={`${premium} premium / ${gratis} gratis`}
          />
        </div>
      </section>

      {/* Suscripciones e ingresos */}
      <section>
        <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-violet-300/50">
          Suscripciones e ingresos
        </p>
        <div className="grid grid-cols-4 gap-3">
          <TarjetaMetrica etiqueta="Premium activas" valor={premium} />
          <TarjetaMetrica etiqueta="Gratis activas" valor={gratis} />
          <TarjetaMetrica
            etiqueta="Ingresos mes"
            valor={totalIngresosMes > 0 ? formatearMoneda(totalIngresosMes, "ARS") : "$0"}
          />
          <TarjetaMetrica
            etiqueta="Ingresos mes anterior"
            valor={
              Object.values(ingresos.mes_anterior).reduce((a, b) => a + b, 0) > 0
                ? formatearMoneda(
                    Object.values(ingresos.mes_anterior).reduce((a, b) => a + b, 0),
                    "ARS",
                  )
                : "$0"
            }
          />
        </div>
      </section>

      {/* Costos API */}
      <section>
        <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-violet-300/50">
          Costos API
        </p>
        <div className="grid grid-cols-4 gap-3">
          <TarjetaMetrica
            etiqueta="Costo total mes"
            valor={totalCostosMes > 0 ? `US$ ${(totalCostosMes / 100).toFixed(2)}` : "US$ 0"}
          />
          {Object.entries(costos_api.mes_actual).map(([servicio, centavos]) => (
            <TarjetaMetrica
              key={servicio}
              etiqueta={servicio}
              valor={`US$ ${(centavos / 100).toFixed(2)}`}
            />
          ))}
          {Object.keys(costos_api.mes_actual).length === 0 && (
            <TarjetaMetrica etiqueta="Sin datos" valor="—" subtexto="No hay registros de consumo aún" />
          )}
        </div>
      </section>

      {/* Actividad */}
      <section>
        <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-violet-300/50">
          Actividad (7 días)
        </p>
        <div className="grid grid-cols-4 gap-3">
          <TarjetaMetrica
            etiqueta="Conversaciones oráculo"
            valor={actividad.conversaciones_oraculo_7d}
          />
          <TarjetaMetrica
            etiqueta="Podcasts generados"
            valor={actividad.podcasts_generados_7d}
          />
        </div>
      </section>
    </div>
  );
}
