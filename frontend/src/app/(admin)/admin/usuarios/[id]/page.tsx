"use client";

import { use } from "react";
import Link from "next/link";
import { usarUsuarioDetalleAdmin } from "@/lib/hooks/usar-admin";
import { clienteApi } from "@/lib/api/cliente";
import { Icono } from "@/componentes/ui/icono";
import { TarjetaMetrica } from "@/componentes/admin/tarjeta-metrica";
import { cn } from "@/lib/utilidades/cn";
import { useQueryClient } from "@tanstack/react-query";

export default function PaginaDetalleUsuario({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data, isLoading } = usarUsuarioDetalleAdmin(id);
  const queryClient = useQueryClient();

  if (isLoading || !data) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-violet-400 border-t-transparent" />
      </div>
    );
  }

  const toggleEstado = async () => {
    const endpoint = data.activo
      ? `/admin/usuarios/${id}/desactivar`
      : `/admin/usuarios/${id}/reactivar`;
    await clienteApi.put(endpoint);
    queryClient.invalidateQueries({ queryKey: ["admin", "usuario", id] });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/admin/usuarios" className="text-white/40 transition-colors hover:text-white/70">
          <Icono nombre="flecha-izquierda" tamaño={20} />
        </Link>
        <div className="flex-1">
          <h1 className="text-[22px] font-bold text-white">{data.nombre}</h1>
          <p className="text-sm text-white/48">{data.email}</p>
        </div>
        <button
          onClick={toggleEstado}
          className={cn(
            "rounded-xl px-4 py-2 text-sm font-medium transition-colors",
            data.activo
              ? "border border-red-400/30 text-red-400 hover:bg-red-400/10"
              : "border border-emerald-400/30 text-emerald-400 hover:bg-emerald-400/10",
          )}
        >
          {data.activo ? "Desactivar" : "Reactivar"}
        </button>
      </div>

      {/* Info general */}
      <div className="grid grid-cols-4 gap-3">
        <TarjetaMetrica etiqueta="Rol" valor={data.rol} />
        <TarjetaMetrica etiqueta="Proveedor" valor={data.proveedor_auth} />
        <TarjetaMetrica
          etiqueta="Registro"
          valor={data.creado_en ? new Date(data.creado_en).toLocaleDateString("es-AR") : "—"}
        />
        <TarjetaMetrica
          etiqueta="Último acceso"
          valor={data.ultimo_acceso ? new Date(data.ultimo_acceso).toLocaleDateString("es-AR") : "—"}
        />
      </div>

      {/* Suscripción activa */}
      <section>
        <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-violet-300/50">
          Suscripción activa
        </p>
        {data.suscripcion_activa ? (
          <div className="rounded-2xl border border-white/[0.06] bg-white/[0.03] p-4">
            <div className="grid grid-cols-4 gap-4 text-sm">
              <div>
                <p className="text-white/40">Plan</p>
                <p className="font-medium text-white">{data.suscripcion_activa.plan_nombre}</p>
              </div>
              <div>
                <p className="text-white/40">Estado</p>
                <p className="font-medium text-emerald-400">{data.suscripcion_activa.estado}</p>
              </div>
              <div>
                <p className="text-white/40">País</p>
                <p className="font-medium text-white">{data.suscripcion_activa.pais_codigo}</p>
              </div>
              <div>
                <p className="text-white/40">Inicio</p>
                <p className="font-medium text-white">
                  {data.suscripcion_activa.fecha_inicio
                    ? new Date(data.suscripcion_activa.fecha_inicio).toLocaleDateString("es-AR")
                    : "—"}
                </p>
              </div>
            </div>
          </div>
        ) : (
          <p className="text-sm text-white/30">Sin suscripción paga activa</p>
        )}
      </section>

      {/* Actividad */}
      <section>
        <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-violet-300/50">
          Actividad
        </p>
        <div className="grid grid-cols-2 gap-3">
          <TarjetaMetrica etiqueta="Conversaciones oráculo" valor={data.totales.conversaciones} />
          <TarjetaMetrica etiqueta="Podcasts generados" valor={data.totales.podcasts} />
        </div>
      </section>

      {/* Costos API */}
      {data.costos_api.length > 0 && (
        <section>
          <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-violet-300/50">
            Consumo API
          </p>
          <div className="grid grid-cols-3 gap-3">
            {data.costos_api.map((c) => (
              <TarjetaMetrica
                key={c.servicio}
                etiqueta={c.servicio}
                valor={`US$ ${(c.costo_usd_centavos / 100).toFixed(2)}`}
                subtexto={`${(c.tokens_entrada + c.tokens_salida).toLocaleString()} tokens`}
              />
            ))}
          </div>
        </section>
      )}

      {/* Pagos */}
      {data.pagos.length > 0 && (
        <section>
          <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-violet-300/50">
            Historial de pagos
          </p>
          <div className="overflow-hidden rounded-2xl border border-white/[0.06]">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-white/[0.06] bg-white/[0.02]">
                  <th className="px-4 py-2 text-[11px] font-semibold uppercase text-white/40">Monto</th>
                  <th className="px-4 py-2 text-[11px] font-semibold uppercase text-white/40">Moneda</th>
                  <th className="px-4 py-2 text-[11px] font-semibold uppercase text-white/40">Estado</th>
                  <th className="px-4 py-2 text-[11px] font-semibold uppercase text-white/40">Fecha</th>
                </tr>
              </thead>
              <tbody>
                {data.pagos.map((p) => (
                  <tr key={p.id} className="border-b border-white/[0.04]">
                    <td className="px-4 py-2 text-white">${(p.monto_centavos / 100).toFixed(2)}</td>
                    <td className="px-4 py-2 text-white/60">{p.moneda}</td>
                    <td className="px-4 py-2">
                      <span className={cn(
                        "text-xs",
                        p.estado === "aprobado" ? "text-emerald-400" : "text-white/40",
                      )}>
                        {p.estado}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-xs text-white/40">
                      {p.fecha_pago ? new Date(p.fecha_pago).toLocaleDateString("es-AR") : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}
