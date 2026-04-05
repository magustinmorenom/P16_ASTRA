import { useState } from "react";
import { ScrollView, Text, View, Pressable, ActivityIndicator, RefreshControl } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useQueryClient } from "@tanstack/react-query";
import { LinearGradient } from "expo-linear-gradient";
import {
  ArrowRight,
  CalendarDots,
  ChatCircleDots,
  Brain,
  CurrencyDollar,
  Heart,
  Heartbeat,
  Moon,
  Play,
  Rocket,
  Sun,
  SunHorizon,
  WarningCircle,
} from "phosphor-react-native";
import { FondoCosmico } from "@/componentes/layouts/fondo-cosmico";
import { Avatar } from "@/componentes/ui/avatar";
import { Badge } from "@/componentes/ui/badge";
import { Boton } from "@/componentes/ui/boton";
import { Esqueleto } from "@/componentes/ui/esqueleto";
import { Tarjeta } from "@/componentes/ui/tarjeta";
import { AnimacionEntrada } from "@/componentes/ui/animacion-entrada";
import { IconoAstral, IconoSigno } from "@/componentes/ui/icono-astral";
import { EstadoVacio } from "@/componentes/feedback/estado-vacio";
import { GraficaEnergia } from "@/componentes/visualizaciones/grafica-energia";
import { useStoreAuth } from "@/lib/stores/store-auth";
import { useStoreUI, type PistaReproduccion } from "@/lib/stores/store-ui";
import {
  usarPodcastHoy,
  usarGenerarPodcast,
  usarPronosticoDiario,
  usarPronosticoSemanal,
} from "@/lib/hooks";
import { usarTema } from "@/lib/hooks/usar-tema";
import { usarReview } from "@/lib/hooks/usar-review";
import { trackPantalla, trackEvento, Eventos } from "@/lib/utilidades/analytics";
import type {
  AreaVidaDTO,
  MomentoClaveDTO,
  PodcastEpisodio,
  TipoPodcast,
} from "@/lib/tipos";

function obtenerSaludo(nombre?: string | null): string {
  const primerNombre = nombre?.split(" ")[0] ?? "Explorador";
  return `Hola ${primerNombre} 👋`;
}

function formatearFechaDashboard(fecha: Date): string {
  return fecha.toLocaleDateString("es-AR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}

function formatearDiaSemana(fecha: string): string {
  const d = new Date(`${fecha}T12:00:00`);
  const dia = d.getDate();
  const nombre = d
    .toLocaleDateString("es-AR", { weekday: "short" })
    .replace(".", "")
    .toLowerCase();
  return `${nombre} ${dia}`;
}

function obtenerNivelBadge(nivel: "favorable" | "neutro" | "precaucion") {
  if (nivel === "favorable") return "exito";
  if (nivel === "precaucion") return "advertencia";
  return "info";
}

function obtenerUrgenciaBadge(urgencia: "baja" | "media" | "alta") {
  if (urgencia === "alta") return "error";
  if (urgencia === "media") return "advertencia";
  return "info";
}

function obtenerIconoArea(areaId: string) {
  const mapa: Record<string, typeof Heart> = {
    trabajo: Rocket,
    amor: Heart,
    salud: Heartbeat,
    finanzas: CurrencyDollar,
    creatividad: Brain,
    crecimiento: Rocket,
  };

  return mapa[areaId] ?? Rocket;
}

function IndicadorHero({
  etiqueta,
  valor,
}: {
  etiqueta: string;
  valor: string;
}) {
  const { colores, esOscuro } = usarTema();

  return (
    <View
      style={{
        flex: 1,
        borderRadius: 16,
        paddingHorizontal: 12,
        paddingVertical: 12,
        borderWidth: 1,
        borderColor: esOscuro ? "rgba(255,255,255,0.08)" : "rgba(124,77,255,0.12)",
        backgroundColor: esOscuro ? "rgba(255,255,255,0.05)" : "rgba(255,255,255,0.56)",
      }}
    >
      <Text
        style={{
          color: colores.textoSecundario,
          fontSize: 11,
          fontFamily: "Inter_600SemiBold",
          textTransform: "uppercase",
          letterSpacing: 0.8,
        }}
      >
        {etiqueta}
      </Text>
      <Text
        numberOfLines={1}
        style={{
          color: colores.primario,
          fontSize: 15,
          fontFamily: "Inter_700Bold",
          marginTop: 4,
        }}
      >
        {valor}
      </Text>
    </View>
  );
}

function EncabezadoSeccion({
  titulo,
  accion,
}: {
  titulo: string;
  accion?: React.ReactNode;
}) {
  const { colores } = usarTema();

  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: 12,
      }}
    >
      <Text
        style={{
          color: colores.primario,
          fontFamily: "Inter_700Bold",
          fontSize: 19,
        }}
      >
        {titulo}
      </Text>
      {accion}
    </View>
  );
}

