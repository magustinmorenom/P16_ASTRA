import { useEffect, useRef, useState } from "react";
import {
  ActionSheetIOS,
  Alert,
  Dimensions,
  FlatList,
  Image,
  Keyboard,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import Animated, {
  Easing,
  FadeIn,
  FadeInDown,
  FadeInLeft,
  FadeInRight,
  FadeOut,
  FadeOutLeft,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
  type SharedValue,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BlurView } from "expo-blur";
import {
  Archive,
  ClockCounterClockwise,
  PaperPlaneTilt,
  PencilSimple,
  Plus,
  PushPin,
  ShareNetwork,
  Trash,
  X,
} from "phosphor-react-native";
import { usarTema } from "@/lib/hooks/usar-tema";
import { useStoreAuth } from "@/lib/stores/store-auth";
import {
  usarEnviarMensaje,
  usarHistorialChat,
  usarNuevaConversacion,
  usarConversaciones,
  usarCambiarConversacion,
  usarRenombrarConversacion,
  usarAnclarConversacion,
  usarArchivarConversacion,
  usarEliminarConversacion,
} from "@/lib/hooks";
import { haptico } from "@/lib/utilidades/hapticos";
import type { MensajeChat, ConversacionResumen } from "@/lib/tipos";

const { height: ALTO_PANTALLA } = Dimensions.get("window");
const SHEET_HEIGHT = ALTO_PANTALLA * 0.88;

const logo = require("../../../assets/logo-astra.png");

const SUGERENCIAS = [
  "¿Qué necesito priorizar hoy?",
  "¿Cómo viene mi energía esta semana?",
  "Dame una guía corta para decidir mejor.",
];

/* ── Burbuja de mensaje con animación ──────────────────── */

function BurbujaMensaje({
  mensaje,
  indice,
  esNuevo,
}: {
  mensaje: MensajeChat;
  indice: number;
  esNuevo: boolean;
}) {
  const { colores } = usarTema();
  const esUsuario = mensaje.rol === "user";

  const entering = esNuevo
    ? esUsuario
      ? FadeInRight.duration(280)
          .easing(Easing.out(Easing.cubic))
          .withInitialValues({ transform: [{ translateX: 20 }], opacity: 0 })
      : FadeInLeft.duration(320)
          .easing(Easing.out(Easing.cubic))
          .withInitialValues({ transform: [{ translateX: -20 }], opacity: 0 })
    : FadeIn.delay(Math.min(indice * 30, 300)).duration(200);

  return (
    <Animated.View
      entering={entering}
      style={{
        alignItems: esUsuario ? "flex-end" : "flex-start",
        marginBottom: 10,
      }}
    >
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
    </Animated.View>
  );
}

/* ── Indicador de typing con dots pulsantes ─────────────── */

function IndicadorTyping() {
  const { colores } = usarTema();

  const o1 = useSharedValue(0.3);
  const o2 = useSharedValue(0.3);
  const o3 = useSharedValue(0.3);

  useEffect(() => {
    const pulse = (sv: SharedValue<number>, delay: number) => {
      sv.value = withDelay(
        delay,
        withRepeat(
          withSequence(
            withTiming(1, { duration: 400, easing: Easing.inOut(Easing.quad) }),
            withTiming(0.3, { duration: 400, easing: Easing.inOut(Easing.quad) })
          ),
          -1,
          false
        )
      );
    };
    pulse(o1, 0);
    pulse(o2, 160);
    pulse(o3, 320);
  }, []);

  const s1 = useAnimatedStyle(() => ({ opacity: o1.value }));
  const s2 = useAnimatedStyle(() => ({ opacity: o2.value }));
  const s3 = useAnimatedStyle(() => ({ opacity: o3.value }));

  return (
    <Animated.View
      entering={FadeInLeft.duration(250).easing(Easing.out(Easing.cubic))}
      style={{ alignItems: "flex-start", marginBottom: 10 }}
    >
      <View
        style={{
          borderRadius: 18,
          paddingHorizontal: 16,
          paddingVertical: 14,
          backgroundColor: colores.superficie,
          borderWidth: 1,
          borderColor: colores.borde,
          flexDirection: "row",
          alignItems: "center",
          gap: 5,
        }}
      >
        {[s1, s2, s3].map((style, i) => (
          <Animated.View
            key={i}
            style={[
              {
                width: 7,
                height: 7,
                borderRadius: 3.5,
                backgroundColor: colores.acento,
              },
              style,
            ]}
          />
        ))}
      </View>
    </Animated.View>
  );
}

/* ── Botón enviar animado ───────────────────────────────── */

function BotonEnviar({
  onPress,
  disabled,
  colores,
}: {
  onPress: () => void;
  disabled: boolean;
  colores: { borde: string; acento: string; textoMuted: string };
}) {
  const escala = useSharedValue(1);

  const estiloAnimado = useAnimatedStyle(() => ({
    transform: [{ scale: escala.value }],
  }));

  return (
    <Pressable
      onPressIn={() => {
        if (!disabled) {
          escala.value = withSpring(0.85, { damping: 15, stiffness: 400 });
        }
      }}
      onPressOut={() => {
        escala.value = withSpring(1, { damping: 12, stiffness: 300 });
      }}
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel="Enviar mensaje"
    >
      <Animated.View
        style={[
          {
            width: 44,
            height: 44,
            alignItems: "center",
            justifyContent: "center",
            borderRadius: 22,
            backgroundColor: disabled ? colores.borde : colores.acento,
          },
          estiloAnimado,
        ]}
      >
        <PaperPlaneTilt
          size={20}
          color={disabled ? colores.textoMuted : "#FFFFFF"}
          weight="fill"
        />
      </Animated.View>
    </Pressable>
  );
}

/* ── Menú contextual glass ────── */

const MENU_OPCIONES = [
  { id: "compartir", label: "Compartir chat", Icono: ShareNetwork, destructivo: false },
  { id: "anclar", label: "Anclar", Icono: PushPin, destructivo: false },
  { id: "renombrar", label: "Cambiar nombre", Icono: PencilSimple, destructivo: false },
  { id: "archivar", label: "Archivar", Icono: Archive, destructivo: false },
  { id: "eliminar", label: "Eliminar", Icono: Trash, destructivo: true },
] as const;

function MenuContextual({
  visible,
  onCerrar,
  posY,
  colores,
  esOscuro,
}: {
  visible: boolean;
  onCerrar: (accion?: string) => void;
  posY: number;
  colores: ReturnType<typeof usarTema>["colores"];
  esOscuro: boolean;
}) {
  if (!visible) return null;

  return (
    <View style={[StyleSheet.absoluteFill, { zIndex: 200, elevation: 200 }]}>
      <Pressable
        onPress={() => onCerrar()}
        style={StyleSheet.absoluteFill}
      />
      <Animated.View
        entering={FadeIn.duration(150)}
        exiting={FadeOut.duration(100)}
        style={{
          position: "absolute",
          left: 16,
          right: 16,
          top: Math.min(posY, 400),
          zIndex: 21,
          elevation: 21,
          borderRadius: 14,
          overflow: "hidden",
        }}
      >
        {Platform.OS === "ios" ? (
          <BlurView
            intensity={80}
            tint={esOscuro ? "dark" : "light"}
            style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}
          >
            <View
              style={{
                flex: 1,
                backgroundColor: esOscuro
                  ? "rgba(20, 16, 40, 0.75)"
                  : "rgba(255, 255, 255, 0.8)",
              }}
            />
          </BlurView>
        ) : (
          <View
            style={{
              position: "absolute",
              top: 0, left: 0, right: 0, bottom: 0,
              backgroundColor: esOscuro ? "rgba(20, 16, 40, 0.95)" : "rgba(255, 255, 255, 0.96)",
              borderRadius: 14,
            }}
          />
        )}
        <View style={{ paddingVertical: 6 }}>
          {MENU_OPCIONES.map((opcion, idx) => (
            <Pressable
              key={opcion.id}
              onPress={() => {
                haptico.toque();
                onCerrar(opcion.id);
              }}
              style={{
                flexDirection: "row",
                alignItems: "center",
                paddingHorizontal: 16,
                paddingVertical: 12,
                borderBottomWidth: idx < MENU_OPCIONES.length - 1 ? 1 : 0,
                borderBottomColor: esOscuro ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)",
              }}
            >
              <opcion.Icono
                size={18}
                color={opcion.destructivo ? "#f87171" : colores.primario}
                weight="regular"
              />
              <Text
                style={{
                  color: opcion.destructivo ? "#f87171" : colores.primario,
                  fontSize: 15,
                  fontFamily: "Inter_500Medium",
                  marginLeft: 12,
                }}
              >
                {opcion.label}
              </Text>
            </Pressable>
          ))}
        </View>
      </Animated.View>
    </View>
  );
}

