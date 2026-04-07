import { useState } from "react";
import { Alert, Pressable, ScrollView, Text, View } from "react-native";
import { useRouter } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import { useQueryClient } from "@tanstack/react-query";
import { HeaderMobile } from "@/componentes/layouts/header-mobile";
import { Tarjeta } from "@/componentes/ui/tarjeta";
import { Boton } from "@/componentes/ui/boton";
import { Badge } from "@/componentes/ui/badge";
import { Esqueleto } from "@/componentes/ui/esqueleto";
import { Separador } from "@/componentes/ui/separador";
import { useStoreAuth } from "@/lib/stores/store-auth";
import { usarTema } from "@/lib/hooks/usar-tema";
import {
  usarCancelarSuscripcion,
  usarDetectarPais,
  usarFacturas,
  usarMiSuscripcion,
  usarPagos,
  usarPlanes,
  usarSuscribirse,
} from "@/lib/hooks/usar-suscripcion";
import { descargarYAbrirDocumentoProtegido } from "@/lib/utilidades/descargar-documento";
import { formatearFechaCorta } from "@/lib/utilidades/formatear-fecha";

export default function SuscripcionScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const usuario = useStoreAuth((state) => state.usuario);
  const { colores } = usarTema();
  const { data: planes, isLoading: cargandoPlanes } = usarPlanes();
  const { data: suscripcion } = usarMiSuscripcion();
  const { data: pais } = usarDetectarPais();
  const { data: pagos } = usarPagos();
  const { data: facturas } = usarFacturas();
  const suscribirse = usarSuscribirse();
  const cancelar = usarCancelarSuscripcion();

  const [facturaAbriendo, setFacturaAbriendo] = useState<string | null>(null);

  const esPremium = usuario?.plan_slug === "premium";
  const paisCodigo = pais?.pais_codigo ?? "AR";

  const refrescarSuscripcion = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["mi-suscripcion"] }),
      queryClient.invalidateQueries({ queryKey: ["planes"] }),
      queryClient.invalidateQueries({ queryKey: ["pagos"] }),
      queryClient.invalidateQueries({ queryKey: ["facturas"] }),
      useStoreAuth.getState().cargarUsuario(),
    ]);
  };

  const manejarSuscripcion = async (planId: string) => {
    try {
      const respuesta = await suscribirse.mutateAsync({
        plan_id: planId,
        pais_codigo: paisCodigo,
      });
      await WebBrowser.openBrowserAsync(respuesta.init_point);
      router.push("/(features)/suscripcion-verificacion" as never);
    } catch (error) {
      Alert.alert(
        "Error",
        error instanceof Error ? error.message : "No se pudo iniciar el checkout.",
      );
    }
  };

  const manejarCancelacion = () => {
    Alert.alert(
      "Cancelar suscripción",
      "Tu plan Premium seguirá activo hasta el fin del período actual.",
      [
        { text: "No, mantener", style: "cancel" },
        {
          text: "Sí, cancelar",
          style: "destructive",
          onPress: async () => {
            try {
              await cancelar.mutateAsync();
              await refrescarSuscripcion();
              Alert.alert("Listo", "La suscripción quedó cancelada con gracia.");
            } catch (error) {
              Alert.alert(
                "Error",
                error instanceof Error
                  ? error.message
                  : "No se pudo cancelar la suscripción.",
              );
            }
          },
        },
      ],
    );
  };

  const manejarAbrirFactura = async (facturaId: string, numeroFactura: string) => {
    try {
      setFacturaAbriendo(facturaId);
      await descargarYAbrirDocumentoProtegido(
        `/suscripcion/facturas/${facturaId}/pdf`,
        `${numeroFactura}.pdf`,
      );
    } catch (error) {
      Alert.alert(
        "Error",
        error instanceof Error ? error.message : "No se pudo abrir la factura.",
      );
    } finally {
      setFacturaAbriendo(null);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: colores.fondo }}>
      <HeaderMobile titulo="Suscripción" />
      <ScrollView
        contentContainerStyle={{ paddingBottom: 40, paddingHorizontal: 16 }}
      >
        {suscripcion && (
          <Tarjeta
            variante={esPremium ? "acento" : "default"}
            style={{ marginTop: 16, marginBottom: 16 }}
          >
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <View>
                <Text
                  style={{
                    color: colores.textoSecundario,
                    fontSize: 11,
                    textTransform: "uppercase",
                  }}
                >
                  Plan actual
                </Text>
                <Text
                  style={{
                    color: colores.primario,
                    fontFamily: "Inter_700Bold",
                    fontSize: 18,
                  }}
                >
                  {suscripcion.plan_nombre ?? "Gratis"}
                </Text>
                {pais?.pais_nombre ? (
                  <Text
                    style={{
                      color: colores.textoSecundario,
                      fontSize: 12,
                      marginTop: 4,
                    }}
                  >
                    País detectado: {pais.pais_nombre} ({pais.moneda})
                  </Text>
                ) : null}
              </View>
              <Badge variante={esPremium ? "exito" : "default"}>
                {suscripcion.estado}
              </Badge>
            </View>
            {suscripcion.cancelacion_programada && (
              <Text
                style={{
                  color: colores.advertencia,
                  fontSize: 12,
                  marginTop: 8,
                }}
              >
                Activa hasta fin del período actual
              </Text>
            )}
          </Tarjeta>
        )}

        <Text
          style={{
            color: colores.primario,
            fontFamily: "Inter_600SemiBold",
            fontSize: 18,
            marginBottom: 12,
          }}
        >
          Planes disponibles
        </Text>
        {cargandoPlanes ? (
          <View style={{ gap: 12 }}>
            <Esqueleto style={{ height: 128, borderRadius: 12 }} />
            <Esqueleto style={{ height: 128, borderRadius: 12 }} />
          </View>
        ) : (
          <View style={{ gap: 12, marginBottom: 16 }}>
            {planes?.map((plan) => {
              const esActual = usuario?.plan_slug === plan.slug;
              const precio = plan.precios_por_pais?.[paisCodigo];
              return (
                <Tarjeta
                  key={plan.id}
                  variante={plan.slug === "premium" ? "acento" : "default"}
                >
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      justifyContent: "space-between",
                      marginBottom: 8,
                    }}
                  >
                    <Text
                      style={{
                        color: colores.primario,
                        fontFamily: "Inter_700Bold",
                        fontSize: 18,
                      }}
                    >
                      {plan.nombre}
                    </Text>
                    {esActual && <Badge variante="exito">Actual</Badge>}
                  </View>
                  {precio ? (
                    <Text
                      style={{
                        color: colores.acento,
                        fontFamily: "Inter_700Bold",
                        fontSize: 20,
                      }}
                    >
                      {(precio.precio_local / 100).toLocaleString()} {precio.moneda}
                      /mes
                    </Text>
                  ) : plan.precio_usd_centavos > 0 ? (
                    <Text
                      style={{
                        color: colores.acento,
                        fontFamily: "Inter_700Bold",
                        fontSize: 20,
                      }}
                    >
                      ${(plan.precio_usd_centavos / 100).toFixed(2)} USD/mes
                    </Text>
                  ) : (
                    <Text
                      style={{
                        color: colores.exito,
                        fontFamily: "Inter_700Bold",
                        fontSize: 20,
                      }}
                    >
                      Gratis
                    </Text>
                  )}
                  {plan.descripcion ? (
                    <Text
                      style={{
                        color: colores.textoSecundario,
                        fontSize: 14,
                        marginTop: 4,
                      }}
                    >
                      {plan.descripcion}
                    </Text>
                  ) : null}
                  <View
                    style={{
                      flexDirection: "row",
                      flexWrap: "wrap",
                      gap: 4,
                      marginTop: 8,
                    }}
                  >
                    {plan.features.map((feature) => (
                      <Badge key={feature} variante="info">
                        {feature}
                      </Badge>
                    ))}
                  </View>
                  {!esActual && plan.slug === "premium" && (
                    <Boton
                      onPress={() => manejarSuscripcion(plan.id)}
                      cargando={suscribirse.isPending}
                      style={{ marginTop: 12 }}
                    >
                      Suscribirme
                    </Boton>
                  )}
                </Tarjeta>
              );
            })}
          </View>
        )}

        {esPremium && !suscripcion?.cancelacion_programada && (
          <>
            <Separador />
            <Pressable
              onPress={manejarCancelacion}
              disabled={cancelar.isPending}
              accessibilityRole="button"
              accessibilityLabel="Cancelar suscripción"
              style={{
                borderRadius: 12,
                borderWidth: 1,
                borderColor: `${colores.error}40`,
                backgroundColor: `${colores.error}10`,
                paddingVertical: 14,
                alignItems: "center",
                marginTop: 4,
              }}
            >
              <Text
                style={{
                  color: colores.error,
                  fontSize: 14,
                  fontFamily: "Inter_600SemiBold",
                }}
              >
                {cancelar.isPending ? "Cancelando..." : "Cancelar suscripción"}
              </Text>
            </Pressable>
          </>
        )}

        {pagos && pagos.length > 0 && (
          <>
            <Separador />
            <Text
              style={{
                color: colores.primario,
                fontFamily: "Inter_600SemiBold",
                fontSize: 18,
                marginBottom: 12,
              }}
            >
              Historial de pagos
            </Text>
            {pagos.map((pago) => (
              <Tarjeta key={pago.id} padding="sm" style={{ marginBottom: 8 }}>
                <View style={{ flexDirection: "row", alignItems: "center" }}>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: colores.primario, fontSize: 14 }}>
                      {(pago.monto_centavos / 100).toLocaleString()} {pago.moneda}
                    </Text>
                    {pago.fecha_pago ? (
                      <Text
                        style={{ color: colores.textoMuted, fontSize: 12 }}
                      >
                        {formatearFechaCorta(pago.fecha_pago.split("T")[0])}
                      </Text>
                    ) : null}
                  </View>
                  <Badge
                    variante={
                      pago.estado === "aprobado"
                        ? "exito"
                        : pago.estado === "rechazado"
                          ? "error"
                          : "default"
                    }
                  >
                    {pago.estado}
                  </Badge>
                </View>
              </Tarjeta>
            ))}
          </>
        )}

        {facturas && facturas.length > 0 && (
          <>
            <Separador />
            <Text
              style={{
                color: colores.primario,
                fontFamily: "Inter_600SemiBold",
                fontSize: 18,
                marginBottom: 12,
              }}
            >
              Facturas
            </Text>
            {facturas.map((factura) => (
              <Tarjeta key={factura.id} padding="sm" style={{ marginBottom: 8 }}>
                <View style={{ flexDirection: "row", alignItems: "center" }}>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: colores.primario, fontSize: 14 }}>
                      {factura.numero_factura}
                    </Text>
                    <Text
                      style={{
                        color: colores.textoMuted,
                        fontSize: 12,
                        marginTop: 2,
                      }}
                    >
                      {factura.concepto}
                    </Text>
                  </View>
                  <Pressable
                    onPress={() =>
                      manejarAbrirFactura(factura.id, factura.numero_factura)
                    }
                    disabled={facturaAbriendo === factura.id}
                    style={{
                      borderRadius: 10,
                      borderWidth: 1,
                      borderColor: colores.borde,
                      paddingHorizontal: 12,
                      paddingVertical: 8,
                    }}
                  >
                    <Text style={{ color: colores.acento, fontSize: 12 }}>
                      {facturaAbriendo === factura.id ? "Abriendo..." : "PDF"}
                    </Text>
                  </Pressable>
                </View>
              </Tarjeta>
            ))}
          </>
        )}
      </ScrollView>
    </View>
  );
}
