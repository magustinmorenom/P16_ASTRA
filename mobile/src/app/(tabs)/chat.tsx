import { useEffect, useRef, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Tarjeta } from "@/componentes/ui/tarjeta";
import { IconoAstral } from "@/componentes/ui/icono-astral";
import { usarTema } from "@/lib/hooks/usar-tema";
import { useStoreAuth } from "@/lib/stores/store-auth";
import { usarEnviarMensaje, usarHistorialChat, usarNuevaConversacion } from "@/lib/hooks";
import type { MensajeChat } from "@/lib/tipos";

const SUGERENCIAS = [
  "¿Qué necesito priorizar hoy?",
  "¿Cómo viene mi energía esta semana?",
  "Dame una guía corta para decidir mejor.",
];

function BurbujaMensaje({ mensaje }: { mensaje: MensajeChat }) {
  const { colores } = usarTema();
  const esUsuario = mensaje.rol === "user";

  return (
    <View
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
    </View>
  );
}

export default function PantallaChat() {
  const insets = useSafeAreaInsets();
  const { colores } = usarTema();
  const usuario = useStoreAuth((state) => state.usuario);
  const scrollRef = useRef<ScrollView>(null);
  const [texto, setTexto] = useState("");
  const [mensajes, setMensajes] = useState<MensajeChat[]>([]);
  const [historialSincronizado, setHistorialSincronizado] = useState(false);
  const [mensajesRestantes, setMensajesRestantes] = useState<number | null>(null);
  const [limiteAlcanzado, setLimiteAlcanzado] = useState(false);

  const esPremium = usuario?.plan_slug === "premium";
  const historial = usarHistorialChat(true);
  const enviarMensaje = usarEnviarMensaje();
  const nuevaConversacion = usarNuevaConversacion();

  useEffect(() => {
    if (!historial.data || historialSincronizado) return;

    setMensajes(historial.data.mensajes);
    setHistorialSincronizado(true);
  }, [historial.data, historialSincronizado]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      scrollRef.current?.scrollToEnd({ animated: true });
    }, 80);

    return () => clearTimeout(timeout);
  }, [mensajes, enviarMensaje.isPending]);

  const enviar = (contenidoOpcional?: string) => {
    const contenido = (contenidoOpcional ?? texto).trim();
    if (!contenido || enviarMensaje.isPending || limiteAlcanzado) return;

    const ahora = new Date().toISOString();
    setMensajes((actuales) => [
      ...actuales,
      { rol: "user", contenido, fecha: ahora },
    ]);
    setTexto("");

    enviarMensaje.mutate(contenido, {
      onSuccess: (respuesta) => {
        setMensajes((actuales) => [
          ...actuales,
          {
            rol: "assistant",
            contenido: respuesta.respuesta,
            fecha: new Date().toISOString(),
          },
        ]);
        setMensajesRestantes(respuesta.mensajes_restantes);
      },
      onError: (error) => {
        const mensajeError =
          error instanceof Error ? error.message.toLowerCase() : "";
        const llegoAlLimite =
          mensajeError.includes("límite") || mensajeError.includes("limite");

        if (llegoAlLimite) {
          setLimiteAlcanzado(true);
        }

        setMensajes((actuales) => [
          ...actuales,
          {
            rol: "assistant",
            contenido: llegoAlLimite
              ? "Llegaste al límite diario del plan gratis. Con Premium seguís sin cortes."
              : "No pude responder ahora. Probá de nuevo en unos segundos.",
            fecha: new Date().toISOString(),
          },
        ]);
      },
    });
  };

  const reiniciarConversacion = () => {
    nuevaConversacion.mutate(undefined, {
      onSuccess: () => {
        setMensajes([]);
        setMensajesRestantes(null);
        setLimiteAlcanzado(false);
        setHistorialSincronizado(false);
      },
    });
  };

  const estadoConsulta = esPremium
    ? "Premium activo. Conversaciones sin límite."
    : mensajesRestantes !== null
      ? `Plan gratis. Te quedan ${mensajesRestantes} preguntas hoy.`
      : "Plan gratis. Tenés hasta 3 preguntas por día.";

  return (
    <View style={{ flex: 1, backgroundColor: colores.fondo }}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1 }}
      >
        <View
          style={{
            flex: 1,
            paddingTop: insets.top + 16,
            paddingHorizontal: 16,
          }}
        >
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 16,
            }}
          >
            <View>
              <Text
                style={{
                  color: colores.primario,
                  fontSize: 24,
                  fontFamily: "Inter_700Bold",
                }}
              >
                Chat ASTRA
              </Text>
              <Text
                style={{
                  color: colores.textoSecundario,
                  fontSize: 13,
                  marginTop: 4,
                }}
              >
                Tu lectura en tiempo real, con contexto de perfil y tránsitos.
              </Text>
            </View>

            <Pressable onPress={reiniciarConversacion} disabled={nuevaConversacion.isPending}>
              <Text
                style={{
                  color: colores.acento,
                  fontSize: 13,
                  fontFamily: "Inter_600SemiBold",
                }}
              >
                Nuevo
              </Text>
            </Pressable>
          </View>

          <Tarjeta variante="violeta" style={{ marginBottom: 16 }}>
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <View
                style={{
                  width: 42,
                  height: 42,
                  borderRadius: 21,
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: `${colores.acento}16`,
                  borderWidth: 1,
                  borderColor: `${colores.acento}28`,
                }}
              >
                <IconoAstral nombre="bola-cristal" tamaño={20} />
              </View>
              <View style={{ marginLeft: 12, flex: 1 }}>
                <Text
                  style={{
                    color: colores.primario,
                    fontSize: 16,
                    fontFamily: "Inter_700Bold",
                  }}
                >
                  Hablá directo
                </Text>
                <Text
                  style={{
                    color: colores.textoSecundario,
                    fontSize: 13,
                    lineHeight: 18,
                    marginTop: 4,
                  }}
                >
                  Respuestas breves, personalizadas y sin tener que reexplicar quién sos.
                </Text>
              </View>
            </View>

            <Text
              style={{
                color: limiteAlcanzado ? colores.error : colores.textoSecundario,
                fontSize: 12,
                marginTop: 14,
              }}
            >
              {limiteAlcanzado && !esPremium
                ? "Alcanzaste el límite diario del plan gratis."
                : estadoConsulta}
            </Text>
          </Tarjeta>

          <ScrollView
            ref={scrollRef}
            style={{ flex: 1 }}
            contentContainerStyle={{ paddingBottom: 20 }}
            keyboardShouldPersistTaps="handled"
          >
            {historial.isLoading && !historialSincronizado ? (
              <Tarjeta>
                <Text style={{ color: colores.textoSecundario, fontSize: 14 }}>
                  Cargando conversación...
                </Text>
              </Tarjeta>
            ) : mensajes.length === 0 ? (
              <Tarjeta>
                <Text
                  style={{
                    color: colores.primario,
                    fontSize: 18,
                    fontFamily: "Inter_700Bold",
                  }}
                >
                  Hola {usuario?.nombre?.split(" ")[0] ?? "viajero"}
                </Text>
                <Text
                  style={{
                    color: colores.textoSecundario,
                    fontSize: 14,
                    lineHeight: 20,
                    marginTop: 8,
                  }}
                >
                  Elegí un disparador o escribí tu pregunta. ASTRA ya entra con tu contexto completo.
                </Text>

                <View style={{ marginTop: 16, gap: 8 }}>
                  {SUGERENCIAS.map((sugerencia) => (
                    <Pressable
                      key={sugerencia}
                      onPress={() => enviar(sugerencia)}
                      style={{
                        borderRadius: 14,
                        borderWidth: 1,
                        borderColor: colores.borde,
                        paddingHorizontal: 12,
                        paddingVertical: 12,
                        backgroundColor: colores.superficie,
                      }}
                    >
                      <Text
                        style={{
                          color: colores.primario,
                          fontSize: 14,
                          fontFamily: "Inter_500Medium",
                        }}
                      >
                        {sugerencia}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </Tarjeta>
            ) : (
              mensajes.map((mensaje, index) => (
                <BurbujaMensaje
                  key={`${mensaje.fecha}-${index}`}
                  mensaje={mensaje}
                />
              ))
            )}

            {enviarMensaje.isPending ? (
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
                    ASTRA está respondiendo...
                  </Text>
                </View>
              </View>
            ) : null}
          </ScrollView>

          <View
            style={{
              borderTopWidth: 1,
              borderTopColor: colores.borde,
              paddingTop: 12,
              paddingBottom: 16,
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
                    maxHeight: 110,
                  }}
                />
              </View>

              <Pressable
                onPress={() => enviar()}
                disabled={!texto.trim() || enviarMensaje.isPending || limiteAlcanzado}
                style={{
                  minWidth: 76,
                  alignItems: "center",
                  justifyContent: "center",
                  borderRadius: 14,
                  paddingHorizontal: 16,
                  paddingVertical: 14,
                  backgroundColor:
                    !texto.trim() || enviarMensaje.isPending || limiteAlcanzado
                      ? colores.borde
                      : colores.acento,
                }}
              >
                <Text
                  style={{
                    color:
                      !texto.trim() || enviarMensaje.isPending || limiteAlcanzado
                        ? colores.textoMuted
                        : "#FFFFFF",
                    fontSize: 14,
                    fontFamily: "Inter_600SemiBold",
                  }}
                >
                  Enviar
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}
