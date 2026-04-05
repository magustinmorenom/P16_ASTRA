import { useEffect, useState } from "react";
import {
  Dimensions,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Animated, {
  Easing,
  FadeIn,
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";
import { Link } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Envelope, Lock, Eye, EyeSlash } from "phosphor-react-native";
import { IconoGoogle } from "@/componentes/ui/icono-google";
import * as WebBrowser from "expo-web-browser";
import * as SecureStore from "expo-secure-store";
import { Input } from "@/componentes/ui/input";
import { Boton } from "@/componentes/ui/boton";
import { usarLogin, usarGoogleAuthUrl } from "@/lib/hooks";
import { useStoreAuth } from "@/lib/stores/store-auth";
import { usarTema } from "@/lib/hooks/usar-tema";
import { trackEvento, Eventos } from "@/lib/utilidades/analytics";

const logo = require("../../../assets/logo-astra.png");

const { width: ANCHO_PANTALLA, height: ALTO_PANTALLA } = Dimensions.get("window");

/* ── Orbe cósmico flotante ──────────────────────────────── */
function OrbeCosmica({
  tamaño,
  color,
  x,
  y,
  delay,
  duracion,
}: {
  tamaño: number;
  color: string;
  x: number;
  y: number;
  delay: number;
  duracion: number;
}) {
  const translateY = useSharedValue(0);
  const translateX = useSharedValue(0);
  const escala = useSharedValue(0.85);
  const opacidad = useSharedValue(0);

  useEffect(() => {
    // Fade in suave
    opacidad.value = withDelay(
      delay,
      withTiming(1, { duration: 1200, easing: Easing.out(Easing.quad) })
    );
    // Flotación vertical
    translateY.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(-18, { duration: duracion, easing: Easing.inOut(Easing.quad) }),
          withTiming(18, { duration: duracion, easing: Easing.inOut(Easing.quad) })
        ),
        -1,
        true
      )
    );
    // Flotación horizontal sutil
    translateX.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(10, { duration: duracion * 1.3, easing: Easing.inOut(Easing.quad) }),
          withTiming(-10, { duration: duracion * 1.3, easing: Easing.inOut(Easing.quad) })
        ),
        -1,
        true
      )
    );
    // Pulso de escala
    escala.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(1.1, { duration: duracion * 1.5, easing: Easing.inOut(Easing.quad) }),
          withTiming(0.85, { duration: duracion * 1.5, easing: Easing.inOut(Easing.quad) })
        ),
        -1,
        true
      )
    );
  }, []);

  const estiloAnimado = useAnimatedStyle(() => ({
    opacity: opacidad.value,
    transform: [
      { translateY: translateY.value },
      { translateX: translateX.value },
      { scale: escala.value },
    ],
  }));

  return (
    <Animated.View
      style={[
        {
          position: "absolute",
          left: x,
          top: y,
          width: tamaño,
          height: tamaño,
          borderRadius: tamaño / 2,
        },
        estiloAnimado,
      ]}
    >
      <LinearGradient
        colors={[color, "transparent"]}
        style={{
          width: tamaño,
          height: tamaño,
          borderRadius: tamaño / 2,
        }}
        start={{ x: 0.5, y: 0.5 }}
        end={{ x: 1, y: 1 }}
      />
    </Animated.View>
  );
}

