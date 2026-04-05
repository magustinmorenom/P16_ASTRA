import { View, Text, ScrollView } from "react-native";
import { HeaderMobile } from "@/componentes/layouts/header-mobile";
import { Tarjeta } from "@/componentes/ui/tarjeta";
import { Badge } from "@/componentes/ui/badge";
import { Esqueleto } from "@/componentes/ui/esqueleto";
import { AnimacionEntrada } from "@/componentes/ui/animacion-entrada";
import { EstadoTimeout } from "@/componentes/feedback/estado-timeout";
import { BodyGraph } from "@/componentes/visualizaciones/body-graph";
import { usarMisCalculos } from "@/lib/hooks/usar-mis-calculos";
import { usarTema } from "@/lib/hooks/usar-tema";

export default function DisenoHumanoScreen() {
  const { data: calculos, isLoading, error, refetch } = usarMisCalculos();
  const { colores } = usarTema();
  const hd = calculos?.diseno_humano;

  const esqueleto = (
    <View style={{ padding: 16, gap: 12 }}>
      <Esqueleto style={{ height: 160, borderRadius: 16 }} />
      <Esqueleto style={{ height: 80, borderRadius: 12 }} />
    </View>
  );

  if (!isLoading && !hd) {
    return (
      <View style={{ flex: 1, backgroundColor: colores.fondo }}>
        <HeaderMobile titulo="Diseño Humano" />
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 32 }}>
          <Text style={{ color: colores.textoSecundario, textAlign: "center" }}>
            Completá tu perfil para ver tu Diseño Humano
          </Text>
        </View>
      </View>
    );
  }

  const centrosDefinidos = hd
    ? Object.entries(hd.centros)
        .filter(([, v]) => v === "definido")
        .map(([k]) => k)
    : [];

  return (
    <View style={{ flex: 1, backgroundColor: colores.fondo }}>
      <HeaderMobile titulo="Diseño Humano" />
      <ScrollView contentContainerStyle={{ paddingBottom: 40, paddingHorizontal: 16 }}>
        <EstadoTimeout
          cargando={isLoading}
          error={error}
          onReintentar={() => refetch()}
          esqueleto={esqueleto}
        >
          <AnimacionEntrada>
            <View style={{ flexDirection: "row", gap: 12, marginBottom: 16, marginTop: 16 }}>
              <View style={{ flex: 1 }}>
                <Tarjeta variante="acento" style={{ alignItems: "center" }}>
                  <Text style={{ color: colores.textoSecundario, fontSize: 11, textTransform: "uppercase" }}>Tipo</Text>
                  <Text style={{ color: colores.primario, fontFamily: "Inter_700Bold", fontSize: 18 }}>{hd?.tipo}</Text>
                </Tarjeta>
              </View>
              <View style={{ flex: 1 }}>
                <Tarjeta variante="violeta" style={{ alignItems: "center" }}>
                  <Text style={{ color: colores.textoSecundario, fontSize: 11, textTransform: "uppercase" }}>Autoridad</Text>
                  <Text style={{ color: colores.primario, fontFamily: "Inter_700Bold", fontSize: 14 }}>{hd?.autoridad}</Text>
                </Tarjeta>
              </View>
              <View style={{ flex: 1 }}>
                <Tarjeta variante="dorado" style={{ alignItems: "center" }}>
                  <Text style={{ color: colores.textoSecundario, fontSize: 11, textTransform: "uppercase" }}>Perfil</Text>
                  <Text style={{ color: colores.primario, fontFamily: "Inter_700Bold", fontSize: 18 }}>{hd?.perfil}</Text>
                </Tarjeta>
              </View>
            </View>
          </AnimacionEntrada>

          {hd && (
            <AnimacionEntrada retraso={100}>
              <BodyGraph datos={hd} />
            </AnimacionEntrada>
          )}

          <Text style={{ color: colores.primario, fontFamily: "Inter_600SemiBold", fontSize: 18, marginBottom: 12, marginTop: 16 }}>
            Centros Definidos
          </Text>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 16 }}>
            {centrosDefinidos.map((c) => (
              <Badge key={c} variante="info">{c}</Badge>
            ))}
          </View>

          {hd && hd.canales.length > 0 && (
            <>
              <Text style={{ color: colores.primario, fontFamily: "Inter_600SemiBold", fontSize: 18, marginBottom: 12 }}>
                Canales
              </Text>
              {hd.canales.map((canal, i) => (
                <Tarjeta key={i} padding="sm" style={{ marginBottom: 8 }}>
                  <Text style={{ color: colores.primario, fontFamily: "Inter_500Medium" }}>{canal.nombre}</Text>
                  <Text style={{ color: colores.textoMuted, fontSize: 12 }}>
                    Puertas {canal.puertas.join("-")} · {canal.centros.join(" → ")}
                  </Text>
                </Tarjeta>
              ))}
            </>
          )}

          {hd && (
            <>
              <Text style={{ color: colores.primario, fontFamily: "Inter_600SemiBold", fontSize: 18, marginBottom: 12, marginTop: 16 }}>
                Cruz de Encarnación
              </Text>
              <Tarjeta variante="violeta">
                <Text style={{ color: colores.primario, fontSize: 14 }}>
                  Puertas: {hd.cruz_encarnacion.puertas.filter(Boolean).join(" / ")}
                </Text>
              </Tarjeta>
            </>
          )}
        </EstadoTimeout>
      </ScrollView>
    </View>
  );
}
