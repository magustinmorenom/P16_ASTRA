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
  Moon,
  Play,
  Sun,
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
import { useStoreAuth } from "@/lib/stores/store-auth";
import { useStoreUI, type PistaReproduccion } from "@/lib/stores/store-ui";
import {
  usarPodcastHoy,
  usarGenerarPodcast,
  usarPronosticoDiario,
  usarPronosticoSemanal,
} from "@/lib/hooks";
import { usarTema } from "@/lib/hooks/usar-tema";
import type {
  AreaVidaDTO,
  MomentoClaveDTO,
  PodcastEpisodio,
  TipoPodcast,
} from "@/lib/tipos";

function obtenerSaludo(): string {
  const hora = new Date().getHours();
  if (hora < 12) return "Buenos dias";
  if (hora < 19) return "Buenas tardes";
  return "Buenas noches";
}

function formatearFechaDashboard(fecha: Date): string {
  return fecha.toLocaleDateString("es-AR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}

function formatearDiaSemana(fecha: string): string {
  return new Date(`${fecha}T12:00:00`).toLocaleDateString("es-AR", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
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
  const mapa: Record<string, string> = {
    trabajo: "carrera",
    amor: "emocion",
    salud: "salud",
    finanzas: "suerte",
    creatividad: "libro",
    crecimiento: "personal",
  };

  return mapa[areaId] ?? "astrologia";
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
          <IconoAstral nombre={obtenerIconoArea(area.id)} tamaño={20} />
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

        <Badge variante={obtenerNivelBadge(area.nivel)}>{area.nivel}</Badge>
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

export default function DashboardScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const usuario = useStoreAuth((s) => s.usuario);
  const setPistaActual = useStoreUI((s) => s.setPistaActual);
  const { colores, esOscuro } = usarTema();
  const queryClient = useQueryClient();
  const [refrescando, setRefrescando] = useState(false);

  const {
    data: pronostico,
    isLoading: cargandoPronostico,
    error: errorPronostico,
    refetch,
  } = usarPronosticoDiario();
  const { data: pronosticoSemanal, isLoading: cargandoSemanal } = usarPronosticoSemanal();
  const { data: episodios } = usarPodcastHoy();
  const generarPodcast = usarGenerarPodcast();

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
                  color: colores.textoSecundario,
                  fontSize: 13,
                  fontFamily: "Inter_500Medium",
                }}
              >
                {obtenerSaludo()}
              </Text>
              <Text
                style={{
                  color: colores.primario,
                  fontSize: 22,
                  fontFamily: "Inter_700Bold",
                  marginTop: 2,
                }}
              >
                {usuario?.nombre ?? "Explorador"}
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
            <Badge variante="info">Ritual de hoy</Badge>

            <Text
              style={{
                color: colores.textoSecundario,
                fontSize: 13,
                marginTop: 14,
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
                    etiqueta="Energia"
                    valor={`${pronostico.clima.energia}/10`}
                  />
                  <IndicadorHero
                    etiqueta="Claridad"
                    valor={`${pronostico.clima.claridad}/10`}
                  />
                  <IndicadorHero etiqueta="Luna" valor={pronostico.luna.signo} />
                </View>

                <View
                  style={{
                    marginTop: 18,
                    paddingTop: 16,
                    borderTopWidth: 1,
                    borderTopColor: esOscuro
                      ? "rgba(255,255,255,0.08)"
                      : "rgba(124,77,255,0.12)",
                  }}
                >
                  <View style={{ flexDirection: "row", alignItems: "center" }}>
                    <View
                      style={{
                        width: 44,
                        height: 44,
                        borderRadius: 22,
                        backgroundColor: esOscuro
                          ? "rgba(255,255,255,0.05)"
                          : "rgba(255,255,255,0.62)",
                        borderWidth: 1,
                        borderColor: esOscuro
                          ? "rgba(255,255,255,0.08)"
                          : "rgba(124,77,255,0.12)",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <IconoSigno signo={pronostico.luna.signo} tamaño={22} />
                    </View>
                    <View style={{ marginLeft: 12, flex: 1 }}>
                      <Text
                        style={{
                          color: colores.primario,
                          fontSize: 15,
                          fontFamily: "Inter_700Bold",
                        }}
                      >
                        Luna en {pronostico.luna.signo}
                      </Text>
                      <Text
                        style={{
                          color: colores.textoSecundario,
                          fontSize: 13,
                          marginTop: 3,
                        }}
                      >
                        {pronostico.luna.fase} · Numero {pronostico.numero_personal.numero}
                      </Text>
                    </View>
                  </View>

                  <View style={{ flexDirection: "row", gap: 10, marginTop: 16 }}>
                    <Boton
                      tamaño="sm"
                      onPress={() => router.push("/(tabs)/chat" as never)}
                      icono={<ChatCircleDots size={16} color="white" weight="fill" />}
                    >
                      Abrir chat
                    </Boton>
                    <Boton
                      tamaño="sm"
                      variante="secundario"
                      onPress={() => router.push("/(tabs)/descubrir" as never)}
                    >
                      Explorar modulos
                    </Boton>
                  </View>
                </View>
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
            <EncabezadoSeccion
              titulo="Momentos del dia"
              accion={<Badge variante="info">Numero {pronostico.numero_personal.numero}</Badge>}
            />
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingRight: 4, marginBottom: 24 }}
            >
              {pronostico.momentos.map((momento) => (
                <TarjetaMomento key={momento.bloque} momento={momento} />
              ))}
            </ScrollView>
          </AnimacionEntrada>
        ) : null}

        {pronostico ? (
          <AnimacionEntrada retraso={190}>
            <EncabezadoSeccion
              titulo="Tu foco ahora"
              accion={
                <Badge
                  variante={pronostico.acceso.pronostico_detalle_area ? "exito" : "default"}
                >
                  {pronostico.acceso.pronostico_detalle_area ? "Detalle completo" : "Resumen"}
                </Badge>
              }
            />
            <Text
              style={{
                color: colores.textoSecundario,
                fontSize: 14,
                lineHeight: 20,
                marginBottom: 12,
              }}
            >
              Estas son las areas que hoy conviene mirar primero antes de bajar al detalle.
            </Text>
            <View style={{ marginBottom: 24 }}>
              {pronostico.areas.slice(0, 3).map((area) => (
                <TarjetaArea
                  key={area.id}
                  area={area}
                  mostrarDetalle={pronostico.acceso.pronostico_detalle_area}
                />
              ))}
            </View>
          </AnimacionEntrada>
        ) : null}

        <AnimacionEntrada retraso={230}>
          <EncabezadoSeccion
            titulo="Panorama semanal"
            accion={<CalendarDots size={18} color={colores.acento} weight="fill" />}
          />

          {cargandoSemanal ? (
            <View style={{ gap: 8, marginBottom: 24 }}>
              {[1, 2, 3].map((item) => (
                <Esqueleto key={item} style={{ height: 72, borderRadius: 16 }} />
              ))}
            </View>
          ) : pronosticoSemanal?.semana?.length ? (
            <View style={{ gap: 8, marginBottom: 24 }}>
              {pronosticoSemanal.semana.slice(0, 4).map((dia) => (
                <Tarjeta key={dia.fecha} padding="sm">
                  <View style={{ flexDirection: "row", alignItems: "center" }}>
                    <View style={{ flex: 1 }}>
                      <Text
                        style={{
                          color: colores.primario,
                          fontSize: 14,
                          fontFamily: "Inter_700Bold",
                        }}
                      >
                        {formatearDiaSemana(dia.fecha)}
                      </Text>
                      <Text
                        style={{
                          color: colores.textoSecundario,
                          fontSize: 12,
                          marginTop: 3,
                        }}
                      >
                        {dia.frase_corta}
                      </Text>
                    </View>
                    <Badge variante="info">Energia {dia.energia}</Badge>
                  </View>
                </Tarjeta>
              ))}
            </View>
          ) : null}
        </AnimacionEntrada>

        <AnimacionEntrada retraso={270}>
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

        <AnimacionEntrada retraso={310}>
          <Tarjeta variante="violeta">
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <View
                style={{
                  width: 46,
                  height: 46,
                  borderRadius: 23,
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: `${colores.acento}16`,
                  borderWidth: 1,
                  borderColor: `${colores.acento}28`,
                }}
              >
                <IconoAstral nombre="personal" tamaño={22} />
              </View>
              <View style={{ marginLeft: 12, flex: 1 }}>
                <Text
                  style={{
                    color: colores.primario,
                    fontSize: 16,
                    fontFamily: "Inter_700Bold",
                  }}
                >
                  Segui explorando tu mapa
                </Text>
                <Text
                  style={{
                    color: colores.textoSecundario,
                    fontSize: 13,
                    lineHeight: 19,
                    marginTop: 3,
                  }}
                >
                  Diseño Humano, numerología, calendario cósmico y más, ordenados para
                  entrar con contexto.
                </Text>
              </View>
              <Pressable onPress={() => router.push("/(tabs)/descubrir" as never)}>
                <ArrowRight size={20} color={colores.acento} />
              </Pressable>
            </View>
          </Tarjeta>
        </AnimacionEntrada>
      </ScrollView>
    </FondoCosmico>
  );
}
