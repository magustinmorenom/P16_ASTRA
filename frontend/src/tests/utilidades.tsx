import React from "react";
import { render, type RenderOptions } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

/**
 * Crea un QueryClient fresco para cada test (evita estado compartido).
 */
export function crearQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
      mutations: { retry: false },
    },
  });
}

/**
 * Wrapper que provee QueryClientProvider para tests de hooks/componentes.
 */
export function crearWrapper() {
  const queryClient = crearQueryClient();
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    );
  };
}

/**
 * Render personalizado que incluye QueryClientProvider.
 */
export function renderConProveedores(
  ui: React.ReactElement,
  opciones?: Omit<RenderOptions, "wrapper">,
) {
  const queryClient = crearQueryClient();
  function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    );
  }
  return { ...render(ui, { wrapper: Wrapper, ...opciones }), queryClient };
}
