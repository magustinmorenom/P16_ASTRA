"use client";

import { useState } from "react";
import { usarSuscripcionesAdmin } from "@/lib/hooks/usar-admin";
import { cn } from "@/lib/utilidades/cn";

const ESTADOS = ["", "activa", "pendiente", "cancelada", "pausada"] as const;
const PAISES = ["", "AR", "BR", "MX"] as const;

export default function PaginaSuscripciones() {
  const [pagina, setPagina] = useState(1);
  const [estado, setEstado] = useState("");
  const [pais, setPais] = useState("");

  const { data, isLoading } = usarSuscripcionesAdmin({
    pagina,
    estado: estado || undefined,
    pais_codigo: pais || undefined,
  });

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-[22px] font-bold text-white">Suscripciones</h1>
        <p className="mt-1 text-sm text-white/48">Gestión de suscripciones activas y pasadas</p>
      </div>

      {/* Filtros */}
      <div className="flex gap-3">
        <select
          value={estado}
          onChange={(e) => { setEstado(e.target.value); setPagina(1); }}
          className="rounded-xl border border-white/[0.08] bg-white/[0.04] px-3 py-2 text-sm text-white focus:border-violet-500/40 focus:outline-none"
        >
          <option value="">Todos los estados</option>
          {ESTADOS.filter(Boolean).map((e) => (
            <option key={e} value={e}>{e}</option>
          ))}
        </select>
        <select
          value={pais}
          onChange={(e) => { setPais(e.target.value); setPagina(1); }}
          className="rounded-xl border border-white/[0.08] bg-white/[0.04] px-3 py-2 text-sm text-white focus:border-violet-500/40 focus:outline-none"
        >
          <option value="">Todos los países</option>
          {PAISES.filter(Boolean).map((p) => (
            <option key={p} value={p}>{p}</option>
          ))}
        </select>
      </div>

      {/* Tabla */}
      <div className="overflow-hidden rounded-2xl border border-white/[0.06]">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-white/[0.06] bg-white/[0.02]">
              <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-white/40">Usuario</th>
              <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-white/40">Plan</th>
              <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-white/40">Estado</th>
              <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-white/40">País</th>
              <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-white/40">Inicio</th>
              <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-white/40">Creada</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-white/30">Cargando...</td>
              </tr>
            ) : data?.items.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-white/30">Sin resultados</td>
              </tr>
            ) : (
              data?.items.map((s) => (
                <tr key={s.id} className="border-b border-white/[0.04] transition-colors hover:bg-white/[0.02]">
                  <td className="px-4 py-3">
                    <p className="font-medium text-white">{s.usuario_nombre}</p>
                    <p className="text-xs text-white/40">{s.usuario_email}</p>
                  </td>
                  <td className="px-4 py-3">
                    <span className={cn(
                      "rounded-full px-2 py-0.5 text-[11px] font-medium",
                      s.plan_slug === "premium" ? "bg-violet-500/20 text-violet-300" : "bg-white/[0.06] text-white/50",
                    )}>
                      {s.plan_nombre}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={cn(
                      "text-xs font-medium",
                      s.estado === "activa" ? "text-emerald-400" :
                      s.estado === "cancelada" ? "text-red-400" :
                      "text-white/50",
                    )}>
                      {s.estado}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-white/60">{s.pais_codigo}</td>
                  <td className="px-4 py-3 text-xs text-white/40">
                    {s.fecha_inicio ? new Date(s.fecha_inicio).toLocaleDateString("es-AR") : "—"}
                  </td>
                  <td className="px-4 py-3 text-xs text-white/40">
                    {s.creado_en ? new Date(s.creado_en).toLocaleDateString("es-AR") : "—"}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Paginación */}
      {data && data.total_paginas > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-xs text-white/40">
            {data.total} suscripciones · Página {data.pagina} de {data.total_paginas}
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setPagina((p) => Math.max(1, p - 1))}
              disabled={pagina <= 1}
              className="rounded-lg border border-white/[0.08] px-3 py-1.5 text-xs text-white/60 hover:bg-white/[0.04] disabled:opacity-30"
            >
              Anterior
            </button>
            <button
              onClick={() => setPagina((p) => Math.min(data.total_paginas, p + 1))}
              disabled={pagina >= data.total_paginas}
              className="rounded-lg border border-white/[0.08] px-3 py-1.5 text-xs text-white/60 hover:bg-white/[0.04] disabled:opacity-30"
            >
              Siguiente
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
