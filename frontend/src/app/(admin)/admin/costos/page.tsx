"use client";

import { usarCostosPorServicio, usarTopConsumidores } from "@/lib/hooks/usar-admin";
import { TarjetaMetrica } from "@/componentes/admin/tarjeta-metrica";

export default function PaginaCostos() {
  const { data: servicios, isLoading: cargandoServicios } = usarCostosPorServicio();
  const { data: top, isLoading: cargandoTop } = usarTopConsumidores();

  const totalCentavos = servicios?.reduce((a, s) => a + s.costo_usd_centavos, 0) ?? 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-[22px] font-bold text-white">Costos API</h1>
        <p className="mt-1 text-sm text-white/48">Consumo de APIs externas (Anthropic, Gemini, Resend)</p>
      </div>

      {/* Resumen por servicio */}
      <section>
        <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-violet-300/50">
          Por servicio
        </p>
        {cargandoServicios ? (
          <p className="text-sm text-white/30">Cargando...</p>
        ) : (
          <div className="grid grid-cols-4 gap-3">
            <TarjetaMetrica
              etiqueta="Total acumulado"
              valor={`US$ ${(totalCentavos / 100).toFixed(2)}`}
            />
            {servicios?.map((s) => (
              <TarjetaMetrica
                key={s.servicio}
                etiqueta={s.servicio}
                valor={`US$ ${(s.costo_usd_centavos / 100).toFixed(2)}`}
                subtexto={`${s.cantidad} requests · ${(s.tokens_entrada + s.tokens_salida).toLocaleString()} tokens`}
              />
            ))}
            {servicios?.length === 0 && (
              <TarjetaMetrica etiqueta="Sin datos" valor="—" subtexto="No hay registros de consumo aún" />
            )}
          </div>
        )}
      </section>

      {/* Top consumidores */}
      <section>
        <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-violet-300/50">
          Top consumidores
        </p>
        {cargandoTop ? (
          <p className="text-sm text-white/30">Cargando...</p>
        ) : top?.length === 0 ? (
          <p className="text-sm text-white/30">Sin datos de consumo por usuario</p>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-white/[0.06]">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-white/[0.06] bg-white/[0.02]">
                  <th className="px-4 py-3 text-[11px] font-semibold uppercase text-white/40">#</th>
                  <th className="px-4 py-3 text-[11px] font-semibold uppercase text-white/40">Usuario</th>
                  <th className="px-4 py-3 text-[11px] font-semibold uppercase text-white/40">Costo</th>
                  <th className="px-4 py-3 text-[11px] font-semibold uppercase text-white/40">Requests</th>
                </tr>
              </thead>
              <tbody>
                {top?.map((t, i) => (
                  <tr key={t.usuario_id} className="border-b border-white/[0.04]">
                    <td className="px-4 py-2 text-white/40">{i + 1}</td>
                    <td className="px-4 py-2">
                      <p className="font-medium text-white">{t.nombre}</p>
                      <p className="text-xs text-white/40">{t.email}</p>
                    </td>
                    <td className="px-4 py-2 font-medium text-white">
                      US$ {(t.costo_usd_centavos / 100).toFixed(2)}
                    </td>
                    <td className="px-4 py-2 text-white/60">{t.cantidad_requests}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
