import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";

import { usarPerfilEspiritual } from "@/lib/hooks/usar-perfil-espiritual";
import { crearWrapper } from "../utilidades";

vi.mock("@/lib/api/cliente", () => ({
  clienteApi: {
    get: vi.fn(),
  },
}));

import { clienteApi } from "@/lib/api/cliente";

const mockGet = vi.mocked(clienteApi.get);

describe("usarPerfilEspiritual", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("mantiene polling cuando el backend informa que sigue generando", async () => {
    mockGet.mockResolvedValueOnce({ estado: "generando" });

    const { result } = renderHook(() => usarPerfilEspiritual(), {
      wrapper: crearWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockGet).toHaveBeenCalledWith("/perfil-espiritual");
    expect(result.current.data).toBeNull();
  });

  it("retorna el perfil espiritual cuando ya está listo", async () => {
    const perfil = {
      estado: "listo" as const,
      resumen: "Tu centro interno se ordena cuando confiás en tu ritmo.",
      foda: {
        fortalezas: [{ titulo: "Fortaleza", descripcion: "Descripción" }],
        oportunidades: [{ titulo: "Oportunidad", descripcion: "Descripción" }],
        debilidades: [{ titulo: "Debilidad", descripcion: "Descripción" }],
        amenazas: [{ titulo: "Amenaza", descripcion: "Descripción" }],
      },
    };

    mockGet.mockResolvedValueOnce(perfil);

    const { result } = renderHook(() => usarPerfilEspiritual(), {
      wrapper: crearWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual({
      resumen: perfil.resumen,
      foda: perfil.foda,
    });
  });

  it("propaga errores reales del endpoint", async () => {
    mockGet.mockRejectedValueOnce(new Error("Completá tus cartas primero."));

    const { result } = renderHook(() => usarPerfilEspiritual(), {
      wrapper: crearWrapper(),
    });

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(result.current.error?.message).toBe("Completá tus cartas primero.");
  });
});
