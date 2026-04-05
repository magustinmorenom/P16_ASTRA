import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import Animated, { FadeIn, FadeInDown, Easing } from "react-native-reanimated";
import {
  Clock,
  Microphone,
  Moon,
  Pause,
  Play,
  SunDim,
  Sparkle,
  WarningCircle,
  CaretDown,
  CaretUp,
} from "phosphor-react-native";
import { Tarjeta } from "@/componentes/ui/tarjeta";
import { Esqueleto } from "@/componentes/ui/esqueleto";
import { AnimacionEntrada } from "@/componentes/ui/animacion-entrada";
import { PresionableAnimado } from "@/componentes/ui/presionable-animado";
import { EstadoVacio } from "@/componentes/feedback/estado-vacio";
import { useStoreUI, type PistaReproduccion } from "@/lib/stores/store-ui";
import {
  usarPodcastHoy,
  usarPodcastHistorial,
  usarGenerarPodcast,
} from "@/lib/hooks/usar-podcast";
import { usarTema } from "@/lib/hooks/usar-tema";
import { formatearFechaCorta } from "@/lib/utilidades/formatear-fecha";
import { haptico } from "@/lib/utilidades/hapticos";
import type { PodcastEpisodio, TipoPodcast } from "@/lib/tipos";

/* ── Constantes ─────────────────────────────────────────── */

const LIMITE_HISTORIAL = 5;

interface ConfigTipo {
  titulo: string;
  descripcion: string;
  icono: typeof SunDim;
  gradiente: [string, string];
}

const CONFIG_TIPO: Record<TipoPodcast, ConfigTipo> = {
  dia: {
    titulo: "Diario",
    descripcion: "Tu guía cósmica para hoy",
    icono: SunDim,
    gradiente: ["#7C3AED", "#4F46E5"],
  },
  semana: {
    titulo: "Semanal",
    descripcion: "Panorama de los próximos 7 días",
    icono: Sparkle,
    gradiente: ["#6D28D9", "#DB2777"],
  },
  mes: {
    titulo: "Mensual",
    descripcion: "Tendencias del mes completo",
    icono: Moon,
    gradiente: ["#4338CA", "#0891B2"],
  },
};

