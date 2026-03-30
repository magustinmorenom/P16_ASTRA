import { View, Platform } from "react-native";
import { Tabs } from "expo-router";
import { BlurView } from "expo-blur";
import { House, Star, Compass, Microphone, UserCircle } from "phosphor-react-native";
import { MiniReproductor } from "@/componentes/layouts/mini-reproductor";
import { useStoreUI } from "@/lib/stores/store-ui";
import { usarTema } from "@/lib/hooks/usar-tema";

export default function LayoutTabs() {
  const pistaActual = useStoreUI((s) => s.pistaActual);
  const { colores, esOscuro } = usarTema();

  return (
    <View style={{ flex: 1, backgroundColor: colores.fondo }}>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: colores.tabBarActivo,
          tabBarInactiveTintColor: colores.tabBarInactivo,
          tabBarBackground: () =>
            Platform.OS === "ios" ? (
              <BlurView
                intensity={60}
                tint={esOscuro ? "dark" : "light"}
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                }}
              >
                <View
                  style={{
                    flex: 1,
                    backgroundColor: colores.vidrioOverlay,
                  }}
                />
              </BlurView>
            ) : (
              <View
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  backgroundColor: colores.tabBarFondo,
                }}
              />
            ),
          tabBarStyle: {
            position: "absolute",
            backgroundColor: "transparent",
            borderTopColor: colores.tabBarBorde,
            borderTopWidth: 1,
            height: 85,
            paddingBottom: 20,
            paddingTop: 8,
            elevation: 0,
          },
          tabBarLabelStyle: {
            fontSize: 11,
            fontFamily: "Inter_600SemiBold",
          },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: "Inicio",
            tabBarIcon: ({ color, size }) => (
              <House size={size} color={color} weight="fill" />
            ),
          }}
        />
        <Tabs.Screen
          name="astral"
          options={{
            title: "Astral",
            tabBarIcon: ({ color, size }) => (
              <Star size={size} color={color} weight="fill" />
            ),
          }}
        />
        <Tabs.Screen
          name="descubrir"
          options={{
            title: "Descubrir",
            tabBarIcon: ({ color, size }) => (
              <Compass size={size} color={color} weight="fill" />
            ),
          }}
        />
        <Tabs.Screen
          name="podcast"
          options={{
            title: "Podcasts",
            tabBarIcon: ({ color, size }) => (
              <Microphone size={size} color={color} weight="fill" />
            ),
          }}
        />
        <Tabs.Screen
          name="perfil"
          options={{
            title: "Perfil",
            tabBarIcon: ({ color, size }) => (
              <UserCircle size={size} color={color} weight="fill" />
            ),
          }}
        />
      </Tabs>

      {pistaActual && <MiniReproductor />}
    </View>
  );
}
