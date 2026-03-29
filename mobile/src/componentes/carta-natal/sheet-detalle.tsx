import { useCallback, useMemo, useRef } from "react";
import { View, Text, ScrollView, Pressable } from "react-native";
import BottomSheet, { BottomSheetScrollView } from "@gorhom/bottom-sheet";
import { usarTema } from "@/lib/hooks/usar-tema";
import { IconoSigno } from "@/componentes/ui/icono-astral";
import { Badge } from "@/componentes/ui/badge";
import {
  COLORES_PLANETA,
  ELEMENTO_SIGNO,
  MODALIDAD_SIGNO,
  REGENTE_SIGNO,
  ROMANO,
  normalizarClave,
  interpretarPlaneta,
  interpretarAspecto,
  interpretarCasa,
  interpretarTriada,
} from "@/lib/utilidades/interpretaciones-natal";
import type { CartaNatal, Planeta, Aspecto, Casa } from "@/lib/tipos";

// ---------------------------------------------------------------------------
// Tipos de selección
// ---------------------------------------------------------------------------

export type SeleccionSheet =
  | { tipo: "planeta"; planeta: Planeta }
  | { tipo: "aspecto"; aspecto: Aspecto }
  | { tipo: "casa"; casa: Casa }
  | { tipo: "triada"; subtipo: "sol" | "luna" | "ascendente" };

interface SheetDetalleProps {
  seleccion: SeleccionSheet | null;
  datos: CartaNatal;
  onCerrar: () => void;
}

// ---------------------------------------------------------------------------
// Componente principal
// ---------------------------------------------------------------------------

export function SheetDetalle({ seleccion, datos, onCerrar }: SheetDetalleProps) {
  const { colores, esOscuro } = usarTema();
  const sheetRef = useRef<BottomSheet>(null);
  const snapPoints = useMemo(() => ["40%", "80%"], []);

  const handleSheetChange = useCallback((index: number) => {
    if (index === -1) onCerrar();
  }, [onCerrar]);

  if (!seleccion) return null;

  return (
    <BottomSheet
      ref={sheetRef}
      index={0}
      snapPoints={snapPoints}
      onChange={handleSheetChange}
      enablePanDownToClose
      backgroundStyle={{
        backgroundColor: colores.superficie,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
      }}
      handleIndicatorStyle={{ backgroundColor: colores.textoMuted, width: 40 }}
    >
      <BottomSheetScrollView
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }}
      >
        {seleccion.tipo === "planeta" && (
          <ContenidoPlaneta planeta={seleccion.planeta} datos={datos} />
        )}
        {seleccion.tipo === "aspecto" && (
          <ContenidoAspecto aspecto={seleccion.aspecto} />
        )}
        {seleccion.tipo === "casa" && (
          <ContenidoCasa casa={seleccion.casa} datos={datos} />
        )}
        {seleccion.tipo === "triada" && (
          <ContenidoTriada subtipo={seleccion.subtipo} datos={datos} />
        )}
      </BottomSheetScrollView>
    </BottomSheet>
  );
}

// ---------------------------------------------------------------------------
// Vista planeta
// ---------------------------------------------------------------------------

