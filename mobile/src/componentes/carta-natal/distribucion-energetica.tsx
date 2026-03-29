import { View, Text } from "react-native";
import { usarTema } from "@/lib/hooks/usar-tema";
import {
  calcularDistribucion,
  COLORES_ELEMENTO,
  COLORES_MODALIDAD,
} from "@/lib/utilidades/interpretaciones-natal";
import type { Planeta } from "@/lib/tipos";

interface DistribucionEnergeticaProps {
  planetas: Planeta[];
}

function BarraDistribucion({
  items,
  colores: coloresMap,
  total,
}: {
  items: Record<string, number>;
  colores: Record<string, string>;
  total: number;
}) {
  const { colores } = usarTema();

  return (
    <View>
      {/* Barra visual */}
      <View style={{ flexDirection: "row", height: 10, borderRadius: 5, overflow: "hidden", backgroundColor: colores.fondoSecundario }}>
        {Object.entries(items).map(([nombre, cantidad]) => {
          const pct = total > 0 ? (cantidad / total) * 100 : 0;
          if (pct === 0) return null;
          return (
            <View
              key={nombre}
              style={{
                width: `${pct}%`,
                backgroundColor: coloresMap[nombre] || "#9E9E9E",
              }}
            />
          );
        })}
      </View>
      {/* Etiquetas */}
      <View style={{ flexDirection: "row", marginTop: 6, gap: 12, flexWrap: "wrap" }}>
        {Object.entries(items).map(([nombre, cantidad]) => (
          <View key={nombre} style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
            <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: coloresMap[nombre] || "#9E9E9E" }} />
            <Text style={{ fontSize: 12, fontFamily: "Inter_600SemiBold", color: colores.primario }}>{nombre}</Text>
            <Text style={{ fontSize: 11, color: colores.textoSecundario }}>{cantidad}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

export function DistribucionEnergetica({ planetas }: DistribucionEnergeticaProps) {
  const { colores } = usarTema();
  const dist = calcularDistribucion(planetas);
  const totalElementos = Object.values(dist.elementos).reduce((a, b) => a + b, 0);
  const totalModalidades = Object.values(dist.modalidades).reduce((a, b) => a + b, 0);

  return (
    <View style={{ marginBottom: 20 }}>
      <Text style={{ color: colores.primario, fontFamily: "Inter_600SemiBold", fontSize: 15, marginBottom: 10 }}>
        Distribución Energética
      </Text>
      <View style={{ backgroundColor: colores.superficie, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: colores.borde, gap: 16 }}>
        <View>
          <Text style={{ fontSize: 10, color: colores.textoSecundario, textTransform: "uppercase", letterSpacing: 1, fontFamily: "Inter_600SemiBold", marginBottom: 6 }}>
            Elementos
          </Text>
          <BarraDistribucion items={dist.elementos} colores={COLORES_ELEMENTO} total={totalElementos} />
        </View>
        <View>
          <Text style={{ fontSize: 10, color: colores.textoSecundario, textTransform: "uppercase", letterSpacing: 1, fontFamily: "Inter_600SemiBold", marginBottom: 6 }}>
            Modalidades
          </Text>
          <BarraDistribucion items={dist.modalidades} colores={COLORES_MODALIDAD} total={totalModalidades} />
        </View>
      </View>
    </View>
  );
}
