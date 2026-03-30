import { View, Text, ScrollView, Pressable, ActivityIndicator } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Play, Clock } from "phosphor-react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Tarjeta } from "@/componentes/ui/tarjeta";
import { Badge } from "@/componentes/ui/badge";
import { Esqueleto } from "@/componentes/ui/esqueleto";
import { AnimacionEntrada } from "@/componentes/ui/animacion-entrada";
import { useStoreUI, type PistaReproduccion } from "@/lib/stores/store-ui";
import { usarPodcastHoy, usarPodcastHistorial, usarGenerarPodcast } from "@/lib/hooks/usar-podcast";
import { usarTema } from "@/lib/hooks/usar-tema";
import { formatearFechaCorta } from "@/lib/utilidades/formatear-fecha";
import type { PodcastEpisodio, TipoPodcast } from "@/lib/tipos";

const TITULOS: Record<TipoPodcast, string> = {
  dia: "Diario",
  semana: "Semanal",
  mes: "Mensual",
};

const GRADIENTES: Record<TipoPodcast, [string, string]> = {
  dia: ["#7C3AED", "#4F46E5"],
  semana: ["#6D28D9", "#DB2777"],
  mes: ["#4338CA", "#0891B2"],
};

function formatearDuracion(seg: number): string {
  const m = Math.floor(seg / 60);
  const s = Math.floor(seg % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
}

export default function PantallaPodcast() {
  const insets = useSafeAreaInsets();
  const setPistaActual = useStoreUI((s) => s.setPistaActual);
  const { colores } = usarTema();

  const { data: episodios, isLoading } = usarPodcastHoy(false);
  const { data: historial } = usarPodcastHistorial();
  const generarPodcast = usarGenerarPodcast();

  const reproducir = (ep: PodcastEpisodio) => {
    const pista: PistaReproduccion = {
      id: ep.id,
      titulo: ep.titulo,
      subtitulo: `Podcast ${TITULOS[ep.tipo]}`,
      tipo: "podcast",
      duracionSegundos: ep.duracion_segundos,
      icono: "microfono",
      gradiente: GRADIENTES[ep.tipo].join(","),
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
      <AnimacionEntrada>
        <Text style={{ color: colores.primario, fontSize: 24, fontFamily: "Inter_700Bold", marginBottom: 16 }}>
          Podcasts
        </Text>
      </AnimacionEntrada>

      {/* Cards de generación */}
      <AnimacionEntrada retraso={100}>
        {isLoading ? (
          <View style={{ gap: 12, marginBottom: 24 }}>
            {[1, 2, 3].map((i) => (
              <Esqueleto key={i} style={{ height: 96, borderRadius: 12 }} />
            ))}
          </View>
        ) : (
          <View style={{ gap: 12, marginBottom: 24 }}>
            {(["dia", "semana", "mes"] as TipoPodcast[]).map((tipo) => {
              const ep = episodios?.find((e) => e.tipo === tipo);
              const generando =
                ep?.estado === "generando_guion" || ep?.estado === "generando_audio";
              const listo = ep?.estado === "listo";
              const gradient = GRADIENTES[tipo];

              return (
                <LinearGradient key={tipo} colors={gradient} style={{ borderRadius: 12, padding: 16 }}>
                  <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                    <View style={{ flex: 1 }}>
                      <Text style={{ color: "white", fontFamily: "Inter_700Bold", fontSize: 16 }}>
                        {TITULOS[tipo]}
                      </Text>
                      {listo && ep && (
                        <View style={{ flexDirection: "row", alignItems: "center", marginTop: 4 }}>
                          <Clock size={12} color="rgba(255,255,255,0.6)" />
                          <Text style={{ color: "rgba(255,255,255,0.6)", fontSize: 12, marginLeft: 4 }}>
                            {formatearDuracion(ep.duracion_segundos)}
                          </Text>
                        </View>
                      )}
                    </View>

                    {generando ? (
                      <ActivityIndicator color="white" />
                    ) : listo ? (
                      <Pressable
                        onPress={() => reproducir(ep!)}
                        style={{
                          backgroundColor: "rgba(255,255,255,0.2)",
                          borderRadius: 20,
                          width: 40,
                          height: 40,
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <Play size={20} color="white" weight="fill" />
                      </Pressable>
                    ) : (
                      <Pressable
                        onPress={() => generarPodcast.mutate(tipo)}
                        disabled={generarPodcast.isPending}
                        style={{
                          backgroundColor: "rgba(255,255,255,0.2)",
                          borderRadius: 8,
                          paddingHorizontal: 16,
                          paddingVertical: 8,
                        }}
                      >
                        <Text style={{ color: "white", fontFamily: "Inter_600SemiBold", fontSize: 14 }}>
                          Generar
                        </Text>
                      </Pressable>
                    )}
                  </View>
                </LinearGradient>
              );
            })}
          </View>
        )}
      </AnimacionEntrada>

      {/* Historial */}
      {historial && historial.length > 0 && (
        <AnimacionEntrada retraso={200}>
          <Text style={{ color: colores.primario, fontFamily: "Inter_600SemiBold", fontSize: 18, marginBottom: 12 }}>
            Historial
          </Text>
          {historial.map((ep) => (
            <Pressable key={ep.id} onPress={() => ep.estado === "listo" && reproducir(ep)}>
              <Tarjeta padding="sm" style={{ marginBottom: 8 }}>
                <View style={{ flexDirection: "row", alignItems: "center" }}>
                  <View style={{ flex: 1 }}>
                    <Text
                      numberOfLines={1}
                      style={{ color: colores.primario, fontSize: 14, fontFamily: "Inter_500Medium" }}
                    >
                      {ep.titulo}
                    </Text>
                    <Text style={{ color: colores.textoMuted, fontSize: 12, marginTop: 2 }}>
                      {formatearFechaCorta(ep.fecha)} · {formatearDuracion(ep.duracion_segundos)}
                    </Text>
                  </View>
                  {ep.estado === "listo" && (
                    <Play size={18} color={colores.acento} weight="fill" />
                  )}
                </View>
              </Tarjeta>
            </Pressable>
          ))}
        </AnimacionEntrada>
      )}
    </ScrollView>
  );
}
