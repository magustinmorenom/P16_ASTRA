import { useEffect, useState } from "react";
import { ActivityIndicator, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { useQueryClient } from "@tanstack/react-query";
import { HeaderMobile } from "@/componentes/layouts/header-mobile";
import { Boton } from "@/componentes/ui/boton";
import { Tarjeta } from "@/componentes/ui/tarjeta";
import { usarTema } from "@/lib/hooks/usar-tema";
import { usarVerificarEstado } from "@/lib/hooks/usar-suscripcion";
import { useStoreAuth } from "@/lib/stores/store-auth";

type EstadoVisual = "verificando" | "confirmado" | "timeout";

export default function SuscripcionVerificacionScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { colores } = usarTema();
  const [estadoVisual, setEstadoVisual] = useState<EstadoVisual>("verificando");

  const { data } = usarVerificarEstado(estadoVisual === "verificando");

  useEffect(() => {
    if (!data?.es_premium || estadoVisual !== "verificando") return;

    const confirmar = async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["mi-suscripcion"] }),
        queryClient.invalidateQueries({ queryKey: ["planes"] }),
        queryClient.invalidateQueries({ queryKey: ["pagos"] }),
        queryClient.invalidateQueries({ queryKey: ["facturas"] }),
        useStoreAuth.getState().cargarUsuario(),
      ]);
      setEstadoVisual("confirmado");
    };

    confirmar();
  }, [data, estadoVisual, queryClient]);

  useEffect(() => {
    if (estadoVisual !== "verificando") return;

    const timeoutId = setTimeout(() => {
      setEstadoVisual("timeout");
    }, 60_000);

    return () => clearTimeout(timeoutId);
  }, [estadoVisual]);

  return (
    <View style={{ flex: 1, backgroundColor: colores.fondo }}>
      <HeaderMobile titulo="Verificación de pago" />
      <View style={{ flex: 1, padding: 16, justifyContent: "center" }}>
        <Tarjeta style={{ alignItems: "center" }}>
          {estadoVisual === "verificando" && (
            <>
              <ActivityIndicator size="large" color={colores.acento} />
              <Text
                style={{
                  color: colores.primario,
                  fontSize: 20,
                  fontFamily: "Inter_700Bold",
                  marginTop: 20,
                }}
              >
                Verificando pago...
              </Text>
              <Text
                style={{
                  color: colores.textoSecundario,
                  fontSize: 14,
                  marginTop: 10,
                  textAlign: "center",
                }}
              >
                Estamos esperando la confirmación de MercadoPago. Esto puede
                tardar unos segundos.
              </Text>
            </>
          )}

          {estadoVisual === "confirmado" && (
            <>
              <Text
                style={{
                  color: colores.exito,
                  fontSize: 24,
                  fontFamily: "Inter_700Bold",
                }}
              >
                Pago confirmado
              </Text>
              <Text
                style={{
                  color: colores.textoSecundario,
                  fontSize: 14,
                  marginTop: 10,
                  textAlign: "center",
                }}
              >
                Tu suscripción Premium ya quedó activa en la cuenta.
              </Text>
            </>
          )}

          {estadoVisual === "timeout" && (
            <>
              <Text
                style={{
                  color: colores.advertencia,
                  fontSize: 24,
                  fontFamily: "Inter_700Bold",
                }}
              >
                Pago en proceso
              </Text>
              <Text
                style={{
                  color: colores.textoSecundario,
                  fontSize: 14,
                  marginTop: 10,
                  textAlign: "center",
                }}
              >
                MercadoPago todavía no cerró la confirmación. Volvé en unos
                minutos y revisalo desde tu suscripción.
              </Text>
            </>
          )}

          <View style={{ width: "100%", marginTop: 24, gap: 12 }}>
            <Boton onPress={() => router.replace("/(features)/suscripcion" as never)}>
              Ver mi suscripción
            </Boton>
            <Boton
              variante="secundario"
              onPress={() => router.replace("/(tabs)" as never)}
            >
              Ir al inicio
            </Boton>
          </View>
        </Tarjeta>
      </View>
    </View>
  );
}
