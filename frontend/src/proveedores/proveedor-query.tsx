"use client";

/**
 * Proveedor de React Query (TanStack Query).
 *
 * Envuelve la aplicacion con QueryClientProvider configurado
 * con valores por defecto razonables para la cache y reintentos.
 */

import { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

/** Tiempo de validez de la cache: 5 minutos. */
const TIEMPO_CACHE_MS = 5 * 60 * 1000;

interface PropiedadesProveedorQuery {
  children: React.ReactNode;
}

export function ProveedorQuery({ children }: PropiedadesProveedorQuery) {
  const [clienteQuery] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: TIEMPO_CACHE_MS,
            retry: 1,
            refetchOnWindowFocus: false,
          },
        },
      }),
  );

  return (
    <QueryClientProvider client={clienteQuery}>
      {children}
    </QueryClientProvider>
  );
}
