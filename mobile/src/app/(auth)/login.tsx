import { useState } from "react";
import { View, Text, Pressable } from "react-native";
import { Link } from "expo-router";
import { GoogleLogo, Envelope, Lock, Eye, EyeSlash } from "phosphor-react-native";
import * as WebBrowser from "expo-web-browser";
import * as SecureStore from "expo-secure-store";
import { ShellAcceso } from "@/componentes/layouts/shell-acceso";
import { Input } from "@/componentes/ui/input";
import { Boton } from "@/componentes/ui/boton";
import { usarLogin, usarGoogleAuthUrl } from "@/lib/hooks";
import { useStoreAuth } from "@/lib/stores/store-auth";
import { usarTema } from "@/lib/hooks/usar-tema";
import { trackEvento, Eventos } from "@/lib/utilidades/analytics";

export default function LoginScreen() {
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
          await useStoreAuth.getState().cargarUsuario();
        }
      }
    } catch {
      setError("Error con Google. Intentá de nuevo.");
    }
  };

  return (
    <ShellAcceso
      insignia="Acceso personal"
      titulo="Entrá a tu espacio cósmico"
      descripcion="Recuperá tu carta, tu pronóstico diario y el historial de tus consultas desde una sola sesión."
      pistas={[
        {
          icono: "astrologia",
          texto: "Tu mapa personal queda disponible apenas volvés a entrar.",
        },
        {
          icono: "bola-cristal",
          texto: "El oráculo y los podcasts retoman tu contexto sin empezar de cero.",
        },
      ]}
      pie={
        <View style={{ alignItems: "center" }}>
          <Link href="/(auth)/olvide-contrasena" asChild>
            <Pressable style={{ marginTop: 4 }}>
              <Text
                style={{
                  color: colores.acento,
                  fontSize: 13,
                  fontFamily: "Inter_500Medium",
                }}
              >
                Olvidé mi contraseña
              </Text>
            </Pressable>
          </Link>

          <View
            style={{
              flexDirection: "row",
              justifyContent: "center",
              marginTop: 18,
              flexWrap: "wrap",
            }}
          >
            <Text style={{ color: colores.textoSecundario, fontSize: 14 }}>
              ¿No tenés cuenta?{" "}
            </Text>
            <Link href="/(auth)/registro" asChild>
              <Pressable>
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
        </View>
      }
    >
      <Boton
        variante="secundario"
        onPress={manejarGoogle}
        cargando={googleAuth.isPending}
        icono={<GoogleLogo size={20} color={colores.primario} weight="bold" />}
        style={{ marginBottom: 20 }}
      >
        Continuar con Google
      </Boton>

      <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 20 }}>
        <View style={{ flex: 1, height: 1, backgroundColor: colores.borde }} />
        <Text style={{ color: colores.textoMuted, fontSize: 12, marginHorizontal: 16 }}>
          o con email
        </Text>
        <View style={{ flex: 1, height: 1, backgroundColor: colores.borde }} />
      </View>

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
        <View
          accessibilityRole="alert"
          accessibilityLiveRegion="assertive"
          style={{
            borderRadius: 14,
            borderWidth: 1,
            borderColor: `${colores.error}4D`,
            backgroundColor: `${colores.error}14`,
            paddingHorizontal: 14,
            paddingVertical: 12,
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
        </View>
      ) : null}

      <Boton
        onPress={manejarLogin}
        cargando={login.isPending}
        disabled={!email.trim() || !contrasena}
      >
        Iniciar sesión
      </Boton>
    </ShellAcceso>
  );
}
