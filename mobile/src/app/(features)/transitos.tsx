import { View, Text, ScrollView } from "react-native";
import { HeaderMobile } from "@/componentes/layouts/header-mobile";
import { Tarjeta } from "@/componentes/ui/tarjeta";
import { Badge } from "@/componentes/ui/badge";
import { Esqueleto } from "@/componentes/ui/esqueleto";
import { AnimacionEntrada } from "@/componentes/ui/animacion-entrada";
import { IconoSigno } from "@/componentes/ui/icono-astral";
import { EstadoTimeout } from "@/componentes/feedback/estado-timeout";
import { usarTransitos } from "@/lib/hooks/usar-transitos";
import { usarTema } from "@/lib/hooks/usar-tema";

export default function TransitosScreen() {
  const { data: transitos, isLoading, error, refetch } = usarTransitos();
  const { colores } = usarTema();

  const esqueletoTransitos = (
    <View style={{ gap: 12, paddingTop: 16 }}>
      {Array.from({ length: 10 }).map((_, i) => (
        <Esqueleto key={i} style={{ height: 64, borderRadius: 12 }} />
      ))}
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: colores.fondo }}>
      <HeaderMobile titulo="Tránsitos en Vivo" />
      <ScrollView contentContainerStyle={{ paddingBottom: 40, paddingHorizontal: 16 }}>
        {transitos && (
          <Text style={{ color: colores.textoMuted, fontSize: 12, marginTop: 16, marginBottom: 16 }}>
            Actualizado: {new Date(transitos.fecha_utc).toLocaleTimeString()}
          </Text>
        )}
        <EstadoTimeout
          cargando={isLoading}
          error={error}
          onReintentar={() => refetch()}
          esqueleto={esqueletoTransitos}
        >
          <AnimacionEntrada>
            <View style={{ gap: 12 }}>
              {transitos?.planetas.map((p) => (
                <Tarjeta key={p.nombre} padding="sm">
                  <View style={{ flexDirection: "row", alignItems: "center" }}>
                    <IconoSigno signo={p.signo} tamaño={24} />
                    <View style={{ marginLeft: 12, flex: 1 }}>
                      <Text style={{ color: colores.primario, fontFamily: "Inter_600SemiBold" }}>{p.nombre}</Text>
                      <Text style={{ color: colores.textoMuted, fontSize: 12 }}>{p.signo} {p.grado_en_signo.toFixed(2)}°</Text>
                    </View>
                    {p.retrogrado && <Badge variante="advertencia">R</Badge>}
                    <Text style={{ color: colores.textoMuted, fontSize: 12, marginLeft: 8 }}>
                      {p.velocidad > 0 ? "+" : ""}{p.velocidad.toFixed(4)}°/d
                    </Text>
                  </View>
                </Tarjeta>
              ))}
            </View>
          </AnimacionEntrada>
        </EstadoTimeout>
      </ScrollView>
    </View>
  );
}
