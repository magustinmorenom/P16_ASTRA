import { useCallback, useMemo, useRef, useState } from "react";
import { View, Text, ScrollView, Pressable } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import BottomSheet, { BottomSheetScrollView } from "@gorhom/bottom-sheet";
import { Tarjeta } from "@/componentes/ui/tarjeta";
import { Badge } from "@/componentes/ui/badge";
import { Esqueleto } from "@/componentes/ui/esqueleto";
import { AnimacionEntrada } from "@/componentes/ui/animacion-entrada";
import { IconoAstral } from "@/componentes/ui/icono-astral";
import { usarMisCalculos } from "@/lib/hooks/usar-mis-calculos";
import { usarTema } from "@/lib/hooks/usar-tema";
import type { EtapaVida, MesPersonalItem } from "@/lib/tipos/numerologia";

// ── Explicaciones para no-numerólogos ──────────────────────────────────────

const QUE_ES: Record<string, string> = {
  camino_de_vida:
    "Es el número más importante de tu carta. Se calcula con tu fecha de nacimiento completa y revela tu propósito de vida, las lecciones que viniste a aprender y el camino que mejor te llevará a realizarte.",
  expresion:
    "Se calcula con todas las letras de tu nombre completo. Muestra tus talentos naturales, tus habilidades innatas y cómo te expresás ante el mundo.",
  impulso_del_alma:
    "Se calcula solo con las vocales de tu nombre. Revela tus deseos más profundos, lo que realmente te motiva y lo que tu alma anhela.",
  personalidad:
    "Se calcula solo con las consonantes de tu nombre. Muestra la imagen que proyectás hacia afuera, cómo los demás te perciben a primera vista.",
  numero_nacimiento:
    "Se calcula solo con el día en que naciste. Representa un talento especial que te acompaña toda la vida, como un regalo de nacimiento.",
  anio_personal:
    "Indica la energía general que domina tu año actual. Cambia cada año en tu cumpleaños y define el tono de todo lo que hacés durante ese período.",
  mes_personal:
    "La energía específica de este mes dentro de tu año personal. Te ayuda a entender qué temas están más activos ahora.",
  dia_personal:
    "La vibración energética de hoy según tu ciclo personal. Útil para planificar actividades y decisiones del día.",
  etapa:
    "Los pináculos son cuatro grandes períodos de tu vida. Cada uno tiene un número que define las lecciones y oportunidades principales de esa etapa.",
};

// ── Utilidades ─────────────────────────────────────────────────────────────

function calcularEdad(fechaNacimiento: string): number {
  const hoy = new Date();
  const nacimiento = new Date(fechaNacimiento);
  let edad = hoy.getFullYear() - nacimiento.getFullYear();
  const mesDiff = hoy.getMonth() - nacimiento.getMonth();
  if (mesDiff < 0 || (mesDiff === 0 && hoy.getDate() < nacimiento.getDate())) {
    edad--;
  }
  return edad;
}

// ── Tipo para detalle ──────────────────────────────────────────────────────

interface DetalleNumero {
  titulo: string;
  numero: number;
  descripcion: string;
  descripcion_larga?: string;
  que_es: string;
  esMaestro?: boolean;
  extra?: string;
}

// ── Componente Principal ───────────────────────────────────────────────────

