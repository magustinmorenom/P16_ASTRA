import { View, Platform } from "react-native";
import { Tabs } from "expo-router";
import { BlurView } from "expo-blur";
import { House, MoonStars, ChatCircleDots, Compass, UserCircle } from "phosphor-react-native";
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
                  backgroundColor: `${colores.tabBarFondo}`,
                }}
              />
            ),
          tabBarStyle: {
            position: "absolute",
            backgroundColor: "transparent",
            borderTopColor: colores.tabBarBorde,
            borderTopWidth: 1,
            left: 14,
            right: 14,
            bottom: 12,
            height: 78,
            paddingBottom: 12,
            paddingTop: 8,
            borderRadius: 28,
            overflow: "hidden",
            elevation: 0,
          },
          tabBarLabelStyle: {
            fontSize: 11,
            fontFamily: "Inter_600SemiBold",
          },
          tabBarItemStyle: {
            paddingTop: 2,
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
              <MoonStars size={size} color={color} weight="fill" />
            ),
          }}
        />
        <Tabs.Screen
          name="chat"
          options={{
            title: "Chat",
            tabBarIcon: ({ color, focused }) => (
              <View
                style={{
                  width: focused ? 46 : 42,
                  height: focused ? 46 : 42,
                  borderRadius: 23,
                  alignItems: "center",
                  justifyContent: "center",
                  marginTop: -2,
                  backgroundColor: focused
                    ? `${colores.acento}22`
                    : esOscuro
                      ? "rgba(255,255,255,0.04)"
                      : "rgba(124,77,255,0.08)",
                  borderWidth: 1,
                  borderColor: focused ? `${colores.acento}40` : "transparent",
                }}
              >
                <ChatCircleDots
                  size={focused ? 22 : 20}
                  color={focused ? colores.acento : color}
                  weight="fill"
                />
              </View>
            ),
          }}
        />
        <Tabs.Screen
          name="descubrir"
          options={{
            title: "Explorar",
            tabBarIcon: ({ color, size }) => (
              <Compass size={size} color={color} weight="fill" />
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
        <Tabs.Screen
          name="podcast"
          options={{
            href: null,
          }}
        />
      </Tabs>

      {pistaActual && <MiniReproductor />}
    </View>
  );
}
