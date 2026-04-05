const secureStoreData: Record<string, string> = {};

jest.mock("expo-secure-store", () => ({
  getItemAsync: jest.fn((key: string) => Promise.resolve(secureStoreData[key] ?? null)),
  setItemAsync: jest.fn((key: string, value: string) => {
    secureStoreData[key] = value;
    return Promise.resolve();
  }),
  deleteItemAsync: jest.fn((key: string) => {
    delete secureStoreData[key];
    return Promise.resolve();
  }),
}));

jest.mock("expo-haptics", () => ({
  impactAsync: jest.fn(),
  selectionAsync: jest.fn(),
  notificationAsync: jest.fn(),
  ImpactFeedbackStyle: { Light: "light", Medium: "medium", Heavy: "heavy" },
  NotificationFeedbackType: { Success: "success", Error: "error", Warning: "warning" },
}));

jest.mock("@/lib/api/cliente", () => ({
  clienteApi: {
    get: jest.fn(),
  },
  API_BASE_URL: "http://localhost:8000/api/v1",
  construirUrlApi: jest.fn((ruta: string) => `http://localhost:8000/api/v1${ruta}`),
}));

jest.mock("@/lib/stores/store-ui", () => ({
  useStoreUI: {
    setState: jest.fn(),
  },
}));

import * as SecureStore from "expo-secure-store";
import { useStoreAuth } from "@/lib/stores/store-auth";

const { clienteApi } = require("@/lib/api/cliente");

const usuarioMock = {
  id: "u-1",
  email: "test@astra.com",
  nombre: "Test User",
  activo: true,
  verificado: true,
  proveedor_auth: "local",
  creado_en: "2026-01-01T00:00:00Z",
  plan_slug: "gratis",
  plan_nombre: "Gratis",
  suscripcion_estado: null,
  tiene_perfil: true,
};

beforeEach(() => {
  useStoreAuth.setState({
    usuario: null,
    cargando: true,
    autenticado: false,
  });
  Object.keys(secureStoreData).forEach((k) => delete secureStoreData[k]);
  jest.clearAllMocks();
});

describe("store-auth", () => {
  it("inicia sin usuario y cargando", () => {
    const estado = useStoreAuth.getState();
    expect(estado.usuario).toBeNull();
    expect(estado.autenticado).toBe(false);
    expect(estado.cargando).toBe(true);
  });

  it("setUsuario actualiza usuario y autenticado", () => {
    useStoreAuth.getState().setUsuario(usuarioMock);
    const estado = useStoreAuth.getState();
    expect(estado.usuario?.email).toBe("test@astra.com");
    expect(estado.autenticado).toBe(true);
  });

  it("setUsuario(null) desautentica", () => {
    useStoreAuth.getState().setUsuario(usuarioMock);
    useStoreAuth.getState().setUsuario(null);
    const estado = useStoreAuth.getState();
    expect(estado.usuario).toBeNull();
    expect(estado.autenticado).toBe(false);
  });

  it("cargarUsuario sin token no autentica", async () => {
    await useStoreAuth.getState().cargarUsuario();
    const estado = useStoreAuth.getState();
    expect(estado.usuario).toBeNull();
    expect(estado.autenticado).toBe(false);
    expect(estado.cargando).toBe(false);
  });

  it("cargarUsuario con token válido carga usuario", async () => {
    secureStoreData["access_token"] = "valid-jwt";
    (clienteApi.get as jest.Mock).mockResolvedValueOnce(usuarioMock);

    await useStoreAuth.getState().cargarUsuario();
    const estado = useStoreAuth.getState();
    expect(estado.usuario?.nombre).toBe("Test User");
    expect(estado.autenticado).toBe(true);
    expect(estado.cargando).toBe(false);
    expect(clienteApi.get).toHaveBeenCalledWith("/auth/me");
  });

  it("cargarUsuario con error de API no autentica", async () => {
    secureStoreData["access_token"] = "expired-jwt";
    (clienteApi.get as jest.Mock).mockRejectedValueOnce(new Error("401"));

    await useStoreAuth.getState().cargarUsuario();
    const estado = useStoreAuth.getState();
    expect(estado.usuario).toBeNull();
    expect(estado.autenticado).toBe(false);
    expect(estado.cargando).toBe(false);
  });

  it("cerrarSesion limpia tokens y estado", async () => {
    useStoreAuth.getState().setUsuario(usuarioMock);
    await useStoreAuth.getState().cerrarSesion();

    expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith("access_token");
    expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith("refresh_token");

    const estado = useStoreAuth.getState();
    expect(estado.usuario).toBeNull();
    expect(estado.autenticado).toBe(false);
  });
});
