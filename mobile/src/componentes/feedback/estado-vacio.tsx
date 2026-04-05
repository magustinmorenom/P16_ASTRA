import { View, Text } from "react-native";
import {
  ShootingStar,
  CloudSlash,
  ChatCircleDots,
  Waveform,
  MoonStars,
  Compass,
  CalendarBlank,
  Lightning,
} from "phosphor-react-native";
import { Boton } from "@/componentes/ui/boton";
import { AnimacionEntrada } from "@/componentes/ui/animacion-entrada";
import { usarTema } from "@/lib/hooks/usar-tema";
import type { ComponentType } from "react";

interface IconoProps {
  size: number;
  color: string;
  weight?: "regular" | "fill" | "bold";
}

const ICONOS_MAPA: Record<string, ComponentType<IconoProps>> = {
  "shooting-star": ShootingStar,
  "cloud-slash": CloudSlash,
  chat: ChatCircleDots,
  waveform: Waveform,
  moon: MoonStars,
  compass: Compass,
  calendario: CalendarBlank,
  energia: Lightning,
};

interface EstadoVacioProps {
  icono?: keyof typeof ICONOS_MAPA;
  titulo: string;
  descripcion: string;
  accion?: {
    texto: string;
    onPress: () => void;
  };
}

export function EstadoVacio({
  icono = "shooting-star",
  titulo,
  descripcion,
  accion,
}: EstadoVacioProps) {
  const { colores, esOscuro } = usarTema();
  const Icono = ICONOS_MAPA[icono] ?? ShootingStar;

  return (
    <AnimacionEntrada duracion={400}>
      <View
        style={{
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
          paddingHorizontal: 32,
          paddingVertical: 48,
        }}
      >
        <View
          style={{
            width: 80,
            height: 80,
            borderRadius: 40,
            backgroundColor: esOscuro
              ? "rgba(192, 132, 252, 0.1)"
              : "rgba(124, 77, 255, 0.08)",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 24,
          }}
        >
          <Icono size={40} color={colores.acento} weight="regular" />
        </View>

        <Text
          style={{
            color: colores.primario,
            fontSize: 20,
            fontFamily: "Inter_700Bold",
            textAlign: "center",
            marginBottom: 8,
          }}
        >
          {titulo}
        </Text>

        <Text
          style={{
            color: colores.textoSecundario,
            fontSize: 15,
            textAlign: "center",
            lineHeight: 22,
            marginBottom: accion ? 28 : 0,
            maxWidth: 300,
          }}
        >
          {descripcion}
        </Text>

        {accion && (
          <Boton onPress={accion.onPress} style={{ minWidth: 200 }}>
            {accion.texto}
          </Boton>
        )}
      </View>
    </AnimacionEntrada>
  );
}