function formatearDuracion(seg: number): string {
  const m = Math.floor(seg / 60);
  const s = Math.floor(seg % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
}

/* ── Card de episodio generado / por generar ────────────── */

function CardEpisodio({
  tipo,
  episodio,
  onReproducir,
  onGenerar,
  generando: generandoExterno,
  reproduccionActual,
  reproduciendo,
}: {
  tipo: TipoPodcast;
  episodio?: PodcastEpisodio;
  onReproducir: (ep: PodcastEpisodio) => void;
  onGenerar: (tipo: TipoPodcast) => void;
  generando: boolean;
  reproduccionActual: string | null;
  reproduciendo: boolean;
}) {
  const config = CONFIG_TIPO[tipo];
  const Icono = config.icono;

  const estado = episodio?.estado;
  const estaGenerando =
    estado === "generando_guion" || estado === "generando_audio";
  const listo = estado === "listo";
  const error = estado === "error";
  const esEsteReproduciendo =
    reproduccionActual === episodio?.id && reproduciendo;

  return (
    <Animated.View
      entering={FadeInDown.delay(
        tipo === "dia" ? 100 : tipo === "semana" ? 180 : 260
      )
        .duration(400)
        .easing(Easing.out(Easing.cubic))}
    >
      <LinearGradient
        colors={config.gradiente}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ borderRadius: 16, overflow: "hidden" }}
      >
        <View style={{ padding: 18 }}>
          {/* Header: icono + info */}
          <View
            style={{
              flexDirection: "row",
              alignItems: "flex-start",
              marginBottom: 14,
            }}
          >
            <View
              style={{
                width: 40,
                height: 40,
                borderRadius: 12,
                backgroundColor: "rgba(255,255,255,0.15)",
                alignItems: "center",
                justifyContent: "center",
                marginRight: 12,
              }}
            >
              <Icono size={22} color="white" weight="fill" />
            </View>
            <View style={{ flex: 1 }}>
              <Text
                style={{
                  color: "white",
                  fontFamily: "Inter_700Bold",
                  fontSize: 17,
                }}
              >
                {config.titulo}
              </Text>
              <Text
                style={{
                  color: "rgba(255,255,255,0.65)",
                  fontSize: 13,
                  fontFamily: "Inter_400Regular",
                  marginTop: 2,
                }}
              >
                {config.descripcion}
              </Text>
            </View>
          </View>

          {/* Footer: estado + acción */}
          {listo && episodio ? (
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                <Clock size={14} color="rgba(255,255,255,0.5)" />
                <Text
                  style={{
                    color: "rgba(255,255,255,0.5)",
                    fontSize: 13,
                    fontFamily: "Inter_500Medium",
                  }}
                >
                  {formatearDuracion(episodio.duracion_segundos)}
                </Text>
                <View
                  style={{
                    backgroundColor: "rgba(255,255,255,0.2)",
                    borderRadius: 6,
                    paddingHorizontal: 8,
                    paddingVertical: 3,
                    marginLeft: 4,
                  }}
                >
                  <Text
                    style={{
                      color: "white",
                      fontSize: 11,
                      fontFamily: "Inter_600SemiBold",
                    }}
                  >
                    Listo
                  </Text>
                </View>
              </View>

              <PresionableAnimado
                onPress={() => {
                  haptico.toque();
                  onReproducir(episodio);
                }}
                accessibilityRole="button"
                accessibilityLabel={
                  esEsteReproduciendo
                    ? `Pausar podcast ${config.titulo}`
                    : `Reproducir podcast ${config.titulo}`
                }
                style={{
                  backgroundColor: esEsteReproduciendo
                    ? "rgba(255,255,255,0.35)"
                    : "rgba(255,255,255,0.2)",
                  borderRadius: 22,
                  width: 44,
                  height: 44,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {esEsteReproduciendo ? (
                  <Pause size={20} color="white" weight="fill" />
                ) : (
                  <Play size={20} color="white" weight="fill" />
                )}
              </PresionableAnimado>
            </View>
          ) : estaGenerando || generandoExterno ? (
            <View
              style={{ flexDirection: "row", alignItems: "center", gap: 10 }}
            >
              <ActivityIndicator color="rgba(255,255,255,0.8)" size="small" />
              <Text
                style={{
                  color: "rgba(255,255,255,0.7)",
                  fontSize: 13,
                  fontFamily: "Inter_500Medium",
                }}
              >
                {estado === "generando_audio"
                  ? "Generando audio..."
                  : "Preparando guión..."}
              </Text>
            </View>
          ) : error ? (
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <View
                style={{ flexDirection: "row", alignItems: "center", gap: 6 }}
              >
                <WarningCircle size={16} color="rgba(255,200,200,0.8)" />
                <Text
                  style={{
                    color: "rgba(255,200,200,0.8)",
                    fontSize: 13,
                    fontFamily: "Inter_500Medium",
                  }}
                >
                  Error al generar
                </Text>
              </View>
              <PresionableAnimado
                onPress={() => onGenerar(tipo)}
                accessibilityRole="button"
                accessibilityLabel={`Reintentar podcast ${config.titulo}`}
                style={{
                  backgroundColor: "rgba(255,255,255,0.2)",
                  borderRadius: 8,
                  paddingHorizontal: 14,
                  paddingVertical: 8,
                }}
              >
                <Text
                  style={{
                    color: "white",
                    fontFamily: "Inter_600SemiBold",
                    fontSize: 13,
                  }}
                >
                  Reintentar
                </Text>
              </PresionableAnimado>
            </View>
          ) : (
            <PresionableAnimado
              onPress={() => {
                haptico.toque();
                onGenerar(tipo);
              }}
              accessibilityRole="button"
              accessibilityLabel={`Generar podcast ${config.titulo}`}
              style={{
                backgroundColor: "rgba(255,255,255,0.2)",
                borderRadius: 10,
                paddingVertical: 10,
                alignItems: "center",
              }}
            >
              <Text
                style={{
                  color: "white",
                  fontFamily: "Inter_600SemiBold",
                  fontSize: 14,
                }}
              >
                Generar ahora
              </Text>
            </PresionableAnimado>
          )}
        </View>
      </LinearGradient>
    </Animated.View>
  );
}

/* ── Item de historial ──────────────────────────────────── */

function ItemHistorial({
  episodio,
  onReproducir,
  esActual,
  reproduciendo,
  indice,
}: {
  episodio: PodcastEpisodio;
  onReproducir: (ep: PodcastEpisodio) => void;
  esActual: boolean;
  reproduciendo: boolean;
  indice: number;
}) {
  const { colores, esOscuro } = usarTema();
  const config = CONFIG_TIPO[episodio.tipo];
  const esEsteReproduciendo = esActual && reproduciendo;

  return (
    <Animated.View
      entering={FadeIn.delay(indice * 50)
        .duration(250)
        .easing(Easing.out(Easing.quad))}
    >
      <PresionableAnimado
        onPress={() => {
          if (episodio.estado === "listo") {
            haptico.toque();
            onReproducir(episodio);
          }
        }}
        accessibilityRole="button"
        accessibilityLabel={`Reproducir ${episodio.titulo}`}
        disabled={episodio.estado !== "listo"}
      >
        <Tarjeta
          padding="sm"
          style={{
            marginBottom: 8,
            borderColor: esActual
              ? `${colores.acento}40`
              : undefined,
          }}
        >
          <View
            style={{ flexDirection: "row", alignItems: "center" }}
          >
            {/* Icono play/pause */}
            <View
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                backgroundColor: esEsteReproduciendo
                  ? `${colores.acento}24`
                  : esOscuro
                  ? "rgba(255,255,255,0.06)"
                  : "rgba(124,77,255,0.08)",
                alignItems: "center",
                justifyContent: "center",
                marginRight: 12,
              }}
            >
              {esEsteReproduciendo ? (
                <Pause size={16} color={colores.acento} weight="fill" />
              ) : (
                <Play size={16} color={colores.acento} weight="fill" />
              )}
            </View>

            {/* Info */}
            <View style={{ flex: 1 }}>
              <Text
                numberOfLines={1}
                style={{
                  color: esActual ? colores.acento : colores.primario,
                  fontSize: 14,
                  fontFamily: "Inter_500Medium",
                }}
              >
                {episodio.titulo}
              </Text>
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 6,
                  marginTop: 3,
                }}
              >
                <Text
                  style={{
                    color: colores.textoMuted,
                    fontSize: 12,
                    fontFamily: "Inter_400Regular",
                  }}
                >
                  {config.titulo}
                </Text>
                <Text style={{ color: colores.textoMuted, fontSize: 10 }}>·</Text>
                <Text
                  style={{
                    color: colores.textoMuted,
                    fontSize: 12,
                    fontFamily: "Inter_400Regular",
                  }}
                >
                  {formatearFechaCorta(episodio.fecha)}
                </Text>
                <Text style={{ color: colores.textoMuted, fontSize: 10 }}>·</Text>
                <Text
                  style={{
                    color: colores.textoMuted,
                    fontSize: 12,
                    fontFamily: "Inter_400Regular",
                  }}
                >
                  {formatearDuracion(episodio.duracion_segundos)}
                </Text>
              </View>
            </View>
          </View>
        </Tarjeta>
      </PresionableAnimado>
    </Animated.View>
  );
}

