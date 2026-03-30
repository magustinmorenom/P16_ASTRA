import { View, Text, ScrollView } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import {
  Fingerprint,
  Hash,
  Planet,
  SunHorizon,
  ChartLine,
} from "phosphor-react-native";
import { PresionableAnimado } from "@/componentes/ui/presionable-animado";
import { AnimacionEntrada } from "@/componentes/ui/animacion-entrada";
import { usarTema } from "@/lib/hooks/usar-tema";

interface CardDescubrirProps {
  titulo: string;
  descripcion: string;
  icono: React.ReactNode;
  colores: [string, string];
  ruta: string;
  fullWidth?: boolean;
}

function CardDescubrir({
  titulo,
  descripcion,
  icono,
  colores,
  ruta,
  fullWidth,
}: CardDescubrirProps) {
  const router = useRouter();

  return (
    <PresionableAnimado
      onPress={() => router.push(ruta as never)}
      style={fullWidth ? { width: "100%" } : { flex: 1 }}
    >
      <LinearGradient
        colors={colores}
        style={{ borderRadius: 16, padding: 16, minHeight: 120 }}
      >
        <View style={{ marginBottom: 8 }}>{icono}</View>
        <Text style={{ color: "white", fontFamily: "Inter_700Bold", fontSize: 16 }}>
          {titulo}
        </Text>
        <Text style={{ color: "rgba(255,255,255,0.6)", fontSize: 12, marginTop: 4 }}>
          {descripcion}
        </Text>
      </LinearGradient>
    </PresionableAnimado>
  );
}

export default function PantallaDescubrir() {
  const insets = useSafeAreaInsets();
  const { colores } = usarTema();

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
          Descubrir
        </Text>
      </AnimacionEntrada>

      {/* Grid 2x2 */}
      <AnimacionEntrada retraso={100}>
        <View style={{ flexDirection: "row", gap: 12, marginBottom: 12 }}>
          <CardDescubrir
            titulo="Diseño Humano"
            descripcion="Tu Body Graph y tipo energético"
            icono={<Fingerprint size={28} color="white" />}
            colores={["#7C3AED", "#4F46E5"]}
            ruta="/(features)/diseno-humano"
          />
          <CardDescubrir
            titulo="Numerología"
            descripcion="Tus números maestros"
            icono={<Hash size={28} color="white" />}
            colores={["#DB2777", "#9333EA"]}
            ruta="/(features)/numerologia"
          />
        </View>
      </AnimacionEntrada>

      <AnimacionEntrada retraso={200}>
        <View style={{ flexDirection: "row", gap: 12, marginBottom: 12 }}>
          <CardDescubrir
            titulo="Calendario Cósmico"
            descripcion="Tránsitos día a día"
            icono={<Planet size={28} color="white" />}
            colores={["#0891B2", "#4338CA"]}
            ruta="/(features)/calendario-cosmico"
          />
          <CardDescubrir
            titulo="Retorno Solar"
            descripcion="Tu año cósmico personal"
            icono={<SunHorizon size={28} color="white" />}
            colores={["#D97706", "#B45309"]}
            ruta="/(features)/retorno-solar"
          />
        </View>
      </AnimacionEntrada>

      {/* Full width */}
      <AnimacionEntrada retraso={300}>
        <CardDescubrir
          titulo="Tránsitos en Vivo"
          descripcion="Posiciones planetarias en tiempo real"
          icono={<ChartLine size={28} color="white" />}
          colores={["#059669", "#0D9488"]}
          ruta="/(features)/transitos"
          fullWidth
        />
      </AnimacionEntrada>
    </ScrollView>
  );
}