function TarjetaMomento({ momento }: { momento: MomentoClaveDTO }) {
  const { colores, esOscuro } = usarTema();
  const IconoBloque = momento.bloque === "noche" ? Moon : Sun;

  return (
    <Tarjeta padding="md" style={{ width: 240, marginRight: 12 }}>
      <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 12 }}>
        <View
          style={{
            width: 36,
            height: 36,
            borderRadius: 18,
            alignItems: "center",
            justifyContent: "center",
            backgroundColor:
              momento.bloque === "noche"
                ? `${colores.acento}18`
                : `${colores.advertencia}18`,
            borderWidth: 1,
            borderColor:
              momento.bloque === "noche"
                ? `${colores.acento}30`
                : `${colores.advertencia}30`,
          }}
        >
          <IconoBloque
            size={18}
            color={momento.bloque === "noche" ? colores.acento : colores.advertencia}
            weight="fill"
          />
        </View>
        <View style={{ marginLeft: 10, flex: 1 }}>
          <Text
            style={{
              color: colores.textoSecundario,
              fontSize: 11,
              fontFamily: "Inter_600SemiBold",
              textTransform: "uppercase",
              letterSpacing: 0.8,
            }}
          >
            {momento.bloque}
          </Text>
          <Text
            style={{
              color: colores.primario,
              fontSize: 15,
              fontFamily: "Inter_700Bold",
              marginTop: 2,
            }}
          >
            {momento.titulo}
          </Text>
        </View>
        <Badge variante={obtenerNivelBadge(momento.nivel)}>{momento.nivel}</Badge>
      </View>

      <Text
        style={{
          color: colores.textoSecundario,
          fontSize: 13,
          lineHeight: 19,
        }}
      >
        {momento.frase}
      </Text>

      <View
        style={{
          marginTop: 14,
          paddingTop: 12,
          borderTopWidth: 1,
          borderTopColor: esOscuro ? "rgba(255,255,255,0.06)" : "rgba(124,77,255,0.08)",
        }}
      >
        <Text style={{ color: colores.textoMuted, fontSize: 12 }}>
          Guardalo como tu foco para este tramo del dia.
        </Text>
      </View>
    </Tarjeta>
  );
}

