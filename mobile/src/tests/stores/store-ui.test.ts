jest.mock("expo-haptics", () => ({
  impactAsync: jest.fn(),
  selectionAsync: jest.fn(),
  notificationAsync: jest.fn(),
  ImpactFeedbackStyle: { Light: "light", Medium: "medium", Heavy: "heavy" },
  NotificationFeedbackType: { Success: "success", Error: "error", Warning: "warning" },
}));

import { useStoreUI, type PistaReproduccion } from "@/lib/stores/store-ui";

const pistaMock: PistaReproduccion = {
  id: "ep-1",
  titulo: "Pronóstico diario",
  subtitulo: "5 de abril 2026",
  tipo: "podcast",
  duracionSegundos: 180,
  icono: "moon",
  gradiente: "#7C4DFF",
};

beforeEach(() => {
  useStoreUI.setState({
    pasoOnboarding: 0,
    pistaActual: null,
    reproduciendo: false,
    progresoSegundos: 0,
    volumen: 70,
    silenciado: false,
    segmentoActual: 0,
    miniReproductorExpandido: false,
    descargandoAudio: false,
    progresoDescarga: 0,
    errorAudio: null,
  });
});

describe("store-ui", () => {
  it("inicia sin pista actual", () => {
    const estado = useStoreUI.getState();
    expect(estado.pistaActual).toBeNull();
    expect(estado.reproduciendo).toBe(false);
  });

  it("setPistaActual configura pista y activa reproducción", () => {
    useStoreUI.getState().setPistaActual(pistaMock);
    const estado = useStoreUI.getState();
    expect(estado.pistaActual?.id).toBe("ep-1");
    expect(estado.reproduciendo).toBe(true);
    expect(estado.progresoSegundos).toBe(0);
    expect(estado.segmentoActual).toBe(0);
    expect(estado.errorAudio).toBeNull();
  });

  it("setPistaActual(null) detiene reproducción", () => {
    useStoreUI.getState().setPistaActual(pistaMock);
    useStoreUI.getState().setPistaActual(null);
    const estado = useStoreUI.getState();
    expect(estado.pistaActual).toBeNull();
    expect(estado.reproduciendo).toBe(false);
  });

  it("toggleReproduccion alterna el estado", () => {
    useStoreUI.getState().setPistaActual(pistaMock);
    expect(useStoreUI.getState().reproduciendo).toBe(true);
    useStoreUI.getState().toggleReproduccion();
    expect(useStoreUI.getState().reproduciendo).toBe(false);
    useStoreUI.getState().toggleReproduccion();
    expect(useStoreUI.getState().reproduciendo).toBe(true);
  });

  it("setProgreso actualiza progresoSegundos", () => {
    useStoreUI.getState().setProgreso(42);
    expect(useStoreUI.getState().progresoSegundos).toBe(42);
  });

  it("setVolumen actualiza volumen", () => {
    useStoreUI.getState().setVolumen(100);
    expect(useStoreUI.getState().volumen).toBe(100);
  });

  it("toggleSilencio alterna el estado de silencio", () => {
    expect(useStoreUI.getState().silenciado).toBe(false);
    useStoreUI.getState().toggleSilencio();
    expect(useStoreUI.getState().silenciado).toBe(true);
  });

  it("toggleMiniReproductor alterna expansión", () => {
    expect(useStoreUI.getState().miniReproductorExpandido).toBe(false);
    useStoreUI.getState().toggleMiniReproductor();
    expect(useStoreUI.getState().miniReproductorExpandido).toBe(true);
  });

  it("setDescargandoAudio y setProgresoDescarga funcionan", () => {
    useStoreUI.getState().setDescargandoAudio(true);
    useStoreUI.getState().setProgresoDescarga(55);
    const estado = useStoreUI.getState();
    expect(estado.descargandoAudio).toBe(true);
    expect(estado.progresoDescarga).toBe(55);
  });

  it("setErrorAudio guarda error", () => {
    useStoreUI.getState().setErrorAudio("Fallo la descarga");
    expect(useStoreUI.getState().errorAudio).toBe("Fallo la descarga");
    useStoreUI.getState().setErrorAudio(null);
    expect(useStoreUI.getState().errorAudio).toBeNull();
  });

  it("setPasoOnboarding actualiza paso", () => {
    useStoreUI.getState().setPasoOnboarding(3);
    expect(useStoreUI.getState().pasoOnboarding).toBe(3);
  });
});
