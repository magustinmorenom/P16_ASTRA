import { useEffect, useRef } from "react";
import { Animated, type ViewStyle } from "react-native";
import { usarTema } from "@/lib/hooks/usar-tema";

interface EsqueletoProps {
  className?: string;
  style?: ViewStyle;
  width?: number | string;
  height?: number | string;
}

export function Esqueleto({ className, style, width, height }: EsqueletoProps) {
  const { colores } = usarTema();
  const opacidad = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const animacion = Animated.loop(
      Animated.sequence([
        Animated.timing(opacidad, {
          toValue: 0.7,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(opacidad, {
          toValue: 0.3,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    );
    animacion.start();
    return () => animacion.stop();
  }, []);

  return (
    <Animated.View
      style={[
        {
          backgroundColor: colores.superficie,
          borderRadius: 12,
          width,
          height,
        },
        style,
        { opacity: opacidad },
      ]}
      className={className}
    />
  );
}
