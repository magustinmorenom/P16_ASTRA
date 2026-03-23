import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { usarDisenoHumano } from "@/lib/hooks/usar-diseno-humano";
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

describe("usarDisenoHumano", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("envía POST a /human-design sin perfil_id", async () => {
    mockPost.mockResolvedValueOnce({ tipo: "Generador" });

    const { result } = renderHook(() => usarDisenoHumano(), {
      wrapper: crearWrapper(),
    });

    await act(async () => {
      await result.current.mutateAsync({ datos: DATOS_NACIMIENTO });
    });

    expect(mockPost).toHaveBeenCalledWith("/human-design", DATOS_NACIMIENTO);
  });

  it("envía POST a /human-design?perfil_id=XXX cuando se proporciona", async () => {
    mockPost.mockResolvedValueOnce({ tipo: "Generador" });

    const perfilId = "uuid-456";
    const { result } = renderHook(() => usarDisenoHumano(), {
      wrapper: crearWrapper(),
    });

    await act(async () => {
      await result.current.mutateAsync({ datos: DATOS_NACIMIENTO, perfilId });
    });

    expect(mockPost).toHaveBeenCalledWith(
      `/human-design?perfil_id=${perfilId}`,
      DATOS_NACIMIENTO,
    );
  });
});
