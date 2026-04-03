import { useRef } from "react";
import {
  Pressable,
  Animated,
  type PressableProps,
  type StyleProp,
  type ViewStyle,
} from "react-native";

interface PresionableAnimadoProps extends Omit<PressableProps, "style"> {
  children: React.ReactNode;
  escala?: number;
  duracion?: number;
  style?: StyleProp<ViewStyle>;
}

export function PresionableAnimado({
  children,
  escala = 0.97,
  duracion = 100,
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
