import { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useQueryClient } from "@tanstack/react-query";
import { FormularioNacimiento } from "@/componentes/compuestos/formulario-nacimiento";
import { usarCrearPerfil } from "@/lib/hooks/usar-perfil";
import { usarCartaNatal } from "@/lib/hooks/usar-carta-natal";
import { usarDisenoHumano } from "@/lib/hooks/usar-diseno-humano";
import { usarNumerologia } from "@/lib/hooks/usar-numerologia";
import { usarRetornoSolar } from "@/lib/hooks/usar-retorno-solar";
import { useStoreAuth } from "@/lib/stores/store-auth";
import { usarTema } from "@/lib/hooks/usar-tema";
import type { DatosNacimiento } from "@/lib/tipos";

export default function OnboardingScreen() {
  const insets = useSafeAreaInsets();
  const { colores } = usarTema();
  const queryClient = useQueryClient();
  const [calculando, setCalculando] = useState(false);
  const [error, setError] = useState("");

  const crearPerfil = usarCrearPerfil();
  const cartaNatal = usarCartaNatal();
  const disenoHumano = usarDisenoHumano();
  const numerologia = usarNumerologia();
  const retornoSolar = usarRetornoSolar();

  const manejarDatosNacimiento = async (datos: DatosNacimiento) => {
    setCalculando(true);
    setError("");

    try {
      const perfil = await crearPerfil.mutateAsync(datos);

      const anioActual = new Date().getFullYear();
      await Promise.all([
        cartaNatal.mutateAsync({ datos, perfilId: perfil.id }),
        disenoHumano.mutateAsync({ datos, perfilId: perfil.id }),
        numerologia.mutateAsync({
          datos: {
            nombre: datos.nombre,
            fecha_nacimiento: datos.fecha_nacimiento,
          },
          perfilId: perfil.id,
        }),
        retornoSolar.mutateAsync({
          datosNacimiento: datos,
          anio: anioActual,
          perfilId: perfil.id,
        }),
      ]);

      await useStoreAuth.getState().cargarUsuario();
      queryClient.invalidateQueries({ queryKey: ["calculos", "me"] });
    } catch {
      setError("Error al calcular tu perfil cósmico. Intentá de nuevo.");
      setCalculando(false);
    }
  };

  if (calculando) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: colores.fondo,
          alignItems: "center",
          justifyContent: "center",
          paddingHorizontal: 32,
          paddingTop: insets.top,
        }}
      >
        <ActivityIndicator size="large" color={colores.acento} />
        <Text
          style={{
            color: colores.primario,
            fontSize: 20,
            fontFamily: "Inter_700Bold",
            marginTop: 24,
            textAlign: "center",
          }}
        >
          Calculando tu perfil cósmico
        </Text>
        <Text
          style={{
            color: colores.textoSecundario,
            fontSize: 14,
            marginTop: 8,
            textAlign: "center",
          }}
        >
          Carta natal, Diseño Humano, Numerología y Revolución Solar...
        </Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={{ flex: 1, backgroundColor: colores.fondo }}
    >
      <ScrollView
        contentContainerStyle={{
          flexGrow: 1,
          paddingTop: insets.top + 20,
          paddingBottom: insets.bottom + 20,
          paddingHorizontal: 24,
        }}
        keyboardShouldPersistTaps="handled"
      >
        <View style={{ marginBottom: 32 }}>
          <Text style={{ fontSize: 24, fontFamily: "Inter_700Bold", color: colores.primario }}>
            Datos de nacimiento
          </Text>
          <Text style={{ color: colores.textoSecundario, fontSize: 14, marginTop: 4 }}>
            Necesitamos esta información para calcular tu carta astral, diseño
            humano y numerología.
          </Text>
        </View>

        {error ? (
          <Text style={{ color: colores.error, fontSize: 14, marginBottom: 16, textAlign: "center" }}>
            {error}
          </Text>
        ) : null}

        <FormularioNacimiento
          onEnviar={manejarDatosNacimiento}
          cargando={crearPerfil.isPending}
          textoBoton="Calcular mi perfil cósmico"
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
