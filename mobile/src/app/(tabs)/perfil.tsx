import { useState } from "react";
import { View, Text, ScrollView, Pressable, Alert } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useQueryClient } from "@tanstack/react-query";
import {
  SignOut,
  CaretRight,
  LockKey,
  CreditCard,
  PencilSimple,
  Sun,
  Moon,
  CircleHalf,
} from "phosphor-react-native";
import { Avatar } from "@/componentes/ui/avatar";
import { Badge } from "@/componentes/ui/badge";
import { Boton } from "@/componentes/ui/boton";
import { Input } from "@/componentes/ui/input";
import { Tarjeta } from "@/componentes/ui/tarjeta";
import { Separador } from "@/componentes/ui/separador";
import { PresionableAnimado } from "@/componentes/ui/presionable-animado";
import { AnimacionEntrada } from "@/componentes/ui/animacion-entrada";
import { useStoreAuth } from "@/lib/stores/store-auth";
import { usarMiPerfil, usarActualizarPerfil } from "@/lib/hooks/usar-perfil";
import { usarLogout, usarCambiarContrasena } from "@/lib/hooks/usar-auth";
import { usarCartaNatal } from "@/lib/hooks/usar-carta-natal";
import { usarDisenoHumano } from "@/lib/hooks/usar-diseno-humano";
import { usarNumerologia } from "@/lib/hooks/usar-numerologia";
import { usarRetornoSolar } from "@/lib/hooks/usar-retorno-solar";
import { usarTema } from "@/lib/hooks/usar-tema";
import { formatearFecha, formatearHora } from "@/lib/utilidades/formatear-fecha";
import type { PreferenciaTema } from "@/lib/stores/store-tema";

