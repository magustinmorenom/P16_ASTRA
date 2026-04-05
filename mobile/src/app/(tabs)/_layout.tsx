import { useCallback, useState } from "react";
import { Pressable, View, Platform } from "react-native";
import { Tabs } from "expo-router";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import { House, MoonStars, ChatCircleDots, Compass, Microphone } from "phosphor-react-native";
import { MiniReproductor } from "@/componentes/layouts/mini-reproductor";
import { SheetChat } from "@/componentes/layouts/sheet-chat";
import { useStoreUI } from "@/lib/stores/store-ui";
import { usarTema } from "@/lib/hooks/usar-tema";
import { haptico } from "@/lib/utilidades/hapticos";

const TAB_H = 80;
const FADE_H = 28;
const FAB = 58;

export default function LayoutTabs() {
  const pistaActual = useStoreUI((s) => s.pistaActual);
  const { colores, esOscuro } = usarTema();
  const [chatAbierto, setChatAbierto] = useState(false);

  const violeta = esOscuro ? "#2D1B69" : "#3B1F8E";

  const abrirChat = useCallback(() => {
    haptico.toque();
    setChatAbierto(true);
  }, []);

  const cerrarChat = useCallback(() => {
    setChatAbierto(false);
  }, []);

  return (
    <View style={{ flex: 1, backgroundColor: colores.fondo }}>
      <Tabs
        screenOptions={{
          headerShown: false,
          animation: "fade",
          tabBarActiveTintColor: "#FFFFFF",
          tabBarInactiveTintColor: "rgba(255,255,255,0.4)",
          tabBarBackground: () =>
            Platform.OS === "ios" ? (
              <BlurView
                intensity={90}
                tint="dark"
                style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}
              >
                <View style={{ flex: 1, backgroundColor: `${violeta}E0` }} />
              </BlurView>
            ) : (
              <View
                style={{
                  position: "absolute",
                  top: 0, left: 0, right: 0, bottom: 0,
                  backgroundColor: `${violeta}F5`,
                }}
              />
            ),
          tabBarStyle: {
            position: "absolute",
            backgroundColor: "transparent",
            borderTopWidth: 0,
            left: 0,
            right: 0,
            bottom: 0,
            height: TAB_H,
            paddingBottom: 18,
            paddingTop: 10,
            elevation: 0,
          },
          tabBarLabelStyle: {
            fontSize: 10,
            fontFamily: "Inter_600SemiBold",
            marginTop: 2,
          },
          tabBarItemStyle: {
            paddingTop: 4,
          },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: "Inicio",
            tabBarIcon: ({ color }) => <House size={22} color={color} weight="fill" />,
          }}
        />
        <Tabs.Screen
          name="astral"
          options={{
            title: "Astral",
            tabBarIcon: ({ color }) => <MoonStars size={22} color={color} weight="fill" />,
          }}
        />
        {/* Spacer central para el FAB */}
        <Tabs.Screen
          name="chat"
          options={{
            href: null,
            tabBarItemStyle: { display: "none" },
          }}
        />
        <Tabs.Screen
          name="descubrir"
          options={{
            title: "Explorar",
            tabBarIcon: ({ color }) => <Compass size={22} color={color} weight="fill" />,
          }}
        />
        <Tabs.Screen
          name="perfil"
          options={{ href: null }}
        />
        <Tabs.Screen
          name="podcast"
          options={{
            title: "Podcast",
            tabBarIcon: ({ color }) => <Microphone size={22} color={color} weight="fill" />,
          }}
        />
      </Tabs>

      {/* Degradé suave arriba del tab bar */}
      <View
        pointerEvents="none"
        style={{ position: "absolute", bottom: TAB_H, left: 0, right: 0, height: FADE_H }}
      >
        <LinearGradient colors={["transparent", `${violeta}B0`]} style={{ flex: 1 }} />
      </View>

      {/* FAB Chat */}
      <Pressable
        onPress={abrirChat}
        accessibilityRole="button"
        accessibilityLabel="Abrir chat"
        style={{
          position: "absolute",
          bottom: TAB_H / 2 - (FAB + 10) / 2,
          alignSelf: "center",
          left: "50%",
          marginLeft: -(FAB + 10) / 2,
          zIndex: 50,
        }}
      >
        <View
          style={{
            width: FAB + 10,
            height: FAB + 10,
            borderRadius: (FAB + 10) / 2,
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: chatAbierto
              ? "rgba(147, 51, 234, 0.3)"
              : "rgba(124, 77, 255, 0.15)",
          }}
        >
          <View
            style={{
              width: FAB,
              height: FAB,
              borderRadius: FAB / 2,
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: chatAbierto ? "#9333EA" : "#7C4DFF",
              shadowColor: "#A855F7",
              shadowOffset: { width: 0, height: 0 },
              shadowOpacity: chatAbierto ? 0.65 : 0.35,
              shadowRadius: 18,
              elevation: 14,
            }}
          >
            <ChatCircleDots size={28} color="#FFFFFF" weight="fill" />
          </View>
        </View>
      </Pressable>

      {/* Sheet del chat — slide from bottom */}
      <SheetChat visible={chatAbierto} onCerrar={cerrarChat} />

      {pistaActual && <MiniReproductor />}
    </View>
  );
}
