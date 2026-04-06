import { useState } from "react";
import {
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import Animated, {
  Easing,
  FadeIn,
  FadeInDown,
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

export default function LoginScreen() {
  const { colores } = usarTema();
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

  return (
    <View style={{ flex: 1 }}>
      {/* Fondo ciruela — igual que desktop --shell-hero */}
      <LinearGradient
        colors={["#1a1128", "#0f0a1e", "#0a0816"]}
        style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}
      />

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
          {/* Logo blanco */}
          <Animated.View
            entering={FadeIn.duration(1400).easing(Easing.out(Easing.quad))}
            style={{ alignItems: "center", marginBottom: 48 }}
          >
            <Image
              source={logo}
              style={{ width: 140, height: 42 }}
              resizeMode="contain"
              accessibilityRole="image"
              accessibilityLabel="Logo ASTRA"
            />
            <Animated.Text
              entering={FadeIn.delay(700).duration(900).easing(Easing.out(Easing.quad))}
              style={{
                color: "rgba(255,255,255,0.5)",
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
              backgroundColor: "rgba(255,255,255,0.06)",
              borderRadius: 24,
              borderWidth: 1,
              borderColor: "rgba(255,255,255,0.1)",
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
              icono={<Envelope size={18} color="rgba(255,255,255,0.4)" />}
            />

            <View>
              <Input
                etiqueta="Contraseña"
                placeholder="Tu contraseña"
                value={contrasena}
                onChangeText={setContrasena}
                secureTextEntry={!mostrarContrasena}
                icono={<Lock size={18} color="rgba(255,255,255,0.4)" />}
              />
              <Pressable
                onPress={() => setMostrarContrasena(!mostrarContrasena)}
                accessibilityRole="button"
                accessibilityLabel={mostrarContrasena ? "Ocultar contraseña" : "Mostrar contraseña"}
                hitSlop={8}
                style={{ position: "absolute", right: 16, top: 38 }}
              >
                {mostrarContrasena ? (
                  <EyeSlash size={20} color="rgba(255,255,255,0.4)" />
                ) : (
                  <Eye size={20} color="rgba(255,255,255,0.4)" />
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
                  backgroundColor: "rgba(248,113,113,0.12)",
                  paddingHorizontal: 14,
                  paddingVertical: 10,
                  marginBottom: 16,
                }}
              >
                <Text
                  style={{
                    color: "#f87171",
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
            <View style={{ flexDirection: "row", alignItems: "center", marginVertical: 20 }}>
              <View style={{ flex: 1, height: 1, backgroundColor: "rgba(255,255,255,0.08)" }} />
              <Text
                style={{
                  color: "rgba(255,255,255,0.35)",
                  fontSize: 11,
                  fontFamily: "Inter_600SemiBold",
                  marginHorizontal: 16,
                  textTransform: "uppercase",
                  letterSpacing: 1.5,
                }}
              >
                o
              </Text>
              <View style={{ flex: 1, height: 1, backgroundColor: "rgba(255,255,255,0.08)" }} />
            </View>

            {/* Google */}
            <Boton
              variante="secundario"
              onPress={manejarGoogle}
              cargando={googleAuth.isPending}
              icono={<IconoGoogle tamaño={18} />}
            >
              Continuar con Google
            </Boton>
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
                    color: "rgba(255,255,255,0.45)",
                    fontSize: 13,
                    fontFamily: "Inter_500Medium",
                  }}
                >
                  Olvidé mi contraseña
                </Text>
              </Pressable>
            </Link>

            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <Text style={{ color: "rgba(255,255,255,0.4)", fontSize: 14 }}>
                ¿No tenés cuenta?{" "}
              </Text>
              <Link href="/(auth)/registro" asChild>
                <Pressable accessibilityRole="link" hitSlop={8}>
                  <Text
                    style={{
                      color: "#c084fc",
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
