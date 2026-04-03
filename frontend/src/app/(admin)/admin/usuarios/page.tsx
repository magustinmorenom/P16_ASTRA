"use client";

import { useState } from "react";
import Link from "next/link";
import { usarUsuariosAdmin } from "@/lib/hooks/usar-admin";
import { Icono } from "@/componentes/ui/icono";
import { cn } from "@/lib/utilidades/cn";

export default function PaginaUsuarios() {
  const [pagina, setPagina] = useState(1);
  const [busqueda, setBusqueda] = useState("");

  const { data, isLoading } = usarUsuariosAdmin({ pagina, busqueda: busqueda || undefined });

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-[22px] font-bold text-white">Usuarios</h1>
        <p className="mt-1 text-sm text-white/48">Gestión de usuarios registrados</p>
      </div>

      {/* Buscador */}
      <div className="relative max-w-md">
        <Icono nombre="lupa" tamaño={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
        <input
          type="text"
          placeholder="Buscar por email o nombre..."
          value={busqueda}
          onChange={(e) => { setBusqueda(e.target.value); setPagina(1); }}
          className="w-full rounded-xl border border-white/[0.08] bg-white/[0.04] py-2.5 pl-10 pr-4 text-sm text-white placeholder:text-white/30 focus:border-violet-500/40 focus:outline-none"
        />
      </div>

      {/* Tabla */}
      <div className="overflow-hidden rounded-2xl border border-white/[0.06]">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-white/[0.06] bg-white/[0.02]">
              <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-white/40">Nombre</th>
              <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-white/40">Email</th>
              <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-white/40">Rol</th>
              <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-white/40">Estado</th>
              <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-white/40">Registro</th>
              <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-white/40">Último acceso</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-white/30">
                  Cargando...
                </td>
              </tr>
            ) : data?.items.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-white/30">
                  No se encontraron usuarios
                </td>
              </tr>
            ) : (
              data?.items.map((u) => (
                <tr
                  key={u.id}
                  className="border-b border-white/[0.04] transition-colors hover:bg-white/[0.02]"
                >
                  <td className="px-4 py-3">
                    <Link href={`/admin/usuarios/${u.id}`} className="font-medium text-white hover:text-violet-300">
                      {u.nombre}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-white/60">{u.email}</td>
                  <td className="px-4 py-3">
                    <span className={cn(
                      "rounded-full px-2 py-0.5 text-[11px] font-medium",
                      u.rol === "admin" ? "bg-violet-500/20 text-violet-300" : "bg-white/[0.06] text-white/50"
                    )}>
                      {u.rol}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={cn(
                      "inline-flex items-center gap-1.5 text-xs",
                      u.activo ? "text-emerald-400" : "text-red-400"
                    )}>
                      <span className={cn("h-1.5 w-1.5 rounded-full", u.activo ? "bg-emerald-400" : "bg-red-400")} />
                      {u.activo ? "Activo" : "Inactivo"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-white/40">
                    {u.creado_en ? new Date(u.creado_en).toLocaleDateString("es-AR") : "—"}
                  </td>
                  <td className="px-4 py-3 text-xs text-white/40">
                    {u.ultimo_acceso ? new Date(u.ultimo_acceso).toLocaleDateString("es-AR") : "—"}
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
            {data.total} usuarios · Página {data.pagina} de {data.total_paginas}
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setPagina((p) => Math.max(1, p - 1))}
              disabled={pagina <= 1}
              className="rounded-lg border border-white/[0.08] px-3 py-1.5 text-xs text-white/60 transition-colors hover:bg-white/[0.04] disabled:opacity-30"
            >
              Anterior
            </button>
            <button
              onClick={() => setPagina((p) => Math.min(data.total_paginas, p + 1))}
              disabled={pagina >= data.total_paginas}
              className="rounded-lg border border-white/[0.08] px-3 py-1.5 text-xs text-white/60 transition-colors hover:bg-white/[0.04] disabled:opacity-30"
            >
              Siguiente
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
