import { View, Text, Pressable } from "react-native";
import { usarTema } from "@/lib/hooks/usar-tema";
import {
  COLORES_PLANETA,
  SIMBOLOS_ASPECTO,
  normalizarClave,
  agruparAspectos,
} from "@/lib/utilidades/interpretaciones-natal";
import type { Aspecto } from "@/lib/tipos";

function obtenerColoresTipo(colores: ReturnType<typeof usarTema>["colores"]) {
  const base: Record<string, { bg: string; text: string }> = {
    conjuncion: { bg: colores.acento + "18", text: colores.acento },
    trigono: { bg: "#34d39920", text: "#34d399" },
    sextil: { bg: "#60a5fa20", text: "#60a5fa" },
    cuadratura: { bg: colores.error + "20", text: colores.error },
    oposicion: { bg: "#c084fc20", text: "#c084fc" },
  };
  return base;
}

interface AspectosNarrativoProps {
  aspectos: Aspecto[];
  onSeleccionar: (a: Aspecto) => void;
}

export function AspectosNarrativo({ aspectos, onSeleccionar }: AspectosNarrativoProps) {
  const { colores } = usarTema();
  const grupos = agruparAspectos(aspectos);

  return (
    <View style={{ marginBottom: 20 }}>
      <Text style={{ color: colores.primario, fontFamily: "Inter_600SemiBold", fontSize: 15, marginBottom: 10 }}>
        Aspectos Planetarios
      </Text>
      {grupos.map((grupo) => {
        const coloresTipo = obtenerColoresTipo(colores);
        const estilo = coloresTipo[grupo.tipo] || { bg: colores.fondoSecundario, text: colores.textoSecundario };
        return (
          <View key={grupo.tipo} style={{ marginBottom: 14 }}>
            {/* Encabezado */}
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 6 }}>
              <View style={{ backgroundColor: estilo.bg, borderRadius: 12, paddingHorizontal: 10, paddingVertical: 3 }}>
                <Text style={{ fontSize: 11, fontFamily: "Inter_600SemiBold", color: estilo.text }}>
                  {grupo.label}
                </Text>
              </View>
              <Text style={{ fontSize: 11, color: colores.textoMuted }}>
                {grupo.aspectos.length} aspectos
              </Text>
            </View>
            {/* Lista */}
            {grupo.aspectos.map((aspecto, idx) => {
              const clave = normalizarClave(aspecto.tipo);
              const simbolo = SIMBOLOS_ASPECTO[clave] || "·";
              const orbeEstrecho = aspecto.orbe < 3;

              return (
                <Pressable
                  key={`${aspecto.planeta1}-${aspecto.planeta2}-${idx}`}
                  onPress={() => onSeleccionar(aspecto)}
                  style={{
                    backgroundColor: colores.superficie,
                    borderRadius: 12,
                    paddingHorizontal: 14,
                    paddingVertical: 10,
                    marginBottom: 4,
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "space-between",
                    borderWidth: orbeEstrecho ? 1 : 0,
                    borderColor: colores.borde,
                  }}
                >
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                    <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: COLORES_PLANETA[aspecto.planeta1] || "#9E9E9E" }} />
                    <Text style={{ fontSize: 13, fontFamily: "Inter_600SemiBold", color: colores.primario }}>
                      {aspecto.planeta1}
                    </Text>
                    <Text style={{ fontSize: 13, color: colores.textoMuted }}>{simbolo}</Text>
                    <Text style={{ fontSize: 13, fontFamily: "Inter_600SemiBold", color: colores.primario }}>
                      {aspecto.planeta2}
                    </Text>
                    <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: COLORES_PLANETA[aspecto.planeta2] || "#9E9E9E" }} />
                  </View>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                    <Text style={{ fontSize: 11, color: colores.textoSecundario }}>
                      {aspecto.orbe.toFixed(1)}°
                    </Text>
                    <Text style={{
                      fontSize: 10,
                      paddingHorizontal: 6,
                      paddingVertical: 2,
                      borderRadius: 4,
                      overflow: "hidden",
                      backgroundColor: aspecto.aplicativo ? "#E8F5E9" : colores.fondoSecundario,
                      color: aspecto.aplicativo ? "#2E7D32" : colores.textoMuted,
                    }}>
                      {aspecto.aplicativo ? "Ap" : "Sep"}
                    </Text>
                  </View>
                </Pressable>
              );
            })}
          </View>
        );
      })}
    </View>
  );
}
