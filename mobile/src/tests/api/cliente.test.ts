jest.mock("expo-secure-store", () => ({
  getItemAsync: jest.fn(() => Promise.resolve(null)),
  setItemAsync: jest.fn(() => Promise.resolve()),
  deleteItemAsync: jest.fn(() => Promise.resolve()),
}));

jest.mock("expo-constants", () => ({
  __esModule: true,
  default: { expoConfig: { hostUri: "192.168.1.1:8081" } },
}));

jest.mock("expo-haptics", () => ({
  impactAsync: jest.fn(),
  selectionAsync: jest.fn(),
  notificationAsync: jest.fn(),
  ImpactFeedbackStyle: { Light: "light", Medium: "medium", Heavy: "heavy" },
  NotificationFeedbackType: { Success: "success", Error: "error", Warning: "warning" },
}));

import { ErrorApi, construirUrlApi, API_BASE_URL } from "@/lib/api/cliente";

describe("ErrorApi", () => {
  it("crea error con código y detalle", () => {
    const error = new ErrorApi(404, "No encontrado");
    expect(error.codigo).toBe(404);
    expect(error.detalle).toBe("No encontrado");
    expect(error.message).toBe("No encontrado");
    expect(error.name).toBe("ErrorApi");
  });

  it("es instancia de Error", () => {
    const error = new ErrorApi(500, "Error interno");
    expect(error).toBeInstanceOf(Error);
    expect(error).toBeInstanceOf(ErrorApi);
  });

  it("se puede capturar como Error genérico", () => {
    try {
      throw new ErrorApi(403, "Sin permisos");
    } catch (e) {
      expect(e).toBeInstanceOf(Error);
      if (e instanceof ErrorApi) {
        expect(e.codigo).toBe(403);
      }
    }
  });
});

describe("construirUrlApi", () => {
  it("construye URL con barra inicial", () => {
    const url = construirUrlApi("/auth/me");
    expect(url).toContain("/api/v1/auth/me");
  });

  it("construye URL sin barra inicial", () => {
    const url = construirUrlApi("auth/me");
    expect(url).toContain("/api/v1/auth/me");
  });

  it("API_BASE_URL está definida y contiene /api/v1", () => {
    expect(API_BASE_URL).toBeDefined();
    expect(API_BASE_URL).toContain("/api/v1");
  });
});
