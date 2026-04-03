"use client";

import { usarSistemaAdmin } from "@/lib/hooks/usar-admin";
import { IndicadorEstado } from "@/componentes/admin/indicador-estado";

export default function PaginaSistema() {
  const { data, isLoading } = usarSistemaAdmin();

  if (isLoading || !data) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-violet-400 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-[22px] font-bold text-white">Estado del sistema</h1>
        <p className="mt-1 text-sm text-white/48">
          Versión {data.version} · Ambiente: {data.ambiente}
        </p>
      </div>

      <section>
        <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-violet-300/50">
          Servicios
        </p>
        <div className="grid grid-cols-2 gap-3">
          <IndicadorEstado
            nombre="PostgreSQL"
            estado={data.base_datos.estado}
            detalle={data.base_datos.version?.split(" ").slice(0, 2).join(" ") ?? undefined}
          />
          <IndicadorEstado
            nombre="Redis"
            estado={data.redis.estado}
            detalle={
              data.redis.memoria_usada
                ? `${data.redis.memoria_usada} · ${data.redis.claves} claves`
                : undefined
            }
          />
          <IndicadorEstado nombre="MinIO" estado={data.minio.estado} />
          <IndicadorEstado
            nombre="Efemérides (Swiss Ephemeris)"
            estado={data.efemerides.archivos > 0 ? "conectado" : "no encontrado"}
            detalle={`${data.efemerides.archivos} archivos .se1`}
          />
        </div>
      </section>
    </div>
  );
}
