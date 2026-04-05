import { useMemo, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { Link } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  CheckCircle,
  Envelope,
  Eye,
  EyeSlash,
  Lock,
  ShieldCheck,
} from "phosphor-react-native";
import { Input } from "@/componentes/ui/input";
import { Boton } from "@/componentes/ui/boton";
import { validarContrasenaCompleta, esContrasenaCompletaValida } from "@/lib/utilidades/validacion-contrasena";
import { RequisitosContrasena } from "@/componentes/feedback/requisito-contrasena";
import {
  usarConfirmarReset,
  usarSolicitarReset,
  usarVerificarOtp,
} from "@/lib/hooks";
import { usarTema } from "@/lib/hooks/usar-tema";

type PasoRecuperacion =
  | "email"
  | "codigo"
  | "nueva-contrasena"
  | "completado";

export default function OlvideContrasenaScreen() {
  const insets = useSafeAreaInsets();
  const { colores } = usarTema();

  const solicitarReset = usarSolicitarReset();
  const verificarOtp = usarVerificarOtp();
  const confirmarReset = usarConfirmarReset();

  const [paso, setPaso] = useState<PasoRecuperacion>("email");
  const [email, setEmail] = useState("");
  const [codigo, setCodigo] = useState("");
  const [tokenReset, setTokenReset] = useState("");
  const [contrasena, setContrasena] = useState("");
  const [confirmacion, setConfirmacion] = useState("");
  const [mostrarContrasena, setMostrarContrasena] = useState(false);
  const [error, setError] = useState("");

  const validacionContrasena = useMemo(
    () => validarContrasenaCompleta(contrasena, confirmacion),
    [contrasena, confirmacion]
  );

  const contrasenaValida = esContrasenaCompletaValida(validacionContrasena);

  const enviarEmail = () => {
    setError("");
    solicitarReset.mutate(
      { email: email.trim() },
      {
        onSuccess: () => {
          setPaso("codigo");
        },
        onError: (err) => {
          setError(err instanceof Error ? err.message : "No se pudo enviar el código.");
        },
      },
    );
  };

  const verificarCodigo = () => {
    setError("");
    verificarOtp.mutate(
      { email: email.trim(), codigo: codigo.trim() },
      {
        onSuccess: (respuesta) => {
          setTokenReset(respuesta.token);
          setPaso("nueva-contrasena");
        },
        onError: (err) => {
          setError(err instanceof Error ? err.message : "No se pudo verificar el código.");
        },
      },
    );
  };

  const confirmarNuevaContrasena = () => {
    if (!contrasenaValida) {
      setError("Revisá los requisitos de la nueva contraseña.");
      return;
    }

    setError("");
    confirmarReset.mutate(
      { token: tokenReset, contrasena_nueva: contrasena },
      {
        onSuccess: () => {
          setPaso("completado");
        },
        onError: (err) => {
          setError(err instanceof Error ? err.message : "No se pudo restablecer la contraseña.");
        },
      },
    );
  };

  const cargando =
    solicitarReset.isPending ||
    verificarOtp.isPending ||
    confirmarReset.isPending;

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={{ flex: 1, backgroundColor: colores.fondo }}
    >
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{
          flexGrow: 1,
          paddingTop: insets.top + 32,
          paddingBottom: insets.bottom + 24,
          paddingHorizontal: 24,
        }}
      >
        <View style={{ alignItems: "center", marginBottom: 32 }}>
          <Text
            style={{
              fontSize: 32,
              fontFamily: "Inter_700Bold",
              color: colores.primario,
              letterSpacing: 3,
            }}
          >
            ASTRA
          </Text>
          <Text
            style={{
              color: colores.textoSecundario,
              fontSize: 14,
              marginTop: 8,
              textAlign: "center",
            }}
          >
            {paso === "email" && "Recuperá el acceso a tu cuenta"}
            {paso === "codigo" && `Ingresá el código que enviamos a ${email}`}
            {paso === "nueva-contrasena" && "Definí una nueva contraseña segura"}
            {paso === "completado" && "Tu contraseña ya quedó actualizada"}
          </Text>
        </View>

        {paso === "email" && (
          <View>
            <Input
              etiqueta="Correo electrónico"
              placeholder="tu@email.com"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              icono={<Envelope size={18} color={colores.textoMuted} />}
            />
            <Boton
              onPress={enviarEmail}
              cargando={solicitarReset.isPending}
              disabled={!email.trim()}
            >
              Enviar código
            </Boton>
          </View>
        )}

        {paso === "codigo" && (
          <View>
            <Input
              etiqueta="Código de verificación"
              placeholder="123456"
              value={codigo}
              onChangeText={(valor) => setCodigo(valor.replace(/\D/g, "").slice(0, 6))}
              keyboardType="number-pad"
              icono={<ShieldCheck size={18} color={colores.textoMuted} />}
            />
            <Boton
              onPress={verificarCodigo}
              cargando={verificarOtp.isPending}
              disabled={codigo.trim().length !== 6}
            >
              Verificar código
            </Boton>

            <Pressable
              onPress={enviarEmail}
              disabled={solicitarReset.isPending}
              style={{ alignSelf: "center", marginTop: 14 }}
            >
              <Text style={{ color: colores.acento, fontSize: 13 }}>
                Reenviar código
              </Text>
            </Pressable>
          </View>
        )}

        {paso === "nueva-contrasena" && (
          <View>
            <View>
              <Input
                etiqueta="Nueva contraseña"
                placeholder="Mínimo 8 caracteres"
                value={contrasena}
                onChangeText={setContrasena}
                secureTextEntry={!mostrarContrasena}
                icono={<Lock size={18} color={colores.textoMuted} />}
              />
              <Pressable
                onPress={() => setMostrarContrasena((valor) => !valor)}
                style={{ position: "absolute", right: 16, top: 32 }}
              >
                {mostrarContrasena ? (
                  <EyeSlash size={20} color={colores.textoMuted} />
                ) : (
                  <Eye size={20} color={colores.textoMuted} />
                )}
              </Pressable>
            </View>

            <Input
              etiqueta="Confirmar contraseña"
              placeholder="Repetí la contraseña"
              value={confirmacion}
              onChangeText={setConfirmacion}
              secureTextEntry={!mostrarContrasena}
              icono={<Lock size={18} color={colores.textoMuted} />}
            />

            {contrasena.length > 0 && (
              <RequisitosContrasena
                validacion={validacionContrasena}
                mostrarCoincide={confirmacion.length > 0}
              />
            )}

            <Boton
              onPress={confirmarNuevaContrasena}
              cargando={confirmarReset.isPending}
              disabled={!contrasenaValida}
            >
              Guardar nueva contraseña
            </Boton>
          </View>
        )}

        {paso === "completado" && (
          <View
            style={{
              alignItems: "center",
              backgroundColor: colores.superficie,
              borderRadius: 16,
              borderWidth: 1,
              borderColor: colores.borde,
              padding: 24,
            }}
          >
            <CheckCircle size={48} color={colores.exito} weight="fill" />
            <Text
              style={{
                color: colores.primario,
                fontSize: 20,
                fontFamily: "Inter_700Bold",
                marginTop: 16,
              }}
            >
              Contraseña actualizada
            </Text>
            <Text
              style={{
                color: colores.textoSecundario,
                fontSize: 14,
                marginTop: 8,
                textAlign: "center",
              }}
            >
              Ya podés volver a iniciar sesión con tu nueva contraseña.
            </Text>
          </View>
        )}

        {error ? (
          <Text
            style={{
              color: colores.error,
              fontSize: 14,
              marginTop: 16,
              textAlign: "center",
            }}
          >
            {error}
          </Text>
        ) : null}

        {!cargando && (
          <View style={{ flexDirection: "row", justifyContent: "center", marginTop: 24 }}>
            <Text style={{ color: colores.textoSecundario, fontSize: 14 }}>
              ¿Recordaste tu contraseña?{" "}
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
                  Volver al login
                </Text>
              </Pressable>
            </Link>
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
