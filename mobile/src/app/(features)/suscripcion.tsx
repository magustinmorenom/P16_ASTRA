import { View, Text, ScrollView, Alert } from "react-native";
import * as WebBrowser from "expo-web-browser";
import { HeaderMobile } from "@/componentes/layouts/header-mobile";
import { Tarjeta } from "@/componentes/ui/tarjeta";
import { Boton } from "@/componentes/ui/boton";
import { Badge } from "@/componentes/ui/badge";
import { Esqueleto } from "@/componentes/ui/esqueleto";
import { Separador } from "@/componentes/ui/separador";
import { useStoreAuth } from "@/lib/stores/store-auth";
import { usarTema } from "@/lib/hooks/usar-tema";
import {
  usarPlanes, usarMiSuscripcion, usarSuscribirse,
  usarCancelarSuscripcion, usarPagos, usarDetectarPais,
} from "@/lib/hooks/usar-suscripcion";
import { formatearFechaCorta } from "@/lib/utilidades/formatear-fecha";

export default function SuscripcionScreen() {
  const usuario = useStoreAuth((s) => s.usuario);
  const { colores } = usarTema();
  const { data: planes, isLoading: cargandoPlanes } = usarPlanes();
  const { data: suscripcion } = usarMiSuscripcion();
  const { data: pais } = usarDetectarPais();
  const { data: pagos } = usarPagos();
  const suscribirse = usarSuscribirse();
  const cancelar = usarCancelarSuscripcion();
  const esPremium = usuario?.plan_slug === "premium";
  const paisCodigo = pais?.pais_codigo ?? "AR";

  const manejarSuscripcion = async (planId: string) => {
    try {
      const resp = await suscribirse.mutateAsync({ plan_id: planId, pais_codigo: paisCodigo });
      await WebBrowser.openBrowserAsync(resp.init_point);
    } catch { Alert.alert("Error", "No se pudo iniciar el checkout"); }
  };

  const manejarCancelacion = () => {
    Alert.alert("Cancelar suscripción", "Tu plan Premium seguirá activo hasta el fin del período actual.", [
      { text: "No, mantener", style: "cancel" },
      { text: "Sí, cancelar", style: "destructive", onPress: async () => {
        try { await cancelar.mutateAsync(); Alert.alert("Listo", "Suscripción cancelada con gracia"); }
        catch { Alert.alert("Error", "No se pudo cancelar"); }
      }},
    ]);
  };

  return (
    <View style={{ flex: 1, backgroundColor: colores.fondo }}>
      <HeaderMobile titulo="Suscripción" />
      <ScrollView contentContainerStyle={{ paddingBottom: 40, paddingHorizontal: 16 }}>
        {suscripcion && (
          <Tarjeta variante={esPremium ? "acento" : "default"} style={{ marginTop: 16, marginBottom: 16 }}>
            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
              <View>
                <Text style={{ color: colores.textoSecundario, fontSize: 11, textTransform: "uppercase" }}>Plan actual</Text>
                <Text style={{ color: colores.primario, fontFamily: "Inter_700Bold", fontSize: 18 }}>{suscripcion.plan_nombre ?? "Gratis"}</Text>
              </View>
              <Badge variante={esPremium ? "exito" : "default"}>{suscripcion.estado}</Badge>
            </View>
            {suscripcion.cancelacion_programada && (
              <Text style={{ color: colores.advertencia, fontSize: 12, marginTop: 8 }}>Activa hasta fin del período</Text>
            )}
          </Tarjeta>
        )}
        <Text style={{ color: colores.primario, fontFamily: "Inter_600SemiBold", fontSize: 18, marginBottom: 12 }}>Planes disponibles</Text>
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
                <Tarjeta key={plan.id} variante={plan.slug === "premium" ? "acento" : "default"}>
                  <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                    <Text style={{ color: colores.primario, fontFamily: "Inter_700Bold", fontSize: 18 }}>{plan.nombre}</Text>
                    {esActual && <Badge variante="exito">Actual</Badge>}
                  </View>
                  {precio ? (
                    <Text style={{ color: colores.acento, fontFamily: "Inter_700Bold", fontSize: 20 }}>{(precio.precio_local / 100).toLocaleString()} {precio.moneda}/mes</Text>
                  ) : plan.precio_usd_centavos > 0 ? (
                    <Text style={{ color: colores.acento, fontFamily: "Inter_700Bold", fontSize: 20 }}>${(plan.precio_usd_centavos / 100).toFixed(2)} USD/mes</Text>
                  ) : (
                    <Text style={{ color: colores.exito, fontFamily: "Inter_700Bold", fontSize: 20 }}>Gratis</Text>
                  )}
                  {plan.descripcion && <Text style={{ color: colores.textoSecundario, fontSize: 14, marginTop: 4 }}>{plan.descripcion}</Text>}
                  <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 4, marginTop: 8 }}>
                    {plan.features.map((f) => <Badge key={f} variante="info">{f}</Badge>)}
                  </View>
                  {!esActual && plan.slug === "premium" && (
                    <Boton onPress={() => manejarSuscripcion(plan.id)} cargando={suscribirse.isPending} style={{ marginTop: 12 }}>Suscribirme</Boton>
                  )}
                </Tarjeta>
              );
            })}
          </View>
        )}
        {esPremium && !suscripcion?.cancelacion_programada && (
          <><Separador /><Boton variante="fantasma" onPress={manejarCancelacion} cargando={cancelar.isPending}>Cancelar suscripción</Boton></>
        )}
        {pagos && pagos.length > 0 && (
          <>
            <Separador />
            <Text style={{ color: colores.primario, fontFamily: "Inter_600SemiBold", fontSize: 18, marginBottom: 12 }}>Historial de pagos</Text>
            {pagos.map((pago) => (
              <Tarjeta key={pago.id} padding="sm" style={{ marginBottom: 8 }}>
                <View style={{ flexDirection: "row", alignItems: "center" }}>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: colores.primario, fontSize: 14 }}>{(pago.monto_centavos / 100).toLocaleString()} {pago.moneda}</Text>
                    {pago.fecha_pago && <Text style={{ color: colores.textoMuted, fontSize: 12 }}>{formatearFechaCorta(pago.fecha_pago.split("T")[0])}</Text>}
                  </View>
                  <Badge variante={pago.estado === "aprobado" ? "exito" : pago.estado === "rechazado" ? "error" : "default"}>{pago.estado}</Badge>
                </View>
              </Tarjeta>
            ))}
          </>
        )}
      </ScrollView>
    </View>
  );
}
