import { useMemo, useState } from "react";
import { View, Text, Pressable } from "react-native";
import { Link } from "expo-router";
import { GoogleLogo, Envelope, Lock, User, Eye, EyeSlash } from "phosphor-react-native";
import { validarContrasena, esContrasenaValida } from "@/lib/utilidades/validacion-contrasena";
import { RequisitosContrasena } from "@/componentes/feedback/requisito-contrasena";
import * as WebBrowser from "expo-web-browser";
import * as SecureStore from "expo-secure-store";
import { ShellAcceso } from "@/componentes/layouts/shell-acceso";
import { Input } from "@/componentes/ui/input";
import { Boton } from "@/componentes/ui/boton";
import { usarRegistro, usarGoogleAuthUrl } from "@/lib/hooks";
import { useStoreAuth } from "@/lib/stores/store-auth";
import { usarTema } from "@/lib/hooks/usar-tema";

export default function RegistroScreen() {
  const { colores } = usarTema();
  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [contrasena, setContrasena] = useState("");
  const [mostrarContrasena, setMostrarContrasena] = useState(false);
  const [error, setError] = useState("");

  const validacion = useMemo(() => validarContrasena(contrasena), [contrasena]);

  const registro = usarRegistro();
  const googleAuth = usarGoogleAuthUrl();

  const manejarRegistro = () => {
    setError("");
    if (!esContrasenaValida(validacion)) {
      setError("La contrasena debe tener al menos 8 caracteres, una mayuscula, un numero y un simbolo");
      return;
    }
    registro.mutate(
      { nombre: nombre.trim(), email: email.trim(), contrasena },
      {
        onError: (err: unknown) => {
          setError(err instanceof Error ? err.message : "Error al registrar");
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
      insignia="Nueva cuenta"
      titulo="Creá tu cuenta y empezá a leer tu mapa"
      descripcion="ASTRA combina astrología, Diseño Humano y numerología en una sola experiencia personal."
      pistas={[
        {
          icono: "personal",
          texto: "Tu primer paso es completar tus datos natales para activar todos los cálculos.",
        },
        {
          icono: "numerologia",
          texto: "Después vas a tener dashboard diario, podcasts y módulos de exploración.",
        },
      ]}
      pie={
        <View
          style={{
            flexDirection: "row",
            justifyContent: "center",
            flexWrap: "wrap",
          }}
        >
          <Text style={{ color: colores.textoSecundario, fontSize: 14 }}>
            ¿Ya tenés cuenta?{" "}
          </Text>
          <Link href="/(auth)/login" asChild>
            <Pressable>
              <Text
                style={{
                  color: colores.acento,
                  fontSize: 14,
                  fontFamily: "Inter_600SemiBold",
                }}
              >
                Iniciá sesión
              </Text>
            </Pressable>
          </Link>
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
        etiqueta="Nombre"
        placeholder="Tu nombre"
        value={nombre}
        onChangeText={setNombre}
        autoCapitalize="words"
        icono={<User size={18} color={colores.textoMuted} />}
      />

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
          placeholder="Mínimo 8 caracteres"
          value={contrasena}
          onChangeText={setContrasena}
          secureTextEntry={!mostrarContrasena}
          icono={<Lock size={18} color={colores.textoMuted} />}
        />
        <Pressable
          onPress={() => setMostrarContrasena(!mostrarContrasena)}
          style={{ position: "absolute", right: 16, top: 38 }}
        >
          {mostrarContrasena ? (
            <EyeSlash size={20} color={colores.textoMuted} />
          ) : (
            <Eye size={20} color={colores.textoMuted} />
          )}
        </Pressable>
      </View>

      {contrasena.length > 0 && <RequisitosContrasena validacion={validacion} />}

      {error ? (
        <View
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
        onPress={manejarRegistro}
        cargando={registro.isPending}
        disabled={!nombre.trim() || !email.trim() || !contrasena}
      >
        Crear cuenta
      </Boton>

      <Text
        style={{
          color: colores.textoMuted,
          fontSize: 12,
          lineHeight: 18,
          textAlign: "center",
          marginTop: 14,
        }}
      >
        Al registrarte aceptas nuestros{" "}
        <Text style={{ color: colores.acento, textDecorationLine: "underline" }}>
          Terminos de Servicio
        </Text>
        {" "}y{" "}
        <Text style={{ color: colores.acento, textDecorationLine: "underline" }}>
          Politica de Privacidad
        </Text>
      </Text>
    </ShellAcceso>
  );
}