export default function NumerologiaScreen() {
  const insets = useSafeAreaInsets();
  const { data: calculos, isLoading } = usarMisCalculos();
  const { colores, esOscuro } = usarTema();
  const num = calculos?.numerologia;

  // Bottom sheet
  const bottomSheetRef = useRef<BottomSheet>(null);
  const snapPoints = useMemo(() => ["55%", "85%"], []);
  const [detalle, setDetalle] = useState<DetalleNumero | null>(null);

  const abrirDetalle = useCallback((d: DetalleNumero) => {
    setDetalle(d);
    bottomSheetRef.current?.snapToIndex(0);
  }, []);

  const cerrarDetalle = useCallback(() => {
    bottomSheetRef.current?.close();
  }, []);

  // ── Loading ────────────────────────────────────────────────────────────

  if (isLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: colores.fondo, paddingHorizontal: 16, paddingTop: insets.top + 16 }}>
        <Esqueleto style={{ height: 32, width: 180, marginBottom: 16 }} />
        <Esqueleto style={{ height: 120, borderRadius: 16, marginBottom: 16 }} />
        <Esqueleto style={{ height: 80, borderRadius: 12, marginBottom: 8 }} />
        <Esqueleto style={{ height: 200, borderRadius: 12 }} />
      </View>
    );
  }

  // ── Empty state ────────────────────────────────────────────────────────

  if (!num) {
    return (
      <View style={{ flex: 1, backgroundColor: colores.fondo, alignItems: "center", justifyContent: "center", paddingHorizontal: 32, paddingTop: insets.top }}>
        <Text style={{ color: colores.primario, fontSize: 20, fontFamily: "Inter_700Bold", textAlign: "center" }}>
          Numerología
        </Text>
        <Text style={{ color: colores.textoSecundario, textAlign: "center", marginTop: 8 }}>
          Completá tu perfil para ver tu numerología
        </Text>
      </View>
    );
  }

  // ── Datos derivados ────────────────────────────────────────────────────

  const edadActual = calcularEdad(num.fecha_nacimiento);
  const mesActual = new Date().getMonth() + 1;
  const esMaestro = (n: number) => [11, 22, 33].includes(n);

  const esEtapaActiva = (etapa: EtapaVida) =>
    edadActual >= etapa.edad_inicio &&
    (etapa.edad_fin === null || edadActual < etapa.edad_fin);

  // ── Helpers de detalle ─────────────────────────────────────────────────

  const abrirNumero = (clave: string, titulo: string, resp: { numero: number; descripcion: string; descripcion_larga?: string }) => {
    abrirDetalle({
      titulo,
      numero: resp.numero,
      descripcion: resp.descripcion,
      descripcion_larga: resp.descripcion_larga,
      que_es: QUE_ES[clave] ?? "",
      esMaestro: esMaestro(resp.numero),
    });
  };

  const abrirMes = (item: MesPersonalItem) => {
    abrirDetalle({
      titulo: `Mes Personal — ${item.nombre_mes}`,
      numero: item.numero,
      descripcion: item.descripcion,
      descripcion_larga: undefined,
      que_es: `Este es tu número personal para ${item.nombre_mes}. Cada mes tiene una vibración diferente dentro de tu año personal (${num.anio_personal.numero}). Influye en las oportunidades y desafíos del mes.`,
      esMaestro: esMaestro(item.numero),
    });
  };

  const abrirEtapa = (etapa: EtapaVida, indice: number) => {
    const activa = esEtapaActiva(etapa);
    abrirDetalle({
      titulo: etapa.nombre || `Pináculo ${indice + 1}`,
      numero: etapa.numero,
      descripcion: etapa.descripcion,
      descripcion_larga: etapa.descripcion_larga,
      que_es: QUE_ES.etapa,
      esMaestro: esMaestro(etapa.numero),
      extra: activa
        ? `Estás en esta etapa ahora (${edadActual} años).`
        : etapa.edad_fin !== null && edadActual >= etapa.edad_fin
        ? "Esta etapa ya pasó."
        : `Esta etapa comienza a los ${etapa.edad_inicio} años.`,
    });
  };

  // ── Render ─────────────────────────────────────────────────────────────

  return (
    <View style={{ flex: 1, backgroundColor: colores.fondo }}>
      <ScrollView
        contentContainerStyle={{
          paddingTop: insets.top + 16,
          paddingBottom: 120,
          paddingHorizontal: 16,
        }}
      >
        {/* Header */}
        <AnimacionEntrada>
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
              <IconoAstral nombre="numerologia" tamaño={24} />
              <Text style={{ color: colores.primario, fontSize: 24, fontFamily: "Inter_700Bold" }}>
                Numerología
              </Text>
            </View>
            <Badge variante="info">Pitagórico</Badge>
          </View>
          <Text style={{ color: colores.textoMuted, fontSize: 12, marginBottom: 4 }}>
            {num.nombre} · {num.fecha_nacimiento}
          </Text>
          <Text style={{ color: colores.textoSecundario, fontSize: 13, lineHeight: 18 }}>
            Tocá cualquier número para ver su explicación detallada.
          </Text>
        </AnimacionEntrada>

        {/* Hero: Día Personal + Año Personal */}
        <AnimacionEntrada retraso={100}>
          <View style={{ flexDirection: "row", gap: 12, marginTop: 20 }}>
            {/* Día Personal — hero principal */}
            <Pressable style={{ flex: 2 }} onPress={() => abrirNumero("dia_personal", "Día Personal", num.dia_personal)}>
              <Tarjeta variante="acento" padding="lg">
                <Text style={{ color: colores.textoSecundario, fontSize: 11, textTransform: "uppercase", fontFamily: "Inter_600SemiBold" }}>
                  Tu día hoy
                </Text>
                <Text style={{ color: colores.acento, fontSize: 48, fontFamily: "Inter_700Bold", marginVertical: 2 }}>
                  {num.dia_personal.numero}
                </Text>
                <Text numberOfLines={2} style={{ color: colores.textoSecundario, fontSize: 12, lineHeight: 16 }}>
                  {num.dia_personal.descripcion}
                </Text>
              </Tarjeta>
            </Pressable>
            {/* Año Personal */}
            <View style={{ flex: 1, gap: 12 }}>
              <Pressable onPress={() => abrirNumero("anio_personal", "Año Personal", num.anio_personal)}>
                <Tarjeta variante="violeta" padding="md">
                  <Text style={{ color: colores.textoSecundario, fontSize: 10, textTransform: "uppercase", fontFamily: "Inter_600SemiBold" }}>
                    Año
                  </Text>
                  <Text style={{ color: colores.acento, fontSize: 28, fontFamily: "Inter_700Bold" }}>
                    {num.anio_personal.numero}
                  </Text>
                </Tarjeta>
              </Pressable>
              <Pressable onPress={() => abrirNumero("mes_personal", "Mes Personal", num.mes_personal)}>
                <Tarjeta padding="md">
                  <Text style={{ color: colores.textoSecundario, fontSize: 10, textTransform: "uppercase", fontFamily: "Inter_600SemiBold" }}>
                    Mes
                  </Text>
                  <Text style={{ color: colores.acento, fontSize: 28, fontFamily: "Inter_700Bold" }}>
                    {num.mes_personal.numero}
                  </Text>
                </Tarjeta>
              </Pressable>
            </View>
          </View>
        </AnimacionEntrada>

        {/* Sección: Tus Números */}
        <AnimacionEntrada retraso={200}>
          <Text style={{ color: colores.primario, fontFamily: "Inter_600SemiBold", fontSize: 18, marginTop: 28, marginBottom: 4 }}>
            Tus Números
          </Text>
          <Text style={{ color: colores.textoMuted, fontSize: 12, marginBottom: 12 }}>
            Los números clave que definen tu personalidad y propósito
          </Text>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
            {([
              ["camino_de_vida", "Camino de Vida", num.camino_de_vida],
              ["expresion", "Expresión", num.expresion],
              ["impulso_del_alma", "Impulso del Alma", num.impulso_del_alma],
              ["personalidad", "Personalidad", num.personalidad],
              ["numero_nacimiento", "Nacimiento", num.numero_nacimiento],
            ] as const).map(([clave, titulo, resp]) => (
              <Pressable
                key={clave}
                style={{ flexBasis: "47%", flexGrow: 1 }}
                onPress={() => abrirNumero(clave, titulo, resp)}
              >
                <Tarjeta variante={esMaestro(resp.numero) ? "dorado" : clave === "camino_de_vida" ? "acento" : "default"}>
                  <Text style={{ color: colores.textoSecundario, fontSize: 10, textTransform: "uppercase", fontFamily: "Inter_600SemiBold" }}>
                    {titulo}
                  </Text>
                  <Text style={{ color: colores.acento, fontSize: 30, fontFamily: "Inter_700Bold", marginVertical: 2 }}>
                    {resp.numero}
                  </Text>
                  <Text numberOfLines={2} style={{ color: colores.textoSecundario, fontSize: 11 }}>
                    {resp.descripcion}
                  </Text>
                  {esMaestro(resp.numero) && (
                    <View style={{ marginTop: 4 }}>
                      <Badge variante="advertencia">Maestro</Badge>
                    </View>
                  )}
                </Tarjeta>
              </Pressable>
            ))}
          </View>
        </AnimacionEntrada>

        {/* Sección: Meses Personales */}
        {num.meses_personales && num.meses_personales.length > 0 && (
          <AnimacionEntrada retraso={300}>
            <Text style={{ color: colores.primario, fontFamily: "Inter_600SemiBold", fontSize: 18, marginTop: 28, marginBottom: 4 }}>
              Tus 12 Meses del Año
            </Text>
            <Text style={{ color: colores.textoMuted, fontSize: 12, marginBottom: 12 }}>
              Cada mes tiene una vibración diferente · Año Personal {num.anio_personal.numero}
            </Text>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
              {num.meses_personales.map((item) => {
                const esActual = item.mes === mesActual;
                return (
                  <Pressable
                    key={item.mes}
                    onPress={() => abrirMes(item)}
                    style={{ flexBasis: "23%", flexGrow: 1, maxWidth: "25%" }}
                  >
                    <View
                      style={{
                        backgroundColor: esActual ? colores.acento + "20" : colores.fondoSecundario,
                        borderRadius: 12,
                        borderWidth: esActual ? 1.5 : 1,
                        borderColor: esActual ? colores.acento + "66" : colores.borde,
                        paddingVertical: 10,
                        alignItems: "center",
                      }}
                    >
                      <Text style={{ color: colores.textoMuted, fontSize: 10, fontFamily: "Inter_600SemiBold", textTransform: "uppercase" }}>
                        {item.nombre_mes.substring(0, 3)}
                      </Text>
                      <Text style={{ color: esActual ? colores.acento : colores.primario, fontSize: 22, fontFamily: "Inter_700Bold", marginVertical: 2 }}>
                        {item.numero}
                      </Text>
                      {esActual && (
                        <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: colores.acento, marginTop: 2 }} />
                      )}
                    </View>
                  </Pressable>
                );
              })}
            </View>
          </AnimacionEntrada>
        )}

        {/* Sección: Etapas de Vida */}
        {num.etapas_de_la_vida.length > 0 && (
          <AnimacionEntrada retraso={400}>
            <Text style={{ color: colores.primario, fontFamily: "Inter_600SemiBold", fontSize: 18, marginTop: 28, marginBottom: 4 }}>
              Etapas de Vida
            </Text>
            <Text style={{ color: colores.textoMuted, fontSize: 12, marginBottom: 12 }}>
              Los 4 grandes períodos de tu vida · Tenés {edadActual} años
            </Text>
            {num.etapas_de_la_vida.map((etapa, i) => {
              const activa = esEtapaActiva(etapa);
              const pasada = etapa.edad_fin !== null && edadActual >= etapa.edad_fin;
              return (
                <Pressable key={i} onPress={() => abrirEtapa(etapa, i)}>
                  <Tarjeta
                    variante={activa ? "acento" : "default"}
                    padding="md"
                    style={{ marginBottom: 10, opacity: pasada ? 0.6 : 1 }}
                  >
                    <View style={{ flexDirection: "row", alignItems: "center" }}>
                      <View
                        style={{
                          backgroundColor: activa ? colores.acento + "33" : colores.superficie,
                          borderRadius: 20,
                          width: 40,
                          height: 40,
                          alignItems: "center",
                          justifyContent: "center",
                          marginRight: 12,
                        }}
                      >
                        <Text style={{ color: activa ? colores.acento : colores.primario, fontFamily: "Inter_700Bold", fontSize: 18 }}>
                          {etapa.numero}
                        </Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={{ color: colores.primario, fontSize: 14, fontFamily: "Inter_600SemiBold" }}>
                          {etapa.nombre || `Pináculo ${i + 1}`}
                        </Text>
                        <Text style={{ color: colores.textoMuted, fontSize: 12 }}>
                          De {etapa.edad_inicio} a {etapa.edad_fin ?? "∞"} años
                        </Text>
                      </View>
                      <View style={{ gap: 4 }}>
                        {activa && <Badge variante="info">Ahora</Badge>}
                        {esMaestro(etapa.numero) && <Badge variante="advertencia">Maestro</Badge>}
                      </View>
                    </View>
                  </Tarjeta>
                </Pressable>
              );
            })}
          </AnimacionEntrada>
        )}
      </ScrollView>

      {/* Bottom Sheet — Detalle del Número */}
      <BottomSheet
        ref={bottomSheetRef}
        index={-1}
        snapPoints={snapPoints}
        enablePanDownToClose
        backgroundStyle={{
          backgroundColor: colores.fondoSecundario,
          borderTopLeftRadius: 24,
          borderTopRightRadius: 24,
        }}
        handleIndicatorStyle={{ backgroundColor: colores.textoMuted, width: 40 }}
        style={{
          shadowColor: "#000",
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: 0.15,
          shadowRadius: 12,
          elevation: 8,
        }}
      >
        <BottomSheetScrollView
          contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
        >
          {detalle && (
            <>
              {/* Número grande */}
              <View style={{ alignItems: "center", marginBottom: 20 }}>
                <View
                  style={{
                    backgroundColor: colores.acento + "1A",
                    borderRadius: 32,
                    width: 80,
                    height: 80,
                    alignItems: "center",
                    justifyContent: "center",
                    marginBottom: 12,
                  }}
                >
                  <Text style={{ color: colores.acento, fontSize: 40, fontFamily: "Inter_700Bold" }}>
                    {detalle.numero}
                  </Text>
                </View>
                <Text style={{ color: colores.primario, fontSize: 18, fontFamily: "Inter_700Bold", textAlign: "center" }}>
                  {detalle.titulo}
                </Text>
                {detalle.esMaestro && (
                  <View style={{ marginTop: 6 }}>
                    <Badge variante="advertencia">Número Maestro</Badge>
                  </View>
                )}
              </View>

              {/* Qué es */}
              <View style={{ backgroundColor: colores.superficie, borderRadius: 12, padding: 14, marginBottom: 16 }}>
                <Text style={{ color: colores.textoMuted, fontSize: 11, textTransform: "uppercase", fontFamily: "Inter_600SemiBold", marginBottom: 6 }}>
                  Qué significa
                </Text>
                <Text style={{ color: colores.textoSecundario, fontSize: 13, lineHeight: 20 }}>
                  {detalle.que_es}
                </Text>
              </View>

              {/* Significado del número */}
              <View style={{ backgroundColor: colores.superficie, borderRadius: 12, padding: 14, marginBottom: 16 }}>
                <Text style={{ color: colores.textoMuted, fontSize: 11, textTransform: "uppercase", fontFamily: "Inter_600SemiBold", marginBottom: 6 }}>
                  El número {detalle.numero}
                </Text>
                <Text style={{ color: colores.acento, fontSize: 14, fontFamily: "Inter_600SemiBold", marginBottom: 6 }}>
                  {detalle.descripcion}
                </Text>
                {detalle.descripcion_larga ? (
                  <Text style={{ color: colores.textoSecundario, fontSize: 13, lineHeight: 20 }}>
                    {detalle.descripcion_larga}
                  </Text>
                ) : null}
              </View>

              {/* Extra (para etapas) */}
              {detalle.extra && (
                <View style={{ backgroundColor: colores.acento + "15", borderRadius: 12, padding: 14 }}>
                  <Text style={{ color: colores.acento, fontSize: 13, fontFamily: "Inter_600SemiBold" }}>
                    {detalle.extra}
                  </Text>
                </View>
              )}
            </>
          )}
        </BottomSheetScrollView>
      </BottomSheet>
    </View>
  );
}
