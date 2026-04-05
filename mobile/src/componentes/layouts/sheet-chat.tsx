import { useEffect, useRef, useState } from "react";
import {
  Dimensions,
  Keyboard,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
  runOnJS,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BlurView } from "expo-blur";
import { MagicWand, PaperPlaneTilt, X } from "phosphor-react-native";
import { usarTema } from "@/lib/hooks/usar-tema";
import { useStoreAuth } from "@/lib/stores/store-auth";
import { usarEnviarMensaje, usarHistorialChat, usarNuevaConversacion } from "@/lib/hooks";
import type { MensajeChat } from "@/lib/tipos";

const { height: ALTO_PANTALLA } = Dimensions.get("window");
const SHEET_HEIGHT = ALTO_PANTALLA * 0.88;

const SUGERENCIAS = [
  "¿Qué necesito priorizar hoy?",
  "¿Cómo viene mi energía esta semana?",
  "Dame una guía corta para decidir mejor.",
];

function BurbujaMensaje({ mensaje }: { mensaje: MensajeChat }) {
  const { colores } = usarTema();
  const esUsuario = mensaje.rol === "user";

  return (
    <View style={{ alignItems: esUsuario ? "flex-end" : "flex-start", marginBottom: 10 }}>
      <View
        style={{
          maxWidth: "86%",
          borderRadius: 18,
          paddingHorizontal: 14,
          paddingVertical: 12,
          backgroundColor: esUsuario ? colores.acento : colores.superficie,
          borderWidth: 1,
          borderColor: esUsuario ? colores.acento : colores.borde,
        }}
      >
        <Text
          style={{
            color: esUsuario ? "#FFFFFF" : colores.primario,
            fontSize: 14,
            lineHeight: 20,
          }}
        >
          {mensaje.contenido}
        </Text>
      </View>
    </View>
  );
}

interface SheetChatProps {
  visible: boolean;
  onCerrar: () => void;
}

