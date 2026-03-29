import { View, Text, Pressable } from "react-native";
import { IconoSigno } from "@/componentes/ui/icono-astral";
import { usarTema } from "@/lib/hooks/usar-tema";
import { ROMANO } from "@/lib/utilidades/interpretaciones-natal";
import type { Casa } from "@/lib/tipos";

interface CasasGridProps {
  casas: Casa[];
  onSeleccionar: (casa: Casa) => void;
}

export function CasasGrid({ casas, onSeleccionar }: CasasGridProps) {
  const { colores } = usarTema();

  return (
    <View style={{ marginBottom: 20 }}>
      <Text style={{ color: colores.primario, fontFamily: "Inter_600SemiBold", fontSize: 15, marginBottom: 10 }}>
        Las 12 Casas
      </Text>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6 }}>
        {casas.map((casa) => {
          const esAngular = [1, 4, 7, 10].includes(casa.numero);
          return (
            <Pressable
              key={casa.numero}
              onPress={() => onSeleccionar(casa)}
              style={{
                width: "23.5%",
                borderRadius: 12,
                paddingVertical: 10,
                alignItems: "center",
                backgroundColor: esAngular ? colores.acento : colores.superficie,
                borderWidth: esAngular ? 0 : 1,
                borderColor: colores.borde,
              }}
            >
              <Text style={{
                fontSize: 10,
                fontFamily: "Inter_600SemiBold",
                color: esAngular ? "rgba(255,255,255,0.7)" : colores.textoSecundario,
              }}>
                {ROMANO[casa.numero]}
              </Text>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 3, marginTop: 3 }}>
                <IconoSigno
                  signo={casa.signo}
                  tamaño={13}
                  style={{ tintColor: esAngular ? "#FFFFFF" : colores.acento }}
                />
                <Text style={{
                  fontSize: 12,
                  fontFamily: "Inter_600SemiBold",
                  color: esAngular ? "#FFFFFF" : colores.primario,
                }}>
                  {Math.floor(casa.grado_en_signo)}°
                </Text>
              </View>
              <Text style={{
                fontSize: 9,
                color: esAngular ? "rgba(255,255,255,0.6)" : colores.textoMuted,
                marginTop: 1,
              }}>
                {casa.signo}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
