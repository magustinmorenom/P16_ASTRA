import { useState } from "react";
import {
  View,
  Text,
  ActivityIndicator,
} from "react-native";
import { useQueryClient } from "@tanstack/react-query";
import { FondoCosmico } from "@/componentes/layouts/fondo-cosmico";
import { ShellAcceso } from "@/componentes/layouts/shell-acceso";
import { Tarjeta } from "@/componentes/ui/tarjeta";
import { FormularioNacimiento } from "@/componentes/compuestos/formulario-nacimiento";
import { usarCrearPerfil } from "@/lib/hooks/usar-perfil";
import { usarCartaNatal } from "@/lib/hooks/usar-carta-natal";
import { usarDisenoHumano } from "@/lib/hooks/usar-diseno-humano";
import { usarNumerologia } from "@/lib/hooks/usar-numerologia";
import { usarRetornoSolar } from "@/lib/hooks/usar-retorno-solar";
import { useStoreAuth } from "@/lib/stores/store-auth";
import { usarTema } from "@/lib/hooks/usar-tema";
import { trackEvento, Eventos } from "@/lib/utilidades/analytics";
import type { DatosNacimiento } from "@/lib/tipos";

export default function OnboardingScreen() {
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

      trackEvento(Eventos.ONBOARDING_COMPLETO);
      await useStoreAuth.getState().cargarUsuario();
      queryClient.invalidateQueries({ queryKey: ["calculos", "me"] });
    } catch {
      setError("Error al calcular tu perfil cósmico. Intentá de nuevo.");
      setCalculando(false);
    }
  };

  if (calculando) {
    return (
      <FondoCosmico intensidad="hero">
        <View
          style={{
            flex: 1,
            alignItems: "center",
            justifyContent: "center",
            paddingHorizontal: 24,
          }}
        >
          <Tarjeta variante="violeta" style={{ width: "100%", maxWidth: 460 }}>
            <View style={{ alignItems: "center", paddingVertical: 12 }}>
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
                  marginTop: 10,
                  textAlign: "center",
                  lineHeight: 20,
                }}
              >
                Estamos generando tu carta natal, tu Diseño Humano, tu numerología y
                tu retorno solar inicial.
              </Text>
            </View>
          </Tarjeta>
        </View>
      </FondoCosmico>
    );
  }

  return (
    <ShellAcceso
      insignia="Tu perfil base"
      titulo="Ahora necesitamos tu momento de nacimiento"
      descripcion="Con estos datos vamos a activar todos tus calculos y dejar lista la app para darte respuestas realmente personales."
      pistas={[
        {
          icono: "astrologia",
          texto: "La fecha, la hora y el lugar impactan tu carta y la interpretacion diaria.",
        },
        {
          icono: "personal",
          texto: "Si despues corregis algo, ASTRA puede recalcular tus cartas desde perfil.",
        },
      ]}
      intensidad="hero"
    >
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

      <FormularioNacimiento
        onEnviar={manejarDatosNacimiento}
        cargando={crearPerfil.isPending}
        textoBoton="Calcular mi perfil cosmico"
      />
    </ShellAcceso>
  );
}