function ContenidoPlaneta({ planeta, datos }: { planeta: Planeta; datos: CartaNatal }) {
  const { colores } = usarTema();
  const color = COLORES_PLANETA[planeta.nombre] || "#7C4DFF";
  const elemento = ELEMENTO_SIGNO[planeta.signo] || "—";
  const modalidad = MODALIDAD_SIGNO[planeta.signo] || "—";
  const regente = REGENTE_SIGNO[planeta.signo] || "—";
  const narrativa = interpretarPlaneta(planeta.nombre, planeta.signo, planeta.casa, planeta.dignidad, planeta.retrogrado);

  const aspectosRelacionados = datos.aspectos.filter(
    (a) => a.planeta1 === planeta.nombre || a.planeta2 === planeta.nombre,
  );

  return (
    <View>
      {/* Header */}
      <View style={{ alignItems: "center", marginBottom: 16 }}>
        <View style={{
          width: 56,
          height: 56,
          borderRadius: 28,
          backgroundColor: `${color}20`,
          borderWidth: 2,
          borderColor: color,
          alignItems: "center",
          justifyContent: "center",
          marginBottom: 8,
        }}>
          <IconoSigno signo={planeta.signo} tamaño={28} style={{ tintColor: color }} />
        </View>
        <Text style={{ fontSize: 18, fontFamily: "Inter_700Bold", color: colores.primario }}>
          {planeta.nombre} en {planeta.signo}
        </Text>
        <Text style={{ fontSize: 13, color: colores.textoSecundario, marginTop: 2 }}>
          {planeta.grado_en_signo.toFixed(2)}° · Casa {ROMANO[planeta.casa]}
        </Text>
      </View>

      {/* Propiedades */}
      <View style={{ flexDirection: "row", gap: 8, marginBottom: 16 }}>
        {[
          { label: "Elemento", value: elemento },
          { label: "Modalidad", value: modalidad },
          { label: "Regente", value: regente },
        ].map((prop) => (
          <View key={prop.label} style={{
            flex: 1,
            borderRadius: 10,
            borderWidth: 1,
            borderColor: colores.borde,
            paddingVertical: 8,
            alignItems: "center",
          }}>
            <Text style={{ fontSize: 9, color: colores.textoMuted, textTransform: "uppercase", letterSpacing: 1, fontFamily: "Inter_600SemiBold" }}>
              {prop.label}
            </Text>
            <Text style={{ fontSize: 13, fontFamily: "Inter_600SemiBold", color: colores.primario, marginTop: 2 }}>
              {prop.value}
            </Text>
          </View>
        ))}
      </View>

      {/* Dignidad */}
      {planeta.dignidad && (
        <View style={{ marginBottom: 16 }}>
          <Text style={{ fontSize: 10, color: colores.textoSecundario, textTransform: "uppercase", letterSpacing: 1, fontFamily: "Inter_600SemiBold", marginBottom: 4 }}>
            Dignidad
          </Text>
          <Badge variante="info">{planeta.dignidad}</Badge>
        </View>
      )}

      {/* Interpretación */}
      <View style={{ marginBottom: 16 }}>
        <Text style={{ fontSize: 11, color: colores.acento, textTransform: "uppercase", letterSpacing: 1, fontFamily: "Inter_600SemiBold", marginBottom: 6 }}>
          Interpretación
        </Text>
        <Text style={{ fontSize: 13, color: colores.primario, lineHeight: 20 }}>
          {narrativa}
        </Text>
      </View>

      {/* Aspectos relacionados */}
      {aspectosRelacionados.length > 0 && (
        <View>
          <Text style={{ fontSize: 11, color: colores.acento, textTransform: "uppercase", letterSpacing: 1, fontFamily: "Inter_600SemiBold", marginBottom: 6 }}>
            Aspectos Relacionados
          </Text>
          {aspectosRelacionados.map((asp, idx) => {
            const otroPlaneta = asp.planeta1 === planeta.nombre ? asp.planeta2 : asp.planeta1;
            return (
              <View key={`${asp.planeta1}-${asp.planeta2}-${idx}`} style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                backgroundColor: colores.fondoSecundario,
                borderRadius: 10,
                paddingHorizontal: 12,
                paddingVertical: 8,
                marginBottom: 4,
              }}>
                <Text style={{ fontSize: 13, color: colores.primario }}>{otroPlaneta}</Text>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                  <Text style={{ fontSize: 11, color: colores.textoSecundario }}>{asp.orbe.toFixed(1)}°</Text>
                  <Badge variante="info">{asp.tipo}</Badge>
                </View>
              </View>
            );
          })}
        </View>
      )}
    </View>
  );
}

// ---------------------------------------------------------------------------
// Vista aspecto
// ---------------------------------------------------------------------------

