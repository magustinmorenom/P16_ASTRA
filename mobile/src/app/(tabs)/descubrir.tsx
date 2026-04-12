import { View, Text, ScrollView } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { ArrowRight, Fingerprint, HashStraight, Sparkle } from "phosphor-react-native";
import { FondoCosmico } from "@/componentes/layouts/fondo-cosmico";
import { Tarjeta } from "@/componentes/ui/tarjeta";
import { Badge } from "@/componentes/ui/badge";
import { Boton } from "@/componentes/ui/boton";
import { PresionableAnimado } from "@/componentes/ui/presionable-animado";
import { AnimacionEntrada } from "@/componentes/ui/animacion-entrada";
import { usarTema } from "@/lib/hooks/usar-tema";
import type { Icon } from "phosphor-react-native";

interface ItemDescubrir {
  titulo: string;
  descripcion: string;
  IconoPhosphor: Icon;
  ruta: string;
  etiqueta: string;
}

const MODULOS: ItemDescubrir[] = [
  {
    titulo: "Diseño Humano",
    descripcion: "Tu Body Graph, tipo energético, autoridad interna y centros definidos.",
    IconoPhosphor: Fingerprint,
    ruta: "/(tabs)/diseno-humano",
    etiqueta: "Energía",
  },
  {
    titulo: "Numerología",
    descripcion: "Números maestros, ciclos personales y patrones de tu carta numérica.",
    IconoPhosphor: HashStraight,
    ruta: "/(tabs)/numerologia",
    etiqueta: "Patrón",
  },
];

function TarjetaModulo({ item }: { item: ItemDescubrir }) {
  const router = useRouter();
  const { colores } = usarTema();
  const { IconoPhosphor } = item;

  return (
    <PresionableAnimado
      onPress={() => router.push(item.ruta as never)}
      style={{ width: "100%" }}
    >
      <Tarjeta padding="md" style={{ marginBottom: 12 }}>
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <View
            style={{
              width: 48,
              height: 48,
              borderRadius: 16,
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: colores.fondoSecundario,
              borderWidth: 1,
              borderColor: colores.vidrioBorde,
            }}
          >
            <IconoPhosphor size={24} color={colores.acento} weight="duotone" />
          </View>

          <View style={{ marginLeft: 14, flex: 1 }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 4 }}>
              <Text
                style={{
                  color: colores.primario,
                  fontSize: 17,
                  fontFamily: "Inter_700Bold",
                }}
              >
                {item.titulo}
              </Text>
              <Badge variante="info">{item.etiqueta}</Badge>
            </View>
            <Text
              style={{
                color: colores.textoSecundario,
                fontSize: 13,
                lineHeight: 19,
              }}
            >
              {item.descripcion}
            </Text>
          </View>

          <ArrowRight size={20} color={colores.textoMuted} style={{ marginLeft: 8 }} />
        </View>
      </Tarjeta>
    </PresionableAnimado>
  );
}

export default function PantallaDescubrir() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { colores } = usarTema();

  return (
    <FondoCosmico intensidad="hero">
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          paddingTop: insets.top + 18,
          paddingBottom: 124,
          paddingHorizontal: 16,
        }}
      >
        <AnimacionEntrada>
          <Text
            style={{
              color: colores.primario,
              fontSize: 24,
              lineHeight: 30,
              fontFamily: "Inter_700Bold",
              marginBottom: 6,
            }}
          >
            Explorar
          </Text>
          <Text
            style={{
              color: colores.textoSecundario,
              fontSize: 14,
              lineHeight: 20,
              marginBottom: 22,
            }}
          >
            Herramientas para conocer tu arquitectura personal.
          </Text>
        </AnimacionEntrada>

        <AnimacionEntrada retraso={80}>
          <Tarjeta variante="violeta" style={{ marginBottom: 24 }}>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
              }}
            >
              <View
                style={{
                  width: 50,
                  height: 50,
                  borderRadius: 16,
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: colores.fondoSecundario,
                  borderWidth: 1,
                  borderColor: colores.vidrioBorde,
                }}
              >
                <Sparkle size={26} color={colores.acento} weight="duotone" />
              </View>
              <View style={{ marginLeft: 14, flex: 1 }}>
                <Text
                  style={{
                    color: colores.primario,
                    fontSize: 20,
                    lineHeight: 26,
                    fontFamily: "Inter_700Bold",
                  }}
                >
                  Oráculo ASTRA
                </Text>
                <Text
                  style={{
                    color: colores.textoSecundario,
                    fontSize: 14,
                    lineHeight: 20,
                    marginTop: 4,
                  }}
                >
                  Lectura guiada que ya conoce tu contexto cósmico y tu perfil.
                </Text>
              </View>
            </View>

            <Boton
              tamaño="md"
              onPress={() => router.push("/(features)/suscripcion" as never)}
              style={{ marginTop: 18 }}
            >
              Hacete Premium
            </Boton>
          </Tarjeta>
        </AnimacionEntrada>

        <AnimacionEntrada retraso={140}>
          {MODULOS.map((item, idx) => (
            <AnimacionEntrada key={item.titulo} retraso={140 + idx * 60}>
              <TarjetaModulo item={item} />
            </AnimacionEntrada>
          ))}
        </AnimacionEntrada>
      </ScrollView>
    </FondoCosmico>
  );
}
