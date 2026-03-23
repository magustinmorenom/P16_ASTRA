import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor, act } from "@testing-library/react";
import { usarCartaNatal } from "@/lib/hooks/usar-carta-natal";
import { crearWrapper } from "../utilidades";

vi.mock("@/lib/api/cliente", () => ({
  clienteApi: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));

import { clienteApi } from "@/lib/api/cliente";
const mockPost = vi.mocked(clienteApi.post);

const DATOS_NACIMIENTO = {
  nombre: "Test",
  fecha_nacimiento: "1990-01-15",
  hora_nacimiento: "14:30",
  ciudad_nacimiento: "Buenos Aires",
  pais_nacimiento: "Argentina",
};

describe("usarCartaNatal", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("envía POST a /natal sin perfil_id cuando no se proporciona", async () => {
    mockPost.mockResolvedValueOnce({ planetas: [] });

    const { result } = renderHook(() => usarCartaNatal(), {
      wrapper: crearWrapper(),
    });

    await act(async () => {
      await result.current.mutateAsync({ datos: DATOS_NACIMIENTO });
    });

    expect(mockPost).toHaveBeenCalledWith("/natal", DATOS_NACIMIENTO);
  });

  it("envía POST a /natal?perfil_id=XXX cuando se proporciona perfilId", async () => {
    mockPost.mockResolvedValueOnce({ planetas: [] });

    const perfilId = "abc-123-uuid";
    const { result } = renderHook(() => usarCartaNatal(), {
      wrapper: crearWrapper(),
    });

    await act(async () => {
      await result.current.mutateAsync({
        datos: DATOS_NACIMIENTO,
        perfilId,
      });
    });

    expect(mockPost).toHaveBeenCalledWith(
      `/natal?perfil_id=${perfilId}`,
      DATOS_NACIMIENTO,
    );
  });

  it("maneja errores de cálculo", async () => {
    mockPost.mockRejectedValueOnce(new Error("Error de geocodificación"));

    const { result } = renderHook(() => usarCartaNatal(), {
      wrapper: crearWrapper(),
    });

    await act(async () => {
      try {
        await result.current.mutateAsync({ datos: DATOS_NACIMIENTO });
      } catch {
        // esperado
      }
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });
    expect(result.current.error?.message).toBe("Error de geocodificación");
  });
});
