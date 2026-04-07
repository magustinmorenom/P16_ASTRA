import React, { useEffect } from "react";
import { StyleProp, ViewStyle, View } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
  withSequence,
} from "react-native-reanimated";

interface Props {
  size?: number;
  intensidad?: number; // 0 para idle, 1 para active
  style?: StyleProp<ViewStyle>;
}

export function OrbeCosmico({ size = 60, intensidad = 0, style }: Props) {
  const rotation1 = useSharedValue(0);
  const rotation2 = useSharedValue(0);
  const pulso = useSharedValue(1);

  useEffect(() => {
    // Si la intensidad es mayor a 0, la animación "piensa" más rápido
    const durationObj = intensidad > 0 ? 1200 : 4000;
    const pulsoDuration = intensidad > 0 ? 800 : 2000;
    const maxScale = intensidad > 0 ? 1.15 : 1.04;

    rotation1.value = withRepeat(
      withTiming(360, { duration: durationObj, easing: Easing.linear }),
      -1
    );

    // Gira en sentido contrario a distinta velocidad para crear asimetría natural
    rotation2.value = withRepeat(
      withTiming(-360, { duration: durationObj * 1.5, easing: Easing.linear }),
      -1
    );

    pulso.value = withRepeat(
      withSequence(
        withTiming(maxScale, { duration: pulsoDuration, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: pulsoDuration, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );
  }, [intensidad]);

  const animatedStyle1 = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation1.value}deg` }],
  }));

  const animatedStyle2 = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation2.value}deg` }],
  }));

  const scaleStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulso.value }],
  }));

  const shadowBase = Math.max(10, size * 0.2);

  return (
    <Animated.View 
      style={[{ width: size, height: size, alignItems: "center", justifyContent: "center" }, scaleStyle, style]}
      pointerEvents="none"
    >
      {/* Círculo Principal - Violeta */}
      <Animated.View
        style={[
          {
            position: "absolute",
            width: size * 0.8,
            height: size * 0.8,
            borderRadius: size * 0.4,
            backgroundColor: "#7C4DFF",
            opacity: 0.85,
            shadowColor: "#c084fc",
            shadowOffset: { width: 0, height: 0 },
            shadowOpacity: 0.9,
            shadowRadius: shadowBase,
            elevation: 10,
          },
          animatedStyle1,
        ]}
      />

      {/* Círculo Secundario Oscilante - Violeta Claro */}
      <Animated.View
        style={[
          {
            position: "absolute",
            width: size * 0.65,
            height: size * 0.75,
            borderRadius: size * 0.35,
            backgroundColor: "#c084fc", // Acento lighter
            opacity: 0.6,
            top: "10%",
            left: "15%",
            shadowColor: "#c084fc",
            shadowOffset: { width: 0, height: 0 },
            shadowOpacity: 0.7,
            shadowRadius: shadowBase * 0.8,
            elevation: 8,
          },
            animatedStyle2,
        ]}
      />

      {/* Destello Fondo Noche - Azul Profundo */}
      <Animated.View
        style={[
          {
            position: "absolute",
            width: size * 0.5,
            height: size * 0.4,
            borderRadius: size * 0.25,
            backgroundColor: "#4A2D8C",
            opacity: 0.7,
            bottom: "20%",
            right: "15%",
            shadowColor: "#4A2D8C",
            shadowOffset: { width: 0, height: 0 },
            shadowOpacity: 0.5,
            shadowRadius: shadowBase * 0.5,
            elevation: 6,
          },
          animatedStyle1,
        ]}
      />
    </Animated.View>
  );
}
