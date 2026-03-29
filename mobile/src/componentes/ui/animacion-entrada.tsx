import { useEffect, useRef } from "react";
import { Animated, Easing, type ViewStyle } from "react-native";

interface AnimacionEntradaProps {
  children: React.ReactNode;
  retraso?: number;
  duracion?: number;
  desplazamiento?: number;
  className?: string;
  style?: ViewStyle;
}

export function AnimacionEntrada({
  children,
  retraso = 0,
  duracion = 400,
  desplazamiento = 20,
  className,
  style,
}: AnimacionEntradaProps) {
  const opacidad = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(desplazamiento)).current;

  useEffect(() => {
    const animacion = Animated.parallel([
      Animated.timing(opacidad, {
        toValue: 1,
        duration: duracion,
        delay: retraso,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: duracion,
        delay: retraso,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]);
    animacion.start();
  }, []);

  return (
    <Animated.View
      className={className}
      style={[style, { opacity: opacidad, transform: [{ translateY }] }]}
    >
      {children}
    </Animated.View>
  );
}
