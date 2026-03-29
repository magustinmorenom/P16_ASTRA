import { View, Text, Pressable } from "react-native";
import { IconoSigno } from "@/componentes/ui/icono-astral";
import { Badge } from "@/componentes/ui/badge";
import { usarTema } from "@/lib/hooks/usar-tema";
import {
  COLORES_PLANETA,
  ROMANO,
  normalizarClave,
  interpretarPlaneta,
  ordenarPlanetas,
} from "@/lib/utilidades/interpretaciones-natal";
import type { Planeta } from "@/lib/tipos";

interface PlanetaNarrativoProps {
  planetas: Planeta[];
  onSeleccionar: (p: Planeta) => void;
}

export function PlanetasNarrativo({ planetas, onSeleccionar }: PlanetaNarrativoProps) {
  const { colores } = usarTema();
  const ordenados = ordenarPlanetas(planetas);

  return (
    <View style={{ marginBottom: 20 }}>
      <Text style={{ color: colores.primario, fontFamily: "Inter_600SemiBold", fontSize: 15, marginBottom: 10 }}>
        Tus Planetas
      </Text>
      {ordenados.map((planeta) => {
        const color = COLORES_PLANETA[planeta.nombre] || "#9E9E9E";
        const narrativa = interpretarPlaneta(
          planeta.nombre, planeta.signo, planeta.casa, planeta.dignidad, planeta.retrogrado,
        );

        return (
          <Pressable
            key={planeta.nombre}
            onPress={() => onSeleccionar(planeta)}
            style={{
              backgroundColor: colores.superficie,
              borderRadius: 16,
              padding: 14,
              marginBottom: 8,
              borderWidth: 1,
              borderColor: colores.borde,
            }}
          >
            {/* Header compacto */}
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 6 }}>
              <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: color }} />
              <Text style={{ fontFamily: "Inter_600SemiBold", color: colores.primario, fontSize: 14 }}>
                {planeta.nombre}
              </Text>
              <IconoSigno signo={planeta.signo} tamaño={14} />
              <Text style={{ fontSize: 13, color: colores.primario }}>{planeta.signo}</Text>
              <Text style={{ fontSize: 11, color: colores.textoSecundario }}>
                Casa {ROMANO[planeta.casa]}
              </Text>
              <Text style={{ fontSize: 11, color: colores.acento, fontFamily: "Inter_600SemiBold" }}>
                {planeta.grado_en_signo.toFixed(1)}°
              </Text>
              {planeta.retrogrado && (
                <Badge variante="advertencia">R</Badge>
              )}
              {planeta.dignidad && (
                <Badge variante="info">{planeta.dignidad}</Badge>
              )}
            </View>
            {/* Narrativa breve */}
            <Text
              numberOfLines={2}
              style={{ fontSize: 13, color: colores.textoSecundario, lineHeight: 18 }}
            >
              {narrativa}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
