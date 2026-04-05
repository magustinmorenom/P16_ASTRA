import { useState, useRef } from "react";
import {
  Animated,
  Dimensions,
  FlatList,
  Pressable,
  Text,
  View,
  type ViewToken,
} from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MoonStars, Sparkle, UserCircle } from "phosphor-react-native";
import { FondoCosmico } from "@/componentes/layouts/fondo-cosmico";
import { Boton } from "@/componentes/ui/boton";
import { AnimacionEntrada } from "@/componentes/ui/animacion-entrada";
import { IconoAstral } from "@/componentes/ui/icono-astral";
import { usarTema } from "@/lib/hooks/usar-tema";
import { trackEvento, Eventos } from "@/lib/utilidades/analytics";

const { width: ANCHO_PANTALLA } = Dimensions.get("window");

interface PasoOnboarding {
  id: string;
  icono: React.ReactNode;
  titulo: string;
  descripcion: string;
  detalle: string;
}

export default function BienvenidaScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colores, esOscuro } = usarTema();
  const [pasoActual, setPasoActual] = useState(0);
  const flatListRef = useRef<FlatList>(null);

  const pasos: PasoOnboarding[] = [
    {
      id: "1",
      icono: <MoonStars size={48} color={colores.acento} weight="duotone" />,
      titulo: "Tu mapa cósmico personal",
      descripcion:
        "ASTRA combina astrología, Diseño Humano y numerología para darte un pronóstico diario único, basado en tu momento exacto de nacimiento.",
      detalle:
        "No es un horóscopo genérico. Es tu lectura, calculada con precisión astronómica.",
    },
    {
      id: "2",
      icono: <Sparkle size={48} color={colores.acento} weight="duotone" />,
      titulo: "Cada día, tu ritual personalizado",
      descripcion:
        "Recibí tu pronóstico diario con niveles de energía, claridad e intuición. Escuchá podcasts generados para vos y consultá al oráculo.",
      detalle:
        "Todo se recalcula cada día según los tránsitos planetarios y tu carta natal.",
    },
    {
      id: "3",
      icono: <UserCircle size={48} color={colores.acento} weight="duotone" />,
      titulo: "Solo necesitamos una cosa",
      descripcion:
        "Tu fecha, hora y lugar de nacimiento. Con eso activamos todos tus cálculos: carta astral, Diseño Humano, numerología y retorno solar.",
      detalle:
        "Si no sabés tu hora exacta, poné la más aproximada. Después podés corregirla.",
    },
  ];

  const onViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      if (viewableItems.length > 0 && viewableItems[0].index != null) {
        setPasoActual(viewableItems[0].index);
      }
    },
  ).current;

  const avanzar = () => {
    if (pasoActual < pasos.length - 1) {
      trackEvento(Eventos.ONBOARDING_PASO, { paso: pasoActual + 1 });
      flatListRef.current?.scrollToIndex({ index: pasoActual + 1 });
    } else {
      trackEvento(Eventos.ONBOARDING_INICIO);
      router.replace("/(onboarding)/");
    }
  };

  const omitir = () => {
    router.replace("/(onboarding)/");
  };

  return (
    <FondoCosmico intensidad="hero">
      <View
        style={{
          flex: 1,
          paddingTop: insets.top + 16,
          paddingBottom: insets.bottom + 16,
        }}
      >
        {/* Header con botón omitir */}
        <View
          style={{
            flexDirection: "row",
            justifyContent: "flex-end",
            paddingHorizontal: 20,
            marginBottom: 8,
          }}
        >
          <Pressable
            onPress={omitir}
            accessibilityRole="button"
            accessibilityLabel="Omitir introducción"
            hitSlop={12}
          >
            <Text
              style={{
                color: colores.textoSecundario,
                fontSize: 14,
                fontFamily: "Inter_500Medium",
              }}
            >
              Omitir
            </Text>
          </Pressable>
        </View>

        {/* Carrusel */}
        <FlatList
          ref={flatListRef}
          data={pasos}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          bounces={false}
          keyExtractor={(item) => item.id}
          onViewableItemsChanged={onViewableItemsChanged}
          viewabilityConfig={{ viewAreaCoveragePercentThreshold: 50 }}
          renderItem={({ item, index }) => (
            <View
              style={{
                width: ANCHO_PANTALLA,
                paddingHorizontal: 28,
                justifyContent: "center",
                flex: 1,
              }}
            >
              <AnimacionEntrada retraso={index * 100}>
                {/* Icono central */}
                <View
                  style={{
                    width: 96,
                    height: 96,
                    borderRadius: 48,
                    backgroundColor: esOscuro
                      ? "rgba(124,77,255,0.15)"
                      : "rgba(124,77,255,0.1)",
                    borderWidth: 1,
                    borderColor: `${colores.acento}30`,
                    alignItems: "center",
                    justifyContent: "center",
                    alignSelf: "center",
                    marginBottom: 32,
                  }}
                >
                  {item.icono}
                </View>

                {/* Título */}
                <Text
                  accessibilityRole="header"
                  style={{
                    color: colores.primario,
                    fontSize: 28,
                    lineHeight: 34,
                    fontFamily: "Inter_700Bold",
                    textAlign: "center",
                    marginBottom: 16,
                  }}
                >
                  {item.titulo}
                </Text>

                {/* Descripción */}
                <Text
                  style={{
                    color: colores.textoSecundario,
                    fontSize: 16,
                    lineHeight: 24,
                    textAlign: "center",
                    marginBottom: 12,
                    maxWidth: 360,
                    alignSelf: "center",
                  }}
                >
                  {item.descripcion}
                </Text>

                {/* Detalle */}
                <Text
                  style={{
                    color: colores.textoMuted,
                    fontSize: 13,
                    lineHeight: 19,
                    textAlign: "center",
                    fontFamily: "Inter_500Medium",
                    fontStyle: "italic",
                    maxWidth: 320,
                    alignSelf: "center",
                  }}
                >
                  {item.detalle}
                </Text>
              </AnimacionEntrada>
            </View>
          )}
        />

        {/* Indicadores + botón */}
        <View style={{ paddingHorizontal: 28, paddingBottom: 12 }}>
          {/* Dots */}
          <View
            style={{
              flexDirection: "row",
              justifyContent: "center",
              gap: 8,
              marginBottom: 24,
            }}
          >
            {pasos.map((_, i) => (
              <View
                key={i}
                style={{
                  width: pasoActual === i ? 24 : 8,
                  height: 8,
                  borderRadius: 4,
                  backgroundColor:
                    pasoActual === i ? colores.acento : `${colores.acento}33`,
                }}
              />
            ))}
          </View>

          {/* CTA */}
          <Boton onPress={avanzar}>
            {pasoActual === pasos.length - 1
              ? "Completar mis datos"
              : "Siguiente"}
          </Boton>
        </View>
      </View>
    </FondoCosmico>
  );
}
