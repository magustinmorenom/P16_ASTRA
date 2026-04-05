import { useRef } from "react";
import {
  Pressable,
  Animated,
  type PressableProps,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import { haptico } from "@/lib/utilidades/hapticos";

interface PresionableAnimadoProps extends Omit<PressableProps, "style"> {
  children: React.ReactNode;
  escala?: number;
  duracion?: number;
  sinHaptico?: boolean;
  style?: StyleProp<ViewStyle>;
  accessibilityRole?: PressableProps["accessibilityRole"];
  accessibilityLabel?: string;
  accessibilityState?: PressableProps["accessibilityState"];
  accessibilityHint?: string;
}

export function PresionableAnimado({
  children,
  escala = 0.97,
  duracion = 100,
  sinHaptico = false,
  onPressIn,
  onPressOut,
  style,
  ...rest
}: PresionableAnimadoProps) {
  const scale = useRef(new Animated.Value(1)).current;

  return (
    <Pressable
      onPressIn={(e) => {
        Animated.timing(scale, {
          toValue: escala,
          duration: duracion,
          useNativeDriver: true,
        }).start();
        if (!sinHaptico) haptico.toque();
        onPressIn?.(e);
      }}
      onPressOut={(e) => {
        Animated.timing(scale, {
          toValue: 1,
          duration: duracion,
          useNativeDriver: true,
        }).start();
        onPressOut?.(e);
      }}
      {...rest}
    >
      <Animated.View style={[style, { transform: [{ scale }] }]}>
        {children}
      </Animated.View>
    </Pressable>
  );
}