/* ── Panel lateral de conversaciones (slide animado) ────── */

function PanelConversaciones({
  visible,
  onCerrar,
  conversaciones,
  conversacionActiva,
  onSeleccionar,
  onNueva,
}: {
  visible: boolean;
  onCerrar: () => void;
  conversaciones: ConversacionResumen[];
  conversacionActiva: string | null;
  onSeleccionar: (id: string) => void;
  onNueva: () => void;
}) {
  const { colores, esOscuro } = usarTema();
  const renombrarConv = usarRenombrarConversacion();
  const anclarConv = usarAnclarConversacion();
  const archivarConv = usarArchivarConversacion();
  const eliminarConv = usarEliminarConversacion();

  const [menuConv, setMenuConv] = useState<{ id: string; y: number } | null>(null);

  if (!visible) return null;

  return (
    <Animated.View
      entering={FadeIn.duration(180)}
      exiting={FadeOut.duration(120)}
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 200,
        flexDirection: "row",
      }}
    >
      {/* Panel deslizante — glass con slide desacelerado */}
      <Animated.View
        entering={FadeInLeft.duration(450).easing(Easing.out(Easing.quad))}
        exiting={FadeOutLeft.duration(250).easing(Easing.in(Easing.cubic))}
        style={{
          width: "78%",
          overflow: "hidden",
          borderTopRightRadius: 20,
          borderBottomRightRadius: 20,
        }}
      >
        {/* Fondo glass */}
        {Platform.OS === "ios" ? (
          <BlurView
            intensity={80}
            tint={esOscuro ? "dark" : "light"}
            style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}
          >
            <View
              style={{
                flex: 1,
                backgroundColor: esOscuro
                  ? "rgba(15, 12, 30, 0.72)"
                  : "rgba(247, 243, 252, 0.78)",
              }}
            />
          </BlurView>
        ) : (
          <View
            style={{
              position: "absolute",
              top: 0, left: 0, right: 0, bottom: 0,
              backgroundColor: esOscuro
                ? "rgba(15, 12, 30, 0.95)"
                : "rgba(247, 243, 252, 0.96)",
            }}
          />
        )}
        <View style={{ flex: 1, paddingTop: 16 }}>
        {/* Header panel */}
        <Animated.View
          entering={FadeIn.delay(100).duration(250)}
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            paddingHorizontal: 16,
            marginBottom: 16,
          }}
        >
          <Text
            style={{
              color: colores.primario,
              fontSize: 17,
              fontFamily: "Inter_700Bold",
            }}
          >
            Conversaciones
          </Text>
          <Pressable
            onPress={() => {
              haptico.toque();
              onNueva();
            }}
            accessibilityRole="button"
            accessibilityLabel="Nueva conversación"
            hitSlop={8}
          >
            {({ pressed }) => (
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 6,
                  paddingHorizontal: 14,
                  paddingVertical: 8,
                  borderRadius: 20,
                  backgroundColor: pressed ? `${colores.acento}CC` : colores.acento,
                  transform: [{ scale: pressed ? 0.95 : 1 }],
                }}
              >
                <Plus size={14} color="#FFFFFF" weight="bold" />
                <Text
                  style={{
                    color: "#FFFFFF",
                    fontSize: 14,
                    fontFamily: "Inter_600SemiBold",
                  }}
                >
                  Nuevo
                </Text>
              </View>
            )}
          </Pressable>
        </Animated.View>

        {/* Lista con items escalonados */}
        <FlatList
          data={conversaciones}
          keyExtractor={(c) => c.id}
          contentContainerStyle={{ paddingHorizontal: 12, paddingBottom: 20 }}
          renderItem={({ item, index }) => {
            const esActiva = item.id === conversacionActiva;
            const fecha = item.creado_en
              ? new Date(item.creado_en).toLocaleDateString("es-AR", {
                  day: "numeric",
                  month: "short",
                })
              : "";

            return (
              <Animated.View
                entering={FadeInLeft.delay(80 + index * 40)
                  .duration(250)
                  .easing(Easing.out(Easing.cubic))}
              >
                <Pressable
                  onPress={() => {
                    haptico.toque();
                    onSeleccionar(item.id);
                  }}
                  onLongPress={(e) => {
                    haptico.impacto();
                    setMenuConv({ id: item.id, y: e.nativeEvent.pageY - 80 });
                  }}
                  delayLongPress={400}
                  style={{
                    paddingHorizontal: 12,
                    paddingVertical: 12,
                    borderRadius: 12,
                    marginBottom: 4,
                    backgroundColor: esActiva
                      ? `${colores.acento}14`
                      : "transparent",
                    borderWidth: esActiva ? 1 : 0,
                    borderColor: esActiva
                      ? `${colores.acento}30`
                      : "transparent",
                  }}
                >
                  <View style={{ flexDirection: "row", alignItems: "center" }}>
                    {item.anclada && (
                      <PushPin
                        size={12}
                        color={colores.acento}
                        weight="fill"
                        style={{ marginRight: 6 }}
                      />
                    )}
                    <Text
                      numberOfLines={2}
                      style={{
                        color: esActiva ? colores.acento : colores.primario,
                        fontSize: 14,
                        fontFamily: "Inter_500Medium",
                        lineHeight: 19,
                        flex: 1,
                      }}
                    >
                      {item.titulo || item.preview || "Conversación vacía"}
                    </Text>
                  </View>
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 8,
                      marginTop: 4,
                    }}
                  >
                    <Text style={{ color: colores.textoMuted, fontSize: 11 }}>
                      {fecha}
                    </Text>
                    <Text style={{ color: colores.textoMuted, fontSize: 11 }}>
                      {item.total_mensajes} msgs
                    </Text>
                  </View>
                </Pressable>
              </Animated.View>
            );
          }}
          ListEmptyComponent={
            <Animated.View
              entering={FadeIn.delay(200).duration(300)}
              style={{ paddingVertical: 32, alignItems: "center" }}
            >
              <Text
                style={{
                  color: colores.textoMuted,
                  fontSize: 14,
                  textAlign: "center",
                }}
              >
                No tenés conversaciones aún.
              </Text>
            </Animated.View>
          }
        />

        {/* Menú contextual glass */}
        <MenuContextual
          visible={menuConv !== null}
          onCerrar={(accion) => {
            const convId = menuConv?.id;
            setMenuConv(null);
            if (!convId || !accion) return;

            switch (accion) {
              case "compartir":
                // TODO: implementar Share API
                break;
              case "anclar":
                anclarConv.mutate(convId);
                break;
              case "renombrar":
                Alert.prompt?.(
                  "Cambiar nombre",
                  "Escribí un nuevo título para esta conversación",
                  (titulo) => {
                    if (titulo?.trim()) {
                      renombrarConv.mutate({ id: convId, titulo: titulo.trim() });
                    }
                  },
                ) ??
                  // Android fallback (Alert.prompt no existe)
                  (() => {
                    // Por ahora usar un título genérico en Android
                    const titulo = `Chat ${new Date().toLocaleDateString("es-AR", { day: "numeric", month: "short" })}`;
                    renombrarConv.mutate({ id: convId, titulo });
                  })();
                break;
              case "archivar":
                archivarConv.mutate(convId);
                break;
              case "eliminar":
                Alert.alert(
                  "Eliminar conversación",
                  "¿Estás seguro? Esta acción no se puede deshacer.",
                  [
                    { text: "Cancelar", style: "cancel" },
                    {
                      text: "Eliminar",
                      style: "destructive",
                      onPress: () => eliminarConv.mutate(convId),
                    },
                  ],
                );
                break;
            }
          }}
          posY={menuConv?.y ?? 0}
          colores={colores}
          esOscuro={esOscuro}
        />
        </View>
      </Animated.View>

      {/* Overlay derecho para cerrar */}
      <Pressable
        onPress={onCerrar}
        style={{
          flex: 1,
          backgroundColor: "rgba(0,0,0,0.3)",
        }}
      />
    </Animated.View>
  );
}

