import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { usarNumerologia } from "@/lib/hooks/usar-numerologia";
import { crearWrapper } from "../utilidades";

vi.mock("@/lib/api/cliente", () => ({
  clienteApi: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));

import { clienteApi } from "@/lib/api/cliente";
const mockPost = vi.mocked(clienteApi.post);

const DATOS_NUMEROLOGIA = {
  nombre: "Test Usuario",
  fecha_nacimiento: "1990-01-15",
};

describe("usarNumerologia", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("envía POST a /numerology sin perfil_id", async () => {
    mockPost.mockResolvedValueOnce({ camino_de_vida: { numero: 7 } });

    const { result } = renderHook(() => usarNumerologia(), {
      wrapper: crearWrapper(),
    });

    await act(async () => {
      await result.current.mutateAsync({ datos: DATOS_NUMEROLOGIA });
    });

    expect(mockPost).toHaveBeenCalledWith("/numerology", DATOS_NUMEROLOGIA);
  });

  it("envía POST a /numerology?perfil_id=XXX cuando se proporciona", async () => {
    mockPost.mockResolvedValueOnce({ camino_de_vida: { numero: 7 } });

    const perfilId = "uuid-789";
    const { result } = renderHook(() => usarNumerologia(), {
      wrapper: crearWrapper(),
    });

    await act(async () => {
      await result.current.mutateAsync({ datos: DATOS_NUMEROLOGIA, perfilId });
    });

    expect(mockPost).toHaveBeenCalledWith(
      `/numerology?perfil_id=${perfilId}`,
      DATOS_NUMEROLOGIA,
    );
  });
});
