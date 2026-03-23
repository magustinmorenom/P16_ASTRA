import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor, act } from "@testing-library/react";
import { usarActualizarPerfil } from "@/lib/hooks/usar-perfil";
import { crearWrapper } from "../utilidades";

vi.mock("@/lib/api/cliente", () => ({
  clienteApi: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
  },
}));

import { clienteApi } from "@/lib/api/cliente";
const mockPut = vi.mocked(clienteApi.put);

describe("usarActualizarPerfil", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("envía PUT a /profile/me con los datos proporcionados", async () => {
    mockPut.mockResolvedValueOnce({
      id: "uuid-1",
      nombre: "Nuevo Nombre",
      fecha_nacimiento: "1990-01-15",
      hora_nacimiento: "14:30:00",
      ciudad_nacimiento: "Buenos Aires",
      pais_nacimiento: "Argentina",
      latitud: -34.6037,
      longitud: -58.3816,
      zona_horaria: "America/Argentina/Buenos_Aires",
      datos_nacimiento_cambiaron: false,
    });

    const { result } = renderHook(() => usarActualizarPerfil(), {
      wrapper: crearWrapper(),
    });

    await act(async () => {
      await result.current.mutateAsync({ nombre: "Nuevo Nombre" });
    });

    expect(mockPut).toHaveBeenCalledWith("/profile/me", { nombre: "Nuevo Nombre" });
  });

  it("envía todos los campos de nacimiento cuando se proporcionan", async () => {
    const datosActualizar = {
      nombre: "Test",
      fecha_nacimiento: "1991-05-20",
      hora_nacimiento: "10:00",
      ciudad_nacimiento: "Córdoba",
      pais_nacimiento: "Argentina",
    };

    mockPut.mockResolvedValueOnce({
      ...datosActualizar,
      id: "uuid-1",
      hora_nacimiento: "10:00:00",
      latitud: -31.42,
      longitud: -64.18,
      zona_horaria: "America/Argentina/Cordoba",
      datos_nacimiento_cambiaron: true,
    });

    const { result } = renderHook(() => usarActualizarPerfil(), {
      wrapper: crearWrapper(),
    });

    await act(async () => {
      await result.current.mutateAsync(datosActualizar);
    });

    expect(mockPut).toHaveBeenCalledWith("/profile/me", datosActualizar);
  });

  it("retorna datos_nacimiento_cambiaron del servidor", async () => {
    mockPut.mockResolvedValueOnce({
      id: "uuid-1",
      nombre: "Test",
      fecha_nacimiento: "1991-05-20",
      hora_nacimiento: "10:00:00",
      ciudad_nacimiento: "Córdoba",
      pais_nacimiento: "Argentina",
      latitud: -31.42,
      longitud: -64.18,
      zona_horaria: "America/Argentina/Cordoba",
      datos_nacimiento_cambiaron: true,
    });

    const { result } = renderHook(() => usarActualizarPerfil(), {
      wrapper: crearWrapper(),
    });

    let respuesta: unknown;
    await act(async () => {
      respuesta = await result.current.mutateAsync({
        ciudad_nacimiento: "Córdoba",
      });
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect((respuesta as any).datos_nacimiento_cambiaron).toBe(true);
  });

  it("maneja errores del servidor", async () => {
    mockPut.mockRejectedValueOnce(new Error("Perfil no encontrado"));

    const { result } = renderHook(() => usarActualizarPerfil(), {
      wrapper: crearWrapper(),
    });

    await act(async () => {
      try {
        await result.current.mutateAsync({ nombre: "Test" });
      } catch {
        // esperado
      }
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });
    expect(result.current.error?.message).toBe("Perfil no encontrado");
  });
});