/* ── Saludo del día ─────────────────────────────────────── */

function obtenerSaludoDiario(nombre?: string | null): string {
  const hora = new Date().getHours();
  const primerNombre = nombre?.split(" ")[0] ?? "Explorador";

  if (hora < 12)
    return `Buenos días, ${primerNombre}. ¿En qué puedo guiarte hoy?`;
  if (hora < 19)
    return `Buenas tardes, ${primerNombre}. ¿Qué te gustaría consultar?`;
  return `Buenas noches, ${primerNombre}. ¿Qué inquietud traés esta noche?`;
}

/* ── Sheet principal ────────────────────────────────────── */

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
  const [mensajesRestantes, setMensajesRestantes] = useState<number | null>(
    null
  );
  const [limiteAlcanzado, setLimiteAlcanzado] = useState(false);
  const [montado, setMontado] = useState(false);
  const [panelAbierto, setPanelAbierto] = useState(false);
  const [conversacionId, setConversacionId] = useState<string | null>(null);
  // Track cuántos mensajes existían al cargar para saber cuáles son "nuevos"
  const [mensajesIniciales, setMensajesIniciales] = useState(0);

  const esPremium = usuario?.plan_slug === "premium";

  const historial = usarHistorialChat(visible);
  const enviarMensaje = usarEnviarMensaje();
  const nuevaConversacion = usarNuevaConversacion();
  const { data: conversaciones } = usarConversaciones(visible);
  const cambiarConversacion = usarCambiarConversacion();

  // Animación del sheet
  const translateY = useSharedValue(SHEET_HEIGHT);
  const keyboardOffset = useSharedValue(0);
  const overlayOpacidad = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      setMontado(true);
      translateY.value = withTiming(0, {
        duration: 380,
        easing: Easing.bezierFn(0.32, 0.72, 0, 1),
      });
      overlayOpacidad.value = withTiming(1, { duration: 320 });
    } else {
      Keyboard.dismiss();
      setPanelAbierto(false);
      translateY.value = withTiming(
        SHEET_HEIGHT,
        {
          duration: 300,
          easing: Easing.bezierFn(0.32, 0, 0.67, 0),
        },
        () => {
          runOnJS(setMontado)(false);
        }
      );
      overlayOpacidad.value = withTiming(0, { duration: 260 });
      keyboardOffset.value = withTiming(0, { duration: 200 });
    }
  }, [visible]);

  // Escuchar teclado
  useEffect(() => {
    if (!montado) return;

    const showEvent =
      Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
    const hideEvent =
      Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";

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

  // Sincronizar historial + saludo del día
  useEffect(() => {
    if (!historial.data || historialSincronizado) return;

    const msgs = historial.data.mensajes;
    setConversacionId(historial.data.conversacion_id);

    if (msgs.length === 0) {
      const saludo: MensajeChat[] = [
        {
          rol: "assistant",
          contenido: obtenerSaludoDiario(usuario?.nombre),
          fecha: new Date().toISOString(),
        },
      ];
      setMensajes(saludo);
      setMensajesIniciales(saludo.length);
    } else {
      setMensajes(msgs);
      setMensajesIniciales(msgs.length);
    }

    setHistorialSincronizado(true);
  }, [historial.data, historialSincronizado, usuario?.nombre]);

  // Auto-scroll
  useEffect(() => {
    const timeout = setTimeout(() => {
      scrollRef.current?.scrollToEnd({ animated: true });
    }, 100);
    return () => clearTimeout(timeout);
  }, [mensajes, enviarMensaje.isPending]);

  const enviar = (contenidoOpcional?: string) => {
    const contenido = (contenidoOpcional ?? texto).trim();
    if (!contenido || enviarMensaje.isPending || limiteAlcanzado) return;

    haptico.toque();
    setMensajes((prev) => [
      ...prev,
      { rol: "user", contenido, fecha: new Date().toISOString() },
    ]);
    setTexto("");

    enviarMensaje.mutate(contenido, {
      onSuccess: (respuesta) => {
        setMensajes((prev) => [
          ...prev,
          {
            rol: "assistant",
            contenido: respuesta.respuesta,
            fecha: new Date().toISOString(),
          },
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
    haptico.toque();
    nuevaConversacion.mutate(undefined, {
      onSuccess: (data) => {
        const saludo: MensajeChat[] = [
          {
            rol: "assistant",
            contenido: obtenerSaludoDiario(usuario?.nombre),
            fecha: new Date().toISOString(),
          },
        ];
        setMensajes(saludo);
        setMensajesIniciales(saludo.length);
        setMensajesRestantes(null);
        setLimiteAlcanzado(false);
        setHistorialSincronizado(false);
        setConversacionId(data.conversacion_id);
        setPanelAbierto(false);
      },
    });
  };

  const seleccionarConversacion = (id: string) => {
    if (id === conversacionId) {
      setPanelAbierto(false);
      return;
    }
    cambiarConversacion.mutate(id, {
      onSuccess: (data) => {
        const msgs =
          data.mensajes.length > 0
            ? data.mensajes
            : [
                {
                  rol: "assistant" as const,
                  contenido: obtenerSaludoDiario(usuario?.nombre),
                  fecha: new Date().toISOString(),
                },
              ];
        setMensajes(msgs);
        setMensajesIniciales(msgs.length);
        setConversacionId(data.conversacion_id);
        setHistorialSincronizado(true);
        setLimiteAlcanzado(false);
        setMensajesRestantes(null);
        setPanelAbierto(false);
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

  // Quitar leyenda de plan — no mostrar en el header

  const inputDeshabilitado =
    !texto.trim() || enviarMensaje.isPending || limiteAlcanzado;

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
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
            }}
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
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
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
            <Animated.View
              entering={FadeIn.delay(200).duration(400)}
              style={{ alignItems: "center", marginBottom: 12 }}
            >
              <View
                style={{
                  width: 36,
                  height: 4,
                  borderRadius: 2,
                  backgroundColor: colores.borde,
                }}
              />
            </Animated.View>

            {/* Header — Logo ASTRA + acciones */}
            <Animated.View
              entering={FadeInDown.delay(150)
                .duration(350)
                .easing(Easing.out(Easing.cubic))}
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: 12,
              }}
            >
              {/* Izq: historial + logo */}
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 12,
                }}
              >
                <Pressable
                  onPress={() => {
                    haptico.toque();
                    setPanelAbierto(!panelAbierto);
                  }}
                  accessibilityRole="button"
                  accessibilityLabel="Ver conversaciones"
                  hitSlop={8}
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 10,
                    backgroundColor: panelAbierto
                      ? `${colores.acento}24`
                      : `${colores.acento}10`,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <ClockCounterClockwise
                    size={18}
                    color={
                      panelAbierto
                        ? colores.acento
                        : colores.textoSecundario
                    }
                    weight={panelAbierto ? "fill" : "regular"}
                  />
                </Pressable>

                <View>
                  <Image
                    source={logo}
                    style={{
                      width: 80,
                      height: 24,
                      tintColor: colores.primario,
                    }}
                    resizeMode="contain"
                    accessibilityLabel="ASTRA"
                  />
                </View>
              </View>

              {/* Der: nueva conversación + cerrar */}
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 10,
                }}
              >
                <Pressable
                  onPress={reiniciar}
                  disabled={nuevaConversacion.isPending}
                  accessibilityRole="button"
                  accessibilityLabel="Nueva conversación"
                  hitSlop={8}
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 10,
                    backgroundColor: colores.acento,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Text style={{ color: "#FFFFFF", fontSize: 20, fontFamily: "Inter_700Bold", marginTop: -1 }}>
                    +
                  </Text>
                </Pressable>
                <Pressable
                  onPress={onCerrar}
                  accessibilityRole="button"
                  accessibilityLabel="Cerrar chat"
                  hitSlop={8}
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 10,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <X size={18} color={colores.textoMuted} />
                </Pressable>
              </View>
            </Animated.View>
          </View>

          {/* Mensajes */}
          <ScrollView
            ref={scrollRef}
            style={{ flex: 1 }}
            contentContainerStyle={{
              paddingHorizontal: 16,
              paddingBottom: 12,
            }}
            keyboardShouldPersistTaps="handled"
          >
            {mensajes.length === 0 ? (
              <Animated.View
                entering={FadeIn.delay(300).duration(400)}
                style={{ paddingTop: 32, alignItems: "center" }}
              >
                <Text
                  style={{
                    color: colores.textoSecundario,
                    fontSize: 14,
                    textAlign: "center",
                    lineHeight: 20,
                    marginBottom: 20,
                  }}
                >
                  Preguntale lo que quieras sobre tu carta, tu energía o tus
                  tránsitos.
                </Text>
                <View style={{ gap: 8, width: "100%" }}>
                  {SUGERENCIAS.map((s, idx) => (
                    <Animated.View
                      key={s}
                      entering={FadeInDown.delay(400 + idx * 80)
                        .duration(300)
                        .easing(Easing.out(Easing.cubic))}
                    >
                      <Pressable
                        onPress={() => enviar(s)}
                        style={{
                          borderRadius: 14,
                          borderWidth: 1,
                          borderColor: colores.borde,
                          paddingHorizontal: 14,
                          paddingVertical: 12,
                        }}
                      >
                        <Text
                          style={{ color: colores.primario, fontSize: 14 }}
                        >
                          {s}
                        </Text>
                      </Pressable>
                    </Animated.View>
                  ))}
                </View>
              </Animated.View>
            ) : (
              mensajes.map((m, i) => (
                <BurbujaMensaje
                  key={`${m.fecha}-${i}`}
                  mensaje={m}
                  indice={i}
                  esNuevo={i >= mensajesIniciales}
                />
              ))
            )}

            {enviarMensaje.isPending && <IndicadorTyping />}
          </ScrollView>

          {/* Input */}
          <Animated.View
            entering={FadeInDown.delay(250).duration(300)}
            style={{
              borderTopWidth: 1,
              borderTopColor: colores.borde,
              paddingHorizontal: 16,
              paddingTop: 10,
              paddingBottom: insets.bottom + 10,
            }}
          >
            <View
              style={{
                flexDirection: "row",
                alignItems: "flex-end",
                gap: 10,
              }}
            >
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

              <BotonEnviar
                onPress={() => enviar()}
                disabled={inputDeshabilitado}
                colores={colores}
              />
            </View>
          </Animated.View>
        </View>

        {/* Panel de conversaciones */}
        <PanelConversaciones
          visible={panelAbierto}
          onCerrar={() => setPanelAbierto(false)}
          conversaciones={conversaciones ?? []}
          conversacionActiva={conversacionId}
          onSeleccionar={seleccionarConversacion}
          onNueva={reiniciar}
        />
      </Animated.View>
    </>
  );
}
