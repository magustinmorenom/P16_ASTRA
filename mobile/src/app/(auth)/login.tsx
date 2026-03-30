import { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Pressable,
} from "react-native";
import { Link } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { GoogleLogo, Envelope, Lock, Eye, EyeSlash } from "phosphor-react-native";
import * as WebBrowser from "expo-web-browser";
import * as SecureStore from "expo-secure-store";
import { Input } from "@/componentes/ui/input";
import { Boton } from "@/componentes/ui/boton";
import { usarLogin, usarGoogleAuthUrl } from "@/lib/hooks";
import { useStoreAuth } from "@/lib/stores/store-auth";
import { usarTema } from "@/lib/hooks/usar-tema";

export default function LoginScreen() {
  const insets = useSafeAreaInsets();
  const { colores } = usarTema();
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
        onError: (err: unknown) => {
          const msg =
            err && typeof err === "object" && "response" in err
              ? ((err as { response?: { data?: { error?: string } } }).response?.data
                  ?.error ?? "Error al iniciar sesión")
              : "Error al iniciar sesión";
          setError(msg);
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
          await useStoreAuth.getState().cargarUsuario();
        }
      }
    } catch {
      setError("Error con Google. Intentá de nuevo.");
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={{ flex: 1, backgroundColor: colores.fondo }}
    >
      <ScrollView
        contentContainerStyle={{
          flexGrow: 1,
          paddingTop: insets.top + 40,
          paddingBottom: insets.bottom + 20,
          paddingHorizontal: 24,
        }}
        keyboardShouldPersistTaps="handled"
      >
        {/* Logo */}
        <View style={{ alignItems: "center", marginBottom: 40 }}>
          <Text style={{ fontSize: 36, fontFamily: "Inter_700Bold", color: colores.primario, letterSpacing: 4 }}>
            ASTRA
          </Text>
          <Text style={{ color: colores.textoSecundario, fontSize: 14, marginTop: 8, fontFamily: "Inter_400Regular" }}>
            Tu mapa cósmico personal
          </Text>
        </View>

        {/* Google OAuth */}
        <Boton
          variante="secundario"
          onPress={manejarGoogle}
          cargando={googleAuth.isPending}
          icono={<GoogleLogo size={20} color={colores.primario} weight="bold" />}
          style={{ marginBottom: 16 }}
        >
          Continuar con Google
        </Boton>

        {/* Separador */}
        <View style={{ flexDirection: "row", alignItems: "center", marginVertical: 24 }}>
          <View style={{ flex: 1, height: 1, backgroundColor: colores.borde }} />
          <Text style={{ color: colores.textoMuted, fontSize: 12, marginHorizontal: 16 }}>o con email</Text>
          <View style={{ flex: 1, height: 1, backgroundColor: colores.borde }} />
        </View>

        {/* Form */}
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
            style={{ position: "absolute", right: 16, top: 32 }}
          >
            {mostrarContrasena ? (
              <EyeSlash size={20} color={colores.textoMuted} />
            ) : (
              <Eye size={20} color={colores.textoMuted} />
            )}
          </Pressable>
        </View>

        {error ? (
          <Text style={{ color: colores.error, fontSize: 14, marginBottom: 16, textAlign: "center" }}>
            {error}
          </Text>
        ) : null}

        <Boton
          onPress={manejarLogin}
          cargando={login.isPending}
          disabled={!email.trim() || !contrasena}
        >
          Iniciar sesión
        </Boton>

        {/* Link registro */}
        <View style={{ flexDirection: "row", justifyContent: "center", marginTop: 24 }}>
          <Text style={{ color: colores.textoSecundario, fontSize: 14 }}>
            ¿No tenés cuenta?{" "}
          </Text>
          <Link href="/(auth)/registro" asChild>
            <Pressable>
              <Text style={{ color: colores.acento, fontSize: 14, fontFamily: "Inter_600SemiBold" }}>
                Registrate
              </Text>
            </Pressable>
          </Link>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