export default function PantallaPerfil() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const queryClient = useQueryClient();
  const usuario = useStoreAuth((s) => s.usuario);
  const { data: perfil } = usarMiPerfil();
  const actualizarPerfil = usarActualizarPerfil();
  const logout = usarLogout();
  const cambiarContrasena = usarCambiarContrasena();
  const cartaNatal = usarCartaNatal();
  const disenoHumano = usarDisenoHumano();
  const numerologia = usarNumerologia();
  const retornoSolar = usarRetornoSolar();
  const { colores, preferencia, setPreferencia } = usarTema();

  const [editando, setEditando] = useState(false);
  const [nombre, setNombre] = useState("");
  const [seccionAbierta, setSeccionAbierta] = useState<string | null>(null);
  const [contrasenaActual, setContrasenaActual] = useState("");
  const [contrasenaNueva, setContrasenaNueva] = useState("");

  const iniciarEdicion = () => {
    setNombre(perfil?.nombre ?? "");
    setEditando(true);
  };

  const guardarEdicion = async () => {
    if (!nombre.trim() || !perfil) return;
    const resp = await actualizarPerfil.mutateAsync({ nombre: nombre.trim() });
    setEditando(false);

    if (resp.datos_nacimiento_cambiaron) {
      const datos = {
        nombre: perfil.nombre,
        fecha_nacimiento: perfil.fecha_nacimiento,
        hora_nacimiento: perfil.hora_nacimiento.slice(0, 5),
        ciudad_nacimiento: perfil.ciudad_nacimiento,
        pais_nacimiento: perfil.pais_nacimiento,
      };
      await Promise.all([
        cartaNatal.mutateAsync({ datos, perfilId: perfil.id }),
        disenoHumano.mutateAsync({ datos, perfilId: perfil.id }),
        numerologia.mutateAsync({
          datos: { nombre: datos.nombre, fecha_nacimiento: datos.fecha_nacimiento },
          perfilId: perfil.id,
        }),
        retornoSolar.mutateAsync({
          datosNacimiento: datos,
          anio: new Date().getFullYear(),
          perfilId: perfil.id,
        }),
      ]);
      queryClient.invalidateQueries({ queryKey: ["calculos", "me"] });
    }
  };

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
      Alert.alert("Listo", "Contraseña actualizada");
    } catch {
      Alert.alert("Error", "No se pudo cambiar la contraseña");
    }
  };

  const manejarLogout = () => {
    Alert.alert("Cerrar sesión", "¿Estás seguro?", [
      { text: "Cancelar", style: "cancel" },
      { text: "Sí, cerrar", onPress: () => logout.mutate() },
    ]);
  };

  const esPremium = usuario?.plan_slug === "premium";

  const opcionesTema: { valor: PreferenciaTema; icono: React.ReactNode; etiqueta: string }[] = [
    { valor: "claro", icono: <Sun size={20} color={preferencia === "claro" ? colores.acento : colores.textoMuted} weight="fill" />, etiqueta: "Claro" },
    { valor: "oscuro", icono: <Moon size={20} color={preferencia === "oscuro" ? colores.acento : colores.textoMuted} weight="fill" />, etiqueta: "Oscuro" },
    { valor: "automatico", icono: <CircleHalf size={20} color={preferencia === "automatico" ? colores.acento : colores.textoMuted} weight="fill" />, etiqueta: "Auto" },
  ];

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
        <Text style={{ color: colores.primario, fontSize: 24, fontFamily: "Inter_700Bold", marginBottom: 24 }}>
          Mi Perfil
        </Text>
      </AnimacionEntrada>

      {/* Info usuario */}
      <AnimacionEntrada retraso={100}>
        <Tarjeta style={{ marginBottom: 16 }}>
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <Avatar nombre={usuario?.nombre ?? "U"} tamaño="lg" />
            <View style={{ marginLeft: 16, flex: 1 }}>
              <Text style={{ color: colores.primario, fontFamily: "Inter_700Bold", fontSize: 18 }}>
                {usuario?.nombre}
              </Text>
              <Text style={{ color: colores.textoSecundario, fontSize: 14 }}>
                {usuario?.email}
              </Text>
              <View style={{ marginTop: 4 }}>
                <Badge variante={esPremium ? "info" : "default"}>
                  {esPremium ? "Premium" : "Gratis"}
                </Badge>
              </View>
            </View>
          </View>
        </Tarjeta>
      </AnimacionEntrada>

      {/* Datos de nacimiento */}
      {perfil && (
        <AnimacionEntrada retraso={200}>
          <Tarjeta style={{ marginBottom: 16 }}>
            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
              <Text style={{ color: colores.primario, fontFamily: "Inter_600SemiBold" }}>
                Datos de nacimiento
              </Text>
              {!editando && (
                <Pressable onPress={iniciarEdicion}>
                  <PencilSimple size={18} color={colores.acento} />
                </Pressable>
              )}
            </View>

            {editando ? (
              <View>
                <Input
                  etiqueta="Nombre"
                  value={nombre}
                  onChangeText={setNombre}
                />
                <View style={{ flexDirection: "row", gap: 8 }}>
                  <Boton onPress={guardarEdicion} cargando={actualizarPerfil.isPending}>
                    Guardar
                  </Boton>
                  <Boton variante="fantasma" onPress={() => setEditando(false)}>
                    Cancelar
                  </Boton>
                </View>
              </View>
            ) : (
              <View style={{ gap: 8 }}>
                {[
                  { label: "Nombre", valor: perfil.nombre },
                  { label: "Nacimiento", valor: formatearFecha(perfil.fecha_nacimiento) },
                  { label: "Hora", valor: formatearHora(perfil.hora_nacimiento) },
                  { label: "Lugar", valor: `${perfil.ciudad_nacimiento}, ${perfil.pais_nacimiento}` },
                ].map((item) => (
                  <View key={item.label} style={{ flexDirection: "row", justifyContent: "space-between" }}>
                    <Text style={{ color: colores.textoSecundario, fontSize: 14 }}>{item.label}</Text>
                    <Text style={{ color: colores.primario, fontSize: 14 }}>{item.valor}</Text>
                  </View>
                ))}
              </View>
            )}
          </Tarjeta>
        </AnimacionEntrada>
      )}

      {/* Configuración */}
      <Text style={{ color: colores.primario, fontFamily: "Inter_600SemiBold", fontSize: 18, marginBottom: 12 }}>
        Configuración
      </Text>

      {/* Selector de tema */}
      <Tarjeta style={{ marginBottom: 8 }}>
        <Text style={{ color: colores.primario, fontFamily: "Inter_600SemiBold", marginBottom: 12 }}>
          Apariencia
        </Text>
        <View style={{ flexDirection: "row", gap: 8 }}>
          {opcionesTema.map((opcion) => (
            <PresionableAnimado
              key={opcion.valor}
              onPress={() => setPreferencia(opcion.valor)}
              style={{
                flex: 1,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                gap: 6,
                paddingVertical: 10,
                borderRadius: 12,
                backgroundColor:
                  preferencia === opcion.valor
                    ? colores.acento + "1A"
                    : colores.superficie,
                borderWidth: 1,
                borderColor:
                  preferencia === opcion.valor
                    ? colores.acento + "4D"
                    : colores.borde,
              }}
            >
              {opcion.icono}
              <Text
                style={{
                  color:
                    preferencia === opcion.valor
                      ? colores.acento
                      : colores.textoSecundario,
                  fontSize: 13,
                  fontFamily: "Inter_600SemiBold",
                }}
              >
                {opcion.etiqueta}
              </Text>
            </PresionableAnimado>
          ))}
        </View>
      </Tarjeta>

      {/* Suscripción */}
      <PresionableAnimado onPress={() => router.push("/(features)/suscripcion" as never)}>
        <Tarjeta padding="sm" style={{ marginBottom: 8 }}>
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <CreditCard size={20} color={colores.acento} />
            <Text style={{ color: colores.primario, marginLeft: 12, flex: 1 }}>Suscripción</Text>
            <CaretRight size={18} color={colores.textoMuted} />
          </View>
        </Tarjeta>
      </PresionableAnimado>

      {/* Cambiar contraseña */}
      {usuario?.proveedor_auth === "local" && (
        <>
          <PresionableAnimado
            onPress={() =>
              setSeccionAbierta(seccionAbierta === "contrasena" ? null : "contrasena")
            }
          >
            <Tarjeta padding="sm" style={{ marginBottom: 8 }}>
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <LockKey size={20} color={colores.acento} />
                <Text style={{ color: colores.primario, marginLeft: 12, flex: 1 }}>Cambiar contraseña</Text>
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

      <Separador />

      {/* Cerrar sesión */}
      <PresionableAnimado onPress={manejarLogout}>
        <Tarjeta padding="sm">
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <SignOut size={20} color={colores.error} />
            <Text style={{ color: colores.error, marginLeft: 12 }}>Cerrar sesión</Text>
          </View>
        </Tarjeta>
      </PresionableAnimado>
    </ScrollView>
  );
}
