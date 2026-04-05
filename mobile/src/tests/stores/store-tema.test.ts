// Mocks deben ir antes de los imports
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

import * as SecureStore from "expo-secure-store";
import { useStoreTema } from "@/lib/stores/store-tema";
import { ColoresClaro, ColoresOscuro } from "@/constants/colores";

beforeEach(() => {
  useStoreTema.setState({
    preferencia: "automatico",
    esquemaActivo: "dark",
    colores: ColoresOscuro,
    cargado: false,
  });
  Object.keys(secureStoreData).forEach((k) => delete secureStoreData[k]);
  jest.clearAllMocks();
});

describe("store-tema", () => {
  it("inicia con preferencia automático", () => {
    const estado = useStoreTema.getState();
    expect(estado.preferencia).toBe("automatico");
    expect(estado.cargado).toBe(false);
  });

  it("setPreferencia a claro cambia esquema y colores", () => {
    useStoreTema.getState().setPreferencia("claro");
    const estado = useStoreTema.getState();
    expect(estado.preferencia).toBe("claro");
    expect(estado.esquemaActivo).toBe("light");
    expect(estado.colores).toEqual(ColoresClaro);
  });

  it("setPreferencia a oscuro cambia esquema y colores", () => {
    useStoreTema.getState().setPreferencia("oscuro");
    const estado = useStoreTema.getState();
    expect(estado.preferencia).toBe("oscuro");
    expect(estado.esquemaActivo).toBe("dark");
    expect(estado.colores).toEqual(ColoresOscuro);
  });

  it("setPreferencia persiste en SecureStore", () => {
    useStoreTema.getState().setPreferencia("claro");
    expect(SecureStore.setItemAsync).toHaveBeenCalledWith(
      "astra_tema_preferencia",
      "claro",
    );
  });

  it("cargarPreferencia lee de SecureStore", async () => {
    secureStoreData["astra_tema_preferencia"] = "oscuro";
    await useStoreTema.getState().cargarPreferencia();
    const estado = useStoreTema.getState();
    expect(estado.preferencia).toBe("oscuro");
    expect(estado.esquemaActivo).toBe("dark");
    expect(estado.cargado).toBe(true);
  });

  it("cargarPreferencia con valor inválido mantiene automático", async () => {
    secureStoreData["astra_tema_preferencia"] = "invalido";
    await useStoreTema.getState().cargarPreferencia();
    const estado = useStoreTema.getState();
    expect(estado.preferencia).toBe("automatico");
    expect(estado.cargado).toBe(true);
  });

  it("sincronizarSistema solo actúa en modo automático", () => {
    useStoreTema.getState().sincronizarSistema("light");
    expect(useStoreTema.getState().esquemaActivo).toBe("light");

    useStoreTema.getState().setPreferencia("oscuro");
    useStoreTema.getState().sincronizarSistema("light");
    expect(useStoreTema.getState().esquemaActivo).toBe("dark");
  });
});