function TarjetaArea({
  area,
  mostrarDetalle,
}: {
  area: AreaVidaDTO;
  mostrarDetalle: boolean;
}) {
  const { colores } = usarTema();

  const IconoArea = obtenerIconoArea(area.id);

  return (
    <Tarjeta padding="sm" style={{ marginBottom: 10 }}>
      <View style={{ flexDirection: "row", alignItems: "center" }}>
        <View
          style={{
            width: 40,
            height: 40,
            borderRadius: 20,
            backgroundColor: `${colores.acento}14`,
            borderWidth: 1,
            borderColor: `${colores.acento}28`,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <IconoArea size={20} color={colores.acento} weight="fill" />
        </View>

        <View style={{ marginLeft: 12, flex: 1 }}>
          <Text
            style={{
              color: colores.primario,
              fontSize: 15,
              fontFamily: "Inter_700Bold",
            }}
          >
            {area.nombre}
          </Text>
          <Text style={{ color: colores.textoMuted, fontSize: 12, marginTop: 2 }}>
            {area.frase}
          </Text>
        </View>

        {area.nivel !== "neutro" && (
          <Badge variante={obtenerNivelBadge(area.nivel)}>{area.nivel}</Badge>
        )}
      </View>

      <Text
        style={{
          color: colores.textoSecundario,
          fontSize: 13,
          lineHeight: 18,
          marginTop: 12,
        }}
      >
        {mostrarDetalle ? area.detalle : area.frase}
      </Text>
    </Tarjeta>
  );
}

const TITULOS_PODCAST: Record<TipoPodcast, string> = {
  dia: "Hoy",
  semana: "Semana",
  mes: "Mes",
};

const GRADIENTES_PODCAST: Record<TipoPodcast, [string, string]> = {
  dia: ["#6D28D9", "#4A2D8C"],
  semana: ["#7C3AED", "#5B21B6"],
  mes: ["#4C1D95", "#312E81"],
};

function TarjetaPodcast({
  tipo,
  episodio,
  onGenerar,
  onReproducir,
  cargandoGlobal,
}: {
  tipo: TipoPodcast;
  episodio?: PodcastEpisodio;
  onGenerar: () => void;
  onReproducir: () => void;
  cargandoGlobal: boolean;
}) {
  const { colores } = usarTema();
  const listo = episodio?.estado === "listo";
  const generando =
    episodio?.estado === "generando_guion" || episodio?.estado === "generando_audio";

  return (
    <LinearGradient
      colors={GRADIENTES_PODCAST[tipo]}
      style={{
        width: 196,
        borderRadius: 20,
        padding: 16,
        marginRight: 12,
      }}
    >
      <Text
        style={{
          color: "rgba(255,255,255,0.72)",
          fontSize: 11,
          fontFamily: "Inter_600SemiBold",
          textTransform: "uppercase",
          letterSpacing: 0.8,
        }}
      >
        Podcast {TITULOS_PODCAST[tipo]}
      </Text>

      <Text
        style={{
          color: "white",
          fontSize: 18,
          fontFamily: "Inter_700Bold",
          lineHeight: 24,
          marginTop: 10,
          minHeight: 48,
        }}
      >
        {listo ? "Listo para escuchar" : generando ? "Preparando audio" : "Generar episodio"}
      </Text>

      <Text
        style={{
          color: "rgba(255,255,255,0.72)",
          fontSize: 12,
          lineHeight: 18,
          marginTop: 8,
          minHeight: 36,
        }}
      >
        {listo
          ? episodio?.titulo ?? "Tu resumen cosmico ya esta disponible."
          : generando
          ? "Estamos armando el guion y el audio para este ciclo."
          : "Escuchalo en formato breve cuando quieras entrar en sintonia."}
      </Text>

      <View style={{ marginTop: 16 }}>
        {generando ? (
          <ActivityIndicator size="small" color="white" />
        ) : listo ? (
          <Pressable
            onPress={onReproducir}
            style={{
              alignSelf: "flex-start",
              flexDirection: "row",
              alignItems: "center",
              borderRadius: 999,
              paddingHorizontal: 14,
              paddingVertical: 10,
              backgroundColor: "rgba(255,255,255,0.16)",
            }}
          >
            <Play size={16} color="white" weight="fill" />
            <Text
              style={{
                color: "white",
                fontSize: 13,
                fontFamily: "Inter_600SemiBold",
                marginLeft: 8,
              }}
            >
              Reproducir
            </Text>
          </Pressable>
        ) : (
          <Pressable
            onPress={onGenerar}
            disabled={cargandoGlobal}
            style={{
              alignSelf: "flex-start",
              borderRadius: 999,
              paddingHorizontal: 14,
              paddingVertical: 10,
              backgroundColor: "rgba(255,255,255,0.16)",
            }}
          >
            <Text
              style={{
                color: "white",
                fontSize: 13,
                fontFamily: "Inter_600SemiBold",
              }}
            >
              Generar
            </Text>
          </Pressable>
        )}
      </View>
    </LinearGradient>
  );
}

function calcularLunesSiguiente(): string {
  const hoy = new Date();
  const diaSemana = hoy.getDay();
  const diasHastaLunes = diaSemana === 0 ? 1 : 8 - diaSemana;
  const lunes = new Date(hoy);
  lunes.setDate(hoy.getDate() + diasHastaLunes);
  return lunes.toISOString().split("T")[0];
}

export default function DashboardScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const usuario = useStoreAuth((s) => s.usuario);
  const setPistaActual = useStoreUI((s) => s.setPistaActual);
  const { colores, esOscuro } = usarTema();
  const queryClient = useQueryClient();
  const [refrescando, setRefrescando] = useState(false);
  const [verSiguienteSemana, setVerSiguienteSemana] = useState(false);

  const {
    data: pronostico,
    isLoading: cargandoPronostico,
    error: errorPronostico,
    refetch,
  } = usarPronosticoDiario();
  const { data: pronosticoSemanal, isLoading: cargandoSemanal } = usarPronosticoSemanal();
  const {
    data: semanaSiguiente,
    isLoading: cargandoSiguiente,
  } = usarPronosticoSemanal(calcularLunesSiguiente());
  const { data: episodios } = usarPodcastHoy();
  const generarPodcast = usarGenerarPodcast();

  // Solicitar review después de 5 sesiones
  usarReview();

  // Analytics
  trackPantalla("dashboard");

  const esPremium = usuario?.plan_slug === "premium";

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

  const manejarRefresh = async () => {
    setRefrescando(true);
    await queryClient.invalidateQueries({ queryKey: ["pronostico"] });
    await queryClient.invalidateQueries({ queryKey: ["podcast"] });
    setRefrescando(false);
  };

  return (
    <FondoCosmico intensidad="hero">
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          paddingTop: insets.top + 16,
          paddingBottom: 124,
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
        <AnimacionEntrada>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              marginBottom: 22,
            }}
          >
            <Avatar nombre={usuario?.nombre ?? "U"} tamaño="md" />
            <View style={{ marginLeft: 12, flex: 1 }}>
              <Text
                style={{
                  color: colores.primario,
                  fontSize: 22,
                  fontFamily: "Inter_700Bold",
                }}
              >
                {obtenerSaludo(usuario?.nombre)}
              </Text>
            </View>
            <Badge variante={esPremium ? "exito" : "info"}>
              {esPremium ? "Premium" : "Plan gratis"}
            </Badge>
          </View>
        </AnimacionEntrada>

        <AnimacionEntrada retraso={70}>
          <LinearGradient
            colors={colores.gradienteHero}
            style={{
              borderRadius: 26,
              padding: 22,
              marginBottom: 24,
              borderWidth: 1,
              borderColor: esOscuro ? "rgba(255,255,255,0.08)" : "rgba(124,77,255,0.12)",
            }}
          >
            <Text
              style={{
                color: colores.primario,
                fontSize: 17,
                fontFamily: "Inter_600SemiBold",
                textTransform: "capitalize",
                letterSpacing: 0.2,
              }}
            >
              {formatearFechaDashboard(new Date())}
            </Text>

            {cargandoPronostico ? (
              <View style={{ marginTop: 14 }}>
                <Esqueleto style={{ height: 32, width: "72%", borderRadius: 10 }} />
                <Esqueleto
                  style={{ height: 18, width: "100%", borderRadius: 10, marginTop: 12 }}
                />
                <Esqueleto
                  style={{ height: 18, width: "88%", borderRadius: 10, marginTop: 8 }}
                />
                <View style={{ flexDirection: "row", gap: 10, marginTop: 18 }}>
                  <Esqueleto style={{ height: 70, flex: 1, borderRadius: 16 }} />
                  <Esqueleto style={{ height: 70, flex: 1, borderRadius: 16 }} />
                  <Esqueleto style={{ height: 70, flex: 1, borderRadius: 16 }} />
                </View>
              </View>
            ) : errorPronostico || !pronostico ? (
              <EstadoVacio
                icono="cloud-slash"
                titulo="Los astros se escondieron"
                descripcion="No pudimos conectar con el cielo. Verifica tu conexion y volve a intentar."
                accion={{ texto: "Reintentar", onPress: () => refetch() }}
              />
            ) : (
              <>
                <Text
                  style={{
                    color: colores.primario,
                    fontSize: 30,
                    lineHeight: 36,
                    fontFamily: "Inter_700Bold",
                    marginTop: 14,
                  }}
                >
                  {pronostico.clima.titulo}
                </Text>

                <Text
                  style={{
                    color: colores.textoSecundario,
                    fontSize: 15,
                    marginTop: 12,
                    lineHeight: 22,
                  }}
                >
                  {pronostico.clima.frase_sintesis}
                </Text>

                <View style={{ flexDirection: "row", gap: 10, marginTop: 18 }}>
                  <IndicadorHero
                    etiqueta="Energía"
                    valor={`${pronostico.clima.energia}/10`}
                  />
                  <IndicadorHero
                    etiqueta="Claridad"
                    valor={`${pronostico.clima.claridad}/10`}
                  />
                  <IndicadorHero
                    etiqueta="Intuición"
                    valor={`${pronostico.clima.intuicion}/10`}
                  />
                </View>

                {/* CTA Podcast del día — violeta realzado */}
                {(() => {
                  const epHoy = episodios?.find((e) => e.tipo === "dia");
                  const listoParaReproducir = epHoy?.estado === "listo";
                  const generandoEp = epHoy?.estado === "generando_guion" || epHoy?.estado === "generando_audio";

                  return (
                    <Pressable
                      onPress={() => {
                        if (listoParaReproducir && epHoy) {
                          reproducirPodcast(epHoy);
                        } else if (!generandoEp) {
                          generarPodcast.mutate("dia");
                        }
                      }}
                      disabled={generandoEp}
                      style={{
                        marginTop: 18,
                        paddingVertical: 14,
                        paddingHorizontal: 16,
                        borderRadius: 16,
                        flexDirection: "row",
                        alignItems: "center",
                        backgroundColor: esOscuro
                          ? "rgba(124,77,255,0.18)"
                          : "rgba(124,77,255,0.1)",
                        borderWidth: 1,
                        borderColor: `${colores.acento}40`,
                      }}
                      accessibilityRole="button"
                      accessibilityLabel={listoParaReproducir ? "Reproducir podcast de hoy" : "Generar podcast de hoy"}
                    >
                      <View
                        style={{
                          width: 42,
                          height: 42,
                          borderRadius: 21,
                          backgroundColor: colores.acento,
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        {generandoEp ? (
                          <ActivityIndicator size="small" color="white" />
                        ) : (
                          <Play size={18} color="white" weight="fill" />
                        )}
                      </View>
                      <View style={{ marginLeft: 12, flex: 1 }}>
                        <View style={{ flexDirection: "row", alignItems: "center" }}>
                          {listoParaReproducir && (
                            <View
                              style={{
                                width: 8,
                                height: 8,
                                borderRadius: 4,
                                backgroundColor: colores.exito,
                                marginRight: 8,
                              }}
                            />
                          )}
                          <Text
                            style={{
                              color: colores.primario,
                              fontSize: 15,
                              fontFamily: "Inter_700Bold",
                            }}
                          >
                            {listoParaReproducir
                              ? "Escuchá tu podcast de hoy"
                              : generandoEp
                              ? "Preparando tu podcast..."
                              : "Generar podcast de hoy"}
                          </Text>
                        </View>
                        <Text
                          style={{
                            color: colores.textoSecundario,
                            fontSize: 12,
                            marginTop: 3,
                          }}
                        >
                          {listoParaReproducir
                            ? epHoy?.titulo ?? "Tu resumen cósmico diario"
                            : "Tu pronóstico narrado en audio"}
                        </Text>
                      </View>
                      {!generandoEp && (
                        <ArrowRight size={18} color={colores.acento} />
                      )}
                    </Pressable>
                  );
                })()}
              </>
            )}
          </LinearGradient>
        </AnimacionEntrada>

        {pronostico?.alertas.length ? (
          <AnimacionEntrada retraso={110}>
            <EncabezadoSeccion titulo="Alertas cosmicas" />
            <View style={{ marginBottom: 24 }}>
              {pronostico.alertas.slice(0, 2).map((alerta, index) => (
                <Tarjeta key={`${alerta.tipo}-${index}`} padding="sm" style={{ marginBottom: 10 }}>
                  <View style={{ flexDirection: "row", alignItems: "center" }}>
                    <WarningCircle
                      size={18}
                      color={
                        alerta.urgencia === "alta" ? colores.error : colores.advertencia
                      }
                      weight="fill"
                    />
                    <View style={{ marginLeft: 10, flex: 1 }}>
                      <Text
                        style={{
                          color: colores.primario,
                          fontSize: 15,
                          fontFamily: "Inter_700Bold",
                        }}
                      >
                        {alerta.titulo}
                      </Text>
                      <Text
                        style={{
                          color: colores.textoSecundario,
                          fontSize: 13,
                          marginTop: 3,
                          lineHeight: 19,
                        }}
                      >
                        {alerta.descripcion}
                      </Text>
                    </View>
                    <Badge variante={obtenerUrgenciaBadge(alerta.urgencia)}>
                      {alerta.urgencia}
                    </Badge>
                  </View>
                </Tarjeta>
              ))}
            </View>
          </AnimacionEntrada>
        ) : null}

        {pronostico ? (
          <AnimacionEntrada retraso={150}>
            <EncabezadoSeccion titulo="Hoy estás para" />
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingRight: 4, marginBottom: 24 }}
            >
              {pronostico.momentos.map((momento) => {
                const IconoBloque =
                  momento.bloque === "manana"
                    ? SunHorizon
                    : momento.bloque === "tarde"
                    ? Sun
                    : Moon;
                const horaBloque =
                  momento.bloque === "manana"
                    ? "6 – 12h"
                    : momento.bloque === "tarde"
                    ? "12 – 19h"
                    : "19 – 6h";

                return (
                  <Tarjeta key={momento.bloque} padding="md" style={{ width: 260, marginRight: 12 }}>
                    <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 12 }}>
                      <View
                        style={{
                          width: 36,
                          height: 36,
                          borderRadius: 18,
                          backgroundColor: `${colores.acento}18`,
                          borderWidth: 1,
                          borderColor: `${colores.acento}30`,
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <IconoBloque size={18} color={colores.acento} weight="fill" />
                      </View>
                      <Text
                        style={{
                          color: colores.textoMuted,
                          fontSize: 12,
                          fontFamily: "Inter_500Medium",
                          marginLeft: 10,
                        }}
                      >
                        {horaBloque}
                      </Text>
                    </View>

                    {momento.accionables?.length ? (
                      <View style={{ gap: 6 }}>
                        {momento.accionables.map((accion: string, i: number) => (
                          <View
                            key={i}
                            style={{ flexDirection: "row", alignItems: "flex-start" }}
                          >
                            <View
                              style={{
                                width: 6,
                                height: 6,
                                borderRadius: 3,
                                backgroundColor: colores.acento,
                                marginTop: 6,
                                marginRight: 10,
                              }}
                            />
                            <Text
                              style={{
                                color: colores.textoSecundario,
                                fontSize: 13,
                                lineHeight: 19,
                                flex: 1,
                              }}
                            >
                              {accion}
                            </Text>
                          </View>
                        ))}
                      </View>
                    ) : (
                      <Text
                        style={{
                          color: colores.textoSecundario,
                          fontSize: 13,
                          lineHeight: 19,
                        }}
                      >
                        {momento.frase}
                      </Text>
                    )}
                  </Tarjeta>
                );
              })}
            </ScrollView>
          </AnimacionEntrada>
        ) : null}

        {pronostico ? (
          <AnimacionEntrada retraso={190}>
            <EncabezadoSeccion titulo="Tu foco ahora" />
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingRight: 4, marginBottom: 24 }}
            >
              {pronostico.areas.map((area) => (
                <View key={area.id} style={{ width: 220, marginRight: 12 }}>
                  <TarjetaArea
                    area={area}
                    mostrarDetalle={pronostico.acceso.pronostico_detalle_area}
                  />
                </View>
              ))}
            </ScrollView>
          </AnimacionEntrada>
        ) : null}

        <AnimacionEntrada retraso={230}>
          <EncabezadoSeccion
            titulo="Panorama semanal"
            accion={<CalendarDots size={18} color={colores.acento} weight="fill" />}
          />

          {(() => {
            const cargando = verSiguienteSemana ? cargandoSiguiente : cargandoSemanal;
            const datos = verSiguienteSemana
              ? semanaSiguiente?.semana
              : pronosticoSemanal?.semana;
            const hoyStr = new Date().toISOString().split("T")[0];

            if (cargando) {
              return (
                <Tarjeta variante="violeta" style={{ marginBottom: 24 }}>
                  <View style={{ gap: 12 }}>
                    {[1, 2, 3, 4, 5].map((i) => (
                      <Esqueleto key={i} style={{ height: 40, borderRadius: 10 }} />
                    ))}
                  </View>
                </Tarjeta>
              );
            }

            if (!datos?.length) return null;

            return (
              <LinearGradient
                colors={["#6D28D9", "#4A2D8C"]}
                style={{
                  borderRadius: 20,
                  padding: 18,
                  marginBottom: 24,
                }}
              >
                {datos.slice(0, 7).map((dia, idx) => {
                  const esHoy = dia.fecha === hoyStr;
                  const esUltimo = idx === Math.min(datos.length, 7) - 1;

                  return (
                    <View key={dia.fecha}>
                      <View
                        style={{
                          flexDirection: "row",
                          alignItems: "center",
                          paddingVertical: 11,
                        }}
                      >
                        <View style={{ width: 52 }}>
                          <Text
                            style={{
                              color: esHoy ? "#FFFFFF" : "rgba(255,255,255,0.7)",
                              fontSize: 13,
                              fontFamily: esHoy ? "Inter_700Bold" : "Inter_600SemiBold",
                            }}
                          >
                            {esHoy ? "Hoy" : formatearDiaSemana(dia.fecha)}
                          </Text>
                        </View>

                        <Text
                          style={{
                            color: "rgba(255,255,255,0.75)",
                            fontSize: 13,
                            lineHeight: 18,
                            flex: 1,
                            marginHorizontal: 12,
                          }}
                          numberOfLines={2}
                        >
                          {dia.frase_corta}
                        </Text>

                        <Text
                          style={{
                            color: esHoy ? "#FFFFFF" : "rgba(255,255,255,0.5)",
                            fontSize: 12,
                            fontFamily: "Inter_600SemiBold",
                            minWidth: 20,
                            textAlign: "right",
                          }}
                        >
                          {dia.energia}
                        </Text>
                      </View>

                      {!esUltimo && (
                        <View
                          style={{
                            height: 1,
                            backgroundColor: "rgba(255,255,255,0.1)",
                          }}
                        />
                      )}
                    </View>
                  );
                })}

                <Pressable
                  onPress={() => setVerSiguienteSemana(!verSiguienteSemana)}
                  accessibilityRole="button"
                  accessibilityLabel={verSiguienteSemana ? "Volver a esta semana" : "Ver siguiente semana"}
                  style={{
                    marginTop: 12,
                    paddingTop: 12,
                    borderTopWidth: 1,
                    borderTopColor: "rgba(255,255,255,0.12)",
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Text
                    style={{
                      color: "rgba(255,255,255,0.85)",
                      fontSize: 13,
                      fontFamily: "Inter_600SemiBold",
                    }}
                  >
                    {verSiguienteSemana ? "Volver a esta semana" : "Ver siguiente semana"}
                  </Text>
                  <ArrowRight
                    size={14}
                    color="rgba(255,255,255,0.85)"
                    style={{
                      marginLeft: 6,
                      transform: [{ rotate: verSiguienteSemana ? "180deg" : "0deg" }],
                    }}
                  />
                </Pressable>
              </LinearGradient>
            );
          })()}
        </AnimacionEntrada>

        {pronosticoSemanal?.semana?.length ? (
          <AnimacionEntrada retraso={250}>
            <GraficaEnergia
              datos={pronosticoSemanal.semana}
              datosSiguiente={semanaSiguiente?.semana}
              fechaHoy={new Date().toISOString().split("T")[0]}
            />
          </AnimacionEntrada>
        ) : null}

        <AnimacionEntrada retraso={290}>
          <EncabezadoSeccion
            titulo="Podcasts del ciclo"
            accion={
              <Pressable onPress={() => router.push("/(tabs)/podcast" as never)}>
                <Text
                  style={{
                    color: colores.acento,
                    fontSize: 13,
                    fontFamily: "Inter_600SemiBold",
                  }}
                >
                  Ver todo
                </Text>
              </Pressable>
            }
          />

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingRight: 4, marginBottom: 24 }}
          >
            {(["dia", "semana", "mes"] as TipoPodcast[]).map((tipo) => {
              const episodio = episodios?.find((item) => item.tipo === tipo);

              return (
                <TarjetaPodcast
                  key={tipo}
                  tipo={tipo}
                  episodio={episodio}
                  onGenerar={() => generarPodcast.mutate(tipo)}
                  onReproducir={() => episodio && reproducirPodcast(episodio)}
                  cargandoGlobal={generarPodcast.isPending}
                />
              );
            })}
          </ScrollView>
        </AnimacionEntrada>

      </ScrollView>
    </FondoCosmico>
  );
}
