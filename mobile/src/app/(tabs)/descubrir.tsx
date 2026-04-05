import { View, Text, ScrollView } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { ArrowRight } from "phosphor-react-native";
import { FondoCosmico } from "@/componentes/layouts/fondo-cosmico";
import { Tarjeta } from "@/componentes/ui/tarjeta";
import { Badge } from "@/componentes/ui/badge";
import { Boton } from "@/componentes/ui/boton";
import { PresionableAnimado } from "@/componentes/ui/presionable-animado";
import { AnimacionEntrada } from "@/componentes/ui/animacion-entrada";
import { IconoAstral } from "@/componentes/ui/icono-astral";
import { usarTema } from "@/lib/hooks/usar-tema";

interface ItemDescubrir {
  titulo: string;
  descripcion: string;
  icono: string;
  ruta: string;
  etiqueta: string;
}

const IDENTIDAD: ItemDescubrir[] = [
  {
    titulo: "Diseno Humano",
    descripcion: "Tu Body Graph, autoridad y centros definidos.",
    icono: "personal",
    ruta: "/(features)/diseno-humano",
    etiqueta: "Energia",
  },
  {
    titulo: "Numerologia",
    descripcion: "Lecturas base y numeros maestros para tu ciclo.",
    icono: "numerologia",
    ruta: "/(features)/numerologia",
    etiqueta: "Patron",
  },
  {
    titulo: "Retorno Solar",
    descripcion: "La narrativa del anio que estas atravesando.",
    icono: "astrologia",
    ruta: "/(features)/retorno-solar",
    etiqueta: "Anual",
  },
];

const TIEMPO: ItemDescubrir[] = [
  {
    titulo: "Calendario Cosmico",
    descripcion: "Seguimiento diario para leer el clima de cada jornada.",
    icono: "horoscopo",
    ruta: "/(features)/calendario-cosmico",
    etiqueta: "Ritmo",
  },
  {
    titulo: "Transitos en vivo",
    descripcion: "Posiciones actuales para consulta puntual y contexto.",
    icono: "astrologia",
    ruta: "/(features)/transitos",
    etiqueta: "Ahora",
  },
];

function EncabezadoSeccion({
  titulo,
  descripcion,
}: {
  titulo: string;
  descripcion: string;
}) {
  const { colores } = usarTema();

  return (
    <View style={{ marginBottom: 14 }}>
      <Text
        style={{
          color: colores.primario,
          fontSize: 19,
          fontFamily: "Inter_700Bold",
        }}
      >
        {titulo}
      </Text>
      <Text
        style={{
          color: colores.textoSecundario,
          fontSize: 13,
          lineHeight: 19,
          marginTop: 4,
        }}
      >
        {descripcion}
      </Text>
    </View>
  );
}