function ContenidoAspecto({ aspecto }: { aspecto: Aspecto }) {
  const { colores } = usarTema();
  const narrativa = interpretarAspecto(aspecto.planeta1, aspecto.planeta2, aspecto.tipo, aspecto.orbe, aspecto.aplicativo);

  return (
    <View>
      <View style={{ alignItems: "center", marginBottom: 16 }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 6 }}>
          <Text style={{ fontSize: 16, fontFamily: "Inter_700Bold", color: colores.primario }}>{aspecto.planeta1}</Text>
          <Badge variante="info">{aspecto.tipo}</Badge>
          <Text style={{ fontSize: 16, fontFamily: "Inter_700Bold", color: colores.primario }}>{aspecto.planeta2}</Text>
        </View>
        <Text style={{ fontSize: 13, color: colores.textoSecundario }}>
          Ángulo: {aspecto.angulo_exacto.toFixed(1)}° · Orbe: {aspecto.orbe.toFixed(1)}° · {aspecto.aplicativo ? "Aplicativo" : "Separativo"}
        </Text>
      </View>

      <View>
        <Text style={{ fontSize: 11, color: colores.acento, textTransform: "uppercase", letterSpacing: 1, fontFamily: "Inter_600SemiBold", marginBottom: 6 }}>
          Interpretación
        </Text>
        <Text style={{ fontSize: 13, color: colores.primario, lineHeight: 20 }}>
          {narrativa}
        </Text>
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Vista casa
// ---------------------------------------------------------------------------

function ContenidoCasa({ casa, datos }: { casa: Casa; datos: CartaNatal }) {
  const { colores } = usarTema();
  const planetasEnCasa = datos.planetas.filter((p) => p.casa === casa.numero).map((p) => p.nombre);
  const narrativa = interpretarCasa(casa.numero, casa.signo, planetasEnCasa);

  return (
    <View>
      <View style={{ alignItems: "center", marginBottom: 16 }}>
        <View style={{
          width: 56,
          height: 56,
          borderRadius: 28,
          backgroundColor: `${colores.acento}20`,
          alignItems: "center",
          justifyContent: "center",
          marginBottom: 8,
        }}>
          <IconoSigno signo={casa.signo} tamaño={28} />
        </View>
        <Text style={{ fontSize: 18, fontFamily: "Inter_700Bold", color: colores.primario }}>
          Casa {ROMANO[casa.numero]}
        </Text>
        <Text style={{ fontSize: 13, color: colores.textoSecundario, marginTop: 2 }}>
          {casa.signo} · {casa.grado_en_signo.toFixed(1)}°
        </Text>
      </View>

      {planetasEnCasa.length > 0 && (
        <View style={{ marginBottom: 16 }}>
          <Text style={{ fontSize: 10, color: colores.textoSecundario, textTransform: "uppercase", letterSpacing: 1, fontFamily: "Inter_600SemiBold", marginBottom: 6 }}>
            Planetas presentes
          </Text>
          <View style={{ flexDirection: "row", gap: 6, flexWrap: "wrap" }}>
            {planetasEnCasa.map((nombre) => (
              <Badge key={nombre} variante="info">{nombre}</Badge>
            ))}
          </View>
        </View>
      )}

      <View>
        <Text style={{ fontSize: 11, color: colores.acento, textTransform: "uppercase", letterSpacing: 1, fontFamily: "Inter_600SemiBold", marginBottom: 6 }}>
          Interpretación
        </Text>
        <Text style={{ fontSize: 13, color: colores.primario, lineHeight: 20 }}>
          {narrativa}
        </Text>
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Vista tríada
// ---------------------------------------------------------------------------

function ContenidoTriada({ subtipo, datos }: { subtipo: "sol" | "luna" | "ascendente"; datos: CartaNatal }) {
  const { colores } = usarTema();
  const sol = datos.planetas.find((p) => p.nombre === "Sol")!;
  const luna = datos.planetas.find((p) => p.nombre === "Luna")!;
  const narrativa = interpretarTriada(sol.signo, sol.casa, luna.signo, luna.casa, datos.ascendente.signo);

  const titulo =
    subtipo === "sol" ? `Sol en ${sol.signo}` :
    subtipo === "luna" ? `Luna en ${luna.signo}` :
    `Ascendente en ${datos.ascendente.signo}`;

  const detalle =
    subtipo === "sol"
      ? interpretarPlaneta("Sol", sol.signo, sol.casa, sol.dignidad, sol.retrogrado)
      : subtipo === "luna"
      ? interpretarPlaneta("Luna", luna.signo, luna.casa, luna.dignidad, luna.retrogrado)
      : `Tu Ascendente en ${datos.ascendente.signo} define cómo el mundo te percibe. Es la lente a través de la cual filtras toda experiencia vital y la primera impresión que generas en los demás.`;

  return (
    <View>
      <Text style={{ fontSize: 16, fontFamily: "Inter_700Bold", color: colores.primario, marginBottom: 12 }}>
        Tríada: {titulo}
      </Text>

      <View style={{ marginBottom: 16 }}>
        <Text style={{ fontSize: 11, color: colores.acento, textTransform: "uppercase", letterSpacing: 1, fontFamily: "Inter_600SemiBold", marginBottom: 6 }}>
          {titulo}
        </Text>
        <Text style={{ fontSize: 13, color: colores.primario, lineHeight: 20 }}>
          {detalle}
        </Text>
      </View>

      <View>
        <Text style={{ fontSize: 11, color: colores.acento, textTransform: "uppercase", letterSpacing: 1, fontFamily: "Inter_600SemiBold", marginBottom: 6 }}>
          Análisis Sol-Luna-Ascendente
        </Text>
        <Text style={{ fontSize: 13, color: colores.primario, lineHeight: 20 }}>
          {narrativa}
        </Text>
      </View>
    </View>
  );
}
