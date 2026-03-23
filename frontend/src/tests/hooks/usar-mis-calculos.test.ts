import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { usarMisCalculos } from "@/lib/hooks/usar-mis-calculos";
import { crearWrapper } from "../utilidades";

// Mock del cliente API
vi.mock("@/lib/api/cliente", () => ({
  clienteApi: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));

import { clienteApi } from "@/lib/api/cliente";
const mockGet = vi.mocked(clienteApi.get);

describe("usarMisCalculos", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("llama a GET /profile/me/calculos", async () => {
    const datosEsperados = {
      natal: { nombre: "Test", planetas: [] },
      diseno_humano: null,
      numerologia: null,
      retorno_solar: null,
    };

    mockGet.mockResolvedValueOnce(datosEsperados);

    const { result } = renderHook(() => usarMisCalculos(), {
      wrapper: crearWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockGet).toHaveBeenCalledWith("/profile/me/calculos");
    expect(result.current.data).toEqual(datosEsperados);
  });

  it("devuelve null para todos los tipos cuando el usuario no tiene cálculos", async () => {
    const datosVacios = {
      natal: null,
      diseno_humano: null,
      numerologia: null,
      retorno_solar: null,
    };

    mockGet.mockResolvedValueOnce(datosVacios);

    const { result } = renderHook(() => usarMisCalculos(), {
      wrapper: crearWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data?.natal).toBeNull();
    expect(result.current.data?.diseno_humano).toBeNull();
    expect(result.current.data?.numerologia).toBeNull();
    expect(result.current.data?.retorno_solar).toBeNull();
  });

  it("maneja errores de API correctamente", async () => {
    mockGet.mockRejectedValueOnce(new Error("No autorizado"));

    const { result } = renderHook(() => usarMisCalculos(), {
      wrapper: crearWrapper(),
    });

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(result.current.error?.message).toBe("No autorizado");
  });
});