function TarjetaModulo({
  item,
  fullWidth = false,
}: {
  item: ItemDescubrir;
  fullWidth?: boolean;
}) {
  const router = useRouter();
  const { colores } = usarTema();

  return (
    <PresionableAnimado
      onPress={() => router.push(item.ruta as never)}
      style={fullWidth ? { width: "100%" } : { flex: 1 }}
    >
      <Tarjeta
        padding="md"
        style={{ marginBottom: 12, minHeight: fullWidth ? 132 : 168 }}
        variante={fullWidth ? "violeta" : "default"}
      >
        <Badge variante="info">{item.etiqueta}</Badge>

        <View
          style={{
            width: 42,
            height: 42,
            borderRadius: 21,
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: `${colores.acento}14`,
            borderWidth: 1,
            borderColor: `${colores.acento}28`,
            marginTop: 16,
          }}
        >
          <IconoAstral nombre={item.icono} tamaño={22} />
        </View>

        <Text
          style={{
            color: colores.primario,
            fontSize: 17,
            lineHeight: 22,
            fontFamily: "Inter_700Bold",
            marginTop: 14,
          }}
        >
          {item.titulo}
        </Text>

        <Text
          style={{
            color: colores.textoSecundario,
            fontSize: 13,
            lineHeight: 19,
            marginTop: 8,
          }}
        >
          {item.descripcion}
        </Text>

        <View style={{ flexDirection: "row", alignItems: "center", marginTop: 18 }}>
          <Text
            style={{
              color: colores.acento,
              fontSize: 13,
              fontFamily: "Inter_600SemiBold",
            }}
          >
            Abrir modulo
          </Text>
          <ArrowRight size={16} color={colores.acento} />
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
          <Badge variante="info">Biblioteca ASTRA</Badge>
          <Text
            style={{
              color: colores.primario,
              fontSize: 30,
              lineHeight: 36,
              fontFamily: "Inter_700Bold",
              marginTop: 14,
            }}
          >
            Elegi por donde profundizar hoy
          </Text>
          <Text
            style={{
              color: colores.textoSecundario,
              fontSize: 15,
              lineHeight: 22,
              marginTop: 12,
              marginBottom: 22,
            }}
          >
            En vez de una grilla plana, aca tenes las herramientas agrupadas por
            intencion para entrar con mas contexto.
          </Text>
        </AnimacionEntrada>

        <AnimacionEntrada retraso={80}>
          <Tarjeta variante="violeta" style={{ marginBottom: 24 }}>
            <Badge variante="info">Premium</Badge>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                marginTop: 16,
              }}
            >
              <View
                style={{
                  width: 50,
                  height: 50,
                  borderRadius: 25,
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: `${colores.acento}16`,
                  borderWidth: 1,
                  borderColor: `${colores.acento}28`,
                }}
              >
                <IconoAstral nombre="bola-cristal" tamaño={24} />
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
                  Oraculo ASTRA
                </Text>
                <Text
                  style={{
                    color: colores.textoSecundario,
                    fontSize: 14,
                    lineHeight: 20,
                    marginTop: 6,
                  }}
                >
                  Conversa con una lectura guiada que ya conoce tu contexto cosmico,
                  tu perfil y el momento actual.
                </Text>
              </View>
            </View>

            <View style={{ flexDirection: "row", gap: 10, marginTop: 18 }}>
              <Boton
                tamaño="sm"
                onPress={() => router.push("/(tabs)/chat" as never)}
              >
                Abrir chat
              </Boton>
              <Boton
                tamaño="sm"
                variante="secundario"
                onPress={() => router.push("/(features)/suscripcion" as never)}
              >
                Ver planes
              </Boton>
            </View>
          </Tarjeta>
        </AnimacionEntrada>

        <AnimacionEntrada retraso={140}>
          <EncabezadoSeccion
            titulo="Tu arquitectura personal"
            descripcion="Herramientas para entender identidad, patron energetico y grandes ciclos."
          />
          <View style={{ flexDirection: "row", gap: 12 }}>
            <TarjetaModulo item={IDENTIDAD[0]} />
            <TarjetaModulo item={IDENTIDAD[1]} />
          </View>
          <TarjetaModulo item={IDENTIDAD[2]} fullWidth />
        </AnimacionEntrada>

        <AnimacionEntrada retraso={220}>
          <EncabezadoSeccion
            titulo="Tiempo cosmico"
            descripcion="Lecturas para bajar el cielo al presente y decidir con mejor timing."
          />
          {TIEMPO.map((item) => (
            <TarjetaModulo key={item.titulo} item={item} fullWidth />
          ))}
        </AnimacionEntrada>

        <AnimacionEntrada retraso={300}>
          <Tarjeta style={{ marginTop: 12 }}>
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <View
                style={{
                  width: 42,
                  height: 42,
                  borderRadius: 21,
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: `${colores.acento}14`,
                  borderWidth: 1,
                  borderColor: `${colores.acento}28`,
                }}
              >
                <IconoAstral nombre="astrologia" tamaño={20} />
              </View>
              <View style={{ marginLeft: 12, flex: 1 }}>
                <Text
                  style={{
                    color: colores.primario,
                    fontSize: 16,
                    fontFamily: "Inter_700Bold",
                  }}
                >
                  Tu carta astral vive aparte
                </Text>
                <Text
                  style={{
                    color: colores.textoSecundario,
                    fontSize: 13,
                    lineHeight: 19,
                    marginTop: 4,
                  }}
                >
                  La pestaña Astral queda como vista principal para la rueda, la triada y
                  el detalle tecnico.
                </Text>
              </View>
              <Boton
                tamaño="sm"
                variante="secundario"
                onPress={() => router.push("/(tabs)/astral" as never)}
              >
                Ir
              </Boton>
            </View>
          </Tarjeta>
        </AnimacionEntrada>
      </ScrollView>
    </FondoCosmico>
  );
}
