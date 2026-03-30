import { View, Text, ScrollView, Pressable, ActivityIndicator } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Play, Sparkle } from "phosphor-react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Tarjeta } from "@/componentes/ui/tarjeta";
import { Avatar } from "@/componentes/ui/avatar";
import { Esqueleto } from "@/componentes/ui/esqueleto";
import { AnimacionEntrada } from "@/componentes/ui/animacion-entrada";
import { useStoreAuth } from "@/lib/stores/store-auth";
import { useStoreUI, type PistaReproduccion } from "@/lib/stores/store-ui";
import { usarTransitos } from "@/lib/hooks/usar-transitos";
import { usarPodcastHoy, usarGenerarPodcast } from "@/lib/hooks/usar-podcast";
import { usarTema } from "@/lib/hooks/usar-tema";
import type { PodcastEpisodio, TipoPodcast } from "@/lib/tipos";

function obtenerSaludo(): string {
  const hora = new Date().getHours();
  if (hora < 12) return "Buenos días";
  if (hora < 19) return "Buenas tardes";
  return "Buenas noches";
}

const TITULOS_PODCAST: Record<TipoPodcast, string> = {
  dia: "Hoy",
  semana: "Semana",
  mes: "Mes",
};

const GRADIENTES_PODCAST: Record<TipoPodcast, [string, string]> = {
  dia: ["#7C3AED", "#4F46E5"],
  semana: ["#6D28D9", "#DB2777"],
  mes: ["#4338CA", "#0891B2"],
};

