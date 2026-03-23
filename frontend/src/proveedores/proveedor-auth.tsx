"use client";

/**
 * Proveedor de autenticacion.
 *
 * Al montarse, consulta el estado de la sesion (GET /auth/me).
 * Mientras la consulta esta en curso, muestra un indicador de carga
 * a pantalla completa para evitar parpadeos de contenido protegido.
 */

import { useEffect } from "react";

import { useStoreAuth } from "@/lib/stores/store-auth";

interface PropiedadesProveedorAuth {
  children: React.ReactNode;
}

export function ProveedorAuth({ children }: PropiedadesProveedorAuth) {
  const cargando = useStoreAuth((estado) => estado.cargando);
  const cargarUsuario = useStoreAuth((estado) => estado.cargarUsuario);

  useEffect(() => {
    cargarUsuario();
  }, [cargarUsuario]);

  if (cargando) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90">
        <div className="flex flex-col items-center gap-4">
          {/* Spinner animado */}
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-white/20 border-t-white" />
          <p className="text-sm text-white/60">Cargando...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