export function SheetChat({ visible, onCerrar }: SheetChatProps) {
  const insets = useSafeAreaInsets();
  const { colores, esOscuro } = usarTema();
  const usuario = useStoreAuth((s) => s.usuario);
  const scrollRef = useRef<ScrollView>(null);
  const inputRef = useRef<TextInput>(null);

  const [texto, setTexto] = useState("");
  const [mensajes, setMensajes] = useState<MensajeChat[]>([]);
  const [historialSincronizado, setHistorialSincronizado] = useState(false);
  const [mensajesRestantes, setMensajesRestantes] = useState<number | null>(null);
  const [limiteAlcanzado, setLimiteAlcanzado] = useState(false);
  const [montado, setMontado] = useState(false);

  const esPremium = usuario?.plan_slug === "premium";

  const historial = usarHistorialChat(visible);
  const enviarMensaje = usarEnviarMensaje();
  const nuevaConversacion = usarNuevaConversacion();

  // Animación del sheet
  const translateY = useSharedValue(SHEET_HEIGHT);
  const keyboardOffset = useSharedValue(0);
  const overlayOpacidad = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      setMontado(true);
      translateY.value = withTiming(0, {
        duration: 350,
        easing: Easing.out(Easing.cubic),
      });
      overlayOpacidad.value = withTiming(1, { duration: 300 });
    } else {
      Keyboard.dismiss();
      translateY.value = withTiming(SHEET_HEIGHT, {
        duration: 280,
        easing: Easing.in(Easing.cubic),
      }, () => {
        runOnJS(setMontado)(false);
      });
      overlayOpacidad.value = withTiming(0, { duration: 250 });
      keyboardOffset.value = withTiming(0, { duration: 200 });
    }
  }, [visible]);

  // Escuchar teclado y subir el sheet
  useEffect(() => {
    if (!montado) return;

    const showEvent = Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
    const hideEvent = Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";

    const subShow = Keyboard.addListener(showEvent, (e) => {
      keyboardOffset.value = withTiming(e.endCoordinates.height, {
        duration: Platform.OS === "ios" ? e.duration || 250 : 200,
        easing: Easing.out(Easing.cubic),
      });
    });

    const subHide = Keyboard.addListener(hideEvent, () => {
      keyboardOffset.value = withTiming(0, {
        duration: 200,
        easing: Easing.out(Easing.cubic),
      });
    });

    return () => {
      subShow.remove();
      subHide.remove();
    };
  }, [montado]);

  // Sincronizar historial
  useEffect(() => {
    if (!historial.data || historialSincronizado) return;
    setMensajes(historial.data.mensajes);
    setHistorialSincronizado(true);
  }, [historial.data, historialSincronizado]);

  // Auto-scroll
  useEffect(() => {
    const timeout = setTimeout(() => {
      scrollRef.current?.scrollToEnd({ animated: true });
    }, 80);
    return () => clearTimeout(timeout);
  }, [mensajes, enviarMensaje.isPending]);

  const enviar = (contenidoOpcional?: string) => {
    const contenido = (contenidoOpcional ?? texto).trim();
    if (!contenido || enviarMensaje.isPending || limiteAlcanzado) return;

    setMensajes((prev) => [...prev, { rol: "user", contenido, fecha: new Date().toISOString() }]);
    setTexto("");

    enviarMensaje.mutate(contenido, {
      onSuccess: (respuesta) => {
        setMensajes((prev) => [
          ...prev,
          { rol: "assistant", contenido: respuesta.respuesta, fecha: new Date().toISOString() },
        ]);
        setMensajesRestantes(respuesta.mensajes_restantes);
      },
      onError: (error) => {
        const msg = error instanceof Error ? error.message.toLowerCase() : "";
        const limite = msg.includes("límite") || msg.includes("limite");
        if (limite) setLimiteAlcanzado(true);
        setMensajes((prev) => [
          ...prev,
          {
            rol: "assistant",
            contenido: limite
              ? "Llegaste al límite diario del plan gratis. Con Premium seguís sin cortes."
              : "No pude responder ahora. Probá de nuevo en unos segundos.",
            fecha: new Date().toISOString(),
          },
        ]);
      },
    });
  };

  const reiniciar = () => {
    nuevaConversacion.mutate(undefined, {
      onSuccess: () => {
        setMensajes([]);
        setMensajesRestantes(null);
        setLimiteAlcanzado(false);
        setHistorialSincronizado(false);
      },
    });
  };

  const estiloSheet = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value - keyboardOffset.value }],
  }));

  const estiloOverlay = useAnimatedStyle(() => ({
    opacity: overlayOpacidad.value,
  }));

  if (!montado) return null;

  const estadoConsulta = esPremium
    ? "Premium activo. Sin límite."
    : mensajesRestantes !== null
      ? `Plan gratis · ${mensajesRestantes} restantes hoy`
      : "Plan gratis · 3 preguntas/día";

  return (
    <>
      {/* Overlay oscuro */}
      <Animated.View
        style={[
          {
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0,0,0,0.5)",
            zIndex: 90,
          },
          estiloOverlay,
        ]}
      >
        <Pressable style={{ flex: 1 }} onPress={onCerrar} />
      </Animated.View>

      {/* Sheet */}
      <Animated.View
        style={[
          {
            position: "absolute",
            left: 0,
            right: 0,
            bottom: 0,
            height: SHEET_HEIGHT,
            zIndex: 100,
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
            overflow: "hidden",
          },
          estiloSheet,
        ]}
      >
        {/* Fondo glass */}
        {Platform.OS === "ios" ? (
          <BlurView
            intensity={90}
            tint={esOscuro ? "dark" : "light"}
            style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}
          >
            <View
              style={{
                flex: 1,
                backgroundColor: esOscuro
                  ? "rgba(10, 10, 26, 0.65)"
                  : "rgba(247, 243, 252, 0.72)",
              }}
            />
          </BlurView>
        ) : (
          <View
            style={{
              position: "absolute",
              top: 0, left: 0, right: 0, bottom: 0,
              backgroundColor: esOscuro
                ? "rgba(10, 10, 26, 0.92)"
                : "rgba(247, 243, 252, 0.94)",
            }}
          />
        )}
        <View style={{ flex: 1 }}>
          {/* Handle + Header */}
          <View style={{ paddingTop: 12, paddingHorizontal: 16 }}>
            {/* Handle */}
            <View style={{ alignItems: "center", marginBottom: 12 }}>
              <View
                style={{
                  width: 36,
                  height: 4,
                  borderRadius: 2,
                  backgroundColor: colores.borde,
                }}
              />
            </View>

            {/* Header */}
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: 12,
              }}
            >
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <View
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 18,
                    backgroundColor: `${colores.acento}18`,
                    alignItems: "center",
                    justifyContent: "center",
                    marginRight: 10,
                  }}
                >
                  <MagicWand size={18} color={colores.acento} weight="fill" />
                </View>
                <View>
                  <Text
                    style={{
                      color: colores.primario,
                      fontSize: 17,
                      fontFamily: "Inter_700Bold",
                    }}
                  >
                    Astrea A.I.
                  </Text>
                  <Text style={{ color: colores.textoMuted, fontSize: 11, marginTop: 1 }}>
                    {estadoConsulta}
                  </Text>
                </View>
              </View>

              <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
                <Pressable onPress={reiniciar} disabled={nuevaConversacion.isPending}>
                  <Text style={{ color: colores.acento, fontSize: 13, fontFamily: "Inter_600SemiBold" }}>
                    Nuevo
                  </Text>
                </Pressable>
                <Pressable
                  onPress={onCerrar}
                  accessibilityRole="button"
                  accessibilityLabel="Cerrar chat"
                  hitSlop={8}
                >
                  <X size={20} color={colores.textoMuted} />
                </Pressable>
              </View>
            </View>
          </View>

          {/* Mensajes */}
          <ScrollView
            ref={scrollRef}
            style={{ flex: 1 }}
            contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 12 }}
            keyboardShouldPersistTaps="handled"
          >
            {mensajes.length === 0 ? (
              <View style={{ paddingTop: 32, alignItems: "center" }}>
                <Text
                  style={{
                    color: colores.textoSecundario,
                    fontSize: 14,
                    textAlign: "center",
                    lineHeight: 20,
                    marginBottom: 20,
                  }}
                >
                  Preguntale lo que quieras sobre tu carta, tu energía o tus tránsitos.
                </Text>
                <View style={{ gap: 8, width: "100%" }}>
                  {SUGERENCIAS.map((s) => (
                    <Pressable
                      key={s}
                      onPress={() => enviar(s)}
                      style={{
                        borderRadius: 14,
                        borderWidth: 1,
                        borderColor: colores.borde,
                        paddingHorizontal: 14,
                        paddingVertical: 12,
                      }}
                    >
                      <Text style={{ color: colores.primario, fontSize: 14 }}>{s}</Text>
                    </Pressable>
                  ))}
                </View>
              </View>
            ) : (
              mensajes.map((m, i) => (
                <BurbujaMensaje key={`${m.fecha}-${i}`} mensaje={m} />
              ))
            )}

            {enviarMensaje.isPending && (
              <View style={{ alignItems: "flex-start", marginBottom: 10 }}>
                <View
                  style={{
                    borderRadius: 18,
                    paddingHorizontal: 14,
                    paddingVertical: 12,
                    backgroundColor: colores.superficie,
                    borderWidth: 1,
                    borderColor: colores.borde,
                  }}
                >
                  <Text style={{ color: colores.textoSecundario, fontSize: 14 }}>
                    Respondiendo...
                  </Text>
                </View>
              </View>
            )}
          </ScrollView>

          {/* Input */}
          <View
            style={{
              borderTopWidth: 1,
              borderTopColor: colores.borde,
              paddingHorizontal: 16,
              paddingTop: 10,
              paddingBottom: insets.bottom + 10,
            }}
          >
            <View style={{ flexDirection: "row", alignItems: "flex-end", gap: 10 }}>
              <View
                style={{
                  flex: 1,
                  backgroundColor: colores.superficie,
                  borderWidth: 1,
                  borderColor: colores.borde,
                  borderRadius: 16,
                  paddingHorizontal: 14,
                  paddingVertical: 10,
                }}
              >
                <TextInput
                  ref={inputRef}
                  value={texto}
                  onChangeText={setTexto}
                  placeholder="Escribí tu pregunta..."
                  placeholderTextColor={colores.textoMuted}
                  multiline
                  editable={!enviarMensaje.isPending && !limiteAlcanzado}
                  style={{
                    color: colores.primario,
                    fontSize: 15,
                    fontFamily: "Inter_400Regular",
                    minHeight: 24,
                    maxHeight: 100,
                  }}
                />
              </View>

              <Pressable
                onPress={() => enviar()}
                disabled={!texto.trim() || enviarMensaje.isPending || limiteAlcanzado}
                accessibilityRole="button"
                accessibilityLabel="Enviar mensaje"
                style={{
                  width: 44,
                  height: 44,
                  alignItems: "center",
                  justifyContent: "center",
                  borderRadius: 22,
                  backgroundColor:
                    !texto.trim() || enviarMensaje.isPending || limiteAlcanzado
                      ? colores.borde
                      : colores.acento,
                }}
              >
                <PaperPlaneTilt
                  size={20}
                  color={
                    !texto.trim() || enviarMensaje.isPending || limiteAlcanzado
                      ? colores.textoMuted
                      : "#FFFFFF"
                  }
                  weight="fill"
                />
              </Pressable>
            </View>
          </View>
        </View>
      </Animated.View>
    </>
  );
}
