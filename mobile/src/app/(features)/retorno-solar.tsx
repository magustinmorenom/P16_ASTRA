import { View, Text, ScrollView } from "react-native";
import { HeaderMobile } from "@/componentes/layouts/header-mobile";
import { Tarjeta } from "@/componentes/ui/tarjeta";
import { Badge } from "@/componentes/ui/badge";
import { Esqueleto } from "@/componentes/ui/esqueleto";
import { AnimacionEntrada } from "@/componentes/ui/animacion-entrada";
import { RuedaZodiacal } from "@/componentes/visualizaciones/rueda-zodiacal";
import { usarMisCalculos } from "@/lib/hooks/usar-mis-calculos";
import { usarTema } from "@/lib/hooks/usar-tema";
import { IconoSigno } from "@/componentes/ui/icono-astral";

export default function RetornoSolarScreen() {
  const { data: calculos, isLoading } = usarMisCalculos();
  const { colores } = usarTema();
  const rs = calculos?.retorno_solar;

  if (isLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: colores.fondo }}>
        <HeaderMobile titulo="Retorno Solar" />
        <View style={{ padding: 16, gap: 12 }}>
          <Esqueleto style={{ height: 160, borderRadius: 16 }} />
          <Esqueleto style={{ height: 80, borderRadius: 12 }} />
        </View>
      </View>
    );
  }

  if (!rs) {
    return (
      <View style={{ flex: 1, backgroundColor: colores.fondo }}>
        <HeaderMobile titulo="Retorno Solar" />
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 32 }}>
          <Text style={{ color: colores.textoSecundario, textAlign: "center" }}>
            Completá tu perfil para ver tu Retorno Solar
          </Text>
        </View>
      </View>
    );
  }

  const { fecha_retorno, carta_retorno } = rs;
  const meses = ["enero","febrero","marzo","abril","mayo","junio","julio","agosto","septiembre","octubre","noviembre","diciembre"];

  return (
    <View style={{ flex: 1, backgroundColor: colores.fondo }}>
      <HeaderMobile titulo="Retorno Solar" />
      <ScrollView contentContainerStyle={{ paddingBottom: 40, paddingHorizontal: 16 }}>
        <AnimacionEntrada>
          <Tarjeta variante="dorado" style={{ marginTop: 16, marginBottom: 16 }}>
            <Text style={{ color: colores.textoSecundario, fontSize: 11, textTransform: "uppercase", marginBottom: 4 }}>Próximo retorno solar</Text>
            <Text style={{ color: colores.primario, fontFamily: "Inter_700Bold", fontSize: 18 }}>
              {fecha_retorno.dia} de {meses[fecha_retorno.mes - 1]}, {fecha_retorno.anio}
            </Text>
            <Text style={{ color: colores.textoMuted, fontSize: 12 }}>Error: {rs.error_grados.toFixed(6)}°</Text>
          </Tarjeta>
        </AnimacionEntrada>
        <AnimacionEntrada retraso={100}>
          <RuedaZodiacal planetas={carta_retorno.planetas} casas={carta_retorno.casas} aspectos={carta_retorno.aspectos} />
        </AnimacionEntrada>
        <Text style={{ color: colores.primario, fontFamily: "Inter_600SemiBold", fontSize: 18, marginBottom: 12, marginTop: 16 }}>Planetas del Retorno</Text>
        {carta_retorno.planetas.map((p) => (
          <Tarjeta key={p.nombre} padding="sm" style={{ marginBottom: 8 }}>
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <IconoSigno signo={p.signo} tamaño={16} />
              <Text style={{ color: colores.primario, fontFamily: "Inter_600SemiBold", marginLeft: 8, flex: 1 }}>{p.nombre}</Text>
              <Text style={{ color: colores.textoSecundario, fontSize: 14 }}>{p.signo} {p.grado_en_signo.toFixed(1)}°</Text>
              <Text style={{ color: colores.textoMuted, fontSize: 12, marginLeft: 8 }}>Casa {p.casa}</Text>
              {p.retrogrado && <View style={{ marginLeft: 4 }}><Badge variante="advertencia">R</Badge></View>}
            </View>
          </Tarjeta>
        ))}
        {rs.aspectos_natal_retorno.length > 0 && (
          <>
            <Text style={{ color: colores.primario, fontFamily: "Inter_600SemiBold", fontSize: 18, marginBottom: 12, marginTop: 16 }}>Aspectos Natal-Retorno</Text>
            {rs.aspectos_natal_retorno.slice(0, 15).map((a, i) => (
              <Tarjeta key={i} padding="sm" style={{ marginBottom: 8 }}>
                <View style={{ flexDirection: "row", alignItems: "center" }}>
                  <Text style={{ color: colores.primario, fontSize: 14, flex: 1 }}>{a.planeta_retorno} → {a.planeta_natal}</Text>
                  <Badge variante="info">{a.tipo}</Badge>
                  <Text style={{ color: colores.textoMuted, fontSize: 12, marginLeft: 8 }}>{a.orbe.toFixed(1)}°</Text>
                </View>
              </Tarjeta>
            ))}
          </>
        )}
      </ScrollView>
    </View>
  );
}