export default function DashboardScreen() {
  const insets = useSafeAreaInsets();
  const usuario = useStoreAuth((s) => s.usuario);
  const setPistaActual = useStoreUI((s) => s.setPistaActual);
  const { colores } = usarTema();

  const { data: transitos, isLoading: cargandoTransitos } = usarTransitos();
  const { data: episodios, isLoading: cargandoPodcasts } = usarPodcastHoy(false);
  const generarPodcast = usarGenerarPodcast();

  const luna = transitos?.planetas?.find((p) => p.nombre === "Luna");

  const reproducirPodcast = (ep: PodcastEpisodio) => {
    const pista: PistaReproduccion = {
      id: ep.id,
      titulo: ep.titulo,
      subtitulo: `Podcast ${TITULOS_PODCAST[ep.tipo]}`,
      tipo: "podcast",
      duracionSegundos: ep.duracion_segundos,
      icono: "microfono",
      gradiente: GRADIENTES_PODCAST[ep.tipo].join(","),
      url: ep.url_audio,
      segmentos: ep.segmentos,
    };
    setPistaActual(pista);
  };

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colores.fondo }}
      contentContainerStyle={{
        paddingTop: insets.top + 16,
        paddingBottom: 120,
        paddingHorizontal: 16,
      }}
    >
      {/* Saludo */}
      <AnimacionEntrada>
        <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 24 }}>
          <Avatar nombre={usuario?.nombre ?? "U"} tamaño="md" />
          <View style={{ marginLeft: 12 }}>
            <Text style={{ color: colores.textoSecundario, fontSize: 14, fontFamily: "Inter_400Regular" }}>
              {obtenerSaludo()}
            </Text>
            <Text style={{ color: colores.primario, fontSize: 18, fontFamily: "Inter_700Bold" }}>
              {usuario?.nombre ?? "Explorador"}
            </Text>
          </View>
        </View>
      </AnimacionEntrada>

      {/* Hero Lunar */}
      <AnimacionEntrada retraso={100}>
        <LinearGradient
          colors={colores.gradienteHero as unknown as string[]}
          style={{ borderRadius: 16, padding: 20, marginBottom: 24 }}
        >
          <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 8 }}>
            <Sparkle size={20} color={colores.acento} weight="fill" />
            <Text
              style={{
                color: colores.acento,
                fontFamily: "Inter_600SemiBold",
                fontSize: 14,
                marginLeft: 8,
              }}
            >
              Luna ahora
            </Text>
          </View>
          {cargandoTransitos ? (
            <Esqueleto style={{ height: 24, width: 192, marginTop: 8 }} />
          ) : luna ? (
            <Text style={{ color: colores.primario, fontSize: 20, fontFamily: "Inter_700Bold" }}>
              {luna.signo} {luna.grado_en_signo.toFixed(1)}°
            </Text>
          ) : (
            <Text style={{ color: colores.textoMuted }}>Sin datos</Text>
          )}
        </LinearGradient>
      </AnimacionEntrada>

      {/* Podcasts */}
      <AnimacionEntrada retraso={200}>
        <Text style={{ color: colores.primario, fontFamily: "Inter_700Bold", fontSize: 18, marginBottom: 12 }}>
          Podcast Cósmico
        </Text>
        <View style={{ flexDirection: "row", gap: 12, marginBottom: 24 }}>
          {(["dia", "semana", "mes"] as TipoPodcast[]).map((tipo) => {
            const ep = episodios?.find((e) => e.tipo === tipo);
            const generando =
              ep?.estado === "generando_guion" || ep?.estado === "generando_audio";
            const listo = ep?.estado === "listo";
            const gradient = GRADIENTES_PODCAST[tipo];

            return (
              <LinearGradient
                key={tipo}
                colors={gradient}
                style={{ flex: 1, borderRadius: 12, padding: 12, minHeight: 100 }}
              >
                <Text style={{ color: "rgba(255,255,255,0.7)", fontSize: 11, fontFamily: "Inter_600SemiBold", textTransform: "uppercase" }}>
                  {TITULOS_PODCAST[tipo]}
                </Text>

                <View style={{ flex: 1, justifyContent: "flex-end", marginTop: 8 }}>
                  {generando ? (
                    <ActivityIndicator size="small" color="white" />
                  ) : listo ? (
                    <Pressable
                      onPress={() => reproducirPodcast(ep!)}
                      style={{
                        backgroundColor: "rgba(255,255,255,0.2)",
                        borderRadius: 16,
                        width: 32,
                        height: 32,
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Play size={16} color="white" weight="fill" />
                    </Pressable>
                  ) : (
                    <Pressable
                      onPress={() => generarPodcast.mutate(tipo)}
                      disabled={generarPodcast.isPending}
                      style={{
                        backgroundColor: "rgba(255,255,255,0.2)",
                        borderRadius: 8,
                        paddingHorizontal: 8,
                        paddingVertical: 4,
                      }}
                    >
                      <Text style={{ color: "white", fontSize: 12, fontFamily: "Inter_600SemiBold", textAlign: "center" }}>
                        Generar
                      </Text>
                    </Pressable>
                  )}
                </View>
              </LinearGradient>
            );
          })}
        </View>
      </AnimacionEntrada>

      {/* Tránsitos rápidos */}
      <AnimacionEntrada retraso={300}>
        <Text style={{ color: colores.primario, fontFamily: "Inter_700Bold", fontSize: 18, marginBottom: 12 }}>
          Tránsitos
        </Text>
        {cargandoTransitos ? (
          <View style={{ gap: 8 }}>
            {[1, 2, 3, 4].map((i) => (
              <Esqueleto key={i} style={{ height: 48, borderRadius: 12 }} />
            ))}
          </View>
        ) : (
          <View style={{ gap: 8 }}>
            {transitos?.planetas?.slice(0, 6).map((p) => (
              <Tarjeta key={p.nombre} padding="sm">
                <View style={{ flexDirection: "row", alignItems: "center" }}>
                  <View
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: 4,
                      backgroundColor: colores.acento,
                      marginRight: 12,
                    }}
                  />
                  <Text style={{ color: colores.primario, fontFamily: "Inter_600SemiBold", flex: 1 }}>
                    {p.nombre}
                  </Text>
                  <Text style={{ color: colores.textoSecundario, fontSize: 14 }}>
                    {p.signo} {p.grado_en_signo.toFixed(1)}°
                    {p.retrogrado ? " R" : ""}
                  </Text>
                </View>
              </Tarjeta>
            ))}
          </View>
        )}
      </AnimacionEntrada>
    </ScrollView>
  );
}
