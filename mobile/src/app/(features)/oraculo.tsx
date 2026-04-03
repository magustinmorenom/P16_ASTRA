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
import { HeaderMobile } from "@/componentes/layouts/header-mobile";
import { Tarjeta } from "@/componentes/ui/tarjeta";
import { Badge } from "@/componentes/ui/badge";
import { IconoAstral } from "@/componentes/ui/icono-astral";
import { usarTema } from "@/lib/hooks/usar-tema";
import { useStoreAuth } from "@/lib/stores/store-auth";
import { usarEnviarMensaje, usarHistorialChat, usarNuevaConversacion } from "@/lib/hooks";
import type { MensajeChat } from "@/lib/tipos";

const SUGERENCIAS = [
  "¿Cómo viene mi energía hoy?",
  "Contame sobre mi perfil cósmico",
  "Necesito un consejo para esta semana",
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

export default function OraculoScreen() {
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
              ? "Llegaste a tu límite diario. Con Premium seguís conversando sin cortes."
              : "No pude responder en este momento. Probá de nuevo en unos segundos.",
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

  return (
    <View style={{ flex: 1, backgroundColor: colores.fondo }}>
      <HeaderMobile
        titulo="Oráculo ASTRA"
        accionDerecha={
          <Pressable onPress={reiniciarConversacion} disabled={nuevaConversacion.isPending}>
            <Text
              style={{
                color: colores.acento,
                fontSize: 12,
                fontFamily: "Inter_600SemiBold",
              }}
            >
              Nuevo
            </Text>
          </Pressable>
        }
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1 }}
      >
        <View style={{ flex: 1, paddingHorizontal: 16, paddingTop: 16 }}>
          <Tarjeta variante="violeta" style={{ marginBottom: 16 }}>
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <IconoAstral nombre="bola-cristal" tamaño={24} />
              <View style={{ marginLeft: 12, flex: 1 }}>
                <Text
                  style={{
                    color: colores.primario,
                    fontSize: 16,
                    fontFamily: "Inter_700Bold",
                  }}
                >
                  Tu guía conversacional
                </Text>
                <Text
                  style={{
                    color: colores.textoSecundario,
                    fontSize: 13,
                    marginTop: 4,
                  }}
                >
                  {esPremium
                    ? "Tu plan Premium tiene conversaciones ilimitadas."
                    : "Podés hacer hasta 3 preguntas por día. Premium elimina ese límite."}
                </Text>
              </View>
            </View>
            <View style={{ flexDirection: "row", gap: 8, flexWrap: "wrap", marginTop: 14 }}>
              <Badge variante={esPremium ? "exito" : "info"}>
                {esPremium ? "Premium activo" : "Plan gratis"}
              </Badge>
              {!esPremium && mensajesRestantes !== null ? (
                <Badge variante={mensajesRestantes > 0 ? "advertencia" : "error"}>
                  {mensajesRestantes} restantes hoy
                </Badge>
              ) : null}
            </View>
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
                  Cargando historial del oráculo...
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
                  Conozco tu perfil cósmico y tus tránsitos actuales. Podés abrir la conversación con alguna de estas preguntas.
                </Text>

                <View style={{ marginTop: 16, gap: 8 }}>
                  {SUGERENCIAS.map((sugerencia) => (
                    <Pressable
                      key={sugerencia}
                      onPress={() => enviar(sugerencia)}
                      style={{
                        borderRadius: 12,
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
                    El oráculo está respondiendo...
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
            {limiteAlcanzado && !esPremium ? (
              <Text
                style={{
                  color: colores.error,
                  fontSize: 12,
                  marginBottom: 8,
                  textAlign: "center",
                }}
              >
                Alcanzaste el límite diario del plan gratis.
              </Text>
            ) : null}

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
                  placeholder="Preguntale al oráculo..."
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
