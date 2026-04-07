import { useState } from "react";
import { Alert, Pressable, ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store";
import {
  CaretRight,
  CircleHalf,
  CreditCard,
  DownloadSimple,
  FileText,
  LockKey,
  Moon,
  SignOut,
  Sun,
  Trash,
} from "phosphor-react-native";
import * as WebBrowser from "expo-web-browser";
import { Avatar } from "@/componentes/ui/avatar";
import { Badge } from "@/componentes/ui/badge";
import { Boton } from "@/componentes/ui/boton";
import { Input } from "@/componentes/ui/input";
import { Tarjeta } from "@/componentes/ui/tarjeta";
import { Separador } from "@/componentes/ui/separador";
import { PresionableAnimado } from "@/componentes/ui/presionable-animado";
import { AnimacionEntrada } from "@/componentes/ui/animacion-entrada";
import { useStoreAuth } from "@/lib/stores/store-auth";
import { usarMiPerfil } from "@/lib/hooks/usar-perfil";
import {
  usarCambiarContrasena,
  usarEliminarCuenta,
  usarLogout,
} from "@/lib/hooks/usar-auth";
import { usarTema } from "@/lib/hooks/usar-tema";
import { descargarYAbrirDocumentoProtegido } from "@/lib/utilidades/descargar-documento";
import {
  formatearFecha,
  formatearHora,
} from "@/lib/utilidades/formatear-fecha";
import type { PreferenciaTema } from "@/lib/stores/store-tema";

export default function PantallaPerfil() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const usuario = useStoreAuth((state) => state.usuario);
  const { data: perfil } = usarMiPerfil();
  const logout = usarLogout();
  const cambiarContrasena = usarCambiarContrasena();
  const eliminarCuenta = usarEliminarCuenta();
  const { colores, preferencia, setPreferencia } = usarTema();

  const [seccionAbierta, setSeccionAbierta] = useState<string | null>(null);
  const [contrasenaActual, setContrasenaActual] = useState("");
  const [contrasenaNueva, setContrasenaNueva] = useState("");
  const [contrasenaEliminar, setContrasenaEliminar] = useState("");
  const [descargandoPerfil, setDescargandoPerfil] = useState(false);

  const manejarCambioContrasena = async () => {
    if (!contrasenaActual || contrasenaNueva.length < 8) return;

    try {
      await cambiarContrasena.mutateAsync({
        contrasena_actual: contrasenaActual,
        contrasena_nueva: contrasenaNueva,
      });
      setContrasenaActual("");
      setContrasenaNueva("");
      setSeccionAbierta(null);
      Alert.alert("Listo", "Contraseña actualizada correctamente.");
    } catch (error) {
      Alert.alert(
        "Error",
        error instanceof Error ? error.message : "No se pudo cambiar la contraseña.",
      );
    }
  };

  const manejarDescargaPerfil = async () => {
    if (!perfil) return;

    try {
      setDescargandoPerfil(true);
      const nombreSeguro =
        perfil.nombre.trim().toLowerCase().replace(/\s+/g, "_") || "usuario";
      await descargarYAbrirDocumentoProtegido(
        "/profile/me/pdf",
        `perfil_cosmico_${nombreSeguro}.pdf`,
      );
    } catch (error) {
      Alert.alert(
        "Error",
        error instanceof Error ? error.message : "No se pudo abrir el PDF del perfil.",
      );
    } finally {
      setDescargandoPerfil(false);
    }
  };

  const manejarEliminarCuenta = async () => {
    try {
      const tokenRefresco =
        (await SecureStore.getItemAsync("refresh_token")) ?? "";
      if (!tokenRefresco) {
        throw new Error("No se encontró la sesión actual.");
      }

      await eliminarCuenta.mutateAsync({
        contrasena:
          usuario?.proveedor_auth === "local" ? contrasenaEliminar : undefined,
        token_refresco: tokenRefresco,
      });

      await useStoreAuth.getState().cerrarSesion();
      setContrasenaEliminar("");
      Alert.alert("Cuenta eliminada", "Tu cuenta fue desactivada correctamente.");
    } catch (error) {
      Alert.alert(
        "Error",
        error instanceof Error ? error.message : "No se pudo eliminar la cuenta.",
      );
    }
  };

  const manejarLogout = () => {
    Alert.alert("Cerrar sesión", "¿Estás seguro?", [
      { text: "Cancelar", style: "cancel" },
      { text: "Sí, cerrar", onPress: () => logout.mutate() },
    ]);
  };

  const esPremium = usuario?.plan_slug === "premium";

  const opcionesTema: {
    valor: PreferenciaTema;
    icono: React.ReactNode;
    etiqueta: string;
  }[] = [
    {
      valor: "claro",
      icono: (
        <Sun
          size={20}
          color={preferencia === "claro" ? colores.acento : colores.textoMuted}
          weight="fill"
        />
      ),
      etiqueta: "Claro",
    },
    {
      valor: "oscuro",
      icono: (
        <Moon
          size={20}
          color={preferencia === "oscuro" ? colores.acento : colores.textoMuted}
          weight="fill"
        />
      ),
      etiqueta: "Oscuro",
    },
    {
      valor: "automatico",
      icono: (
        <CircleHalf
          size={20}
          color={
            preferencia === "automatico" ? colores.acento : colores.textoMuted
          }
          weight="fill"
        />
      ),
      etiqueta: "Auto",
    },
  ];

  // Datos de cuenta simplificados (sin Proveedor, Estado, Miembro desde, Último acceso)

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colores.fondo }}
      contentContainerStyle={{
        paddingTop: insets.top + 16,
        paddingBottom: 120,
        paddingHorizontal: 16,
      }}
    >
      <AnimacionEntrada>
        <Text
          style={{
            color: colores.primario,
            fontSize: 24,
            fontFamily: "Inter_700Bold",
            marginBottom: 24,
          }}
        >
          Mi Perfil
        </Text>
      </AnimacionEntrada>

      <AnimacionEntrada retraso={100}>
        <Tarjeta style={{ marginBottom: 16 }}>
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <Avatar nombre={usuario?.nombre ?? "U"} tamaño="lg" />
            <View style={{ marginLeft: 16, flex: 1 }}>
              <Text
                style={{
                  color: colores.primario,
                  fontFamily: "Inter_700Bold",
                  fontSize: 18,
                }}
              >
                {usuario?.nombre}
              </Text>
              <View style={{ marginTop: 8, flexDirection: "row", gap: 8, flexWrap: "wrap" }}>
                <Badge variante={esPremium ? "info" : "default"}>
                  {usuario?.plan_nombre ?? (esPremium ? "Premium" : "Gratis")}
                </Badge>
              </View>
            </View>
          </View>
        </Tarjeta>
      </AnimacionEntrada>

      {perfil && (
        <AnimacionEntrada retraso={180}>
          <Tarjeta style={{ marginBottom: 16 }}>
            <Text
              style={{
                color: colores.primario,
                fontFamily: "Inter_600SemiBold",
                marginBottom: 12,
              }}
            >
              Datos de nacimiento
            </Text>

            <View style={{ gap: 10 }}>
              {[
                { label: "Nombre", valor: perfil.nombre },
                {
                  label: "Nacimiento",
                  valor: formatearFecha(perfil.fecha_nacimiento),
                },
                { label: "Hora", valor: formatearHora(perfil.hora_nacimiento) },
                {
                  label: "Lugar",
                  valor: `${perfil.ciudad_nacimiento}, ${perfil.pais_nacimiento}`,
                },
                {
                  label: "Zona horaria",
                  valor: perfil.zona_horaria ?? "Sin resolver",
                },
              ].map((item) => (
                <View
                  key={item.label}
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    gap: 16,
                  }}
                >
                  <Text style={{ color: colores.textoSecundario, fontSize: 14 }}>
                    {item.label}
                  </Text>
                  <Text
                    style={{
                      color: colores.primario,
                      fontSize: 14,
                      flex: 1,
                      textAlign: "right",
                    }}
                  >
                    {item.valor}
                  </Text>
                </View>
              ))}
            </View>
          </Tarjeta>
        </AnimacionEntrada>
      )}

      <Text
        style={{
          color: colores.primario,
          fontFamily: "Inter_600SemiBold",
          fontSize: 18,
          marginBottom: 12,
        }}
      >
        Configuración
      </Text>

      <Tarjeta style={{ marginBottom: 8 }}>
        <Text
          style={{
            color: colores.primario,
            fontFamily: "Inter_600SemiBold",
            marginBottom: 12,
          }}
        >
          Apariencia
        </Text>
        <View style={{ flexDirection: "row", gap: 8 }}>
          {opcionesTema.map((opcion) => {
            const seleccionado = preferencia === opcion.valor;
            return (
              <View key={opcion.valor} style={{ flex: 1 }}>
                <PresionableAnimado
                  onPress={() => setPreferencia(opcion.valor)}
                  accessibilityRole="button"
                  accessibilityLabel={`Tema ${opcion.etiqueta}`}
                  accessibilityState={{ selected: seleccionado }}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 6,
                    paddingVertical: 10,
                    borderRadius: 12,
                    backgroundColor: seleccionado
                      ? `${colores.acento}1A`
                      : colores.superficie,
                    borderWidth: 1,
                    borderColor: seleccionado
                      ? `${colores.acento}4D`
                      : colores.borde,
                  }}
                >
                  {opcion.icono}
                  <Text
                    style={{
                      color: seleccionado
                        ? colores.acento
                        : colores.textoSecundario,
                      fontSize: 13,
                      fontFamily: "Inter_600SemiBold",
                    }}
                  >
                    {opcion.etiqueta}
                  </Text>
                </PresionableAnimado>
              </View>
            );
          })}
        </View>
      </Tarjeta>

      <PresionableAnimado
        onPress={() => router.push("/(features)/suscripcion" as never)}
      >
        <Tarjeta padding="sm" style={{ marginBottom: 8 }}>
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <CreditCard size={20} color={colores.acento} />
            <Text style={{ color: colores.primario, marginLeft: 12, flex: 1 }}>
              Suscripción
            </Text>
            <CaretRight size={18} color={colores.textoMuted} />
          </View>
        </Tarjeta>
      </PresionableAnimado>

      <Tarjeta padding="sm" style={{ marginBottom: 8 }}>
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <DownloadSimple size={20} color={colores.acento} />
          <Text style={{ color: colores.primario, marginLeft: 12, flex: 1 }}>
            Perfil en PDF
          </Text>
          <Boton
            variante="fantasma"
            tamaño="sm"
            onPress={manejarDescargaPerfil}
            cargando={descargandoPerfil}
          >
            Abrir
          </Boton>
        </View>
      </Tarjeta>

      <PresionableAnimado
        onPress={() => WebBrowser.openBrowserAsync("https://theastra.xyz/terminos")}
      >
        <Tarjeta padding="sm" style={{ marginBottom: 8 }}>
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <FileText size={20} color={colores.acento} />
            <Text style={{ color: colores.primario, marginLeft: 12, flex: 1 }}>
              Términos de Servicio
            </Text>
            <CaretRight size={18} color={colores.textoMuted} />
          </View>
        </Tarjeta>
      </PresionableAnimado>

      <PresionableAnimado
        onPress={() => WebBrowser.openBrowserAsync("https://theastra.xyz/politica-de-privacidad")}
      >
        <Tarjeta padding="sm" style={{ marginBottom: 8 }}>
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <FileText size={20} color={colores.acento} />
            <Text style={{ color: colores.primario, marginLeft: 12, flex: 1 }}>
              Política de Privacidad
            </Text>
            <CaretRight size={18} color={colores.textoMuted} />
          </View>
        </Tarjeta>
      </PresionableAnimado>

      {usuario?.proveedor_auth === "local" && (
        <>
          <PresionableAnimado
            onPress={() =>
              setSeccionAbierta(
                seccionAbierta === "contrasena" ? null : "contrasena",
              )
            }
          >
            <Tarjeta padding="sm" style={{ marginBottom: 8 }}>
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <LockKey size={20} color={colores.acento} />
                <Text
                  style={{ color: colores.primario, marginLeft: 12, flex: 1 }}
                >
                  Cambiar contraseña
                </Text>
                <CaretRight size={18} color={colores.textoMuted} />
              </View>
            </Tarjeta>
          </PresionableAnimado>
          {seccionAbierta === "contrasena" && (
            <Tarjeta style={{ marginBottom: 8 }}>
              <Input
                etiqueta="Contraseña actual"
                value={contrasenaActual}
                onChangeText={setContrasenaActual}
                secureTextEntry
              />
              <Input
                etiqueta="Nueva contraseña"
                value={contrasenaNueva}
                onChangeText={setContrasenaNueva}
                secureTextEntry
                placeholder="Mínimo 8 caracteres"
              />
              <Boton
                onPress={manejarCambioContrasena}
                cargando={cambiarContrasena.isPending}
                disabled={!contrasenaActual || contrasenaNueva.length < 8}
              >
                Actualizar
              </Boton>
            </Tarjeta>
          )}
        </>
      )}

      <PresionableAnimado
        onPress={() =>
          setSeccionAbierta(seccionAbierta === "eliminar" ? null : "eliminar")
        }
      >
        <Tarjeta padding="sm" style={{ marginBottom: 8 }}>
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <Trash size={20} color={colores.error} />
            <Text style={{ color: colores.error, marginLeft: 12, flex: 1 }}>
              Eliminar cuenta
            </Text>
            <CaretRight size={18} color={colores.textoMuted} />
          </View>
        </Tarjeta>
      </PresionableAnimado>

      {seccionAbierta === "eliminar" && (
        <Tarjeta style={{ marginBottom: 8 }}>
          <Text
            style={{
              color: colores.textoSecundario,
              fontSize: 13,
              marginBottom: 12,
            }}
          >
            Esta acción desactiva tu cuenta, revoca tu sesión y cancela cualquier
            suscripción activa.
          </Text>
          {usuario?.proveedor_auth === "local" && (
            <Input
              etiqueta="Confirmá tu contraseña"
              value={contrasenaEliminar}
              onChangeText={setContrasenaEliminar}
              secureTextEntry
            />
          )}
          <Boton
            variante="fantasma"
            onPress={manejarEliminarCuenta}
            cargando={eliminarCuenta.isPending}
            disabled={
              usuario?.proveedor_auth === "local" && !contrasenaEliminar.trim()
            }
          >
            Eliminar definitivamente
          </Boton>
        </Tarjeta>
      )}

      <Separador />

      <PresionableAnimado onPress={manejarLogout}>
        <Tarjeta padding="sm">
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <SignOut size={20} color={colores.error} />
            <Text style={{ color: colores.error, marginLeft: 12 }}>
              Cerrar sesión
            </Text>
          </View>
        </Tarjeta>
      </PresionableAnimado>
    </ScrollView>
  );
}