export default function LoginScreen() {
  const { colores, esOscuro } = usarTema();
  const insets = useSafeAreaInsets();
  const [email, setEmail] = useState("");
  const [contrasena, setContrasena] = useState("");
  const [mostrarContrasena, setMostrarContrasena] = useState(false);
  const [error, setError] = useState("");

  const login = usarLogin();
  const googleAuth = usarGoogleAuthUrl();

  const manejarLogin = () => {
    setError("");
    login.mutate(
      { email: email.trim(), contrasena },
      {
        onSuccess: () => trackEvento(Eventos.LOGIN, { metodo: "email" }),
        onError: (err: unknown) => {
          setError(err instanceof Error ? err.message : "Error al iniciar sesión");
        },
      }
    );
  };

  const manejarGoogle = async () => {
    try {
      const datos = await googleAuth.mutateAsync();
      const resultado = await WebBrowser.openAuthSessionAsync(
        datos.url,
        "astra://callback"
      );
      if (resultado.type === "success" && resultado.url) {
        const url = new URL(resultado.url);
        const tokenAcceso = url.searchParams.get("token_acceso");
        const tokenRefresco = url.searchParams.get("token_refresco");
        if (tokenAcceso && tokenRefresco) {
          await SecureStore.setItemAsync("access_token", tokenAcceso);
          await SecureStore.setItemAsync("refresh_token", tokenRefresco);
          trackEvento(Eventos.LOGIN, { metodo: "google" });
          await useStoreAuth.getState().cargarUsuario();
        }
      }
    } catch {
      setError("Error con Google. Intentá de nuevo.");
    }
  };

  /* Colores de las orbes según tema */
  const orbes = esOscuro
    ? [
        { tamaño: 220, color: "rgba(124, 77, 255, 0.18)", x: -60, y: ALTO_PANTALLA * 0.08, delay: 0, duracion: 4000 },
        { tamaño: 160, color: "rgba(192, 132, 252, 0.14)", x: ANCHO_PANTALLA - 80, y: ALTO_PANTALLA * 0.22, delay: 600, duracion: 5000 },
        { tamaño: 120, color: "rgba(167, 139, 250, 0.12)", x: ANCHO_PANTALLA * 0.3, y: ALTO_PANTALLA * 0.65, delay: 1200, duracion: 4500 },
        { tamaño: 90, color: "rgba(212, 162, 52, 0.08)", x: ANCHO_PANTALLA * 0.6, y: ALTO_PANTALLA * 0.78, delay: 800, duracion: 5500 },
      ]
    : [
        { tamaño: 220, color: "rgba(124, 77, 255, 0.10)", x: -60, y: ALTO_PANTALLA * 0.08, delay: 0, duracion: 4000 },
        { tamaño: 160, color: "rgba(124, 77, 255, 0.08)", x: ANCHO_PANTALLA - 80, y: ALTO_PANTALLA * 0.22, delay: 600, duracion: 5000 },
        { tamaño: 120, color: "rgba(124, 77, 255, 0.06)", x: ANCHO_PANTALLA * 0.3, y: ALTO_PANTALLA * 0.65, delay: 1200, duracion: 4500 },
        { tamaño: 90, color: "rgba(212, 162, 52, 0.05)", x: ANCHO_PANTALLA * 0.6, y: ALTO_PANTALLA * 0.78, delay: 800, duracion: 5500 },
      ];

  return (
    <View style={{ flex: 1, backgroundColor: colores.fondo }}>
      {/* Gradiente de fondo */}
      <LinearGradient
        colors={colores.gradienteHero as unknown as [string, string, ...string[]]}
        style={StyleSheet.absoluteFill}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
      />

      {/* Orbes cósmicas flotantes */}
      {orbes.map((orbe, i) => (
        <OrbeCosmica key={i} {...orbe} />
      ))}

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={{
            flexGrow: 1,
            justifyContent: "center",
            paddingHorizontal: 28,
            paddingTop: insets.top + 20,
            paddingBottom: insets.bottom + 20,
          }}
          keyboardShouldPersistTaps="handled"
        >
          {/* Logo — centrado horizontal y vertical, emergiendo de la nada */}
          <Animated.View
            entering={FadeIn.duration(1400).easing(Easing.out(Easing.quad))}
            style={{ alignItems: "center", justifyContent: "center", marginBottom: 52 }}
          >
            {/* Halo detrás del logo */}
            <Animated.View
              entering={FadeIn.delay(200).duration(1800).easing(Easing.out(Easing.quad))}
              style={{
                position: "absolute",
                width: 180,
                height: 180,
                borderRadius: 90,
                backgroundColor: esOscuro
                  ? "rgba(124, 77, 255, 0.08)"
                  : "rgba(124, 77, 255, 0.06)",
              }}
            />
            <Image
              source={logo}
              style={{
                width: 160,
                height: 48,
                tintColor: colores.primario,
              }}
              resizeMode="contain"
              accessibilityRole="image"
              accessibilityLabel="Logo ASTRA"
            />
            <Animated.Text
              entering={FadeIn.delay(700).duration(900).easing(Easing.out(Easing.quad))}
              style={{
                color: colores.textoMuted,
                fontSize: 14,
                fontFamily: "Inter_400Regular",
                marginTop: 14,
                letterSpacing: 0.3,
              }}
            >
              Tu mapa cósmico personal
            </Animated.Text>
          </Animated.View>

          {/* Tarjeta glass para formulario */}
          <Animated.View
            entering={FadeInDown.delay(900).duration(700).easing(Easing.out(Easing.cubic)).withInitialValues({ transform: [{ translateY: 16 }], opacity: 0 })}
            style={{
              backgroundColor: colores.vidrioFondo,
              borderRadius: 20,
              borderWidth: 1,
              borderColor: colores.vidrioBorde,
              paddingHorizontal: 20,
              paddingTop: 24,
              paddingBottom: 20,
            }}
          >
            <Input
              etiqueta="Email"
              placeholder="tu@email.com"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              icono={<Envelope size={18} color={colores.textoMuted} />}
            />

            <View>
              <Input
                etiqueta="Contraseña"
                placeholder="Tu contraseña"
                value={contrasena}
                onChangeText={setContrasena}
                secureTextEntry={!mostrarContrasena}
                icono={<Lock size={18} color={colores.textoMuted} />}
              />
              <Pressable
                onPress={() => setMostrarContrasena(!mostrarContrasena)}
                accessibilityRole="button"
                accessibilityLabel={mostrarContrasena ? "Ocultar contraseña" : "Mostrar contraseña"}
                hitSlop={8}
                style={{ position: "absolute", right: 16, top: 38 }}
              >
                {mostrarContrasena ? (
                  <EyeSlash size={20} color={colores.textoMuted} />
                ) : (
                  <Eye size={20} color={colores.textoMuted} />
                )}
              </Pressable>
            </View>

            {error ? (
              <Animated.View
                entering={FadeInDown.duration(300)}
                accessibilityRole="alert"
                accessibilityLiveRegion="assertive"
                style={{
                  borderRadius: 12,
                  backgroundColor: `${colores.error}14`,
                  paddingHorizontal: 14,
                  paddingVertical: 10,
                  marginBottom: 16,
                }}
              >
                <Text
                  style={{
                    color: colores.error,
                    fontSize: 13,
                    lineHeight: 19,
                    textAlign: "center",
                  }}
                >
                  {error}
                </Text>
              </Animated.View>
            ) : null}

            <Boton
              onPress={manejarLogin}
              cargando={login.isPending}
              disabled={!email.trim() || !contrasena}
            >
              Iniciar sesión
            </Boton>

            {/* Separador */}
            <Animated.View
              entering={FadeIn.delay(1300).duration(600).easing(Easing.out(Easing.quad))}
              style={{ flexDirection: "row", alignItems: "center", marginVertical: 20 }}
            >
              <View style={{ flex: 1, height: StyleSheet.hairlineWidth, backgroundColor: colores.borde }} />
              <Text
                style={{
                  color: colores.textoMuted,
                  fontSize: 12,
                  fontFamily: "Inter_500Medium",
                  marginHorizontal: 16,
                }}
              >
                o
              </Text>
              <View style={{ flex: 1, height: StyleSheet.hairlineWidth, backgroundColor: colores.borde }} />
            </Animated.View>

            {/* Google */}
            <Animated.View
              entering={FadeInDown.delay(1500).duration(600).easing(Easing.out(Easing.cubic)).withInitialValues({ transform: [{ translateY: 12 }], opacity: 0 })}
            >
              <Boton
                variante="secundario"
                onPress={manejarGoogle}
                cargando={googleAuth.isPending}
                icono={<IconoGoogle tamaño={18} />}
              >
                Continuar con Google
              </Boton>
            </Animated.View>
          </Animated.View>

          {/* Links */}
          <Animated.View
            entering={FadeIn.delay(1800).duration(800).easing(Easing.out(Easing.quad))}
            style={{ alignItems: "center", marginTop: 28 }}
          >
            <Link href="/(auth)/olvide-contrasena" asChild>
              <Pressable
                accessibilityRole="link"
                hitSlop={8}
                style={{ marginBottom: 18 }}
              >
                <Text
                  style={{
                    color: colores.textoSecundario,
                    fontSize: 13,
                    fontFamily: "Inter_500Medium",
                  }}
                >
                  Olvidé mi contraseña
                </Text>
              </Pressable>
            </Link>

            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <Text style={{ color: colores.textoMuted, fontSize: 14 }}>
                ¿No tenés cuenta?{" "}
              </Text>
              <Link href="/(auth)/registro" asChild>
                <Pressable accessibilityRole="link" hitSlop={8}>
                  <Text
                    style={{
                      color: colores.acento,
                      fontSize: 14,
                      fontFamily: "Inter_600SemiBold",
                    }}
                  >
                    Registrate
                  </Text>
                </Pressable>
              </Link>
            </View>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