/* ── Pantalla principal ─────────────────────────────────── */

export default function PantallaPodcast() {
  const insets = useSafeAreaInsets();
  const { colores, esOscuro } = usarTema();

  const pistaActual = useStoreUI((s) => s.pistaActual);
  const reproduciendo = useStoreUI((s) => s.reproduciendo);
  const setPistaActual = useStoreUI((s) => s.setPistaActual);
  const toggleReproduccion = useStoreUI((s) => s.toggleReproduccion);

  const {
    data: episodios,
    isLoading,
    refetch,
  } = usarPodcastHoy(false);
  const { data: historial } = usarPodcastHistorial();
  const generarPodcast = usarGenerarPodcast();

  const [refrescando, setRefrescando] = useState(false);
  const [historialExpandido, setHistorialExpandido] = useState(false);

  const manejarRefresh = useCallback(async () => {
    setRefrescando(true);
    await refetch();
    setRefrescando(false);
  }, [refetch]);

  const reproducir = useCallback(
    (ep: PodcastEpisodio) => {
      // Si es el mismo, toggle play/pause
      if (pistaActual?.id === ep.id) {
        toggleReproduccion();
        return;
      }
      const pista: PistaReproduccion = {
        id: ep.id,
        titulo: ep.titulo,
        subtitulo: `Podcast ${CONFIG_TIPO[ep.tipo].titulo}`,
        tipo: "podcast",
        duracionSegundos: ep.duracion_segundos,
        icono: "microfono",
        gradiente: CONFIG_TIPO[ep.tipo].gradiente.join(","),
        url: ep.url_audio,
        segmentos: ep.segmentos,
      };
      setPistaActual(pista);
    },
    [pistaActual, setPistaActual, toggleReproduccion]
  );

  const historialListo = historial?.filter((ep) => ep.estado === "listo") ?? [];
  const historialVisible = historialExpandido
    ? historialListo
    : historialListo.slice(0, LIMITE_HISTORIAL);
  const tieneHistorialExtra = historialListo.length > LIMITE_HISTORIAL;

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colores.fondo }}
      contentContainerStyle={{
        paddingTop: insets.top + 16,
        paddingBottom: 140,
        paddingHorizontal: 16,
      }}
      refreshControl={
        <RefreshControl
          refreshing={refrescando}
          onRefresh={manejarRefresh}
          tintColor={colores.acento}
          colors={[colores.acento]}
        />
      }
    >
      {/* Header */}
      <AnimacionEntrada>
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            marginBottom: 8,
          }}
        >
          <Microphone
            size={24}
            color={colores.acento}
            weight="fill"
            style={{ marginRight: 10 }}
          />
          <Text
            accessibilityRole="header"
            style={{
              color: colores.primario,
              fontSize: 24,
              fontFamily: "Inter_700Bold",
            }}
          >
            Podcasts
          </Text>
        </View>
        <Text
          style={{
            color: colores.textoSecundario,
            fontSize: 14,
            fontFamily: "Inter_400Regular",
            lineHeight: 20,
            marginBottom: 24,
          }}
        >
          Elegí una escucha breve, semanal o mensual con tu guía
          cósmica personalizada.
        </Text>
      </AnimacionEntrada>

      {/* Cards de generación */}
      {isLoading ? (
        <View style={{ gap: 14, marginBottom: 32 }}>
          {[1, 2, 3].map((i) => (
            <Esqueleto
              key={i}
              style={{ height: 120, borderRadius: 16 }}
            />
          ))}
        </View>
      ) : (
        <View style={{ gap: 14, marginBottom: 32 }}>
          {(["dia", "semana", "mes"] as TipoPodcast[]).map((tipo) => {
            const ep = episodios?.find((e) => e.tipo === tipo);
            return (
              <CardEpisodio
                key={tipo}
                tipo={tipo}
                episodio={ep}
                onReproducir={reproducir}
                onGenerar={(t) => generarPodcast.mutate(t)}
                generando={
                  generarPodcast.isPending &&
                  generarPodcast.variables === tipo
                }
                reproduccionActual={pistaActual?.id ?? null}
                reproduciendo={reproduciendo}
              />
            );
          })}
        </View>
      )}

      {/* Historial */}
      {historialListo.length > 0 && (
        <AnimacionEntrada retraso={300}>
          <Text
            accessibilityRole="header"
            style={{
              color: colores.primario,
              fontFamily: "Inter_600SemiBold",
              fontSize: 18,
              marginBottom: 14,
            }}
          >
            Biblioteca reciente
          </Text>

          {historialVisible.map((ep, idx) => (
            <ItemHistorial
              key={ep.id}
              episodio={ep}
              onReproducir={reproducir}
              esActual={pistaActual?.id === ep.id}
              reproduciendo={reproduciendo}
              indice={idx}
            />
          ))}

          {tieneHistorialExtra && (
            <PresionableAnimado
              onPress={() => setHistorialExpandido(!historialExpandido)}
              accessibilityRole="button"
              accessibilityLabel={
                historialExpandido
                  ? "Ver menos episodios"
                  : "Ver más episodios"
              }
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                gap: 6,
                paddingVertical: 12,
                marginTop: 4,
              }}
            >
              {historialExpandido ? (
                <CaretUp size={16} color={colores.acento} />
              ) : (
                <CaretDown size={16} color={colores.acento} />
              )}
              <Text
                style={{
                  color: colores.acento,
                  fontSize: 14,
                  fontFamily: "Inter_600SemiBold",
                }}
              >
                {historialExpandido
                  ? "Ver menos"
                  : `Ver ${historialListo.length - LIMITE_HISTORIAL} más`}
              </Text>
            </PresionableAnimado>
          )}
        </AnimacionEntrada>
      )}

      {/* Estado vacío cuando no hay historial y no está cargando */}
      {!isLoading && historialListo.length === 0 && (
        <AnimacionEntrada retraso={350}>
          <View
            style={{
              alignItems: "center",
              paddingVertical: 32,
              paddingHorizontal: 24,
            }}
          >
            <View
              style={{
                width: 56,
                height: 56,
                borderRadius: 28,
                backgroundColor: esOscuro
                  ? "rgba(192,132,252,0.1)"
                  : "rgba(124,77,255,0.08)",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: 14,
              }}
            >
              <Microphone size={28} color={colores.acento} weight="duotone" />
            </View>
            <Text
              style={{
                color: colores.textoSecundario,
                fontSize: 14,
                fontFamily: "Inter_500Medium",
                textAlign: "center",
                lineHeight: 20,
              }}
            >
              Generá tu primer podcast para empezar{"\n"}a escuchar tu guía
              cósmica.
            </Text>
          </View>
        </AnimacionEntrada>
      )}
    </ScrollView>
  );
}
